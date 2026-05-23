import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { periodReports } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity-log";
import { calculatePeriodProfit } from "@/lib/calculations/profit";
import { generateReportSchema } from "@/lib/validations/schemas";

export async function GET() {
  const session = await requireSession();

  const reports = await db
    .select()
    .from(periodReports)
    .where(
      and(
        eq(periodReports.organization_id, session.org_id),
        sql`${periodReports.deleted_at} IS NULL`,
      ),
    )
    .orderBy(desc(periodReports.generated_at));

  return NextResponse.json(
    reports.map((r) => ({
      ...r,
      total_purchased_kg: Number(r.total_purchased_kg),
      total_sold_fabricated_kg: Number(r.total_sold_fabricated_kg),
      total_sold_raw_kg: Number(r.total_sold_raw_kg),
      total_scrap_sold_kg: Number(r.total_scrap_sold_kg),
      current_stock_kg: Number(r.current_stock_kg),
      burnout_kg: Number(r.burnout_kg),
      burnout_percent: Number(r.burnout_percent),
      total_income: Number(r.total_income),
      total_purchase_cost: Number(r.total_purchase_cost),
      total_consumables_cost: Number(r.total_consumables_cost),
      total_salary_cost: Number(r.total_salary_cost),
      total_other_expenses: Number(r.total_other_expenses),
      total_cost: Number(r.total_cost),
      net_profit: Number(r.net_profit),
      profit_per_kg: Number(r.profit_per_kg),
    })),
  );
}

export async function POST(request: Request) {
  const session = await requireSession();

  try {
    const body = await request.json();
    const parsed = generateReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const startDate = new Date(parsed.data.start_date);
    const endDate = new Date(parsed.data.end_date);

    const data = await calculatePeriodProfit(session.org_id, startDate, endDate, parsed.data.total_other_expenses);

    const [report] = await db
      .insert(periodReports)
      .values({
        organization_id: session.org_id,
        period_type: parsed.data.period_type,
        start_date: startDate,
        end_date: endDate,
        total_purchased_kg: data.total_purchased_kg.toFixed(3),
        total_sold_fabricated_kg: data.total_sold_fabricated_kg.toFixed(3),
        total_sold_raw_kg: data.total_sold_raw_kg.toFixed(3),
        total_scrap_sold_kg: data.total_scrap_sold_kg.toFixed(3),
        current_stock_kg: data.current_stock_kg.toFixed(3),
        burnout_kg: data.burnout_kg.toFixed(3),
        burnout_percent: data.burnout_percent.toFixed(2),
        total_income: data.total_income.toFixed(2),
        total_purchase_cost: data.total_purchase_cost.toFixed(2),
        total_consumables_cost: data.total_consumables_cost.toFixed(2),
        total_salary_cost: data.total_salary_cost.toFixed(2),
        total_other_expenses: data.total_other_expenses.toFixed(2),
        total_cost: data.total_cost.toFixed(2),
        net_profit: data.net_profit.toFixed(2),
        profit_per_kg: data.profit_per_kg.toFixed(2),
        result: data.result,
      })
      .returning();

    await logActivity({
      orgId: session.org_id,
      userId: session.user_id,
      action: "create",
      entityType: "report",
      entityId: report.id,
      description: `Generated ${parsed.data.period_type} report`,
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 },
    );
  }
}
