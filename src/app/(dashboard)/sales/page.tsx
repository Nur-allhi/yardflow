"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";

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
  return n.toLocaleString("en-IN") + " tk";
}

function formatMoneyShort(n: number): string {
  return n.toLocaleString("en-IN");
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
      <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded border border-outline text-outline bg-surface-container-highest uppercase tracking-wider">
        Quick Cash
      </span>
    );
  }
  const chips: Record<
    string,
    { border: string; text: string; label: string }
  > = {
    fabricated: {
      border: "border-primary-container",
      text: "text-primary-container",
      label: "Fabricated",
    },
    raw_passthrough: {
      border: "border-secondary",
      text: "text-secondary",
      label: "Raw",
    },
    scrap: {
      border: "border-tertiary",
      text: "text-tertiary",
      label: "Scrap",
    },
  };
  const c = chips[type] || chips.fabricated;
  return (
    <span
      className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded border ${c.border} ${c.text} bg-surface-container-highest uppercase tracking-wider`}
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
      bg: "bg-success/10",
      text: "text-success",
      dot: "bg-success",
      label: "Paid",
    },
    partial: {
      bg: "bg-warning/10",
      text: "text-warning",
      dot: "bg-warning",
      label: "Partial",
    },
    due: {
      bg: "bg-error/10",
      text: "text-error",
      dot: "bg-error",
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
          className="bg-white rounded-xl border border-outline-variant/30 p-6 animate-pulse"
        >
          <div className="h-4 bg-surface-container-highest rounded w-1/3 mb-3" />
          <div className="h-4 bg-surface-container-highest rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function SalesPage() {
  const searchParams = useSearchParams();
  const [customerFilter, setCustomerFilter] = useState(searchParams.get("customer_id") || "");
  const [saleTypeFilter, setSaleTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const buildUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (customerFilter) params.set("customer_id", customerFilter);
    if (saleTypeFilter) params.set("sale_type", saleTypeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (searchQuery) params.set("search", searchQuery);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    params.set("page", String(page));
    params.set("limit", String(PER_PAGE));
    return `/api/sales?${params.toString()}`;
  }, [customerFilter, saleTypeFilter, statusFilter, searchQuery, dateFrom, dateTo, page]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["sales", buildUrl],
    queryFn: async () => {
      const [salesRes, customersRes] = await Promise.all([
        fetch(buildUrl),
        fetch("/api/sales/customers"),
      ]);
      if (!salesRes.ok) throw new Error("Failed to load sales");
      const salesData = await salesRes.json();
      const customersList = customersRes.ok ? await customersRes.json() : [];
      return {
        sales: salesData.sales ?? [],
        summary: salesData.summary ?? null,
        totalCount: salesData.total_count ?? 0,
        customers: customersList,
      };
    },
  });

  const totalPages = Math.max(1, Math.ceil((data?.totalCount ?? 0) / PER_PAGE));

  function getSaleIdDisplay(s: Sale) {
    if (s.id.startsWith("ob-")) return "Opening Balance";
    return `SAL-${s.id.slice(0, 4).toUpperCase()}`;
  }

  function isQuickCash(s: Sale) {
    return s.is_quick_cash_sale;
  }

  return (
    <div className="p-4 md:p-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Sales', href: null }]} />

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
        <h1 className="font-display text-3xl font-bold text-primary-container tracking-tight">
          Sales
        </h1>
        <div className="flex gap-3">
          <Link
            href="/sales/customers"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-primary-container text-primary-container font-bold hover:bg-surface-container-low transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">people</span>
            Customers
          </Link>
          <Link
            href="/sales/scrap/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-tertiary text-tertiary font-bold hover:bg-tertiary/5 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">recycling</span>
            Scrap Sale
          </Link>
          <Link
            href="/sales/new/quick"
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-primary-container text-primary-container font-bold hover:bg-surface-container-low transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">receipt_long</span>
            + Quick Cash Sale
          </Link>
          <Link
            href="/sales/new"
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary-container text-white font-bold hover:bg-primary-container/90 transition-all shadow-md active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
            + New Sale
          </Link>
        </div>
      </header>

      {/* Summary Strip */}
      <section className="mb-6">
        <h2 className="md:hidden font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 px-1">Sales Overview</h2>
        <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-6 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
          <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-surface-container-lowest p-4 md:p-6 rounded-lg shadow-sm border border-outline-variant/30 md:border-outline-variant">
            <p className="text-secondary text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">Total Sales</p>
            <p className="font-mono text-lg md:text-2xl font-bold text-primary-container">
              {data?.summary ? formatMoneyShort(data.summary.total_sales) : "—"}
            </p>
          </div>
          <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-surface-container-lowest p-4 md:p-6 rounded-lg shadow-sm border border-outline-variant/30 md:border-outline-variant">
            <p className="text-secondary text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">Received</p>
            <p className="font-mono text-lg md:text-2xl font-bold text-tertiary">
              {data?.summary ? formatMoneyShort(data.summary.total_paid) : "—"}
            </p>
          </div>
          <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-surface-container-lowest p-4 md:p-6 rounded-lg shadow-sm border border-outline-variant/30 md:border-outline-variant">
            <p className="text-secondary text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">Total Due</p>
            <p className="font-mono text-lg md:text-2xl font-bold text-error">
              {data?.summary ? formatMoneyShort(data.summary.total_due) : "—"}
            </p>
          </div>
          <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-surface-container-lowest p-4 md:p-6 rounded-lg shadow-sm border border-outline-variant/30 md:border-outline-variant">
            <p className="text-secondary text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">This Month</p>
            <p className="font-mono text-lg md:text-2xl font-bold text-secondary">
              {data?.summary ? formatMoneyShort(data.summary.this_month) : "—"}
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
        <div className="bg-surface-container-low p-3 md:p-4 rounded-xl border border-outline-variant/50 mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 border border-outline-variant rounded-lg">
            <span className="material-symbols-outlined text-secondary text-sm">calendar_today</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-sm focus:ring-0 p-0 w-28 outline-none"
            />
          </div>
          <span className="text-secondary text-xs">—</span>
          <div className="flex items-center gap-2 bg-white px-3 py-2 border border-outline-variant rounded-lg">
            <span className="material-symbols-outlined text-secondary text-sm">calendar_today</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-sm focus:ring-0 p-0 w-28 outline-none"
            />
          </div>
          <select
            value={customerFilter}
            onChange={(e) => { setCustomerFilter(e.target.value); setPage(1); }}
            className="appearance-none bg-white border border-outline-variant rounded-lg py-2 pl-3 pr-7 text-sm focus:ring-0 outline-none bg-[length:14px] bg-no-repeat"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundPosition: 'right 6px center' }}
          >
            <option value="">All Customers</option>
            {(data?.customers ?? []).map((c: CustomerOption) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={saleTypeFilter}
            onChange={(e) => { setSaleTypeFilter(e.target.value); setPage(1); }}
            className="appearance-none bg-white border border-outline-variant rounded-lg py-2 pl-3 pr-7 text-sm focus:ring-0 outline-none bg-[length:14px] bg-no-repeat"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundPosition: 'right 6px center' }}
          >
            {SALE_TYPES.map((st) => (
              <option key={st.value} value={st.value}>{st.label}</option>
            ))}
          </select>
          <div className="flex gap-1 bg-surface-container-high p-1 rounded-lg">
            {["all", "paid", "partial", "due"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${
                  statusFilter === s
                    ? "bg-primary-container text-white"
                    : "text-secondary hover:bg-white"
                }`}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[160px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); refetch(); } }}
              className="w-full pl-10 pr-4 py-2 bg-white border border-outline-variant rounded-lg text-sm outline-none focus:ring-0"
              placeholder="Search customer..."
            />
          </div>
        </div>

      {/* Loading State */}
      {isLoading && <SkeletonTable />}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-error-container border border-error/20 rounded-lg p-8 text-center max-w-md mx-auto">
          <span className="material-symbols-outlined text-5xl text-error block mb-4">
            error_outline
          </span>
          <p className="text-error font-bold mb-2">Failed to Load Sales</p>
          <p className="text-on-error-container text-sm mb-6">{error instanceof Error ? error.message : error}</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2.5 bg-error text-white rounded-lg text-sm font-bold hover:bg-error/90 transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (data?.sales ?? []).length === 0 && (
        <div className="bg-white rounded-xl border border-outline-variant/30 py-20 text-center">
          <span className="material-symbols-outlined text-5xl text-outline-variant block mb-4">
            payments
          </span>
          <p className="text-secondary font-medium mb-2">No sales yet</p>
          <p className="text-secondary text-xs mb-6">
            Create your first sale to get started
          </p>
          <Link
            href="/sales/new"
            className="inline-flex items-center gap-2 bg-primary-container text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary-container/90 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Sale
          </Link>
        </div>
      )}

      {/* Data */}
      {!isLoading && !error && (data?.sales ?? []).length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-outline-variant rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-wider">
                      Sale #
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-wider">
                      Weight (kg)
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-wider text-right">
                      Total
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-wider text-right">
                      Due
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-wider text-center">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {(data?.sales ?? []).map((s: Sale) => (
                    <tr
                      key={s.id}
                      className="hover:bg-surface-bright transition-colors group"
                    >
                      <td className="px-6 py-4 text-xs font-mono">
                        {formatDate(s.sale_date)}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold font-mono text-primary-container">
                        {getSaleIdDisplay(s)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-primary-container">
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
                            ? "font-bold text-warning"
                            : "text-secondary"
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
                              className="text-primary-container font-bold text-[10px] uppercase tracking-tighter hover:underline"
                            >
                              View Customer
                            </Link>
                          ) : (
                            <>
                              <Link
                                href={`/sales/${s.id}`}
                                className="text-tertiary font-bold text-[10px] uppercase tracking-tighter hover:underline"
                              >
                                View
                              </Link>
                              {s.due_amount > 0 && (
                                <Link
                                  href={`/sales/${s.id}`}
                                  className="text-tertiary font-bold text-[10px] uppercase tracking-tighter border-b border-tertiary hover:bg-tertiary hover:text-white transition-colors px-1"
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
            <div className="bg-surface-container-low px-6 py-4 flex items-center justify-between border-t border-outline-variant">
              <p className="text-xs text-secondary">
                Showing{" "}
                <span className="font-bold text-primary-container">
                  {(page - 1) * PER_PAGE + 1} -{" "}
                  {Math.min(page * PER_PAGE, data?.totalCount ?? 0)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-primary-container">
                  {(data?.totalCount ?? 0).toLocaleString("en-IN")}
                </span>{" "}
                records
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded border border-outline-variant hover:bg-white transition-colors disabled:opacity-50"
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
                        <span className="px-3 py-1 text-xs text-secondary">
                          ...
                        </span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`px-3 py-1 rounded border text-xs font-bold ${
                          page === p
                            ? "border-primary-container bg-primary-container text-white"
                            : "border-outline-variant hover:bg-white text-secondary"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded border border-outline-variant hover:bg-white transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            <div className="flex items-center justify-between px-1 mb-3">
              <h3 className="font-headline text-sm font-semibold text-on-surface">Recent Transactions</h3>
              <Link href="/sales" className="text-xs font-medium text-secondary">Show all</Link>
            </div>
            <div className="space-y-3">
            {(data?.sales ?? []).map((s: Sale) => (
              <div
                key={s.id}
                className="bg-surface p-4 rounded-xl border border-outline-variant shadow-sm space-y-3 active:scale-[0.98] transition-transform"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-headline text-sm font-bold text-on-surface">
                      {s.customer_name || "Cash Sale"}
                    </h4>
                    <p className="font-mono text-[10px] text-on-surface-variant">
                      {getSaleIdDisplay(s)}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-high text-on-surface">
                    {s.is_quick_cash_sale
                      ? "Quick Cash"
                      : s.sale_type === "fabricated"
                        ? "Fabricated"
                        : s.sale_type === "raw_passthrough"
                          ? "Raw"
                          : "Scrap"}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-secondary font-medium">
                      {formatKg(s.total_kg)}
                    </p>
                    <p className="font-mono text-lg font-bold text-primary">
                      {formatMoney(s.total_amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    {s.due_amount > 0 && (
                      <p className="text-[10px] font-bold text-on-error-container bg-error-container px-2 py-0.5 rounded mb-1">
                        Due: {formatMoney(s.due_amount)}
                      </p>
                    )}
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      s.status === "paid"
                        ? "bg-tertiary-fixed text-on-tertiary-fixed"
                        : s.status === "partial"
                          ? "bg-secondary-container text-on-secondary-container uppercase"
                          : "bg-error/10 text-error"
                    }`}>
                      {s.status === "paid" ? "Paid" : s.status === "partial" ? "Partial" : "Due"}
                    </span>
                    <p className="text-[10px] text-on-surface-variant mt-1">
                      {formatDate(s.sale_date)}
                    </p>
                  </div>
                </div>
                <div className="pt-2 flex gap-2">
                  {s.id.startsWith("ob-") ? (
                    <Link
                      href={`/sales/customers/${s.customer_id}`}
                      className="flex-1 py-2 text-xs font-bold rounded-lg bg-primary-container text-white hover:bg-primary-container/90 transition-colors text-center"
                    >
                      View Customer
                    </Link>
                  ) : (
                    <>
                      {s.due_amount > 0 ? (
                        <>
                          <Link
                            href={`/sales/${s.id}`}
                            className="flex-1 py-2 text-xs font-bold rounded-lg border border-outline-variant text-primary text-center"
                          >
                            View
                          </Link>
                          <Link
                            href={`/sales/${s.id}`}
                            className="flex-1 py-2 text-xs font-bold rounded-lg bg-on-tertiary-container text-on-tertiary text-center"
                          >
                            Collect
                          </Link>
                        </>
                      ) : (
                        <Link
                          href={`/sales/${s.id}`}
                          className="flex-1 py-2 text-xs font-bold rounded-lg bg-surface-container-highest text-primary hover:bg-outline-variant transition-colors text-center"
                        >
                          View Details
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
      )}

      {/* Mobile FAB */}
      <Link
        href="/sales/new"
        className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-on-tertiary-container text-on-tertiary rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform z-40"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </Link>
    </div>
  );
}
