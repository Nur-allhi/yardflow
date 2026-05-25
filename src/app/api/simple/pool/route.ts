import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventoryPool } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";

export async function GET() {
  const session = await requireSession();

  const [pool] = await db
    .select()
    .from(inventoryPool)
    .where(eq(inventoryPool.organization_id, session.org_id))
    .limit(1);

  if (!pool) {
    return NextResponse.json({
      total_quantity_kg: 0,
      total_value: 0,
      avg_price_per_kg: 0,
    });
  }

  return NextResponse.json({
    total_quantity_kg: Number(pool.total_quantity_kg),
    total_value: Number(pool.total_value),
    avg_price_per_kg: Number(pool.avg_price_per_kg),
  });
}
