import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { materialCategories, materialSubtypes, scrapPool } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getStockQuantity, calculateWAC } from "@/lib/calculations/wac";

export async function GET(request: Request) {
  const orgId = request.headers.get("x-org-id");
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
