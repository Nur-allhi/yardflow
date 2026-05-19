import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { materialSubtypes } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { calculateWAC, getStockQuantity } from "@/lib/calculations/wac";
import { requireOrg } from "@/lib/auth/session";

const subtypeSchema = z.object({
  category_id: z.string().uuid("Invalid category"),
  name: z.string().min(1, "Name is required"),
  default_price_per_kg: z.number().positive().optional(),
  unit: z.enum(["kg", "ton"]).optional(),
});

export async function GET(request: Request) {
  const orgId = await requireOrg();

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("category_id");

  const conditions = and(
    eq(materialSubtypes.organization_id, orgId),
    sql`${materialSubtypes.deleted_at} IS NULL`,
    categoryId ? eq(materialSubtypes.category_id, categoryId) : undefined,
  );

  const subtypes = await db
    .select()
    .from(materialSubtypes)
    .where(conditions)
    .orderBy(materialSubtypes.name);

  const enriched = await Promise.all(
    subtypes.map(async (st) => ({
      ...st,
      current_stock_kg: await getStockQuantity(orgId, st.id),
      wac: await calculateWAC(orgId, st.id),
    })),
  );

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  const orgId = await requireOrg();

  try {
    const body = await request.json();
    const parsed = subtypeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const [subtype] = await db
      .insert(materialSubtypes)
      .values({
        organization_id: orgId,
        category_id: parsed.data.category_id,
        name: parsed.data.name,
        default_price_per_kg: parsed.data.default_price_per_kg
          ? String(parsed.data.default_price_per_kg)
          : null,
        unit: parsed.data.unit || "kg",
      })
      .returning();

    return NextResponse.json(subtype, { status: 201 });
  } catch (error) {
    console.error("Error creating subtype:", error);
    return NextResponse.json(
      { error: "Failed to create subtype" },
      { status: 500 },
    );
  }
}
