import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  accounts,
  sales,
  purchases,
  stockLedger,
  workers,
  salaryPayments,
  customers,
  vendors,
  organizations,
  materialCategories,
  materialSubtypes,
  simpleSales,
  simplePurchases,
  inventoryPool,
} from "@/lib/db/schema";
import { eq, and, sql, gte } from "drizzle-orm";

function formatMoney(n: number) {
  return n.toLocaleString("en-IN") + " tk";
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const orgId = session.org_id;

  const [org] = await db
    .select({ inventory_mode: organizations.inventory_mode })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  const inventoryMode = org?.inventory_mode ?? "detailed";

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const pendingSalaryRows = await db.select({
    pending: sql<number>`COUNT(*)::int`,
  }).from(workers)
    .leftJoin(salaryPayments, and(
      eq(workers.id, salaryPayments.worker_id),
      eq(salaryPayments.month, now.getMonth() + 1),
      eq(salaryPayments.year, now.getFullYear()),
      sql`${salaryPayments.deleted_at} IS NULL`,
    ))
    .where(and(
      eq(workers.organization_id, orgId),
      eq(workers.is_active, true),
      sql`${workers.deleted_at} IS NULL`,
      sql`${salaryPayments.id} IS NULL`,
    ));

  const arOpeningRows = await db.select({
    total: sql<string>`COALESCE(SUM(${customers.opening_balance}::numeric), 0)`,
  }).from(customers)
    .where(and(eq(customers.organization_id, orgId), sql`${customers.deleted_at} IS NULL`));

  const apOpeningRows = await db.select({
    total: sql<string>`COALESCE(SUM(${vendors.opening_balance}::numeric), 0)`,
  }).from(vendors)
    .where(and(eq(vendors.organization_id, orgId), sql`${vendors.deleted_at} IS NULL`));

  const accountList = await db.select({
    id: accounts.id, name: accounts.name, type: accounts.type, current_balance: accounts.current_balance,
  }).from(accounts)
    .where(and(eq(accounts.organization_id, orgId), eq(accounts.is_active, true), sql`${accounts.deleted_at} IS NULL`))
    .orderBy(accounts.name);

  const categoryList = await db.select({
    id: materialCategories.id,
    name: materialCategories.name,
  }).from(materialCategories)
    .where(and(eq(materialCategories.organization_id, orgId), sql`${materialCategories.deleted_at} IS NULL`))
    .orderBy(materialCategories.name);

  let todaySales: number;
  let stockKg: number;
  let arTotal: number;
  let apTotal: number;
  let recentSales: { id: string; total_amount: string; sale_date: Date; status: string; customer_name: string | null }[];
  let categoryStock: { name: string; kg: number }[];

  if (inventoryMode === "simple") {
    const poolRows = await db.select({
      total_kg: sql<string>`COALESCE(total_quantity_kg, 0)`,
    }).from(inventoryPool)
      .where(eq(inventoryPool.organization_id, orgId));

    const todaySalesRows = await db.select({
      total: sql<string>`COALESCE(SUM(${simpleSales.total_amount}::numeric), 0)`,
    }).from(simpleSales)
      .where(and(eq(simpleSales.organization_id, orgId), sql`${simpleSales.deleted_at} IS NULL`, gte(simpleSales.sale_date, todayStart)));

    const arRows = await db.select({
      total: sql<string>`COALESCE(SUM(${simpleSales.due_amount}::numeric), 0)`,
    }).from(simpleSales)
      .where(and(eq(simpleSales.organization_id, orgId), sql`${simpleSales.deleted_at} IS NULL`));

    const apRows = await db.select({
      total: sql<string>`COALESCE(SUM(${simplePurchases.due_amount}::numeric), 0)`,
    }).from(simplePurchases)
      .where(and(eq(simplePurchases.organization_id, orgId), sql`${simplePurchases.deleted_at} IS NULL`));

    todaySales = Number(todaySalesRows[0]?.total ?? 0);
    stockKg = Number(poolRows[0]?.total_kg ?? 0);
    arTotal = Number(arRows[0]?.total ?? 0) + Number(arOpeningRows[0]?.total ?? 0);
    apTotal = Number(apRows[0]?.total ?? 0) + Number(apOpeningRows[0]?.total ?? 0);

    recentSales = await db.select({
      id: simpleSales.id,
      total_amount: simpleSales.total_amount,
      sale_date: simpleSales.sale_date,
      status: simpleSales.status,
      customer_name: sql<string>`COALESCE(${customers.name}, ${simpleSales.customer_name})`,
    }).from(simpleSales)
      .leftJoin(customers, and(eq(simpleSales.customer_id, customers.id), sql`${customers.deleted_at} IS NULL`))
      .where(and(eq(simpleSales.organization_id, orgId), sql`${simpleSales.deleted_at} IS NULL`))
      .orderBy(sql`${simpleSales.sale_date} DESC`)
      .limit(5);

    categoryStock = [{ name: "Total Stock", kg: stockKg }];
  } else {
    const orgConditions = [
      eq(sales.organization_id, orgId),
      sql`${sales.deleted_at} IS NULL`,
    ];

    const stockRows = await db.select({
      total_kg: sql<string>`COALESCE(SUM(CASE WHEN ${stockLedger.movement_type} = 'in' THEN ${stockLedger.quantity_kg}::numeric ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN ${stockLedger.movement_type} = 'out' THEN ${stockLedger.quantity_kg}::numeric ELSE 0 END), 0)`,
    }).from(stockLedger)
      .where(and(eq(stockLedger.organization_id, orgId), sql`${stockLedger.deleted_at} IS NULL`));

    const todaySalesRows = await db.select({
      total: sql<string>`COALESCE(SUM(${sales.total_amount}::numeric), 0)`,
    }).from(sales)
      .where(and(...orgConditions, gte(sales.sale_date, todayStart)));

    const arRows = await db.select({
      total: sql<string>`COALESCE(SUM(${sales.due_amount}::numeric), 0)`,
    }).from(sales)
      .where(and(eq(sales.organization_id, orgId), sql`${sales.deleted_at} IS NULL`));

    const apRows = await db.select({
      total: sql<string>`COALESCE(SUM(${purchases.due_amount}::numeric), 0)`,
    }).from(purchases)
      .where(and(eq(purchases.organization_id, orgId), sql`${purchases.deleted_at} IS NULL`));

    todaySales = Number(todaySalesRows[0]?.total ?? 0);
    stockKg = Number(stockRows[0]?.total_kg ?? 0);
    arTotal = Number(arRows[0]?.total ?? 0) + Number(arOpeningRows[0]?.total ?? 0);
    apTotal = Number(apRows[0]?.total ?? 0) + Number(apOpeningRows[0]?.total ?? 0);

    recentSales = await db.select({
      id: sales.id,
      total_amount: sales.total_amount,
      sale_date: sales.sale_date,
      status: sales.status,
      customer_name: sql<string>`COALESCE(${customers.name}, ${sales.customer_name})`,
    }).from(sales)
      .leftJoin(customers, and(eq(sales.customer_id, customers.id), sql`${customers.deleted_at} IS NULL`))
      .where(and(eq(sales.organization_id, orgId), sql`${sales.deleted_at} IS NULL`))
      .orderBy(sql`${sales.sale_date} DESC`)
      .limit(5);

    const categoryStockRows = await db.select({
      category_id: materialSubtypes.category_id,
      kg: sql<string>`COALESCE(SUM(CASE WHEN ${stockLedger.movement_type} = 'in' THEN ${stockLedger.quantity_kg}::numeric ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN ${stockLedger.movement_type} = 'out' THEN ${stockLedger.quantity_kg}::numeric ELSE 0 END), 0)`,
    }).from(stockLedger)
      .innerJoin(materialSubtypes, eq(stockLedger.subtype_id, materialSubtypes.id))
      .where(and(
        eq(stockLedger.organization_id, orgId),
        sql`${stockLedger.deleted_at} IS NULL`,
        sql`${materialSubtypes.deleted_at} IS NULL`,
      ))
      .groupBy(materialSubtypes.category_id);

    const stockByCategory = Object.fromEntries(
      categoryStockRows.map((r) => [r.category_id, Number(r.kg)]),
    );
    categoryStock = categoryList.map((cat) => ({
      name: cat.name,
      kg: stockByCategory[cat.id] ?? 0,
    }));
  }

  const pendingSalaryCount = pendingSalaryRows[0]?.pending ?? 0;

  const cashTotal = accountList.filter(a => a.type === "cash").reduce((s, a) => s + Number(a.current_balance), 0);
  const bankTotal = accountList.filter(a => a.type === "bank").reduce((s, a) => s + Number(a.current_balance), 0);
  const grandTotal = cashTotal + bankTotal;

  const newPurchaseHref = inventoryMode === "simple" ? "/purchases-simple/new" : "/purchases/new";
  const newSaleHref = inventoryMode === "simple" ? "/sales-simple/new" : "/sales/new";

  return (
    <div className="p-4 md:p-6 space-y-6 md:space-y-8">
      {/* ── Desktop: Quick Actions Bar ── */}
      <div className="hidden md:flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-primary-container">
            Operational Dashboard
          </h1>
          <p className="text-on-surface-variant text-sm">
            Real-time overview for YardFlow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/reports"
            className="px-4 py-2 text-on-surface-variant text-sm font-medium hover:bg-surface-container-high rounded transition-colors"
          >
            Generate Report
          </Link>
          <Link
            href={newPurchaseHref}
            className="px-4 py-2 border border-primary-container text-primary-container text-sm font-medium hover:bg-primary-container/5 rounded transition-colors"
          >
            + New Purchase
          </Link>
          <Link
            href={newSaleHref}
            className="px-4 py-2 bg-primary-container text-white text-sm font-bold rounded hover:bg-primary-container/90 transition-colors"
          >
            + New Sale
          </Link>
        </div>
      </div>

      {/* ── Mobile: Quick Entry 2x2 Grid ── */}
      <section className="md:hidden">
        <h2 className="font-display font-semibold text-lg mb-3 px-1 text-primary-container">
          Quick Entry
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href={newSaleHref} className="flex flex-col items-center justify-center p-4 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm active:scale-95 transition-all">
            <span className="material-symbols-outlined text-tertiary bg-tertiary-fixed/30 text-3xl p-2 rounded-lg mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>add_shopping_cart</span>
            <span className="text-sm font-medium text-primary-container">New Sale</span>
          </Link>
          <Link href={inventoryMode === "simple" ? "/inventory-simple" : "/inventory/subtypes"} className="flex flex-col items-center justify-center p-4 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm active:scale-95 transition-all">
            <span className="material-symbols-outlined text-on-primary-fixed-variant bg-primary-container/10 text-3xl p-2 rounded-lg mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
            <span className="text-sm font-medium text-primary-container">{inventoryMode === "simple" ? "Inventory" : "Add Stock"}</span>
          </Link>
          <Link href="/hr" className="flex flex-col items-center justify-center p-4 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm active:scale-95 transition-all">
            <span className="material-symbols-outlined text-on-secondary-fixed-variant bg-secondary-container text-3xl p-2 rounded-lg mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>engineering</span>
            <span className="text-sm font-medium text-primary-container">Labor Entry</span>
          </Link>
          <Link href="/sales/new" className="flex flex-col items-center justify-center p-4 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm active:scale-95 transition-all">
            <span className="material-symbols-outlined text-error bg-error-container text-3xl p-2 rounded-lg mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
            <span className="text-sm font-medium text-primary-container">Dispatch</span>
          </Link>
        </div>
      </section>

      {/* ── Desktop Title (mobile hidden) ── */}
      <div className="md:hidden">
        <h1 className="text-xl font-bold font-display text-primary-container">Dashboard</h1>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl md:rounded-lg p-4 md:p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3 md:mb-4">
            <span className="text-on-surface-variant text-[10px] md:text-xs font-bold uppercase tracking-widest">
              Total Stock
            </span>
            <span className="material-symbols-outlined text-primary-container/40 text-xl md:text-2xl">
              warehouse
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl md:text-2xl font-mono font-bold text-primary-container">{stockKg.toFixed(1)}</span>
            <span className="text-xs md:text-sm text-on-surface-variant">kg</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl md:rounded-lg p-4 md:p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3 md:mb-4">
            <span className="text-on-surface-variant text-[10px] md:text-xs font-bold uppercase tracking-widest">
              Today Sales
            </span>
            <span className="material-symbols-outlined text-tertiary text-xl md:text-2xl">
              payments
            </span>
          </div>
          <div className="flex items-baseline gap-1 text-tertiary">
            <span className="text-xl md:text-2xl font-mono font-bold">{
              todaySales > 0 ? formatMoney(todaySales) : "৳0"
            }</span>
          </div>
          <div className="mt-1 md:mt-2 text-[10px] md:text-xs text-on-surface-variant">
            <span>{todaySales > 0 ? "Today's revenue" : "No transactions yet"}</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl md:rounded-lg p-4 md:p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3 md:mb-4">
            <span className="text-on-surface-variant text-[10px] md:text-xs font-bold uppercase tracking-widest">
              Customers Owe
            </span>
            <span className="material-symbols-outlined text-warning text-xl md:text-2xl">
              account_balance_wallet
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl md:text-2xl font-mono font-bold text-warning">{formatMoney(arTotal)}</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl md:rounded-lg p-4 md:p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3 md:mb-4">
            <span className="text-on-surface-variant text-[10px] md:text-xs font-bold uppercase tracking-widest">
              We Owe Vendors
            </span>
            <span className="material-symbols-outlined text-on-surface-variant text-xl md:text-2xl">
              receipt_long
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl md:text-2xl font-mono font-bold text-warning">{formatMoney(apTotal)}</span>
          </div>
        </div>
      </div>

      {/* ── Desktop: Recent Sales + Stock Overview ── */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-6 bg-white border border-outline-variant rounded-lg overflow-hidden shadow-sm">
          <div className="p-5 border-b border-outline-variant flex justify-between items-center">
            <h3 className="font-display font-bold text-primary-container">
              Recent Sales
            </h3>
            <Link
              href="/sales"
              className="text-primary-container text-xs font-bold hover:underline"
            >
              View All
            </Link>
          </div>
          {recentSales.length === 0 ? (
            <div className="p-10 text-center text-on-surface-variant text-sm">
              <span className="material-symbols-outlined text-4xl block mb-2">
                shopping_cart
              </span>
              No sales recorded yet
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/30">
              {recentSales.map((s) => (
                <Link key={s.id} href={`/sales/${s.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-surface-container-low transition-colors">
                  <div>
                    <p className="text-sm font-bold text-primary-container">{s.customer_name || "Cash Sale"}</p>
                    <p className="text-[11px] text-on-surface-variant">{new Date(s.sale_date).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold">{formatMoney(Number(s.total_amount))}</p>
                    <span className={`text-[10px] font-bold uppercase ${s.status === "paid" ? "text-success" : s.status === "partial" ? "text-warning" : "text-error"}`}>{s.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 bg-white border border-outline-variant rounded-lg p-5 shadow-sm">
          <h3 className="font-display font-bold text-primary-container mb-6">
            Stock Overview
          </h3>
          <div className="space-y-3">
            {categoryStock.length === 0 ? (
              <div className="text-xs text-on-surface-variant text-center py-2">
                No categories added
              </div>
            ) : (
              categoryStock.slice(0, 5).map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-primary-container">{c.name}</span>
                    <span className="font-mono text-on-surface-variant">{c.kg.toFixed(1)} kg</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-tertiary rounded-full" style={{ width: `${Math.min(100, (c.kg / (stockKg || 1)) * 100)}%` }} />
                  </div>
                </div>
              ))
            )}
            <Link
              href="/inventory"
              className="block w-full py-2 bg-surface-container-low text-primary-container text-xs font-bold rounded border border-outline-variant hover:bg-surface-container-high transition-colors text-center"
            >
              Go to Inventory
            </Link>
          </div>
        </div>
      </div>

      {/* ── Mobile: Financial Overview (Bento style) ── */}
      <section className="md:hidden space-y-3">
        <h2 className="font-display font-semibold text-lg px-1 text-primary-container">
          Financial Overview
        </h2>
        <div className="p-5 bg-primary-container text-white rounded-xl shadow-md relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-on-primary-fixed-variant/20 rounded-full blur-3xl" />
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] uppercase text-white/80 mb-1 font-medium">
                Available Balance
              </p>
              <p className="font-mono text-2xl font-bold text-white">{formatMoney(grandTotal)}</p>
            </div>
            <span className="material-symbols-outlined text-white/40 text-4xl">
              account_balance_wallet
            </span>
          </div>
          <div className="flex gap-4 border-t border-white/20 pt-4">
            <div>
              <p className="text-[10px] uppercase text-white/60">Cash in hand</p>
              <p className="font-mono text-sm font-semibold text-white">{formatMoney(cashTotal)}</p>
            </div>
            <div className="border-l border-white/20 pl-4">
              <p className="text-[10px] uppercase text-white/60">Bank Assets</p>
              <p className="font-mono text-sm font-semibold text-white">{formatMoney(bankTotal)}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-warning text-xl">
                pending_actions
              </span>
              <p className="text-[10px] text-secondary uppercase font-bold">
                Pending Dues
              </p>
            </div>
            <p className="font-mono text-lg font-bold text-primary-container">{formatMoney(arTotal)}</p>
            <p className="text-[10px] text-secondary mt-1">{arTotal > 0 ? "Outstanding customer dues" : "No outstanding dues"}</p>
          </div>
          <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-error text-xl">
                payments
              </span>
              <p className="text-[10px] text-secondary uppercase font-bold">
                Salaries
              </p>
            </div>
            <p className="font-mono text-lg font-bold text-primary-container">{pendingSalaryCount}</p>
            <p className="text-[10px] text-secondary mt-1">{pendingSalaryCount > 0 ? `${pendingSalaryCount} worker${pendingSalaryCount > 1 ? "s" : ""} unpaid` : "No pending salaries"}</p>
          </div>
        </div>
      </section>

      {/* ── Mobile: Recent Sales Card List ── */}
      <section className="md:hidden">
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="font-display font-semibold text-lg text-primary-container">
            Recent Sales
          </h2>
          <Link
            href="/sales"
            className="text-tertiary text-xs font-bold flex items-center"
          >
            View All
            <span className="material-symbols-outlined text-sm ml-1">
              chevron_right
            </span>
          </Link>
        </div>
        {recentSales.length === 0 ? (
          <div className="p-10 text-center text-on-surface-variant text-sm bg-surface-container-lowest rounded-xl border border-outline-variant">
            <span className="material-symbols-outlined text-4xl block mb-2 text-outline-variant">
              shopping_cart
            </span>
            No sales recorded yet
          </div>
        ) : (
          <div className="space-y-2">
            {recentSales.slice(0, 3).map((s) => (
              <Link key={s.id} href={`/sales/${s.id}`} className="block bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-primary-container">{s.customer_name || "Cash Sale"}</p>
                    <p className="text-xs text-on-surface-variant">{new Date(s.sale_date).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold">{formatMoney(Number(s.total_amount))}</p>
                    <span className={`text-[10px] font-bold uppercase ${s.status === "paid" ? "text-success" : s.status === "partial" ? "text-warning" : "text-error"}`}>{s.status}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Desktop: Account Balances, Pending Dues, Pending Salaries ── */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-outline-variant rounded-lg p-5 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display font-bold text-primary-container">
              Account Balances
            </h3>
            <span className="material-symbols-outlined text-outline">
              account_balance
            </span>
          </div>
          {accountList.length === 0 ? (
          <div className="text-center text-on-surface-variant text-sm py-6">
            <span className="material-symbols-outlined text-3xl block mb-2">
              account_balance
            </span>
            No accounts added yet
          </div>
        ) : (
          <div className="space-y-3">
            {accountList.map((a) => (
              <div key={a.id} className="flex justify-between items-center py-2 border-b border-outline-variant/20 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${a.type === "cash" ? "bg-tertiary" : "bg-primary-container"}`} />
                  <span className="text-sm font-medium text-primary-container">{a.name}</span>
                </div>
                <span className="text-sm font-mono font-bold">{formatMoney(Number(a.current_balance))}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 border-t border-primary-container/20">
              <span className="text-sm font-bold text-primary-container">Total</span>
              <span className="text-sm font-mono font-bold text-tertiary">{formatMoney(grandTotal)}</span>
            </div>
          </div>
        )}
        </div>

        <div className="bg-white border border-outline-variant rounded-lg p-5 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display font-bold text-primary-container">
              Pending Dues
            </h3>
            <span className="material-symbols-outlined text-outline">
              pending_actions
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-on-surface-variant">Customers owe us</span>
              <span className="text-sm font-mono font-bold text-warning">{formatMoney(arTotal)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-outline-variant/20">
              <span className="text-sm text-on-surface-variant">We owe vendors</span>
              <span className="text-sm font-mono font-bold text-warning">{formatMoney(apTotal)}</span>
            </div>
            {arTotal === 0 && apTotal === 0 && (
              <div className="text-center text-on-surface-variant text-sm py-4">No pending dues</div>
            )}
          </div>
        </div>

        <div className="bg-white border border-outline-variant rounded-lg p-5 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display font-bold text-primary-container">
              Pending Salaries
            </h3>
            <span className="material-symbols-outlined text-outline">
              groups
            </span>
          </div>
          {pendingSalaryCount > 0 ? (
            <div className="text-center py-6">
              <p className="text-3xl font-mono font-bold text-error">{pendingSalaryCount}</p>
              <p className="text-sm text-on-surface-variant mt-1">worker{pendingSalaryCount > 1 ? "s" : ""} not yet paid</p>
            </div>
          ) : (
            <div className="text-center text-on-surface-variant text-sm py-6">No pending salaries</div>
          )}
        </div>
      </div>

      {/* ── Mobile: Stock Trend Placeholder ── */}
      <section className="md:hidden h-48 w-full bg-surface-container rounded-xl overflow-hidden relative border border-outline-variant mb-4">
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest to-transparent opacity-50" />
        <div className="absolute top-4 left-4">
          <p className="text-[10px] font-bold text-secondary uppercase">
            Stock Trend (7 Days)
          </p>
        </div>
        <div className="absolute bottom-4 left-0 right-0 h-24 flex items-end justify-around px-4">
          <div className="w-8 bg-primary-container rounded-t-sm h-[40%]" />
          <div className="w-8 bg-primary-container rounded-t-sm h-[60%]" />
          <div className="w-8 bg-primary-container rounded-t-sm h-[55%]" />
          <div className="w-8 bg-primary-container rounded-t-sm h-[80%]" />
          <div className="w-8 bg-primary-container rounded-t-sm h-[70%]" />
          <div className="w-8 bg-tertiary-fixed-dim rounded-t-sm h-[95%]" />
          <div className="w-8 bg-primary-fixed-dim rounded-t-sm h-[65%]" />
        </div>
      </section>
    </div>
  );
}
