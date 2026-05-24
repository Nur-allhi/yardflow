"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";

interface SimplePurchase {
  id: string;
  vendor_id: string;
  purchase_date: string | null;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  status: "paid" | "partial" | "due";
  note: string | null;
  created_at: string | null;
  vendor_name: string | null;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(n: number) {
  return n.toLocaleString("en-IN") + " tk";
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    paid: { bg: "bg-success/10", text: "text-success", label: "Paid" },
    partial: { bg: "bg-warning/10", text: "text-warning", label: "Partial" },
    due: { bg: "bg-error/10", text: "text-error", label: "Due" },
  };
  const s = map[status] || map.due;
  return (
    <span
      className={`px-2.5 py-1 ${s.bg} ${s.text} text-[10px] font-bold rounded-full uppercase tracking-tighter`}
    >
      {s.label}
    </span>
  );
}

export default function SimplePurchasesPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/simple/mode")
      .then(r => r.json())
      .then(data => {
        if (data.mode === "detailed") router.replace("/purchases");
      })
      .catch(() => {});
  }, [router]);

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const buildUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search) params.set("search", search);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    params.set("page", String(page));
    params.set("limit", String(perPage));
    return `/api/simple/purchases?${params.toString()}`;
  }, [statusFilter, search, dateFrom, dateTo, page]);

  const { data, isLoading, error, refetch } = useQuery<{
    data: SimplePurchase[];
    pagination: { page: number; limit: number; total: number };
  }>({
    queryKey: ["simple-purchases", buildUrl],
    queryFn: async () => {
      const res = await fetch(buildUrl);
      if (!res.ok) throw new Error("Failed to load purchases");
      return res.json();
    },
  });

  const purchases = useMemo(() => data?.data ?? [], [data]);
  const totalCount = data?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));

  const summary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return {
      total: purchases.reduce((s, p) => s + p.total_amount, 0),
      paid: purchases.reduce((s, p) => s + p.paid_amount, 0),
      due: purchases.reduce((s, p) => s + p.due_amount, 0),
      thisMonth: purchases
        .filter((p) => {
          if (!p.purchase_date) return false;
          const d = new Date(p.purchase_date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((s, p) => s + p.total_amount, 0),
    };
  }, [purchases]);

  return (
    <div className="p-4 md:p-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Purchases (Simple)', href: null }]} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-[2rem] font-bold text-primary-container tracking-tight">
            Simple Purchases
          </h1>
          <p className="text-secondary text-sm hidden md:block">
            Manage raw material purchases with simplified tracking.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/purchases/vendors"
            className="flex items-center gap-2 px-4 py-2 border border-primary-container text-primary-container font-semibold rounded-lg hover:bg-primary-container/5 transition-all text-sm"
          >
            <span className="material-symbols-outlined text-lg">people</span>
            Vendors
          </Link>
          <Link
            href="/purchases-simple/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary-container text-white font-semibold rounded-lg hover:bg-primary-container/90 transition-all text-sm shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            New Purchase
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-6 mb-6 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
        <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-surface-container-lowest p-4 md:p-6 rounded-lg shadow-sm border border-outline-variant/30 md:border-outline-variant">
          <p className="text-secondary text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">
            Total
          </p>
          <p className="font-mono text-lg md:text-2xl font-bold text-primary-container">
            {formatMoney(summary.total)}
          </p>
        </div>
        <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-surface-container-lowest p-4 md:p-6 rounded-lg shadow-sm border border-outline-variant/30 md:border-outline-variant">
          <p className="text-secondary text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">
            Paid
          </p>
          <p className="font-mono text-lg md:text-2xl font-bold text-tertiary">
            {formatMoney(summary.paid)}
          </p>
        </div>
        <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-surface-container-lowest p-4 md:p-6 rounded-lg shadow-sm border border-outline-variant/30 md:border-outline-variant">
          <p className="text-secondary text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">
            Due
          </p>
          <p className="font-mono text-lg md:text-2xl font-bold text-error">
            {formatMoney(summary.due)}
          </p>
        </div>
        <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-surface-container-lowest p-4 md:p-6 rounded-lg shadow-sm border border-outline-variant/30 md:border-outline-variant">
          <p className="text-secondary text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">
            This Month
          </p>
          <p className="font-mono text-lg md:text-2xl font-bold text-secondary">
            {formatMoney(summary.thisMonth)}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-low p-3 md:p-4 rounded-xl border border-outline-variant/50 mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white px-3 py-2 border border-outline-variant rounded-lg">
          <span className="material-symbols-outlined text-secondary text-sm">
            calendar_today
          </span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="bg-transparent border-none text-sm focus:ring-0 p-0 w-full outline-none"
            placeholder="From"
          />
        </div>
        <span className="text-secondary text-xs">—</span>
        <div className="flex items-center gap-2 bg-white px-3 py-2 border border-outline-variant rounded-lg">
          <span className="material-symbols-outlined text-secondary text-sm">
            calendar_today
          </span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="bg-transparent border-none text-sm focus:ring-0 p-0 w-full outline-none"
            placeholder="To"
          />
        </div>
        <div className="flex gap-1 bg-surface-container-high p-1 rounded-lg">
          {["all", "paid", "partial", "due"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
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
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-white border border-outline-variant rounded-lg text-sm outline-none focus:ring-0"
            placeholder="Search vendor..."
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-outline-variant/30 p-6 animate-pulse"
            >
              <div className="h-4 bg-surface-container-high rounded w-1/3 mb-3" />
              <div className="h-4 bg-surface-container-high rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-error font-medium text-sm">{error?.message ?? "Something went wrong"}</p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-4 py-2 bg-primary-container text-white text-sm rounded-lg"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && purchases.length === 0 && (
        <div className="bg-white rounded-xl border border-outline-variant/30 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-outline-variant block mb-4">
            shopping_cart
          </span>
          <p className="text-secondary text-sm font-medium mb-1">
            No purchases yet
          </p>
          <p className="text-secondary text-xs">
            Start by creating your first purchase
          </p>
          <Link
            href="/purchases-simple/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary-container text-white text-sm font-semibold rounded-lg"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            New Purchase
          </Link>
        </div>
      )}

      {/* Desktop Table */}
      {!isLoading && !error && purchases.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-high border-b border-outline-variant">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">
                  Due
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {purchases.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-background transition-colors group"
                >
                  <td className="px-6 py-4 text-sm font-medium">
                    {formatDate(p.purchase_date)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {p.vendor_name || "—"}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">
                    {formatMoney(p.total_amount)}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">
                    {formatMoney(p.paid_amount)}
                  </td>
                  <td
                    className={`px-6 py-4 font-mono text-sm ${
                      p.due_amount > 0 ? "text-error" : ""
                    }`}
                  >
                    {formatMoney(p.due_amount)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusChip status={p.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/purchases-simple/${p.id}`}
                      className="text-tertiary font-bold text-sm hover:underline"
                    >
                      View
                    </Link>
                    {p.status !== "paid" && (
                      <Link
                        href={`/purchases-simple/${p.id}`}
                        className="ml-3 text-primary-container font-bold text-sm hover:underline"
                      >
                        Pay
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-between">
            <span className="text-sm text-secondary">
              Showing {(page - 1) * perPage + 1}–
              {Math.min(page * perPage, totalCount)} of {totalCount}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded bg-white hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">
                  chevron_left
                </span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                )
                .map((p, _idx, arr) => (
                  <span key={p} className="contents">
                    {_idx > 0 && arr[_idx - 1] !== p - 1 && (
                      <span className="w-8 h-8 flex items-center justify-center text-xs text-secondary">
                        ...
                      </span>
                    )}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded ${
                        page === p
                          ? "bg-primary-container text-white"
                          : "border border-outline-variant bg-white hover:bg-surface-container-high"
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded bg-white hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Card List */}
      {!isLoading && !error && purchases.length > 0 && (
        <div className="md:hidden space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              Record List
            </h2>
          </div>
          {purchases.map((p) => (
            <div
              key={p.id}
              className="bg-surface-container-lowest rounded-lg p-4 shadow-sm border border-outline-variant/20"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-display font-bold text-on-surface text-base">
                    {p.vendor_name || "Unknown Vendor"}
                  </h3>
                  <p className="text-xs text-on-surface-variant font-medium">
                    {formatDate(p.purchase_date)}
                  </p>
                </div>
                <StatusChip status={p.status} />
              </div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-[11px] text-on-surface-variant font-medium mb-0.5">
                    Total
                  </p>
                  <p className="font-mono text-lg font-bold text-on-surface">
                    {formatMoney(p.total_amount)}
                  </p>
                </div>
                {p.due_amount > 0 && (
                  <div className="text-right">
                    <p className="text-[11px] text-warning font-medium mb-0.5">
                      Due
                    </p>
                    <p className="font-mono text-sm font-bold text-warning">
                      {formatMoney(p.due_amount)}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-3 border-t border-outline-variant/30">
                <Link
                  href={`/purchases-simple/${p.id}`}
                  className="flex-1 py-2 text-on-surface font-bold text-sm bg-surface-container-high/50 rounded-lg text-center"
                >
                  View
                </Link>
                {p.status !== "paid" && (
                  <Link
                    href={`/purchases-simple/${p.id}`}
                    className="flex-1 py-2 bg-primary text-on-primary font-bold text-sm rounded-lg text-center"
                  >
                    {p.status === "due" ? "Pay Now" : "Pay"}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/purchases-simple/new"
        className="md:hidden fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-xl active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </Link>
    </div>
  );
}
