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
  materialCategories,
  materialSubtypes,
} from "@/lib/db/schema";
import { eq, and, sql, gte } from "drizzle-orm";

function formatMoney(n: number) {
  return "৳" + n.toLocaleString("en-IN");
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const orgId = session.org_id;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const orgConditions = [
    eq(sales.organization_id, orgId),
    sql`${sales.deleted_at} IS NULL`,
  ];

  const [[stockResult], [todaySalesResult], [arResult], [apResult], [salaryResult], [arOpeningResult], [apOpeningResult], accountList, categoryList] = await Promise.all([
    db.select({
      total_kg: sql<string>`COALESCE(SUM(CASE WHEN ${stockLedger.movement_type} = 'in' THEN ${stockLedger.quantity_kg}::numeric ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN ${stockLedger.movement_type} = 'out' THEN ${stockLedger.quantity_kg}::numeric ELSE 0 END), 0)`,
    }).from(stockLedger)
      .where(and(eq(stockLedger.organization_id, orgId), sql`${stockLedger.deleted_at} IS NULL`)),

    db.select({
      total: sql<string>`COALESCE(SUM(${sales.total_amount}::numeric), 0)`,
    }).from(sales)
      .where(and(...orgConditions, gte(sales.sale_date, todayStart))),

    db.select({
      total: sql<string>`COALESCE(SUM(${sales.due_amount}::numeric), 0)`,
    }).from(sales)
      .where(and(eq(sales.organization_id, orgId), sql`${sales.deleted_at} IS NULL`)),

    db.select({
      total: sql<string>`COALESCE(SUM(${purchases.due_amount}::numeric), 0)`,
    }).from(purchases)
      .where(and(eq(purchases.organization_id, orgId), sql`${purchases.deleted_at} IS NULL`)),

    db.select({
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
      )),

    db.select({
      total: sql<string>`COALESCE(SUM(${customers.opening_balance}::numeric), 0)`,
    }).from(customers)
      .where(and(eq(customers.organization_id, orgId), sql`${customers.deleted_at} IS NULL`)),

    db.select({
      total: sql<string>`COALESCE(SUM(${vendors.opening_balance}::numeric), 0)`,
    }).from(vendors)
      .where(and(eq(vendors.organization_id, orgId), sql`${vendors.deleted_at} IS NULL`)),

    db.select({
      id: accounts.id, name: accounts.name, type: accounts.type, current_balance: accounts.current_balance,
    }).from(accounts)
      .where(and(eq(accounts.organization_id, orgId), eq(accounts.is_active, true), sql`${accounts.deleted_at} IS NULL`))
      .orderBy(accounts.name),

    db.select({
      id: materialCategories.id,
      name: materialCategories.name,
    }).from(materialCategories)
      .where(and(eq(materialCategories.organization_id, orgId), sql`${materialCategories.deleted_at} IS NULL`))
      .orderBy(materialCategories.name),
  ]);

  const todaySales = Number(todaySalesResult.total);
  const stockKg = Number(stockResult.total_kg);
  const arTotal = Number(arResult.total) + Number(arOpeningResult.total);
  const apTotal = Number(apResult.total) + Number(apOpeningResult.total);
  const pendingSalaryCount = salaryResult.pending;

  const recentSales = await db.select({
    id: sales.id,
    total_amount: sales.total_amount,
    sale_date: sales.sale_date,
    status: sales.status,
    customer_name: customers.name,
  }).from(sales)
    .leftJoin(customers, and(eq(sales.customer_id, customers.id), sql`${customers.deleted_at} IS NULL`))
    .where(and(eq(sales.organization_id, orgId), sql`${sales.deleted_at} IS NULL`))
    .orderBy(sql`${sales.sale_date} DESC`)
    .limit(5);

  const categoryStock = await Promise.all(
    categoryList.map(async (cat) => {
      const [row] = await db.select({
        kg: sql<string>`COALESCE(SUM(CASE WHEN ${stockLedger.movement_type} = 'in' THEN ${stockLedger.quantity_kg}::numeric ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN ${stockLedger.movement_type} = 'out' THEN ${stockLedger.quantity_kg}::numeric ELSE 0 END), 0)`,
      }).from(stockLedger)
        .innerJoin(materialSubtypes, eq(stockLedger.subtype_id, materialSubtypes.id))
        .where(and(
          eq(materialSubtypes.category_id, cat.id),
          eq(stockLedger.organization_id, orgId),
          sql`${stockLedger.deleted_at} IS NULL`,
          sql`${materialSubtypes.deleted_at} IS NULL`,
        ));
      return { name: cat.name, kg: Number(row.kg) };
    })
  );

  const cashTotal = accountList.filter(a => a.type === "cash").reduce((s, a) => s + Number(a.current_balance), 0);
  const bankTotal = accountList.filter(a => a.type === "bank").reduce((s, a) => s + Number(a.current_balance), 0);
  const grandTotal = cashTotal + bankTotal;

  return (
    <div className="p-4 md:p-6 space-y-6 md:space-y-8">
      {/* ── Desktop: Quick Actions Bar ── */}
      <div className="hidden md:flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#0F172A]">
            Operational Dashboard
          </h1>
          <p className="text-[#475569] text-sm">
            Real-time overview for YardFlow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/reports"
            className="px-4 py-2 text-[#475569] text-sm font-medium hover:bg-[#e6e8ea] rounded transition-colors"
          >
            Generate Report
          </Link>
          <Link
            href="/purchases/new"
            className="px-4 py-2 border border-[#0F172A] text-[#0F172A] text-sm font-medium hover:bg-[#0F172A]/5 rounded transition-colors"
          >
            + New Purchase
          </Link>
          <Link
            href="/sales/new"
            className="px-4 py-2 bg-[#0F172A] text-white text-sm font-bold rounded hover:bg-[#0F172A]/90 transition-colors"
          >
            + New Sale
          </Link>
        </div>
      </div>

      {/* ── Mobile: Quick Entry 2x2 Grid ── */}
      <section className="md:hidden">
        <h2 className="font-display font-semibold text-lg mb-3 px-1 text-[#0F172A]">
          Quick Entry
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/sales/new" className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-[#c6c6cd]/30 shadow-sm active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[#059669] bg-[#85f8c4]/30 text-3xl p-2 rounded-lg mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>add_shopping_cart</span>
            <span className="text-sm font-medium text-[#0F172A]">New Sale</span>
          </Link>
          <Link href="/inventory/subtypes" className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-[#c6c6cd]/30 shadow-sm active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[#3f465c] bg-[#131B2E]/10 text-3xl p-2 rounded-lg mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
            <span className="text-sm font-medium text-[#0F172A]">Add Stock</span>
          </Link>
          <Link href="/hr" className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-[#c6c6cd]/30 shadow-sm active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[#38485d] bg-[#d0e1fb] text-3xl p-2 rounded-lg mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>engineering</span>
            <span className="text-sm font-medium text-[#0F172A]">Labor Entry</span>
          </Link>
          <Link href="/sales/new" className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-[#c6c6cd]/30 shadow-sm active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[#ba1a1a] bg-[#ffdad6] text-3xl p-2 rounded-lg mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
            <span className="text-sm font-medium text-[#0F172A]">Dispatch</span>
          </Link>
        </div>
      </section>

      {/* ── Desktop Title (mobile hidden) ── */}
      <div className="md:hidden">
        <h1 className="text-xl font-bold font-display text-[#0F172A]">Dashboard</h1>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <div className="bg-white border border-[#c6c6cd]/30 md:border-[#c6c6cd] rounded-lg md:rounded-lg p-4 md:p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3 md:mb-4">
            <span className="text-[#475569] text-[10px] md:text-xs font-bold uppercase tracking-widest">
              Total Stock
            </span>
            <span className="material-symbols-outlined text-[#0F172A]/40 text-xl md:text-2xl">
              warehouse
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl md:text-2xl font-mono font-bold text-[#0F172A]">{stockKg.toFixed(1)}</span>
            <span className="text-xs md:text-sm text-[#475569]">kg</span>
          </div>
        </div>

        <div className="bg-white border border-[#c6c6cd]/30 md:border-[#c6c6cd] rounded-lg md:rounded-lg p-4 md:p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3 md:mb-4">
            <span className="text-[#475569] text-[10px] md:text-xs font-bold uppercase tracking-widest">
              Today Sales
            </span>
            <span className="material-symbols-outlined text-[#059669] text-xl md:text-2xl">
              payments
            </span>
          </div>
          <div className="flex items-baseline gap-1 text-[#059669]">
            <span className="text-xl md:text-2xl font-mono font-bold">{
              todaySales > 0 ? formatMoney(todaySales) : "৳0"
            }</span>
          </div>
          <div className="mt-1 md:mt-2 text-[10px] md:text-xs text-[#475569]">
            <span>{todaySales > 0 ? "Today's revenue" : "No transactions yet"}</span>
          </div>
        </div>

        <div className="bg-white border border-[#c6c6cd]/30 md:border-[#c6c6cd] rounded-lg md:rounded-lg p-4 md:p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3 md:mb-4">
            <span className="text-[#475569] text-[10px] md:text-xs font-bold uppercase tracking-widest">
              Customers Owe
            </span>
            <span className="material-symbols-outlined text-[#EAB308] text-xl md:text-2xl">
              account_balance_wallet
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl md:text-2xl font-mono font-bold text-[#EAB308]">{formatMoney(arTotal)}</span>
          </div>
        </div>

        <div className="bg-white border border-[#c6c6cd]/30 md:border-[#c6c6cd] rounded-lg md:rounded-lg p-4 md:p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3 md:mb-4">
            <span className="text-[#475569] text-[10px] md:text-xs font-bold uppercase tracking-widest">
              We Owe Vendors
            </span>
            <span className="material-symbols-outlined text-[#475569] text-xl md:text-2xl">
              receipt_long
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl md:text-2xl font-mono font-bold text-[#EAB308]">{formatMoney(apTotal)}</span>
          </div>
        </div>
      </div>

      {/* ── Desktop: Recent Sales + Stock Overview ── */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-6 bg-white border border-[#c6c6cd] rounded-lg overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#c6c6cd] flex justify-between items-center">
            <h3 className="font-display font-bold text-[#0F172A]">
              Recent Sales
            </h3>
            <Link
              href="/sales"
              className="text-[#0F172A] text-xs font-bold hover:underline"
            >
              View All
            </Link>
          </div>
          {recentSales.length === 0 ? (
            <div className="p-10 text-center text-[#475569] text-sm">
              <span className="material-symbols-outlined text-4xl block mb-2">
                shopping_cart
              </span>
              No sales recorded yet
            </div>
          ) : (
            <div className="divide-y divide-[#c6c6cd]/30">
              {recentSales.map((s) => (
                <Link key={s.id} href={`/sales/${s.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-[#f2f4f6] transition-colors">
                  <div>
                    <p className="text-sm font-bold text-[#0F172A]">{s.customer_name || "Cash Sale"}</p>
                    <p className="text-[11px] text-[#475569]">{new Date(s.sale_date).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold">{formatMoney(Number(s.total_amount))}</p>
                    <span className={`text-[10px] font-bold uppercase ${s.status === "paid" ? "text-[#16A34A]" : s.status === "partial" ? "text-[#CA8A04]" : "text-[#DC2626]"}`}>{s.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 bg-white border border-[#c6c6cd] rounded-lg p-5 shadow-sm">
          <h3 className="font-display font-bold text-[#0F172A] mb-6">
            Stock Overview
          </h3>
          <div className="space-y-3">
            {categoryStock.length === 0 ? (
              <div className="text-xs text-[#475569] text-center py-2">
                No categories added
              </div>
            ) : (
              categoryStock.slice(0, 5).map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-[#0F172A]">{c.name}</span>
                    <span className="font-mono text-[#475569]">{c.kg.toFixed(1)} kg</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#e6e8ea] rounded-full overflow-hidden">
                    <div className="h-full bg-[#059669] rounded-full" style={{ width: `${Math.min(100, (c.kg / (stockKg || 1)) * 100)}%` }} />
                  </div>
                </div>
              ))
            )}
            <Link
              href="/inventory"
              className="block w-full py-2 bg-[#f2f4f6] text-[#0F172A] text-xs font-bold rounded border border-[#c6c6cd] hover:bg-[#e6e8ea] transition-colors text-center"
            >
              Go to Inventory
            </Link>
          </div>
        </div>
      </div>

      {/* ── Mobile: Financial Overview (Bento style) ── */}
      <section className="md:hidden space-y-3">
        <h2 className="font-display font-semibold text-lg px-1 text-[#0F172A]">
          Financial Overview
        </h2>
        <div className="p-5 bg-[#131B2E] text-white rounded-xl shadow-md relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#3f465c]/20 rounded-full blur-3xl" />
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
          <div className="p-4 bg-white border border-[#c6c6cd]/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#EAB308] text-xl">
                pending_actions
              </span>
              <p className="text-[10px] text-[#505f76] uppercase font-bold">
                Pending Dues
              </p>
            </div>
            <p className="font-mono text-lg font-bold text-[#0F172A]">{formatMoney(arTotal)}</p>
            <p className="text-[10px] text-[#505f76] mt-1">{arTotal > 0 ? "Outstanding customer dues" : "No outstanding dues"}</p>
          </div>
          <div className="p-4 bg-white border border-[#c6c6cd]/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#ba1a1a] text-xl">
                payments
              </span>
              <p className="text-[10px] text-[#505f76] uppercase font-bold">
                Salaries
              </p>
            </div>
            <p className="font-mono text-lg font-bold text-[#0F172A]">{pendingSalaryCount}</p>
            <p className="text-[10px] text-[#505f76] mt-1">{pendingSalaryCount > 0 ? `${pendingSalaryCount} worker${pendingSalaryCount > 1 ? "s" : ""} unpaid` : "No pending salaries"}</p>
          </div>
        </div>
      </section>

      {/* ── Mobile: Recent Sales Card List ── */}
      <section className="md:hidden">
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="font-display font-semibold text-lg text-[#0F172A]">
            Recent Sales
          </h2>
          <Link
            href="/sales"
            className="text-[#059669] text-xs font-bold flex items-center"
          >
            View All
            <span className="material-symbols-outlined text-sm ml-1">
              chevron_right
            </span>
          </Link>
        </div>
        {recentSales.length === 0 ? (
          <div className="p-10 text-center text-[#475569] text-sm bg-white rounded-xl border border-[#c6c6cd]/30">
            <span className="material-symbols-outlined text-4xl block mb-2 text-[#c6c6cd]">
              shopping_cart
            </span>
            No sales recorded yet
          </div>
        ) : (
          <div className="space-y-2">
            {recentSales.slice(0, 3).map((s) => (
              <Link key={s.id} href={`/sales/${s.id}`} className="block bg-white p-4 rounded-xl border border-[#c6c6cd]/30">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-[#0F172A]">{s.customer_name || "Cash Sale"}</p>
                    <p className="text-xs text-[#475569]">{new Date(s.sale_date).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold">{formatMoney(Number(s.total_amount))}</p>
                    <span className={`text-[10px] font-bold uppercase ${s.status === "paid" ? "text-[#16A34A]" : s.status === "partial" ? "text-[#CA8A04]" : "text-[#DC2626]"}`}>{s.status}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Desktop: Account Balances, Pending Dues, Pending Salaries ── */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-[#c6c6cd] rounded-lg p-5 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display font-bold text-[#0F172A]">
              Account Balances
            </h3>
            <span className="material-symbols-outlined text-[#76777d]">
              account_balance
            </span>
          </div>
          {accountList.length === 0 ? (
          <div className="text-center text-[#475569] text-sm py-6">
            <span className="material-symbols-outlined text-3xl block mb-2">
              account_balance
            </span>
            No accounts added yet
          </div>
        ) : (
          <div className="space-y-3">
            {accountList.map((a) => (
              <div key={a.id} className="flex justify-between items-center py-2 border-b border-[#c6c6cd]/20 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${a.type === "cash" ? "bg-[#059669]" : "bg-[#0F172A]"}`} />
                  <span className="text-sm font-medium text-[#0F172A]">{a.name}</span>
                </div>
                <span className="text-sm font-mono font-bold">{formatMoney(Number(a.current_balance))}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 border-t border-[#0F172A]/20">
              <span className="text-sm font-bold text-[#0F172A]">Total</span>
              <span className="text-sm font-mono font-bold text-[#059669]">{formatMoney(grandTotal)}</span>
            </div>
          </div>
        )}
        </div>

        <div className="bg-white border border-[#c6c6cd] rounded-lg p-5 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display font-bold text-[#0F172A]">
              Pending Dues
            </h3>
            <span className="material-symbols-outlined text-[#76777d]">
              pending_actions
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-[#475569]">Customers owe us</span>
              <span className="text-sm font-mono font-bold text-[#EAB308]">{formatMoney(arTotal)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-[#c6c6cd]/20">
              <span className="text-sm text-[#475569]">We owe vendors</span>
              <span className="text-sm font-mono font-bold text-[#EAB308]">{formatMoney(apTotal)}</span>
            </div>
            {arTotal === 0 && apTotal === 0 && (
              <div className="text-center text-[#475569] text-sm py-4">No pending dues</div>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#c6c6cd] rounded-lg p-5 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display font-bold text-[#0F172A]">
              Pending Salaries
            </h3>
            <span className="material-symbols-outlined text-[#76777d]">
              groups
            </span>
          </div>
          {pendingSalaryCount > 0 ? (
            <div className="text-center py-6">
              <p className="text-3xl font-mono font-bold text-[#DC2626]">{pendingSalaryCount}</p>
              <p className="text-sm text-[#475569] mt-1">worker{pendingSalaryCount > 1 ? "s" : ""} not yet paid</p>
            </div>
          ) : (
            <div className="text-center text-[#475569] text-sm py-6">No pending salaries</div>
          )}
        </div>
      </div>

      {/* ── Mobile: Stock Trend Placeholder ── */}
      <section className="md:hidden h-48 w-full bg-[#eceef0] rounded-xl overflow-hidden relative border border-[#c6c6cd]/30 mb-4">
        <div className="absolute inset-0 bg-gradient-to-t from-[#e0e3e5] to-transparent opacity-50" />
        <div className="absolute top-4 left-4">
          <p className="text-[10px] font-bold text-[#505f76] uppercase">
            Stock Trend (7 Days)
          </p>
        </div>
        <div className="absolute bottom-4 left-0 right-0 h-24 flex items-end justify-around px-4">
          <div className="w-8 bg-[#0F172A] rounded-t-sm h-[40%]" />
          <div className="w-8 bg-[#0F172A] rounded-t-sm h-[60%]" />
          <div className="w-8 bg-[#0F172A] rounded-t-sm h-[55%]" />
          <div className="w-8 bg-[#0F172A] rounded-t-sm h-[80%]" />
          <div className="w-8 bg-[#0F172A] rounded-t-sm h-[70%]" />
          <div className="w-8 bg-[#68dba9] rounded-t-sm h-[95%]" />
          <div className="w-8 bg-[#bec6e0] rounded-t-sm h-[65%]" />
        </div>
      </section>
    </div>
  );
}
