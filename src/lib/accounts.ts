import { db } from "@/lib/db";
import {
  accountTransactions,
  accounts,
  purchasePayments,
  purchases,
  vendors,
  salePayments,
  sales,
  customers,
  salaryPayments,
  salaryAdvances,
  workers,
  simplePurchasePayments,
  simplePurchases,
  simpleSalePayments,
  simpleSales,
} from "@/lib/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

interface RecordAccountTransactionParams {
  organization_id: string;
  account_id: string;
  type: "credit" | "debit";
  amount: string;
  reference_type: "purchase_payment" | "sale_payment" | "salary" | "advance" | "transfer" | "other";
  reference_id?: string;
  note?: string | null;
  transaction_date: Date;
}

export async function recordAccountTransaction(params: RecordAccountTransactionParams) {
  return db.transaction(async (tx) => {
    const [txn] = await tx
      .insert(accountTransactions)
      .values({
        organization_id: params.organization_id,
        account_id: params.account_id,
        type: params.type,
        amount: params.amount,
        reference_type: params.reference_type,
        reference_id: params.reference_id,
        note: params.note,
        transaction_date: params.transaction_date,
      })
      .returning();

    await tx
      .update(accounts)
      .set({
        current_balance: sql`(SELECT COALESCE(
          SUM(CASE WHEN type = 'credit' THEN amount::numeric ELSE 0 END) -
          SUM(CASE WHEN type = 'debit' THEN amount::numeric ELSE 0 END),
          0)
        FROM account_transactions
        WHERE account_id = ${params.account_id}
          AND deleted_at IS NULL)`,
        updated_at: sql`NOW()`,
      })
      .where(eq(accounts.id, params.account_id));

    return txn;
  });
}

interface TransactionRow {
  id: string;
  reference_type: string;
  reference_id: string | null;
}

interface EnrichedInfo {
  reference_name: string | null;
  reference_url: string | null;
}

export async function enrichTransactions(rows: TransactionRow[]): Promise<EnrichedInfo[]> {
  const purchaseIds: string[] = [];
  const saleIds: string[] = [];
  const salaryIds: string[] = [];
  const advanceIds: string[] = [];
  const transferIds: string[] = [];
  const otherIds: string[] = [];

  for (const r of rows) {
    if (!r.reference_id) continue;
    if (r.reference_type === "purchase_payment") purchaseIds.push(r.reference_id);
    else if (r.reference_type === "sale_payment") saleIds.push(r.reference_id);
    else if (r.reference_type === "salary") salaryIds.push(r.reference_id);
    else if (r.reference_type === "advance") advanceIds.push(r.reference_id);
    else if (r.reference_type === "transfer") transferIds.push(r.reference_id);
    else if (r.reference_type === "other") otherIds.push(r.reference_id);
  }

  const [purchaseMap, saleMap, simplePurchaseMap, simpleSaleMap, salaryMap, advanceMap, transferMap, vendorMap, customerMap] = await Promise.all([
    purchaseIds.length
      ? db
          .select({
            id: purchasePayments.id,
            name: vendors.name,
            purchaseId: purchases.id,
          })
          .from(purchasePayments)
          .innerJoin(purchases, eq(purchasePayments.purchase_id, purchases.id))
          .innerJoin(vendors, eq(purchases.vendor_id, vendors.id))
          .where(inArray(purchasePayments.id, purchaseIds))
          .then((res) =>
            Object.fromEntries(res.map((r) => [r.id, { name: r.name, url: `/purchases/${r.purchaseId}` }])),
          )
      : Promise.resolve({} as Record<string, { name: string; url: string }>),

    saleIds.length
      ? db
          .select({
            id: salePayments.id,
            name: customers.name,
            saleId: sales.id,
          })
          .from(salePayments)
          .innerJoin(sales, eq(salePayments.sale_id, sales.id))
          .innerJoin(customers, eq(sales.customer_id, customers.id))
          .where(inArray(salePayments.id, saleIds))
          .then((res) =>
            Object.fromEntries(res.map((r) => [r.id, { name: r.name, url: `/sales/${r.saleId}` }])),
          )
      : Promise.resolve({} as Record<string, { name: string; url: string }>),

    purchaseIds.length
      ? db
          .select({
            id: simplePurchasePayments.id,
            name: vendors.name,
            purchaseId: simplePurchases.id,
          })
          .from(simplePurchasePayments)
          .innerJoin(simplePurchases, eq(simplePurchasePayments.purchase_id, simplePurchases.id))
          .innerJoin(vendors, eq(simplePurchases.vendor_id, vendors.id))
          .where(inArray(simplePurchasePayments.id, purchaseIds))
          .then((res) =>
            Object.fromEntries(res.map((r) => [r.id, { name: r.name, url: `/purchases-simple/${r.purchaseId}` }])),
          )
      : Promise.resolve({} as Record<string, { name: string; url: string }>),

    saleIds.length
      ? db
          .select({
            id: simpleSalePayments.id,
            name: customers.name,
            saleId: simpleSales.id,
          })
          .from(simpleSalePayments)
          .innerJoin(simpleSales, eq(simpleSalePayments.sale_id, simpleSales.id))
          .innerJoin(customers, eq(simpleSales.customer_id, customers.id))
          .where(inArray(simpleSalePayments.id, saleIds))
          .then((res) =>
            Object.fromEntries(res.map((r) => [r.id, { name: r.name, url: `/sales-simple/${r.saleId}` }])),
          )
      : Promise.resolve({} as Record<string, { name: string; url: string }>),

    salaryIds.length
      ? db
          .select({
            id: salaryPayments.id,
            name: workers.name,
            workerId: workers.id,
          })
          .from(salaryPayments)
          .innerJoin(workers, eq(salaryPayments.worker_id, workers.id))
          .where(inArray(salaryPayments.id, salaryIds))
          .then((res) =>
            Object.fromEntries(res.map((r) => [r.id, { name: r.name, url: `/hr/workers/${r.workerId}` }])),
          )
      : Promise.resolve({} as Record<string, { name: string; url: string }>),

    advanceIds.length
      ? db
          .select({
            id: salaryAdvances.id,
            name: workers.name,
            workerId: workers.id,
          })
          .from(salaryAdvances)
          .innerJoin(workers, eq(salaryAdvances.worker_id, workers.id))
          .where(inArray(salaryAdvances.id, advanceIds))
          .then((res) =>
            Object.fromEntries(res.map((r) => [r.id, { name: r.name, url: `/hr/workers/${r.workerId}` }])),
          )
      : Promise.resolve({} as Record<string, { name: string; url: string }>),

    transferIds.length
      ? db
          .select({
            id: accounts.id,
            name: accounts.name,
          })
          .from(accounts)
          .where(inArray(accounts.id, transferIds))
          .then((res) =>
            Object.fromEntries(res.map((r) => [r.id, { name: r.name, url: `/accounts/${r.id}` }])),
          )
      : Promise.resolve({} as Record<string, { name: string; url: string }>),

    otherIds.length
      ? db
          .select({ id: vendors.id, name: vendors.name })
          .from(vendors)
          .where(inArray(vendors.id, otherIds))
          .then((res) =>
            Object.fromEntries(res.map((r) => [r.id, { name: r.name, url: `/purchases/vendors/${r.id}` }])),
          )
      : Promise.resolve({} as Record<string, { name: string; url: string }>),

    otherIds.length
      ? db
          .select({ id: customers.id, name: customers.name })
          .from(customers)
          .where(inArray(customers.id, otherIds))
          .then((res) =>
            Object.fromEntries(res.map((r) => [r.id, { name: r.name, url: `/sales/customers/${r.id}` }])),
          )
      : Promise.resolve({} as Record<string, { name: string; url: string }>),
  ]);

  const combinedPurchaseMap = { ...purchaseMap, ...simplePurchaseMap };
  const combinedSaleMap = { ...saleMap, ...simpleSaleMap };
  const combinedOtherMap = { ...vendorMap, ...customerMap };

  return rows.map((r) => {
    if (!r.reference_id) return { reference_name: null, reference_url: null };
    const info =
      r.reference_type === "purchase_payment"
        ? combinedPurchaseMap[r.reference_id]
        : r.reference_type === "sale_payment"
          ? combinedSaleMap[r.reference_id]
          : r.reference_type === "salary"
            ? salaryMap[r.reference_id]
            : r.reference_type === "advance"
              ? advanceMap[r.reference_id]
              : r.reference_type === "transfer"
                ? transferMap[r.reference_id]
                : r.reference_type === "other"
                  ? combinedOtherMap[r.reference_id]
                  : null;
    return {
      reference_name: info?.name ?? null,
      reference_url: info?.url ?? null,
    };
  });
}
