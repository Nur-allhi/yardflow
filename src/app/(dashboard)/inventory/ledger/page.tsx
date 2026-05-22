"use client";

import { useState } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { InventoryNav } from "@/components/InventoryNav";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSubtypes } from "@/hooks/useCategories";

interface LedgerEntry {
  id: string;
  movement_date: string;
  subtype_id: string;
  subtype_name: string | null;
  category_name: string | null;
  movement_type: "in" | "out";
  quantity_kg: number;
  price_per_kg: number | null;
  total_value: number | null;
  reference_type: string;
  note: string | null;
}

interface LedgerSummary {
  total_in_kg: number;
  total_out_kg: number;
  net_stock: number;
}

function formatWeight(kg: number): string {
  return `${kg.toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg`;
}

function formatTk(amount: number | null | undefined): string {
  const val = amount ?? 0;
  if (val === 0) return "৳0";
  const num = Math.round(val).toString();
  const last3 = num.slice(-3);
  const rest = num.slice(0, -3);
  return rest ? `৳${rest},${last3}` : `৳${last3}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatReference(ref: string): string {
  const labels: Record<string, string> = {
    purchase: "Purchase",
    sale_fabricated: "Fabricated",
    sale_raw: "Raw Sale",
    adjustment: "Adjustment",
  };
  return labels[ref] || ref;
}

export default function StockLedgerPage() {
  const queryClient = useQueryClient();
  const [filterSubtypeId, setFilterSubtypeId] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const [appliedSubtypeId, setAppliedSubtypeId] = useState("");
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");

  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [adjSubtypeId, setAdjSubtypeId] = useState("");
  const [adjType, setAdjType] = useState<"in" | "out">("in");
  const [adjQuantity, setAdjQuantity] = useState("");
  const [adjNote, setAdjNote] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjMsg, setAdjMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: ledgerData, isLoading, error } = useQuery<{ entries: LedgerEntry[]; summary: LedgerSummary }>({
    queryKey: ["ledger", appliedSubtypeId, appliedDateFrom, appliedDateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (appliedSubtypeId) params.set("subtype_id", appliedSubtypeId);
      if (appliedDateFrom) params.set("date_from", appliedDateFrom);
      if (appliedDateTo) params.set("date_to", appliedDateTo);
      const qs = params.toString();
      const res = await fetch(`/api/inventory/ledger${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Failed to load ledger");
      return res.json();
    },
  });

  const { data: subtypes } = useSubtypes();

  const entries = ledgerData?.entries ?? [];
  const summary = ledgerData?.summary ?? null;

  function handleApply() {
    setAppliedSubtypeId(filterSubtypeId);
    setAppliedDateFrom(filterDateFrom);
    setAppliedDateTo(filterDateTo);
  }

  function handleClear() {
    setFilterSubtypeId("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setAppliedSubtypeId("");
    setAppliedDateFrom("");
    setAppliedDateTo("");
  }

  const activeFilters = appliedSubtypeId || appliedDateFrom || appliedDateTo;

  const adjustStockMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/inventory/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Adjustment failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      setAdjMsg({ type: "success", text: "Stock adjusted successfully!" });
      setAdjSubtypeId("");
      setAdjQuantity("");
      setAdjNote("");
      setTimeout(() => setAdjMsg(null), 3000);
    },
    onError: (err) => {
      setAdjMsg({ type: "error", text: err instanceof Error ? err.message : "Adjustment failed" });
    },
    onSettled: () => {
      setAdjusting(false);
    },
  });

  async function handleAdjustment(e: React.FormEvent) {
    e.preventDefault();
    if (!adjSubtypeId || !adjQuantity || Number(adjQuantity) <= 0) return;
    setAdjusting(true);
    setAdjMsg(null);
    adjustStockMutation.mutate({
      subtype_id: adjSubtypeId,
      movement_type: adjType,
      quantity_kg: Number(adjQuantity),
      note: adjNote || undefined,
    });
  }

  function SkeletonRow() {
    return (
      <tr className="animate-pulse">
        <td className="px-6 py-4"><div className="h-4 bg-[#e0e3e5] rounded w-24" /></td>
        <td className="px-6 py-4"><div className="h-4 bg-[#e0e3e5] rounded w-20" /></td>
        <td className="px-6 py-4"><div className="h-4 bg-[#e0e3e5] rounded w-16" /></td>
        <td className="px-6 py-4"><div className="h-4 bg-[#e0e3e5] rounded w-12" /></td>
        <td className="px-6 py-4"><div className="h-4 bg-[#e0e3e5] rounded w-20" /></td>
        <td className="px-6 py-4"><div className="h-4 bg-[#e0e3e5] rounded w-16" /></td>
        <td className="px-6 py-4"><div className="h-4 bg-[#e0e3e5] rounded w-20" /></td>
        <td className="px-6 py-4"><div className="h-4 bg-[#e0e3e5] rounded w-16" /></td>
        <td className="px-6 py-4"><div className="h-4 bg-[#e0e3e5] rounded w-24" /></td>
      </tr>
    );
  }

  function SkeletonCard() {
    return (
      <div className="bg-white p-4 rounded-xl border border-[#c6c6cd]/30 shadow-sm animate-pulse">
        <div className="flex justify-between items-start mb-3">
          <div className="space-y-2">
            <div className="h-4 bg-[#e0e3e5] rounded w-24" />
            <div className="h-3 bg-[#e0e3e5] rounded w-16" />
          </div>
          <div className="h-5 bg-[#e0e3e5] rounded w-14" />
        </div>
        <div className="flex justify-between items-end">
          <div className="h-6 bg-[#e0e3e5] rounded w-20" />
          <div className="h-3 bg-[#e0e3e5] rounded w-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Inventory', href: '/inventory' }, { label: 'Ledger', href: null }]} />

      {/* Mobile: back + title */}
      <div className="md:hidden flex items-center gap-3 mb-4">
        <Link href="/inventory" className="text-[#505f76] hover:text-[#0F172A]">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-display text-2xl font-bold text-[#0F172A] tracking-tight">
          Stock Ledger
        </h1>
      </div>

      {/* Desktop title */}
      <h1 className="hidden md:block font-display text-3xl font-bold text-[#0F172A] tracking-tight mb-2">
        Stock Ledger
      </h1>

      <div className="hidden md:block">
        <InventoryNav active="ledger" />
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-lg border border-[#c6c6cd]/30 shadow-sm p-4 md:p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-4">
          <div className="hidden md:flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-bold text-[#505f76] uppercase tracking-wider">
              Sub-type
            </label>
            <select
              value={filterSubtypeId}
              onChange={(e) => setFilterSubtypeId(e.target.value)}
              className="h-[42px] px-3 border border-[#c6c6cd] rounded text-sm outline-none focus:border-[#059669] bg-white"
            >
              <option value="">All Sub-types</option>
              {subtypes?.map((st) => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-bold text-[#505f76] uppercase tracking-wider">
              From
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="h-[42px] px-3 border border-[#c6c6cd] rounded text-sm outline-none focus:border-[#059669] bg-white"
            />
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-bold text-[#505f76] uppercase tracking-wider">
              To
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="h-[42px] px-3 border border-[#c6c6cd] rounded text-sm outline-none focus:border-[#059669] bg-white"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="h-[42px] px-5 bg-[#0F172A] text-white font-semibold rounded-md hover:bg-[#0F172A]/90 transition-all text-sm"
            >
              Apply
            </button>
            <button
              onClick={handleClear}
              className="h-[42px] px-5 border border-[#c6c6cd] text-[#505f76] font-semibold rounded-md hover:bg-[#f2f4f6] transition-all text-sm"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Mobile: subtype filter chips */}
        <div className="md:hidden mt-3">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            <button
              onClick={() => setFilterSubtypeId("")}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterSubtypeId === ""
                  ? "bg-[#0F172A] text-white"
                  : "bg-[#eceef0] text-[#505f76]"
              }`}
            >
              All
            </button>
            {subtypes?.map((st) => (
              <button
                key={st.id}
                onClick={() => setFilterSubtypeId(st.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterSubtypeId === st.id
                    ? "bg-[#0F172A] text-white"
                    : "bg-[#eceef0] text-[#505f76]"
                }`}
              >
                {st.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Adjustment */}
      <div className="bg-white rounded-lg border border-[#c6c6cd]/30 shadow-sm mb-6">
        <button
          onClick={() => setAdjustmentOpen(!adjustmentOpen)}
          className="w-full flex items-center justify-between p-4 md:p-5 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#505f76]">tune</span>
            <h3 className="font-display font-semibold text-[#0F172A]">Physical Stock Adjustment</h3>
          </div>
          <span className={`material-symbols-outlined text-[#505f76] transition-transform ${adjustmentOpen ? "rotate-180" : ""}`}>
            expand_more
          </span>
        </button>
        {adjustmentOpen && (
          <form onSubmit={handleAdjustment} className="px-4 md:px-5 pb-5 space-y-4 border-t border-[#c6c6cd]/20 pt-4">
            {adjMsg && (
              <div className={`p-3 rounded-md text-sm font-medium ${
                adjMsg.type === "success" ? "bg-[#22C55E]/10 text-[#16A34A]" : "bg-[#ffdad6] text-[#93000a]"
              }`}>
                {adjMsg.text}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#505f76] uppercase tracking-wider">Sub-type</label>
                <select value={adjSubtypeId} onChange={(e) => setAdjSubtypeId(e.target.value)} required
                  className="h-[42px] px-3 border border-[#c6c6cd] rounded text-sm outline-none focus:border-[#059669] bg-white w-full">
                  <option value="">Select sub-type</option>
                  {subtypes?.map((st) => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#505f76] uppercase tracking-wider">Type</label>
                <div className="flex gap-2 h-[42px]">
                  <button type="button" onClick={() => setAdjType("in")}
                    className={`flex-1 rounded text-sm font-bold transition-all ${
                      adjType === "in" ? "bg-[#059669] text-white" : "bg-[#f2f4f6] text-[#505f76] border border-[#c6c6cd]"
                    }`}>IN</button>
                  <button type="button" onClick={() => setAdjType("out")}
                    className={`flex-1 rounded text-sm font-bold transition-all ${
                      adjType === "out" ? "bg-[#ba1a1a] text-white" : "bg-[#f2f4f6] text-[#505f76] border border-[#c6c6cd]"
                    }`}>OUT</button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#505f76] uppercase tracking-wider">Quantity (kg)</label>
                <input type="number" min="0" step="0.001" value={adjQuantity}
                  onChange={(e) => setAdjQuantity(e.target.value)} required placeholder="0.000"
                  className="h-[42px] px-3 border border-[#c6c6cd] rounded text-sm outline-none focus:border-[#059669] bg-white font-mono w-full" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#505f76] uppercase tracking-wider">Note</label>
                <div className="flex gap-2">
                  <input value={adjNote} onChange={(e) => setAdjNote(e.target.value)}
                    placeholder="Reason for adjustment..."
                    className="h-[42px] px-3 border border-[#c6c6cd] rounded text-sm outline-none focus:border-[#059669] bg-white flex-1" />
                  <button type="submit" disabled={adjusting}
                    className="h-[42px] px-5 bg-[#0F172A] text-white font-semibold rounded-md hover:bg-[#0F172A]/90 transition-all text-sm disabled:opacity-50 whitespace-nowrap">
                    {adjusting ? "..." : "Adjust"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <>
          <div className="hidden md:grid grid-cols-3 gap-4 md:gap-6 mb-6">
            <div className="bg-white p-4 md:p-5 rounded-lg border border-[#c6c6cd]/30 shadow-sm">
              <p className="text-[10px] md:text-xs text-[#505f76] font-bold uppercase tracking-wider mb-1">
                Total In
              </p>
              <p className="font-mono text-xl md:text-2xl font-bold text-[#059669]">
                {formatWeight(summary.total_in_kg)}
              </p>
            </div>
            <div className="bg-white p-4 md:p-5 rounded-lg border border-[#c6c6cd]/30 shadow-sm">
              <p className="text-[10px] md:text-xs text-[#505f76] font-bold uppercase tracking-wider mb-1">
                Total Out
              </p>
              <p className="font-mono text-xl md:text-2xl font-bold text-[#ba1a1a]">
                {formatWeight(summary.total_out_kg)}
              </p>
            </div>
            <div className="bg-white p-4 md:p-5 rounded-lg border border-[#c6c6cd]/30 shadow-sm">
              <p className="text-[10px] md:text-xs text-[#505f76] font-bold uppercase tracking-wider mb-1">
                Net Stock
              </p>
              <p className="font-mono text-xl md:text-2xl font-bold text-[#0F172A]">
                {formatWeight(summary.net_stock)}
              </p>
            </div>
          </div>

          {/* Mobile summary cards */}
          <div className="md:hidden flex gap-3 overflow-x-auto mb-4 hide-scrollbar pb-1">
            <div className="flex-shrink-0 w-[140px] bg-white p-3 rounded-lg border border-[#c6c6cd]/30 shadow-sm">
              <p className="text-[10px] text-[#505f76] font-bold uppercase tracking-wider">In</p>
              <p className="font-mono text-sm font-bold text-[#059669]">
                {summary.total_in_kg.toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg
              </p>
            </div>
            <div className="flex-shrink-0 w-[140px] bg-white p-3 rounded-lg border border-[#c6c6cd]/30 shadow-sm">
              <p className="text-[10px] text-[#505f76] font-bold uppercase tracking-wider">Out</p>
              <p className="font-mono text-sm font-bold text-[#ba1a1a]">
                {summary.total_out_kg.toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg
              </p>
            </div>
            <div className="flex-shrink-0 w-[140px] bg-white p-3 rounded-lg border border-[#c6c6cd]/30 shadow-sm">
              <p className="text-[10px] text-[#505f76] font-bold uppercase tracking-wider">Net</p>
              <p className="font-mono text-sm font-bold text-[#0F172A]">
                {summary.net_stock.toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg
              </p>
            </div>
          </div>
        </>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="text-center py-16 text-[#ba1a1a]">
          <span className="material-symbols-outlined text-5xl block mb-4">error</span>
          <p className="text-lg font-medium mb-2">Failed to load ledger</p>
          <p className="text-sm">{error?.message}</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["ledger"] })}
            className="mt-4 px-5 py-2 bg-[#0F172A] text-white rounded-md text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Desktop: Table */}
      <div className="hidden md:block bg-white rounded-lg border border-[#c6c6cd]/30 shadow-sm overflow-hidden">
        {isLoading ? (
          <table className="w-full">
            <thead className="bg-[#f2f4f6] border-b border-[#c6c6cd]/30">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider text-left">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider text-left">Sub-type</th>
                <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider text-left">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider text-left">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider text-left">Qty (kg)</th>
                <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider text-left">Price/kg</th>
                <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider text-left">Total Value</th>
                <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider text-left">Reference</th>
                <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider text-left">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c6c6cd]/20">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-[#505f76]">
            <span className="material-symbols-outlined text-5xl block mb-4">receipt_long</span>
            <p className="text-lg font-medium mb-2">No movements found</p>
            <p className="text-sm">
              {activeFilters ? "Try adjusting your filters" : "Stock movements will appear here"}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#f2f4f6] border-b border-[#c6c6cd]/30">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider text-left">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider text-left">Sub-type</th>
                <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider text-left">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider text-left">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider text-left">Qty (kg)</th>
                <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider text-left">Price/kg</th>
                <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider text-left">Total Value</th>
                <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider text-left">Reference</th>
                <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider text-left">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c6c6cd]/20">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-[#f7f9fb] transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-[#505f76]">
                    {formatDate(entry.movement_date)}
                  </td>
                  <td className="px-6 py-4 font-medium text-sm text-[#0F172A]">
                    {entry.subtype_name || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#505f76]">
                    {entry.category_name || "—"}
                  </td>
                  <td className="px-6 py-4">
                    {entry.movement_type === "in" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success text-[11px] font-bold rounded uppercase">
                        IN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#ffdad6] text-[#ba1a1a] text-[11px] font-bold rounded uppercase">
                        OUT
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm font-medium text-[#0F172A]">
                    {formatWeight(entry.quantity_kg)}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-[#505f76]">
                    {entry.price_per_kg !== null ? `৳${entry.price_per_kg.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm font-medium text-[#0F172A]">
                    {entry.total_value !== null ? formatTk(entry.total_value) : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#505f76]">
                    {formatReference(entry.reference_type)}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#505f76] max-w-[150px] truncate" title={entry.note || ""}>
                    {entry.note || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile: Card List */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-[#505f76] bg-white rounded-xl border border-[#c6c6cd]/30">
            <span className="material-symbols-outlined text-4xl block mb-3">receipt_long</span>
            <p className="font-medium mb-1">No movements found</p>
            <p className="text-xs">
              {activeFilters ? "Try adjusting your filters" : "Stock movements will appear here"}
            </p>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="bg-white p-4 rounded-xl border border-[#c6c6cd]/30 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-mono text-xs text-[#505f76]">{formatDate(entry.movement_date)}</p>
                  <p className="font-display text-sm font-semibold text-[#0F172A] mt-0.5">
                    {entry.subtype_name || "—"}
                  </p>
                  {entry.category_name && (
                    <p className="text-xs text-[#505f76]">{entry.category_name}</p>
                  )}
                </div>
                {entry.movement_type === "in" ? (
                  <span className="px-2 py-0.5 bg-success/10 text-success text-[10px] font-bold rounded uppercase">
                    IN
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-bold rounded uppercase">
                    OUT
                  </span>
                )}
              </div>
              <div className="flex items-end justify-between border-t border-dashed border-[#c6c6cd]/50 pt-3">
                <div>
                  <p className="font-mono text-lg font-bold text-[#0F172A]">
                    {entry.quantity_kg.toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                    <span className="text-xs font-normal text-[#505f76] ml-1">kg</span>
                  </p>
                </div>
                <p className="text-xs text-[#505f76]">{formatReference(entry.reference_type)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
