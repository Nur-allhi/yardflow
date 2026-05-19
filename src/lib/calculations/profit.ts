import { db } from "@/lib/db";
import {
  purchases,
  purchaseItems,
  sales,
  saleItems,
  scrapPool,
  stockLedger,
  consumablesLog,
  salaryPayments,
} from "@/lib/db/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";

export interface PeriodProfitData {
  total_purchased_kg: number;
  total_sold_fabricated_kg: number;
  total_sold_raw_kg: number;
  total_scrap_sold_kg: number;
  current_stock_kg: number;
  burnout_kg: number;
  burnout_percent: number;
  total_income: number;
  total_purchase_cost: number;
  total_consumables_cost: number;
  total_salary_cost: number;
  total_other_expenses: number;
  total_cost: number;
  net_profit: number;
  profit_per_kg: number;
  result: "profit" | "loss";
  wac: number;
  burnout_loss_value: number;
}

export async function calculatePeriodProfit(
  orgId: string,
  startDate: Date,
  endDate: Date,
): Promise<PeriodProfitData> {
  const dateFilter = [
    eq(purchases.organization_id, orgId),
    sql`${purchases.deleted_at} IS NULL`,
    gte(purchases.purchase_date, startDate),
    lte(purchases.purchase_date, endDate),
  ];

  const [purchasedKg] = await db
    .select({
      total: sql<number>`COALESCE(SUM(CAST(${purchaseItems.quantity_kg} AS numeric)), 0)`,
    })
    .from(purchaseItems)
    .innerJoin(purchases, eq(purchaseItems.purchase_id, purchases.id))
    .where(
      and(
        eq(purchaseItems.organization_id, orgId),
        sql`${purchaseItems.deleted_at} IS NULL`,
        ...dateFilter,
      ),
    );

  const [purchaseCost] = await db
    .select({
      total: sql<number>`COALESCE(SUM(CAST(${purchases.total_amount} AS numeric)), 0)`,
    })
    .from(purchases)
    .where(and(...dateFilter));

  const total_purchased_kg = Number(purchasedKg.total);
  const total_purchase_cost = Number(purchaseCost.total);

  const [fabricatedKg] = await db
    .select({
      total: sql<number>`COALESCE(SUM(CAST(${saleItems.quantity_kg} AS numeric)), 0)`,
    })
    .from(sales)
    .innerJoin(saleItems, eq(sales.id, saleItems.sale_id))
    .where(
      and(
        eq(sales.organization_id, orgId),
        eq(sales.sale_type, "fabricated"),
        sql`${sales.deleted_at} IS NULL`,
        sql`${saleItems.deleted_at} IS NULL`,
        gte(sales.sale_date, startDate),
        lte(sales.sale_date, endDate),
      ),
    );

  const [rawKg] = await db
    .select({
      total: sql<number>`COALESCE(SUM(CAST(${saleItems.quantity_kg} AS numeric)), 0)`,
    })
    .from(sales)
    .innerJoin(saleItems, eq(sales.id, saleItems.sale_id))
    .where(
      and(
        eq(sales.organization_id, orgId),
        eq(sales.sale_type, "raw_passthrough"),
        sql`${sales.deleted_at} IS NULL`,
        sql`${saleItems.deleted_at} IS NULL`,
        gte(sales.sale_date, startDate),
        lte(sales.sale_date, endDate),
      ),
    );

  const [scrapKg] = await db
    .select({
      total: sql<number>`COALESCE(SUM(CAST(${scrapPool.quantity_kg} AS numeric)), 0)`,
    })
    .from(scrapPool)
    .where(
      and(
        eq(scrapPool.organization_id, orgId),
        eq(scrapPool.movement_type, "out"),
        sql`${scrapPool.deleted_at} IS NULL`,
        gte(scrapPool.movement_date, startDate),
        lte(scrapPool.movement_date, endDate),
      ),
    );

  const [stock] = await db
    .select({
      net: sql<number>`COALESCE(SUM(
        CASE
          WHEN ${stockLedger.movement_type} = 'in' THEN CAST(${stockLedger.quantity_kg} AS numeric)
          ELSE -CAST(${stockLedger.quantity_kg} AS numeric)
        END
      ), 0)`,
    })
    .from(stockLedger)
    .where(
      and(
        eq(stockLedger.organization_id, orgId),
        sql`${stockLedger.deleted_at} IS NULL`,
      ),
    );

  const total_sold_fabricated_kg = Number(fabricatedKg.total);
  const total_sold_raw_kg = Number(rawKg.total);
  const total_scrap_sold_kg = Number(scrapKg.total);
  const current_stock_kg = Number(stock.net);

  const burnout_kg = Math.max(
    0,
    total_purchased_kg -
      total_sold_fabricated_kg -
      total_sold_raw_kg -
      total_scrap_sold_kg -
      current_stock_kg,
  );
  const burnout_percent =
    total_purchased_kg > 0 ? (burnout_kg / total_purchased_kg) * 100 : 0;

  const [income] = await db
    .select({
      total: sql<number>`COALESCE(SUM(CAST(${sales.total_amount} AS numeric)), 0)`,
    })
    .from(sales)
    .where(
      and(
        eq(sales.organization_id, orgId),
        sql`${sales.deleted_at} IS NULL`,
        gte(sales.sale_date, startDate),
        lte(sales.sale_date, endDate),
      ),
    );

  const [consumables] = await db
    .select({
      total: sql<number>`COALESCE(SUM(CAST(${consumablesLog.total_price} AS numeric)), 0)`,
    })
    .from(consumablesLog)
    .where(
      and(
        eq(consumablesLog.organization_id, orgId),
        sql`${consumablesLog.deleted_at} IS NULL`,
        gte(consumablesLog.purchase_date, startDate),
        lte(consumablesLog.purchase_date, endDate),
      ),
    );

  const [salary] = await db
    .select({
      total: sql<number>`COALESCE(SUM(CAST(${salaryPayments.paid_amount} AS numeric)), 0)`,
    })
    .from(salaryPayments)
    .where(
      and(
        eq(salaryPayments.organization_id, orgId),
        sql`${salaryPayments.deleted_at} IS NULL`,
        gte(salaryPayments.payment_date, startDate),
        lte(salaryPayments.payment_date, endDate),
      ),
    );

  const total_income = Number(income.total);
  const total_consumables_cost = Number(consumables.total);
  const total_salary_cost = Number(salary.total);
  const total_other_expenses = 0;
  const total_cost =
    total_purchase_cost +
    total_consumables_cost +
    total_salary_cost +
    total_other_expenses;
  const net_profit = total_income - total_cost;
  const total_sold_kg = total_sold_fabricated_kg + total_sold_raw_kg;
  const profit_per_kg = total_sold_kg > 0 ? net_profit / total_sold_kg : 0;
  const result = net_profit >= 0 ? "profit" : "loss";

  const wac = total_purchased_kg > 0 ? total_purchase_cost / total_purchased_kg : 0;
  const burnout_loss_value = burnout_kg * wac;

  return {
    total_purchased_kg,
    total_sold_fabricated_kg,
    total_sold_raw_kg,
    total_scrap_sold_kg,
    current_stock_kg,
    burnout_kg,
    burnout_percent,
    total_income,
    total_purchase_cost,
    total_consumables_cost,
    total_salary_cost,
    total_other_expenses,
    total_cost,
    net_profit,
    profit_per_kg,
    result,
    wac,
    burnout_loss_value,
  };
}
