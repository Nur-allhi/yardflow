import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  stockLedger,
  materialSubtypes,
  materialCategories,
} from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";

export async function GET(request: Request) {
  const orgId = await requireOrg();

  const { searchParams } = new URL(request.url);
  const subtypeId = searchParams.get("subtype_id");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");

  const conditions = and(
    eq(stockLedger.organization_id, orgId),
    sql`${stockLedger.deleted_at} IS NULL`,
    subtypeId ? eq(stockLedger.subtype_id, subtypeId) : undefined,
    dateFrom
      ? sql`${stockLedger.movement_date} >= ${dateFrom}::timestamp`
      : undefined,
    dateTo
      ? sql`${stockLedger.movement_date} <= ${dateTo}::timestamp`
      : undefined,
  );

  const entries = await db
    .select({
      id: stockLedger.id,
      movement_date: stockLedger.movement_date,
      subtype_id: stockLedger.subtype_id,
      subtype_name: materialSubtypes.name,
      category_name: materialCategories.name,
      movement_type: stockLedger.movement_type,
      quantity_kg: stockLedger.quantity_kg,
      price_per_kg: stockLedger.price_per_kg,
      total_value: stockLedger.total_value,
      reference_type: stockLedger.reference_type,
      note: stockLedger.note,
    })
    .from(stockLedger)
    .leftJoin(
      materialSubtypes,
      eq(stockLedger.subtype_id, materialSubtypes.id),
    )
    .leftJoin(
      materialCategories,
      eq(materialSubtypes.category_id, materialCategories.id),
    )
    .where(conditions)
    .orderBy(desc(stockLedger.movement_date));

  const [summary] = await db
    .select({
      total_in_kg:
        sql<string>`COALESCE(SUM(CASE WHEN ${stockLedger.movement_type} = 'in' THEN ${stockLedger.quantity_kg} ELSE 0 END), 0)`,
      total_out_kg:
        sql<string>`COALESCE(SUM(CASE WHEN ${stockLedger.movement_type} = 'out' THEN ${stockLedger.quantity_kg} ELSE 0 END), 0)`,
    })
    .from(stockLedger)
    .where(conditions);

  const totalIn = Number(summary.total_in_kg);
  const totalOut = Number(summary.total_out_kg);

  return NextResponse.json({
    entries: entries.map((e) => ({
      ...e,
      quantity_kg: Number(e.quantity_kg),
      price_per_kg: e.price_per_kg ? Number(e.price_per_kg) : null,
      total_value: e.total_value ? Number(e.total_value) : null,
    })),
    summary: {
      total_in_kg: totalIn,
      total_out_kg: totalOut,
      net_stock: totalIn - totalOut,
    },
  });
}
