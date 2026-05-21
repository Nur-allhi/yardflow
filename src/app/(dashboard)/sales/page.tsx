"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Sale {
  id: string;
  customer_id: string | null;
  sale_type: "fabricated" | "raw_passthrough" | "scrap";
  is_quick_cash_sale: boolean;
  sale_date: string | null;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  status: "paid" | "partial" | "due";
  note: string | null;
  created_at: string | null;
  customer_name: string;
  total_kg: number;
}

interface Summary {
  total_sales: number;
  total_paid: number;
  total_due: number;
  this_month: number;
}

interface CustomerOption {
  id: string;
  name: string;
}

const PER_PAGE = 15;

const SALE_TYPES = [
  { value: "", label: "All" },
  { value: "fabricated", label: "Fabricated" },
  { value: "raw_passthrough", label: "Raw" },
  { value: "scrap", label: "Scrap" },
] as const;

const STATUSES = [
  { value: "", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "due", label: "Due" },
] as const;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(n: number): string {
  return "৳" + n.toLocaleString("en-IN");
}

function formatKg(n: number): string {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }) + " kg";
}

function SaleTypeBadge({
  type,
  isQuickCash,
}: {
  type: string;
  isQuickCash: boolean;
}) {
  if (isQuickCash) {
    return (
      <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded border border-[#76777d] text-[#76777d] bg-[#e0e3e5] uppercase tracking-wider">
        Quick Cash
      </span>
    );
  }
  const chips: Record<
    string,
    { border: string; text: string; label: string }
  > = {
    fabricated: {
      border: "border-[#191c1e]",
      text: "text-[#191c1e]",
      label: "Fabricated",
    },
    raw_passthrough: {
      border: "border-[#505f76]",
      text: "text-[#505f76]",
      label: "Raw",
    },
    scrap: {
      border: "border-[#069669]",
      text: "text-[#069669]",
      label: "Scrap",
    },
  };
  const c = chips[type] || chips.fabricated;
  return (
    <span
      className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded border ${c.border} ${c.text} bg-[#e0e3e5] uppercase tracking-wider`}
    >
      {c.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { bg: string; text: string; dot: string; label: string }
  > = {
    paid: {
      bg: "bg-[#22C55E]/10",
      text: "text-[#22C55E]",
      dot: "bg-[#22C55E]",
      label: "Paid",
    },
    partial: {
      bg: "bg-[#EAB308]/10",
      text: "text-[#EAB308]",
      dot: "bg-[#EAB308]",
      label: "Partial",
    },
    due: {
      bg: "bg-[#ba1a1a]/10",
      text: "text-[#ba1a1a]",
      dot: "bg-[#ba1a1a]",
      label: "Due",
    },
  };
  const s = map[status] || map.due;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${s.bg} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function SkeletonTable() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-[#c6c6cd]/30 p-6 animate-pulse"
        >
          <div className="h-4 bg-[#e0e3e5] rounded w-1/3 mb-3" />
          <div className="h-4 bg-[#e0e3e5] rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function SalesPage() {
  const searchParams = useSearchParams();
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [customerFilter, setCustomerFilter] = useState(searchParams.get("customer_id") || "");
  const [saleTypeFilter, setSaleTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (customerFilter) params.set("customer_id", customerFilter);
    if (saleTypeFilter) params.set("sale_type", saleTypeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    params.set("page", String(page));
    params.set("limit", String(PER_PAGE));
    return `/api/sales?${params.toString()}`;
  }, [customerFilter, saleTypeFilter, statusFilter, dateFrom, dateTo, page]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesRes, customersRes] = await Promise.all([
        fetch(buildUrl()),
        fetch("/api/sales/customers"),
      ]);
      if (!salesRes.ok) throw new Error("Failed to load sales");
      const data = await salesRes.json();
      setSales(data.sales || []);
      setSummary(data.summary || null);
      setTotalCount(data.total_count ?? 0);
      if (customersRes.ok) setCustomers(await customersRes.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  function getSaleIdDisplay(s: Sale) {
    if (s.id.startsWith("ob-")) return "Opening Balance";
    return `SAL-${s.id.slice(0, 4).toUpperCase()}`;
  }

  function isQuickCash(s: Sale) {
    return s.is_quick_cash_sale;
  }

  return (
    <div className="p-4 md:p-8">
      {/* Breadcrumb */}
      <nav className="flex text-[10px] uppercase tracking-widest text-[#505f76] mb-1 font-bold">
        <span>ERP</span>
        <span className="mx-2">/</span>
        <span className="text-[#191c1e]">Sales Management</span>
      </nav>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
        <h1 className="font-display text-3xl font-bold text-[#191c1e] tracking-tight">
          Sales
        </h1>
        <div className="flex gap-3">
          <Link
            href="/sales/customers"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#191c1e] text-[#191c1e] font-bold hover:bg-[#f2f4f6] transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">people</span>
            Customers
          </Link>
          <Link
            href="/sales/scrap/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#069669] text-[#069669] font-bold hover:bg-[#069669]/5 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">recycling</span>
            Scrap Sale
          </Link>
          <Link
            href="/sales/new/quick"
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-[#191c1e] text-[#191c1e] font-bold hover:bg-[#f2f4f6] transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">receipt_long</span>
            + Quick Cash Sale
          </Link>
          <Link
            href="/sales/new"
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0F172A] text-white font-bold hover:bg-[#0F172A]/90 transition-all shadow-md active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
            + New Sale
          </Link>
        </div>
      </header>

      {/* Summary Strip */}
      <section className="flex md:grid md:grid-cols-4 gap-3 md:gap-4 mb-6 overflow-x-auto no-scrollbar pb-2 md:pb-0">
        <div className="flex-shrink-0 min-w-[150px] md:min-w-0 bg-white border border-[#c6c6cd] p-5 rounded-lg shadow-sm flex items-center gap-4">
          <div className="p-3 bg-[#d0e1fb] rounded-lg text-[#505f76]">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <div>
            <p className="text-xs font-bold text-[#505f76] uppercase tracking-wider">
              Total Sales
            </p>
            <p className="text-xl font-mono font-bold text-[#191c1e]">
              {summary ? summary.total_sales.toLocaleString("en-IN") : "—"}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 min-w-[150px] md:min-w-0 bg-white border border-[#c6c6cd] p-5 rounded-lg shadow-sm flex items-center gap-4">
          <div className="p-3 bg-[#85f8c4] rounded-lg text-[#069669]">
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </div>
          <div>
            <p className="text-xs font-bold text-[#505f76] uppercase tracking-wider">
              Total Received
            </p>
            <p className="text-xl font-mono font-bold text-[#22C55E]">
              {summary ? formatMoney(summary.total_paid) : "—"}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 min-w-[150px] md:min-w-0 bg-white border border-[#c6c6cd] p-5 rounded-lg shadow-sm flex items-center gap-4">
          <div className="p-3 bg-[#ffdad6] rounded-lg text-[#ba1a1a]">
            <span className="material-symbols-outlined">pending_actions</span>
          </div>
          <div>
            <p className="text-xs font-bold text-[#505f76] uppercase tracking-wider">
              Total Due
            </p>
            <p className="text-xl font-mono font-bold text-[#EAB308]">
              {summary ? formatMoney(summary.total_due) : "—"}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 min-w-[150px] md:min-w-0 bg-white border border-[#c6c6cd] p-5 rounded-lg shadow-sm flex items-center gap-4">
          <div className="p-3 bg-[#e0e3e5] rounded-lg text-[#505f76]">
            <span className="material-symbols-outlined">today</span>
          </div>
          <div>
            <p className="text-xs font-bold text-[#505f76] uppercase tracking-wider">
              Today&apos;s Sales
            </p>
            <p className="text-xl font-mono font-bold text-[#191c1e]">
              {summary ? formatMoney(summary.this_month) : "—"}
            </p>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-white border border-[#c6c6cd] rounded-lg p-4 md:p-6 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#505f76] uppercase tracking-tighter ml-1">
                Date Range
              </label>
              <div className="flex items-center gap-2 border border-[#c6c6cd] px-3 py-2 rounded bg-[#f7f9fb]">
                <span className="material-symbols-outlined text-sm text-[#505f76]">calendar_today</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="text-xs bg-transparent border-none focus:ring-0 w-32 md:w-36 font-body outline-none p-0"
                />
              </div>
            </div>
            <span className="text-[#505f76] text-xs mt-5">—</span>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#505f76] uppercase tracking-tighter ml-1 opacity-0 pointer-events-none">
                To
              </label>
              <div className="flex items-center gap-2 border border-[#c6c6cd] px-3 py-2 rounded bg-[#f7f9fb]">
                <span className="material-symbols-outlined text-sm text-[#505f76]">calendar_today</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="text-xs bg-transparent border-none focus:ring-0 w-32 md:w-36 font-body outline-none p-0"
                />
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#505f76] uppercase tracking-tighter ml-1">
              Customer
            </label>
            <select
              value={customerFilter}
              onChange={(e) => { setCustomerFilter(e.target.value); setPage(1); }}
              className="text-xs bg-[#f7f9fb] border border-[#c6c6cd] px-3 py-2 rounded focus:ring-0 w-40 font-body outline-none"
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden md:block h-10 w-px bg-[#c6c6cd]" />

          {/* Sale Type Chips */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#505f76] uppercase tracking-tighter ml-1">
              Sale Type
            </label>
            <div className="flex gap-2">
              {SALE_TYPES.map((st) => (
                <button
                  key={st.value}
                  onClick={() => { setSaleTypeFilter(st.value); setPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    saleTypeFilter === st.value
                      ? "bg-[#0F172A] text-white"
                      : "border border-[#c6c6cd] text-[#505f76] hover:bg-[#f2f4f6]"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden md:block h-10 w-px bg-[#c6c6cd]" />

          {/* Status Chips */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#505f76] uppercase tracking-tighter ml-1">
              Status
            </label>
            <div className="flex gap-2">
              {STATUSES.map((st) => (
                <button
                  key={st.value}
                  onClick={() => { setStatusFilter(st.value); setPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    statusFilter === st.value
                      ? "bg-[#0F172A] text-white"
                      : "border border-[#c6c6cd] text-[#505f76] hover:bg-[#f2f4f6]"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Button */}
          <button
            onClick={loadData}
            className="ml-auto p-2 hover:bg-[#e6e8ea] rounded transition-colors text-[#505f76] mt-5"
            title="Apply filters"
          >
            <span className="material-symbols-outlined">filter_list</span>
          </button>
        </div>

        {/* Mobile filter row: customer + sale type */}
        <div className="md:hidden flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-[#c6c6cd]/50">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#505f76] uppercase tracking-tighter ml-1">
              Customer
            </label>
            <select
              value={customerFilter}
              onChange={(e) => { setCustomerFilter(e.target.value); setPage(1); }}
              className="text-xs bg-[#f7f9fb] border border-[#c6c6cd] px-3 py-2 rounded focus:ring-0 w-40 font-body outline-none"
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#505f76] uppercase tracking-tighter ml-1">
              Sale Type
            </label>
            <div className="flex gap-1">
              {SALE_TYPES.map((st) => (
                <button
                  key={st.value}
                  onClick={() => { setSaleTypeFilter(st.value); setPage(1); }}
                  className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
                    saleTypeFilter === st.value
                      ? "bg-[#0F172A] text-white"
                      : "border border-[#c6c6cd] text-[#505f76]"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Loading State */}
      {loading && <SkeletonTable />}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-lg p-8 text-center max-w-md mx-auto">
          <span className="material-symbols-outlined text-5xl text-[#ba1a1a] block mb-4">
            error_outline
          </span>
          <p className="text-[#ba1a1a] font-bold mb-2">Failed to Load Sales</p>
          <p className="text-[#93000a] text-sm mb-6">{error}</p>
          <button
            onClick={loadData}
            className="px-6 py-2.5 bg-[#ba1a1a] text-white rounded-lg text-sm font-bold hover:bg-[#ba1a1a]/90 transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sales.length === 0 && (
        <div className="bg-white rounded-xl border border-[#c6c6cd]/30 py-20 text-center">
          <span className="material-symbols-outlined text-5xl text-[#c6c6cd] block mb-4">
            payments
          </span>
          <p className="text-[#505f76] font-medium mb-2">No sales yet</p>
          <p className="text-[#505f76] text-xs mb-6">
            Create your first sale to get started
          </p>
          <Link
            href="/sales/new"
            className="inline-flex items-center gap-2 bg-[#0F172A] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#0F172A]/90 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Sale
          </Link>
        </div>
      )}

      {/* Data */}
      {!loading && !error && sales.length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-[#c6c6cd] rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f2f4f6] border-b border-[#c6c6cd]">
                    <th className="px-6 py-4 text-[10px] font-bold text-[#505f76] uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#505f76] uppercase tracking-wider">
                      Sale #
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#505f76] uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#505f76] uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#505f76] uppercase tracking-wider">
                      Weight (kg)
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#505f76] uppercase tracking-wider text-right">
                      Total
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#505f76] uppercase tracking-wider text-right">
                      Due
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#505f76] uppercase tracking-wider text-center">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#505f76] uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c6c6cd]/30">
                  {sales.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-[#f7f9fb] transition-colors group"
                    >
                      <td className="px-6 py-4 text-xs font-mono">
                        {formatDate(s.sale_date)}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold font-mono text-[#191c1e]">
                        {getSaleIdDisplay(s)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-[#191c1e]">
                        {s.customer_name || "Cash Sale"}
                      </td>
                      <td className="px-6 py-4">
                        <SaleTypeBadge
                          type={s.sale_type}
                          isQuickCash={isQuickCash(s)}
                        />
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">
                        {formatKg(s.total_kg)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold font-mono text-right">
                        {formatMoney(s.total_amount)}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm font-mono text-right ${
                          s.due_amount > 0
                            ? "font-bold text-[#EAB308]"
                            : "text-[#505f76]"
                        }`}
                      >
                        {formatMoney(s.due_amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-3">
                          {s.id.startsWith("ob-") ? (
                            <Link
                              href={`/sales/customers/${s.customer_id}`}
                              className="text-[#0F172A] font-bold text-[10px] uppercase tracking-tighter hover:underline"
                            >
                              View Customer
                            </Link>
                          ) : (
                            <>
                              <Link
                                href={`/sales/${s.id}`}
                                className="text-[#069669] font-bold text-[10px] uppercase tracking-tighter hover:underline"
                              >
                                View
                              </Link>
                              {s.due_amount > 0 && (
                                <Link
                                  href={`/sales/${s.id}`}
                                  className="text-[#069669] font-bold text-[10px] uppercase tracking-tighter border-b border-[#069669] hover:bg-[#069669] hover:text-white transition-colors px-1"
                                >
                                  Collect
                                </Link>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-[#f2f4f6] px-6 py-4 flex items-center justify-between border-t border-[#c6c6cd]">
              <p className="text-xs text-[#505f76]">
                Showing{" "}
                <span className="font-bold text-[#191c1e]">
                  {(page - 1) * PER_PAGE + 1} -{" "}
                  {Math.min(page * PER_PAGE, totalCount)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-[#191c1e]">
                  {totalCount.toLocaleString("en-IN")}
                </span>{" "}
                records
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded border border-[#c6c6cd] hover:bg-white transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">
                    chevron_left
                  </span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - page) <= 1,
                  )
                  .map((p, idx, arr) => (
                    <span key={p} className="contents">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-3 py-1 text-xs text-[#505f76]">
                          ...
                        </span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`px-3 py-1 rounded border text-xs font-bold ${
                          page === p
                            ? "border-[#0F172A] bg-[#0F172A] text-white"
                            : "border-[#c6c6cd] hover:bg-white text-[#505f76]"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded border border-[#c6c6cd] hover:bg-white transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {sales.map((s) => (
              <div
                key={s.id}
                className="bg-white p-4 rounded-xl border border-[#c6c6cd]/30 shadow-sm space-y-3"
              >
                {/* Top row */}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-headline text-sm font-bold text-[#191c1e]">
                      {s.customer_name || "Cash Sale"}
                    </h4>
                    <p className="font-mono text-[10px] text-[#505f76]">
                      {getSaleIdDisplay(s)}
                    </p>
                  </div>
                  <SaleTypeBadge
                    type={s.sale_type}
                    isQuickCash={isQuickCash(s)}
                  />
                </div>

                {/* Middle row */}
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-[#505f76] font-medium">
                      {formatKg(s.total_kg)}
                    </p>
                    <p className="font-mono text-lg font-bold text-[#191c1e]">
                      {formatMoney(s.total_amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    {s.due_amount > 0 && (
                      <p className="text-[10px] font-bold text-[#ba1a1a] bg-[#ffdad6] px-2 py-0.5 rounded mb-1">
                        Due: {formatMoney(s.due_amount)}
                      </p>
                    )}
                    <StatusBadge status={s.status} />
                    <p className="text-[10px] text-[#505f76] mt-1">
                      {formatDate(s.sale_date)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex gap-2">
                  {s.id.startsWith("ob-") ? (
                    <Link
                      href={`/sales/customers/${s.customer_id}`}
                      className="flex-1 py-2 text-xs font-bold rounded-lg bg-[#0F172A] text-white hover:bg-[#0F172A]/90 transition-colors text-center"
                    >
                      View Customer
                    </Link>
                  ) : (
                    <>
                      <Link
                        href={`/sales/${s.id}`}
                        className="flex-1 py-2 text-xs font-bold rounded-lg bg-[#e0e3e5] text-[#191c1e] hover:bg-[#c6c6cd] transition-colors text-center"
                      >
                        View Details
                      </Link>
                      {s.due_amount > 0 && (
                        <Link
                          href={`/sales/${s.id}`}
                          className="flex-1 py-2 text-xs font-bold rounded-lg bg-[#069669] text-white hover:bg-[#069669]/90 transition-colors text-center"
                        >
                          Collect
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Mobile FAB */}
      <Link
        href="/sales/new"
        className="md:hidden fixed bottom-6 right-4 w-14 h-14 bg-[#069669] text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform z-40"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </Link>
    </div>
  );
}
