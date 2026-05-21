import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { materialCategories, materialSubtypes, scrapPool, stockLedger } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getStockQuantity, calculateWAC } from "@/lib/calculations/wac";
import { getSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  const headerOrg = request.headers.get("x-org-id");
  let orgId: string;
  if (headerOrg) {
    orgId = headerOrg;
  } else {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    orgId = session.org_id;
  }

  const categories = await db
    .select()
    .from(materialCategories)
    .where(
      and(
        eq(materialCategories.organization_id, orgId),
        sql`${materialCategories.deleted_at} IS NULL`,
      ),
    )
    .orderBy(materialCategories.name);

  const categoriesWithStock = await Promise.all(
    categories.map(async (cat) => {
      const subtypes = await db
        .select()
        .from(materialSubtypes)
        .where(
          and(
            eq(materialSubtypes.category_id, cat.id),
            sql`${materialSubtypes.deleted_at} IS NULL`,
          ),
        )
        .orderBy(materialSubtypes.name);

      const enrichedSubtypes = await Promise.all(
        subtypes.map(async (st) => ({
          ...st,
          current_stock_kg: await getStockQuantity(orgId, st.id),
          wac: await calculateWAC(orgId, st.id),
        })),
      );

      const totalWeight = enrichedSubtypes.reduce(
        (sum, st) => sum + st.current_stock_kg,
        0,
      );
      const totalValue = enrichedSubtypes.reduce(
        (sum, st) => sum + st.wac * st.current_stock_kg,
        0,
      );

      return {
        ...cat,
        subtypes: enrichedSubtypes,
        total_weight: totalWeight,
        total_value: totalValue,
      };
    }),
  );

  const totalStock = categoriesWithStock.reduce(
    (sum, cat) => sum + cat.total_weight,
    0,
  );
  const totalStockValue = categoriesWithStock.reduce(
    (sum, cat) => sum + cat.total_value,
    0,
  );

  const scrapResult = await db
    .select({
      net: sql<number>`COALESCE(SUM(
        CASE
          WHEN movement_type = 'in' THEN quantity_kg
          WHEN movement_type = 'out' THEN -quantity_kg
          ELSE 0
        END
      ), 0)`,
    })
    .from(scrapPool)
    .where(
      and(
        eq(scrapPool.organization_id, orgId),
        sql`${scrapPool.deleted_at} IS NULL`,
      ),
    );

  return NextResponse.json({
    categories: categoriesWithStock,
    total_stock_kg: totalStock,
    total_stock_value: totalStockValue,
    scrap_pool_kg: scrapResult[0]?.net || 0,
  });
}

export async function POST(request: Request) {
  const headerOrg = request.headers.get("x-org-id");
  let orgId: string;
  if (headerOrg) {
    orgId = headerOrg;
  } else {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    orgId = session.org_id;
  }

  try {
    const body = await request.json();
    const { subtype_id, movement_type, quantity_kg, note } = body;

    if (!subtype_id || !movement_type || !quantity_kg || quantity_kg <= 0) {
      return NextResponse.json({ error: "subtype_id, movement_type, and positive quantity_kg required" }, { status: 400 });
    }

    if (!["in", "out"].includes(movement_type)) {
      return NextResponse.json({ error: "movement_type must be 'in' or 'out'" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      const [entry] = await tx
        .insert(stockLedger)
        .values({
          organization_id: orgId,
          subtype_id,
          movement_type,
          quantity_kg: String(quantity_kg),
          reference_type: "adjustment",
          movement_date: new Date(),
          note: note || `Physical adjustment (${movement_type})`,
        })
        .returning();

      return entry;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating stock adjustment:", error);
    return NextResponse.json(
      { error: "Failed to create stock adjustment" },
      { status: 500 },
    );
  }
}
