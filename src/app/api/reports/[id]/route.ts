import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { periodReports } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = await requireOrg();

  const [report] = await db
    .select()
    .from(periodReports)
    .where(
      and(
        eq(periodReports.id, id),
        eq(periodReports.organization_id, orgId),
        sql`${periodReports.deleted_at} IS NULL`,
      ),
    )
    .limit(1);

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...report,
    total_purchased_kg: Number(report.total_purchased_kg),
    total_sold_fabricated_kg: Number(report.total_sold_fabricated_kg),
    total_sold_raw_kg: Number(report.total_sold_raw_kg),
    total_scrap_sold_kg: Number(report.total_scrap_sold_kg),
    current_stock_kg: Number(report.current_stock_kg),
    burnout_kg: Number(report.burnout_kg),
    burnout_percent: Number(report.burnout_percent),
    total_income: Number(report.total_income),
    total_purchase_cost: Number(report.total_purchase_cost),
    total_consumables_cost: Number(report.total_consumables_cost),
    total_salary_cost: Number(report.total_salary_cost),
    total_other_expenses: Number(report.total_other_expenses),
    total_cost: Number(report.total_cost),
    net_profit: Number(report.net_profit),
    profit_per_kg: Number(report.profit_per_kg),
  });
}
