import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  accounts,
  materialCategories,
  materialSubtypes,
  vendors,
  customers,
  workers,
  purchases,
  purchaseItems,
  purchasePayments,
  purchaseOtherExpenses,
  sales,
  saleItems,
  salePayments,
  consumablesLog,
  consumptionLogs,
  salaryAdvances,
  salaryPayments,
  stockLedger,
  scrapPool,
  accountTransactions,
  periodReports,
  activityLogs,
  inventoryPool,
  inventoryMovements,
  simplePurchases,
  simplePurchaseItems,
  simplePurchasePayments,
  simplePurchaseOtherExpenses,
  simpleSales,
  simpleSaleItems,
  simpleSalePayments,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity-log";

interface ImportResult {
  imported: Record<string, number>;
  errors: string[];
}

const GENERATED_COLUMNS: Record<string, Set<string>> = {
  purchases: new Set(["due_amount"]),
  purchase_items: new Set(["total_amount"]),
  sales: new Set(["due_amount"]),
  sale_items: new Set(["total_amount"]),
  salary_payments: new Set(["net_payable"]),
  simple_purchases: new Set(["due_amount"]),
  simple_purchase_items: new Set(["total_amount"]),
  simple_sales: new Set(["due_amount"]),
  simple_sale_items: new Set(["total_amount"]),
  inventory_pool: new Set(["avg_price_per_kg"]),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TABLE_REGISTRY: Record<string, any> = {
  accounts,
  material_categories: materialCategories,
  material_subtypes: materialSubtypes,
  vendors,
  customers,
  workers,
  purchases,
  purchase_items: purchaseItems,
  purchase_payments: purchasePayments,
  purchase_other_expenses: purchaseOtherExpenses,
  sales,
  sale_items: saleItems,
  sale_payments: salePayments,
  consumables_log: consumablesLog,
  consumption_logs: consumptionLogs,
  salary_advances: salaryAdvances,
  salary_payments: salaryPayments,
  stock_ledger: stockLedger,
  scrap_pool: scrapPool,
  account_transactions: accountTransactions,
  period_reports: periodReports,
  activity_logs: activityLogs,
  inventory_pool: inventoryPool,
  inventory_movements: inventoryMovements,
  simple_purchases: simplePurchases,
  simple_purchase_items: simplePurchaseItems,
  simple_purchase_payments: simplePurchasePayments,
  simple_purchase_other_expenses: simplePurchaseOtherExpenses,
  simple_sales: simpleSales,
  simple_sale_items: simpleSaleItems,
  simple_sale_payments: simpleSalePayments,
};

export async function POST(request: Request) {
  const session = await requireSession();
  const orgId = session.org_id;
  const userId = session.user_id;

  try {
    const body = await request.json();

    if (!body.exported_at || !body.version) {
      const missing = [];
      if (!body.exported_at) missing.push("exported_at");
      if (!body.version) missing.push("version");
      return NextResponse.json(
        { error: `Invalid import file: missing ${missing.join(" and ")}. Export data from /api/settings/data/export first.` },
        { status: 400 },
      );
    }

    const result: ImportResult = { imported: {}, errors: [] };
    const idMap: Record<string, Record<string, string>> = {};

    const entityDefs: { key: string; table: string }[] = [
      { key: "accounts", table: "accounts" },
      { key: "materialCategories", table: "material_categories" },
      { key: "materialSubtypes", table: "material_subtypes" },
      { key: "vendors", table: "vendors" },
      { key: "customers", table: "customers" },
      { key: "workers", table: "workers" },
      { key: "purchases", table: "purchases" },
      { key: "purchaseItems", table: "purchase_items" },
      { key: "purchasePayments", table: "purchase_payments" },
      { key: "purchaseOtherExpenses", table: "purchase_other_expenses" },
      { key: "sales", table: "sales" },
      { key: "saleItems", table: "sale_items" },
      { key: "salePayments", table: "sale_payments" },
      { key: "consumablesLog", table: "consumables_log" },
      { key: "consumptionLogs", table: "consumption_logs" },
      { key: "salaryAdvances", table: "salary_advances" },
      { key: "salaryPayments", table: "salary_payments" },
      { key: "stockLedger", table: "stock_ledger" },
      { key: "scrapPool", table: "scrap_pool" },
      { key: "accountTransactions", table: "account_transactions" },
      { key: "periodReports", table: "period_reports" },
      { key: "activityLogs", table: "activity_logs" },
      { key: "inventoryMovements", table: "inventory_movements" },
      { key: "simplePurchases", table: "simple_purchases" },
      { key: "simplePurchaseItems", table: "simple_purchase_items" },
      { key: "simplePurchasePayments", table: "simple_purchase_payments" },
      { key: "simplePurchaseOtherExpenses", table: "simple_purchase_other_expenses" },
      { key: "simpleSales", table: "simple_sales" },
      { key: "simpleSaleItems", table: "simple_sale_items" },
      { key: "simpleSalePayments", table: "simple_sale_payments" },
    ];

    for (const { key, table } of entityDefs) {
      const rows = body[key];
      if (!Array.isArray(rows)) continue;
      if (!idMap[table]) idMap[table] = {};
      for (const row of rows) {
        if (row && row.id) {
          idMap[table][row.id] = crypto.randomUUID();
        }
      }
    }

    function toDate(value: unknown): unknown {
      if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return new Date(value);
      }
      return value;
    }

    function prepareRow(
      row: Record<string, unknown>,
      table: string,
      fkMappings: [string, string][],
      entityKey: string,
      index: number,
    ): Record<string, unknown> | null {
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) {
        if (k === "id") continue;
        if (GENERATED_COLUMNS[table]?.has(k)) continue;
        cleaned[k] = toDate(v);
      }

      cleaned.organization_id = orgId;

      if (table === "inventory_pool") {
        return cleaned;
      }

      const oldId = row.id as string | undefined;
      if (oldId && idMap[table]?.[oldId]) {
        cleaned.id = idMap[table][oldId];
      } else {
        cleaned.id = crypto.randomUUID();
      }

      for (const [field, refTable] of fkMappings) {
        const val = row[field] as string | null | undefined;
        if (!val) {
          cleaned[field] = null;
          continue;
        }
        const mapped = idMap[refTable]?.[val];
        if (mapped) {
          cleaned[field] = mapped;
          continue;
        }
        if (refTable === "users") {
          cleaned[field] = userId;
          continue;
        }
        result.errors.push(
          `${entityKey}[${index}]: skipped — ${field} ${val} not found in import`,
        );
        return null;
      }

      return cleaned;
    }

    async function importGroup(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tx: any,
      entityKey: string,
      table: string,
      fkMappings: [string, string][],
    ) {
      const rows = body[entityKey];
      if (!Array.isArray(rows) || rows.length === 0) return;

      const toInsert: Record<string, unknown>[] = [];
      for (let i = 0; i < rows.length; i++) {
        const prepared = prepareRow(rows[i], table, fkMappings, entityKey, i);
        if (prepared) toInsert.push(prepared);
      }
      if (toInsert.length === 0) return;

      result.imported[entityKey] = toInsert.length;

      if (table === "inventory_pool") {
        const existing = await tx
          .select({ organization_id: inventoryPool.organization_id })
          .from(inventoryPool)
          .where(eq(inventoryPool.organization_id, orgId))
          .limit(1);

        if (existing.length > 0) {
          await tx
            .update(inventoryPool)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .set(toInsert[0] as any)
            .where(eq(inventoryPool.organization_id, orgId));
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.insert(inventoryPool).values(toInsert[0] as any);
        }
        return;
      }

      await tx.insert(TABLE_REGISTRY[table]).values(toInsert);
    }

    await db.transaction(async (tx) => {
      await importGroup(tx, "accounts", "accounts", []);
      await importGroup(tx, "materialCategories", "material_categories", []);

      await importGroup(tx, "materialSubtypes", "material_subtypes", [
        ["category_id", "material_categories"],
      ]);
      await importGroup(tx, "vendors", "vendors", []);
      await importGroup(tx, "customers", "customers", []);
      await importGroup(tx, "workers", "workers", [["user_id", "users"]]);

      await importGroup(tx, "purchases", "purchases", [
        ["vendor_id", "vendors"],
      ]);
      await importGroup(tx, "sales", "sales", [
        ["customer_id", "customers"],
      ]);
      await importGroup(tx, "consumablesLog", "consumables_log", [
        ["account_id", "accounts"],
      ]);
      await importGroup(tx, "salaryAdvances", "salary_advances", [
        ["worker_id", "workers"],
        ["account_id", "accounts"],
      ]);
      await importGroup(tx, "simplePurchases", "simple_purchases", [
        ["vendor_id", "vendors"],
      ]);
      await importGroup(tx, "simpleSales", "simple_sales", [
        ["customer_id", "customers"],
      ]);

      await importGroup(tx, "purchaseItems", "purchase_items", [
        ["purchase_id", "purchases"],
        ["subtype_id", "material_subtypes"],
      ]);
      await importGroup(tx, "purchasePayments", "purchase_payments", [
        ["purchase_id", "purchases"],
        ["account_id", "accounts"],
      ]);
      await importGroup(tx, "purchaseOtherExpenses", "purchase_other_expenses", [
        ["purchase_id", "purchases"],
        ["account_id", "accounts"],
      ]);
      await importGroup(tx, "saleItems", "sale_items", [
        ["sale_id", "sales"],
        ["subtype_id", "material_subtypes"],
      ]);
      await importGroup(tx, "salePayments", "sale_payments", [
        ["sale_id", "sales"],
        ["account_id", "accounts"],
      ]);
      await importGroup(tx, "stockLedger", "stock_ledger", [
        ["subtype_id", "material_subtypes"],
      ]);
      await importGroup(tx, "scrapPool", "scrap_pool", []);
      await importGroup(tx, "consumptionLogs", "consumption_logs", [
        ["consumable_id", "consumables_log"],
      ]);
      await importGroup(tx, "salaryPayments", "salary_payments", [
        ["worker_id", "workers"],
        ["account_id", "accounts"],
      ]);

      await importGroup(tx, "accountTransactions", "account_transactions", [
        ["account_id", "accounts"],
      ]);
      await importGroup(tx, "periodReports", "period_reports", []);
      await importGroup(tx, "activityLogs", "activity_logs", [
        ["user_id", "users"],
      ]);
      await importGroup(tx, "inventoryPool", "inventory_pool", []);
      await importGroup(tx, "inventoryMovements", "inventory_movements", []);
      await importGroup(tx, "simplePurchaseItems", "simple_purchase_items", [
        ["purchase_id", "simple_purchases"],
      ]);
      await importGroup(tx, "simplePurchasePayments", "simple_purchase_payments", [
        ["purchase_id", "simple_purchases"],
        ["account_id", "accounts"],
      ]);
      await importGroup(
        tx,
        "simplePurchaseOtherExpenses",
        "simple_purchase_other_expenses",
        [
          ["purchase_id", "simple_purchases"],
          ["account_id", "accounts"],
        ],
      );
      await importGroup(tx, "simpleSaleItems", "simple_sale_items", [
        ["sale_id", "simple_sales"],
      ]);
      await importGroup(tx, "simpleSalePayments", "simple_sale_payments", [
        ["sale_id", "simple_sales"],
        ["account_id", "accounts"],
      ]);
    });

    const summary = Object.entries(result.imported)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${v} ${k}`)
      .join(", ");

    await logActivity({
      orgId,
      userId,
      action: "import",
      entityType: "data",
      description: `Imported organization data: ${summary}`,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error importing data:", error);
    const message = error instanceof Error ? error.message : "Failed to import data";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
