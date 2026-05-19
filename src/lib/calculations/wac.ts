import { db } from "@/lib/db";
import { stockLedger } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function calculateWAC(
  orgId: string,
  subtypeId: string,
): Promise<number> {
  const result = await db
    .select({
      total_value: sql<number>`COALESCE(SUM(
        CASE WHEN movement_type = 'in' THEN total_value ELSE 0 END
      ), 0)`,
      total_quantity: sql<number>`COALESCE(SUM(
        CASE WHEN movement_type = 'in' THEN quantity_kg ELSE 0 END
      ), 0)`,
    })
    .from(stockLedger)
    .where(
      and(
        eq(stockLedger.organization_id, orgId),
        eq(stockLedger.subtype_id, subtypeId),
        sql`${stockLedger.deleted_at} IS NULL`,
      ),
    );

  const total_value = Number(result[0].total_value);
  const total_quantity = Number(result[0].total_quantity);

  if (total_quantity === 0) return 0;
  return total_value / total_quantity;
}

export async function getStockQuantity(
  orgId: string,
  subtypeId: string,
): Promise<number> {
  const result = await db
    .select({
      net: sql<number>`COALESCE(SUM(
        CASE
          WHEN movement_type = 'in' THEN quantity_kg
          WHEN movement_type = 'out' THEN -quantity_kg
          ELSE 0
        END
      ), 0)`,
    })
    .from(stockLedger)
    .where(
      and(
        eq(stockLedger.organization_id, orgId),
        eq(stockLedger.subtype_id, subtypeId),
        sql`${stockLedger.deleted_at} IS NULL`,
      ),
    );

  return Number(result[0].net) || 0;
}
