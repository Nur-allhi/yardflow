import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

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
            <span className="text-xl md:text-2xl font-mono font-bold text-[#0F172A]">0</span>
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
            <span className="text-xl md:text-2xl font-mono font-bold">৳0</span>
          </div>
          <div className="mt-1 md:mt-2 text-[10px] md:text-xs text-[#475569]">
            <span>No transactions yet</span>
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
            <span className="text-xl md:text-2xl font-mono font-bold text-[#EAB308]">৳0</span>
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
            <span className="text-xl md:text-2xl font-mono font-bold text-[#EAB308]">৳0</span>
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
          <div className="p-10 text-center text-[#475569] text-sm">
            <span className="material-symbols-outlined text-4xl block mb-2">
              shopping_cart
            </span>
            No sales recorded yet
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-[#c6c6cd] rounded-lg p-5 shadow-sm">
          <h3 className="font-display font-bold text-[#0F172A] mb-6">
            Stock Overview
          </h3>
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="uppercase tracking-wider text-[#0F172A]">
                  No Categories Added
                </span>
              </div>
            </div>
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
              <p className="font-mono text-2xl font-bold text-white">৳0</p>
            </div>
            <span className="material-symbols-outlined text-white/40 text-4xl">
              account_balance_wallet
            </span>
          </div>
          <div className="flex gap-4 border-t border-white/20 pt-4">
            <div>
              <p className="text-[10px] uppercase text-white/60">Cash in hand</p>
              <p className="font-mono text-sm font-semibold text-white">৳0</p>
            </div>
            <div className="border-l border-white/20 pl-4">
              <p className="text-[10px] uppercase text-white/60">Bank Assets</p>
              <p className="font-mono text-sm font-semibold text-white">৳0</p>
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
            <p className="font-mono text-lg font-bold text-[#0F172A]">৳0</p>
            <p className="text-[10px] text-[#505f76] mt-1">No outstanding dues</p>
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
            <p className="font-mono text-lg font-bold text-[#0F172A]">৳0</p>
            <p className="text-[10px] text-[#505f76] mt-1">No pending salaries</p>
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
        <div className="p-10 text-center text-[#475569] text-sm bg-white rounded-xl border border-[#c6c6cd]/30">
          <span className="material-symbols-outlined text-4xl block mb-2 text-[#c6c6cd]">
            shopping_cart
          </span>
          No sales recorded yet
        </div>
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
          <div className="text-center text-[#475569] text-sm py-6">
            <span className="material-symbols-outlined text-3xl block mb-2">
              account_balance
            </span>
            No accounts added yet
          </div>
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
          <div className="text-center text-[#475569] text-sm py-6">
            No pending dues
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
          <div className="text-center text-[#475569] text-sm py-6">
            No pending salaries
          </div>
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
