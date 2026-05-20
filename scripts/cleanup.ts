import { db } from "../src/lib/db";
import {
  accountTransactions,
  salePayments,
  saleItems,
  purchasePayments,
  purchaseItems,
  salaryPayments,
  salaryAdvances,
  consumablesLog,
  stockLedger,
  scrapPool,
  periodReports,
  sales,
  purchases,
  workers,
  customers,
  vendors,
  materialSubtypes,
  materialCategories,
  accounts,
} from "../src/lib/db/schema";

async function cleanup() {
  console.log("🗑️  Wiping ALL transactional data...\n");

  // Child tables first (FK-safe order)
  const r0  = await db.delete(accountTransactions);  console.log(`  account_transactions: ${r0.rowCount ?? 0}`);
  const r1  = await db.delete(saleItems);             console.log(`  sale_items: ${r1.rowCount ?? 0}`);
  const r2  = await db.delete(salePayments);           console.log(`  sale_payments: ${r2.rowCount ?? 0}`);
  const r3  = await db.delete(purchaseItems);          console.log(`  purchase_items: ${r3.rowCount ?? 0}`);
  const r4  = await db.delete(purchasePayments);       console.log(`  purchase_payments: ${r4.rowCount ?? 0}`);
  const r5  = await db.delete(salaryAdvances);         console.log(`  salary_advances: ${r5.rowCount ?? 0}`);
  const r6  = await db.delete(salaryPayments);         console.log(`  salary_payments: ${r6.rowCount ?? 0}`);
  const r7  = await db.delete(consumablesLog);         console.log(`  consumables_log: ${r7.rowCount ?? 0}`);
  const r8  = await db.delete(stockLedger);            console.log(`  stock_ledger: ${r8.rowCount ?? 0}`);
  const r9  = await db.delete(scrapPool);              console.log(`  scrap_pool: ${r9.rowCount ?? 0}`);
  const r10 = await db.delete(periodReports);          console.log(`  period_reports: ${r10.rowCount ?? 0}`);

  // Parent tables
  const r11 = await db.delete(sales);                  console.log(`  sales: ${r11.rowCount ?? 0}`);
  const r12 = await db.delete(purchases);              console.log(`  purchases: ${r12.rowCount ?? 0}`);
  const r13 = await db.delete(workers);                console.log(`  workers: ${r13.rowCount ?? 0}`);
  const r14 = await db.delete(customers);              console.log(`  customers: ${r14.rowCount ?? 0}`);
  const r15 = await db.delete(vendors);                console.log(`  vendors: ${r15.rowCount ?? 0}`);
  const r16 = await db.delete(materialSubtypes);       console.log(`  material_subtypes: ${r16.rowCount ?? 0}`);
  const r17 = await db.delete(materialCategories);     console.log(`  material_categories: ${r17.rowCount ?? 0}`);
  const r18 = await db.delete(accounts);               console.log(`  accounts: ${r18.rowCount ?? 0}`);

  console.log("\n✅ All transactional data wiped!");
  console.log("User accounts, sessions, and organizations preserved.\n");
}

cleanup().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
