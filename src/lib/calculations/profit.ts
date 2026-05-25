import { db } from "@/lib/db";
import {
  organizations,
  purchases,
  purchaseItems,
  sales,
  saleItems,
  scrapPool,
  stockLedger,
  consumablesLog,
  salaryPayments,
  simplePurchases,
  simplePurchaseItems,
  simpleSales,
  simpleSaleItems,
  inventoryPool,
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
  totalOtherExpenses: number = 0,
  inventoryMode?: string,
  burnoutPercent: number = 0,
): Promise<PeriodProfitData> {
  if (!inventoryMode) {
    const [org] = await db
      .select({ inventory_mode: organizations.inventory_mode })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);
    inventoryMode = org?.inventory_mode ?? "detailed";
  }

  let total_purchased_kg = 0;
  let total_purchase_cost = 0;
  let total_sold_fabricated_kg = 0;
  let total_sold_raw_kg = 0;
  let current_stock_kg = 0;

  if (inventoryMode === "simple") {
    const simpleDateFilter = [
      eq(simplePurchases.organization_id, orgId),
      sql`${simplePurchases.deleted_at} IS NULL`,
      gte(simplePurchases.purchase_date, startDate),
      lte(simplePurchases.purchase_date, endDate),
    ];

    const [simplePurchasedKg] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${simplePurchaseItems.quantity_kg} AS numeric)), 0)`,
      })
      .from(simplePurchaseItems)
      .innerJoin(simplePurchases, eq(simplePurchaseItems.purchase_id, simplePurchases.id))
      .where(
        and(
          eq(simplePurchaseItems.organization_id, orgId),
          sql`${simplePurchaseItems.deleted_at} IS NULL`,
          ...simpleDateFilter,
        ),
      );

    const [simplePurchaseCost] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${simplePurchases.total_amount} AS numeric)), 0)`,
      })
      .from(simplePurchases)
      .where(and(...simpleDateFilter));

    total_purchased_kg = Number(simplePurchasedKg.total);
    total_purchase_cost = Number(simplePurchaseCost.total);

    const simpleSaleDateFilter = [
      eq(simpleSales.organization_id, orgId),
      sql`${simpleSales.deleted_at} IS NULL`,
      gte(simpleSales.sale_date, startDate),
      lte(simpleSales.sale_date, endDate),
    ];

    const [simpleFabricatedKg] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${simpleSaleItems.quantity_kg} AS numeric)), 0)`,
      })
      .from(simpleSales)
      .innerJoin(simpleSaleItems, eq(simpleSales.id, simpleSaleItems.sale_id))
      .where(
        and(
          eq(simpleSales.organization_id, orgId),
          eq(simpleSales.sale_type, "fabricated"),
          sql`${simpleSales.deleted_at} IS NULL`,
          sql`${simpleSaleItems.deleted_at} IS NULL`,
          ...simpleSaleDateFilter,
        ),
      );

    const [simpleRawKg] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${simpleSaleItems.quantity_kg} AS numeric)), 0)`,
      })
      .from(simpleSales)
      .innerJoin(simpleSaleItems, eq(simpleSales.id, simpleSaleItems.sale_id))
      .where(
        and(
          eq(simpleSales.organization_id, orgId),
          eq(simpleSales.sale_type, "raw_passthrough"),
          sql`${simpleSales.deleted_at} IS NULL`,
          sql`${simpleSaleItems.deleted_at} IS NULL`,
          ...simpleSaleDateFilter,
        ),
      );

    total_sold_fabricated_kg = Number(simpleFabricatedKg.total);
    total_sold_raw_kg = Number(simpleRawKg.total);

    const [pool] = await db
      .select()
      .from(inventoryPool)
      .where(eq(inventoryPool.organization_id, orgId))
      .limit(1);

    current_stock_kg = Number(pool?.total_quantity_kg ?? 0);
  } else {
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

    total_purchased_kg = Number(purchasedKg.total);
    total_purchase_cost = Number(purchaseCost.total);

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

    total_sold_fabricated_kg = Number(fabricatedKg.total);
    total_sold_raw_kg = Number(rawKg.total);

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

    current_stock_kg = Number(stock.net);
  }

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

  const total_scrap_sold_kg = Number(scrapKg.total);

  const total_sold_kg = total_sold_fabricated_kg + total_sold_raw_kg;
  let burnout_kg: number;
  let burnout_percent: number;

  if (inventoryMode === "simple") {
    burnout_kg = (burnoutPercent / 100) * total_sold_kg;
    burnout_percent = burnoutPercent;
    current_stock_kg = Math.max(0, current_stock_kg - burnout_kg);
  } else {
    burnout_kg = Math.max(
      0,
      total_purchased_kg -
        total_sold_fabricated_kg -
        total_sold_raw_kg -
        total_scrap_sold_kg -
        current_stock_kg,
    );
    burnout_percent =
      total_purchased_kg > 0 ? (burnout_kg / total_purchased_kg) * 100 : 0;
  }

  let [income] = await db
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

  if (inventoryMode === "simple") {
    const [simpleIncome] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${simpleSales.total_amount} AS numeric)), 0)`,
      })
      .from(simpleSales)
      .where(
        and(
          eq(simpleSales.organization_id, orgId),
          sql`${simpleSales.deleted_at} IS NULL`,
          gte(simpleSales.sale_date, startDate),
          lte(simpleSales.sale_date, endDate),
        ),
      );
    income = simpleIncome;
  }

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
  const total_other_expenses = totalOtherExpenses;
  const total_cost =
    total_purchase_cost +
    total_consumables_cost +
    total_salary_cost +
    total_other_expenses;
  const net_profit = total_income - total_cost;
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
