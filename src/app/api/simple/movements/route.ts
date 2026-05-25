import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventoryMovements } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  const session = await requireSession();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const type = searchParams.get("type");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const conditions: ReturnType<typeof eq | typeof gte | typeof lte>[] = [
    eq(inventoryMovements.organization_id, session.org_id),
  ];

  if (type && (type === "in" || type === "out")) {
    conditions.push(eq(inventoryMovements.movement_type, type));
  }
  if (from) conditions.push(gte(inventoryMovements.movement_date, new Date(from)));
  if (to) conditions.push(lte(inventoryMovements.movement_date, new Date(to)));

  const offset = (page - 1) * limit;

  const [movements, countResult] = await Promise.all([
    db
      .select()
      .from(inventoryMovements)
      .where(and(...conditions))
      .orderBy(desc(inventoryMovements.movement_date))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(inventoryMovements)
      .where(and(...conditions))
      .then((r) => Number(r[0].count)),
  ]);

  return NextResponse.json({
    data: movements.map((m) => ({
      ...m,
      quantity_kg: Number(m.quantity_kg),
      price_per_kg: m.price_per_kg ? Number(m.price_per_kg) : null,
      total_value: m.total_value ? Number(m.total_value) : null,
    })),
    pagination: {
      page,
      limit,
      total: countResult,
    },
  });
}
