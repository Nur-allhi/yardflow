"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
interface Vendor {
  id: string;
  name: string;
  due_balance: number;
}

interface Purchase {
  id: string;
  vendor_id: string;
  purchase_date: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  status: "paid" | "partial" | "due";
  note: string | null;
  created_at: string;
  vendor_name: string | null;
}

interface Summary {
  total_purchases: number;
  total_paid: number;
  total_due: number;
  this_month: number;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(n: number) {
  return "৳" + n.toLocaleString("en-IN");
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
      className={`px-2 py-1 ${s.bg} ${s.text} text-[10px] font-bold rounded uppercase tracking-wider`}
    >
      {s.label}
    </span>
  );
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vendorFilter, setVendorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 10;

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (vendorFilter) params.set("vendor_id", vendorFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search) params.set("search", search);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    params.set("page", String(page));
    params.set("limit", String(perPage));
    return `/api/purchases?${params.toString()}`;
  }, [vendorFilter, statusFilter, search, dateFrom, dateTo, page]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [purchasesRes, vendorsRes] = await Promise.all([
        fetch(buildUrl()),
        fetch("/api/purchases/vendors"),
      ]);
      if (!purchasesRes.ok) throw new Error("Failed to load purchases");
      const purchasesData = await purchasesRes.json();
      setPurchases(purchasesData.purchases || purchasesData);
      setSummary(purchasesData.summary || null);
      if (purchasesData.total_count !== undefined) {
        setTotalCount(purchasesData.total_count);
      } else {
        setTotalCount((purchasesData.purchases || purchasesData).length);
      }
      if (vendorsRes.ok) setVendors(await vendorsRes.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));

  return (
    <div className="p-4 md:p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#505f76] mb-2 font-medium tracking-wide uppercase">
        <Link href="/" className="hover:text-[#0F172A]">
          Dashboard
        </Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-[#0F172A] font-bold">Purchases</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-[2rem] font-bold text-[#0F172A] tracking-tight">
            Purchases
          </h1>
          <p className="text-[#505f76] text-sm hidden md:block">
            Manage incoming raw materials and vendor transactions.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/purchases/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white font-semibold rounded-lg hover:bg-[#0F172A]/90 transition-all text-sm shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            New Purchase
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-6 mb-6 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
        <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-white p-4 md:p-6 rounded-xl border border-[#c6c6cd]/30 md:border-[#c6c6cd] shadow-sm">
          <p className="text-[#505f76] text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">
            Total Purchases
          </p>
          <p className="font-mono text-lg md:text-2xl font-bold text-[#0F172A]">
            {summary ? formatMoney(summary.total_purchases) : "—"}
          </p>
        </div>
        <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-white p-4 md:p-6 rounded-xl border border-[#c6c6cd]/30 md:border-[#c6c6cd] shadow-sm">
          <p className="text-[#505f76] text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">
            Total Paid
          </p>
          <p className="font-mono text-lg md:text-2xl font-bold text-[#059669]">
            {summary ? formatMoney(summary.total_paid) : "—"}
          </p>
        </div>
        <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-white p-4 md:p-6 rounded-xl border border-[#c6c6cd]/30 md:border-[#c6c6cd] shadow-sm">
          <p className="text-[#505f76] text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">
            Total Due
          </p>
          <p className="font-mono text-lg md:text-2xl font-bold text-[#EF4444]">
            {summary ? formatMoney(summary.total_due) : "—"}
          </p>
        </div>
        <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-white p-4 md:p-6 rounded-xl border border-[#c6c6cd]/30 md:border-[#c6c6cd] shadow-sm">
          <p className="text-[#505f76] text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">
            This Month
          </p>
          <p className="font-mono text-lg md:text-2xl font-bold text-[#505f76]">
            {summary ? formatMoney(summary.this_month) : "—"}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#f2f4f6] p-3 md:p-4 rounded-xl border border-[#c6c6cd]/50 mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white px-3 py-2 border border-[#c6c6cd] rounded-lg">
          <span className="material-symbols-outlined text-[#505f76] text-sm">
            calendar_today
          </span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-transparent border-none text-sm focus:ring-0 p-0 w-full outline-none"
            placeholder="From"
          />
        </div>
        <span className="text-[#505f76] text-xs">—</span>
        <div className="flex items-center gap-2 bg-white px-3 py-2 border border-[#c6c6cd] rounded-lg">
          <span className="material-symbols-outlined text-[#505f76] text-sm">
            calendar_today
          </span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-transparent border-none text-sm focus:ring-0 p-0 w-full outline-none"
            placeholder="To"
          />
        </div>
        <select
          value={vendorFilter}
          onChange={(e) => setVendorFilter(e.target.value)}
          className="bg-white border border-[#c6c6cd] rounded-lg py-2 pl-3 pr-8 text-sm focus:ring-0 outline-none"
        >
          <option value="">All Vendors</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <div className="flex gap-1 bg-[#e6e8ea] p-1 rounded-lg">
          {["all", "paid", "partial", "due"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${
                statusFilter === s
                  ? "bg-[#0F172A] text-white"
                  : "text-[#505f76] hover:bg-white"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[160px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#505f76] text-lg">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#c6c6cd] rounded-lg text-sm outline-none focus:ring-0"
            placeholder="Search vendor..."
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-[#c6c6cd]/30 p-6 animate-pulse"
            >
              <div className="h-4 bg-[#e6e8ea] rounded w-1/3 mb-3" />
              <div className="h-4 bg-[#e6e8ea] rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-[#EF4444] font-medium text-sm">{error}</p>
          <button
            onClick={loadData}
            className="mt-3 px-4 py-2 bg-[#0F172A] text-white text-sm rounded-lg"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && purchases.length === 0 && (
        <div className="bg-white rounded-xl border border-[#c6c6cd]/30 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-[#c6c6cd] block mb-4">
            shopping_cart
          </span>
          <p className="text-[#505f76] text-sm font-medium mb-1">
            No purchases yet
          </p>
          <p className="text-[#505f76] text-xs">
            Start by creating your first purchase
          </p>
          <Link
            href="/purchases/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#0F172A] text-white text-sm font-semibold rounded-lg"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            New Purchase
          </Link>
        </div>
      )}

      {/* Desktop Table */}
      {!loading && !error && purchases.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl border border-[#c6c6cd] overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#e6e8ea] border-b border-[#c6c6cd]">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Purchase #
                </th>
                <th className="px-6 py-4 text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-4 text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-6 py-4 text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Due
                </th>
                <th className="px-6 py-4 text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-[#0F172A] uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c6c6cd]/50">
              {purchases.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-[#F8FAFC] transition-colors group"
                >
                  <td className="px-6 py-4 text-sm font-medium">
                    {formatDate(p.purchase_date)}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-[#0F172A]">
                    <Link
                      href={`/purchases/${p.id}`}
                      className="hover:underline"
                    >
                      PUR-{p.id.slice(0, 4).toUpperCase()}
                    </Link>
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
                      p.due_amount > 0 ? "text-[#EF4444]" : ""
                    }`}
                  >
                    {formatMoney(p.due_amount)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusChip status={p.status} />
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <Link
                      href={`/purchases/${p.id}`}
                      className="text-[#059669] font-bold text-sm hover:underline"
                    >
                      View
                    </Link>
                    {p.status !== "paid" && (
                      <Link
                        href={`/purchases/${p.id}`}
                        className="text-[#0F172A] font-bold text-sm hover:underline"
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
          <div className="px-6 py-4 bg-[#f2f4f6] border-t border-[#c6c6cd] flex items-center justify-between">
            <span className="text-sm text-[#505f76]">
              Showing {(page - 1) * perPage + 1}–
              {Math.min(page * perPage, totalCount)} of {totalCount}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 flex items-center justify-center border border-[#c6c6cd] rounded bg-white hover:bg-[#e6e8ea] transition-colors disabled:opacity-50"
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
                      <span className="w-8 h-8 flex items-center justify-center text-xs text-[#505f76]">
                        ...
                      </span>
                    )}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded ${
                        page === p
                          ? "bg-[#0F172A] text-white"
                          : "border border-[#c6c6cd] bg-white hover:bg-[#e6e8ea]"
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 flex items-center justify-center border border-[#c6c6cd] rounded bg-white hover:bg-[#e6e8ea] transition-colors disabled:opacity-50"
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
      {!loading && !error && purchases.length > 0 && (
        <div className="md:hidden space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-[#505f76]">
              Record List
            </h2>
            <Link
              href="/purchases/new"
              className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white rounded-lg text-sm font-bold active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New
            </Link>
          </div>
          {purchases.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-lg p-4 shadow-sm border border-[#c6c6cd]/20"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-display font-bold text-[#0F172A] text-base">
                    {p.vendor_name || "Unknown Vendor"}
                  </h3>
                  <p className="text-xs text-[#505f76] font-medium">
                    {formatDate(p.purchase_date)}
                  </p>
                </div>
                <StatusChip status={p.status} />
              </div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-[11px] text-[#505f76] font-medium mb-0.5">
                    Total
                  </p>
                  <p className="font-mono text-lg font-bold text-[#0F172A]">
                    {formatMoney(p.total_amount)}
                  </p>
                </div>
                {p.due_amount > 0 && (
                  <div className="text-right">
                    <p className="text-[11px] text-[#EAB308] font-medium mb-0.5">
                      Due
                    </p>
                    <p className="font-mono text-sm font-bold text-[#EAB308]">
                      {formatMoney(p.due_amount)}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-3 border-t border-[#c6c6cd]/30">
                <Link
                  href={`/purchases/${p.id}`}
                  className="flex-1 py-2 text-[#059669] font-bold text-sm bg-[#059669]/5 rounded-lg text-center"
                >
                  View
                </Link>
                {p.status !== "paid" && (
                  <Link
                    href={`/purchases/${p.id}`}
                    className="flex-1 py-2 bg-[#0F172A] text-white font-bold text-sm rounded-lg text-center"
                  >
                    Pay
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
