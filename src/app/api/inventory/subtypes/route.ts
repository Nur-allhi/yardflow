import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { materialSubtypes } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { calculateWAC, getStockQuantity } from "@/lib/calculations/wac";
import { requireSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity-log";

const subtypeSchema = z.object({
  category_id: z.string().uuid("Invalid category"),
  name: z.string().min(1, "Name is required"),
  unit: z.enum(["kg", "ton"]).optional(),
});

export async function GET(request: Request) {
  const session = await requireSession();

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("category_id");

  const conditions = and(
    eq(materialSubtypes.organization_id, session.org_id),
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
      current_stock_kg: await getStockQuantity(session.org_id, st.id),
      wac: await calculateWAC(session.org_id, st.id),
    })),
  );

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  const session = await requireSession();

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
        organization_id: session.org_id,
        category_id: parsed.data.category_id,
        name: parsed.data.name,
        unit: parsed.data.unit || "kg",
      })
      .returning();

    await logActivity({
      orgId: session.org_id,
      userId: session.user_id,
      action: "create",
      entityType: "subtype",
      entityId: subtype.id,
      description: `Created subtype ${subtype.name}`,
    });

    return NextResponse.json(subtype, { status: 201 });
  } catch (error) {
    console.error("Error creating subtype:", error);
    return NextResponse.json(
      { error: "Failed to create subtype" },
      { status: 500 },
    );
  }
}
