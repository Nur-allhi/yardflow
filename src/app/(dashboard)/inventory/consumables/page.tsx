"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { InventoryNav } from "@/components/InventoryNav";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccounts } from "@/hooks/useAccounts";

interface ConsumableEntry {
  id: string;
  item_name: string;
  quantity: number | null;
  stock_quantity: number;
  unit: string | null;
  unit_price: number | null;
  total_price: number;
  vendor_name: string | null;
  account_id: string | null;
  account_name: string | null;
  purchase_date: string;
  note: string | null;
  created_at: string;
}

interface ConsumablesData {
  entries: ConsumableEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    total_spent_this_month: number;
    total_items: number;
    most_used_item: string | null;
  };
}

function formatTk(amount: number): string {
  if (amount === 0) return "৳0";
  return `৳${Math.round(amount).toLocaleString("en-IN")}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const COMMON_ITEMS = [
  "Welding Rod",
  "Grinding Paper",
  "Gas Cylinder",
  "Cutting Paper",
  "Safety Gloves",
];

export default function ConsumablesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showMobileForm, setShowMobileForm] = useState(false);

  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [unitPrice, setUnitPrice] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [note, setNote] = useState("");

  const qty = parseFloat(quantity) || 0;
  const price = parseFloat(unitPrice) || 0;
  const totalAmount = qty * price;

  const { data, isLoading, error, refetch } = useQuery<ConsumablesData>({
    queryKey: ["consumables", page],
    queryFn: async () => {
      const res = await fetch(`/api/inventory/consumables?page=${page}&limit=20`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const { data: accountsData } = useAccounts();

  useEffect(() => {
    if (accountsData && accountsData.length > 0) {
      setAccountId(accountsData[0].id);
    }
  }, [accountsData]);

  const createConsumableMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/inventory/consumables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create consumable");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumables"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setItemName("");
      setQuantity("");
      setUnit("pcs");
      setUnitPrice("");
      setVendorName("");
      setNote("");
      setPurchaseDate(new Date().toISOString().split("T")[0]);
      setShowMobileForm(false);
    },
    onSettled: () => {
      setSubmitting(false);
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    createConsumableMutation.mutate({
      item_name: itemName,
      quantity: qty || undefined,
      unit: unit || undefined,
      unit_price: price || undefined,
      total_price: totalAmount,
      vendor_name: vendorName || undefined,
      account_id: accountId || undefined,
      purchase_date: purchaseDate,
      note: note || undefined,
    });
  }

  const formatDateFull = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formContent = (submitting: boolean) => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-[#0F172A] mb-1">
          Item Name
        </label>
        <input
          required
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          list="item-suggestions"
          className="w-full h-[42px] border border-[#c6c6cd] rounded px-4 text-sm focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10 outline-none"
          placeholder="e.g. Welding Rod"
        />
        <datalist id="item-suggestions">
          {COMMON_ITEMS.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-bold text-[#0F172A] mb-1">
            Qty
          </label>
          <input
            type="number"
            step="any"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full h-[42px] border border-[#c6c6cd] rounded px-4 text-sm font-mono focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10 outline-none"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-[#0F172A] mb-1">
            Unit
          </label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full h-[42px] border border-[#c6c6cd] rounded px-4 text-sm focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10 outline-none"
          >
            <option value="pcs">pcs</option>
            <option value="box">box</option>
            <option value="kg">kg</option>
            <option value="roll">roll</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-bold text-[#0F172A] mb-1">
          Unit Price (৳)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          className="w-full h-[42px] border border-[#c6c6cd] rounded px-4 text-sm font-mono focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10 outline-none"
          placeholder="0.00"
        />
      </div>
      <div className="bg-[#f2f4f6] p-3 rounded border border-dashed border-[#c6c6cd]">
        <label className="block text-[10px] font-bold text-[#505f76] uppercase tracking-wider mb-1">
          Total Amount
        </label>
        <div className="text-xl font-mono font-bold text-[#059669]">
          {formatTk(totalAmount)}
        </div>
      </div>
      <div>
        <label className="block text-sm font-bold text-[#0F172A] mb-1">
          Vendor Name{" "}
          <span className="text-xs font-normal text-[#505f76]">(Optional)</span>
        </label>
        <input
          value={vendorName}
          onChange={(e) => setVendorName(e.target.value)}
          className="w-full h-[42px] border border-[#c6c6cd] rounded px-4 text-sm focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10 outline-none"
          placeholder="Search or add vendor"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-[#0F172A] mb-1">
          Pay From Account
        </label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full h-[42px] border border-[#c6c6cd] rounded px-4 text-sm focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10 outline-none"
        >
            {(!accountsData || accountsData.length === 0) && (
              <option value="">No accounts available</option>
            )}
            {accountsData?.map((acct) => (
            <option key={acct.id} value={acct.id}>
              {acct.name} ({formatTk(acct.current_balance)})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-bold text-[#0F172A] mb-1">
          Date
        </label>
        <input
          type="date"
          required
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          className="w-full h-[42px] border border-[#c6c6cd] rounded px-4 text-sm focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-[#0F172A] mb-1">
          Note <span className="text-xs font-normal text-[#505f76]">(Optional)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full p-3 border border-[#c6c6cd] rounded text-sm focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10 outline-none resize-none"
          placeholder="Add a note..."
        />
      </div>
      <button
        type="submit"
        disabled={submitting || !itemName || totalAmount <= 0}
        className="w-full h-[46px] bg-[#0F172A] text-white font-bold rounded-lg hover:bg-[#0F172A]/90 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-[20px]">add</span>
        {submitting ? "Logging..." : "Log Item"}
      </button>
    </form>
  );

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#059669] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center py-16 text-[#505f76]">
          <span className="material-symbols-outlined text-5xl block mb-4">
            error_outline
          </span>
          <p className="text-lg font-medium mb-2">Error</p>
          <p className="text-sm">{error?.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-5 py-2 bg-[#0F172A] text-white rounded-md text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Breadcrumbs & Header */}
      <nav className="flex items-center gap-2 text-xs text-[#505f76] mb-2 font-medium tracking-wide uppercase">
        <Link href="/" className="hover:text-[#0F172A]">Dashboard</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link href="/inventory" className="hover:text-[#0F172A]">Inventory</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-[#0F172A] font-bold">Consumables</span>
      </nav>
      <h1 className="font-display text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight mb-2">
        Consumables Log
      </h1>

      <div className="flex items-center justify-between gap-4">
        <InventoryNav active="consumables" />
        <Link
          href="/inventory/consumables/use"
          className="flex items-center gap-1.5 px-4 h-[38px] bg-[#DC2626] text-white text-sm font-bold rounded-lg hover:bg-[#DC2626]/90 transition-all flex-shrink-0 shadow-sm active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]">remove</span>
          Use Item
        </Link>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 md:mb-8">
        <div className="bg-white p-4 md:p-6 rounded-lg border border-[#c6c6cd]/30 shadow-sm">
          <p className="text-[#505f76] text-xs font-bold uppercase tracking-wider mb-2">
            This Month Spent
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-[#EAB308]">
              {formatTk(data?.summary.total_spent_this_month ?? 0)}
            </span>
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-lg border border-[#c6c6cd]/30 shadow-sm">
          <p className="text-[#505f76] text-xs font-bold uppercase tracking-wider mb-2">
            Total Items Logged
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-[#0F172A]">
              {data?.summary.total_items ?? 0}
            </span>
            <span className="text-[10px] text-[#505f76]">entries total</span>
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-lg border border-[#c6c6cd]/30 shadow-sm">
          <p className="text-[#505f76] text-xs font-bold uppercase tracking-wider mb-2">
            Most Used Item
          </p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold font-display text-[#0F172A]">
              {data?.summary.most_used_item ?? "—"}
            </span>
            {data?.summary.most_used_item && (
              <span className="bg-[#0EA5E9]/10 text-[#0EA5E9] px-3 py-1 rounded-full text-xs font-bold uppercase">
                Top
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: Two-Column Layout */}
      <div className="hidden md:flex flex-col lg:flex-row gap-8 items-start">
        {/* Left: Table */}
        <div className="flex-1 w-full overflow-hidden">
          {!data || data.entries.length === 0 ? (
            <div className="bg-white rounded-lg border border-[#c6c6cd]/30 shadow-sm py-16 text-center text-[#505f76]">
              <span className="material-symbols-outlined text-5xl block mb-4">
                inventory
              </span>
              <p className="text-lg font-medium mb-2">No consumables logged yet</p>
              <p className="text-sm">
                Use the form to log your first consumable purchase
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg border border-[#c6c6cd]/30 shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-[#f2f4f6] border-b border-[#c6c6cd]/40">
                    <tr>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-[#505f76]">Date</th>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-[#505f76]">Item</th>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-[#505f76]">Stock</th>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-[#505f76]">Qty</th>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-[#505f76]">Unit Price</th>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-[#505f76]">Total</th>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-[#505f76]">Vendor</th>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-[#505f76]">Account</th>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-[#505f76]">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c6c6cd]/20">
                    {data.entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[#f2f4f6]/50 transition-colors">
                        <td className="px-4 py-4 text-sm whitespace-nowrap">
                          {formatDate(entry.purchase_date)}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-[#0F172A]">
                          {entry.item_name}
                        </td>
                        <td className="px-4 py-4 text-sm font-mono">
                          <span className={entry.stock_quantity > 0 ? "text-[#059669]" : "text-[#DC2626]"}>
                            {entry.stock_quantity} {entry.unit || ""}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm font-mono text-[#505f76]">
                          {entry.quantity != null
                            ? `${entry.quantity} ${entry.unit || ""}`
                            : "—"}
                        </td>
                        <td className="px-4 py-4 text-sm font-mono text-[#505f76]">
                          {entry.unit_price != null
                            ? formatTk(entry.unit_price)
                            : "—"}
                        </td>
                        <td className="px-4 py-4 text-sm font-mono font-semibold text-[#0F172A]">
                          {formatTk(entry.total_price)}
                        </td>
                        <td className="px-4 py-4 text-sm text-[#505f76]">
                          {entry.vendor_name || "—"}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {entry.account_name ? (
                            <span className="px-2 py-0.5 rounded bg-[#e0e3e5] text-xs font-medium">
                              {entry.account_name}
                            </span>
                          ) : (
                            <span className="text-[#505f76]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs text-[#505f76] italic">
                          {entry.note || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#e6e8ea] border-t-2 border-[#76777d]">
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-4 text-right text-sm font-bold text-[#505f76] uppercase tracking-wider"
                      >
                        Monthly Total:
                      </td>
                      <td className="px-4 py-4 text-base font-mono font-bold text-[#0F172A]">
                        {formatTk(data.summary.total_spent_this_month)}
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex justify-between items-center px-2">
                <p className="text-xs text-[#505f76]">
                  Showing {data.entries.length} of {data.pagination.total} logs
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 border border-[#c6c6cd] rounded bg-white text-xs hover:bg-[#f2f4f6] transition-colors disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= data.pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 border border-[#c6c6cd] rounded bg-white text-xs hover:bg-[#f2f4f6] transition-colors disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Form Sidebar */}
        <aside className="w-full lg:w-[320px] flex-shrink-0">
          <div className="bg-white rounded-lg border border-[#c6c6cd]/30 shadow-md p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-6">
              <span
                className="material-symbols-outlined text-[#059669]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                add_circle
              </span>
              <h3 className="font-display font-bold text-lg text-[#0F172A]">
                Log Consumable
              </h3>
            </div>
            {formContent(submitting)}
          </div>
        </aside>
      </div>

      {/* Mobile: Stats (horizontal scroll) */}
      <div className="md:hidden -mx-4 px-4 mb-4">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
          <div className="bg-white p-4 rounded-lg border border-[#c6c6cd]/30 shadow-sm min-w-[160px] flex-shrink-0">
            <p className="text-[#505f76] text-[10px] font-bold uppercase tracking-wider mb-1">
              This Month
            </p>
            <span className="text-lg font-mono font-bold text-[#EAB308]">
              {formatTk(data?.summary.total_spent_this_month ?? 0)}
            </span>
          </div>
          <div className="bg-white p-4 rounded-lg border border-[#c6c6cd]/30 shadow-sm min-w-[160px] flex-shrink-0">
            <p className="text-[#505f76] text-[10px] font-bold uppercase tracking-wider mb-1">
              Total Items
            </p>
            <span className="text-lg font-mono font-bold text-[#0F172A]">
              {data?.summary.total_items ?? 0}
            </span>
          </div>
          <div className="bg-white p-4 rounded-lg border border-[#c6c6cd]/30 shadow-sm min-w-[160px] flex-shrink-0">
            <p className="text-[#505f76] text-[10px] font-bold uppercase tracking-wider mb-1">
              Most Used
            </p>
            <span className="text-sm font-bold font-display text-[#0F172A]">
              {data?.summary.most_used_item ?? "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile: Recent Entries */}
      <div className="md:hidden">
        <h2 className="font-display font-bold text-lg text-[#0F172A] mb-4">
          Recent Entries
        </h2>
        {!data || data.entries.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#c6c6cd]/30 py-12 text-center text-[#505f76] text-sm">
            <span className="material-symbols-outlined text-4xl block mb-2">
              inventory
            </span>
            No entries yet
          </div>
        ) : (
          <div className="space-y-3">
            {data.entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white p-4 rounded-xl border border-[#c6c6cd]/30 shadow-sm flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-[#059669]/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[#059669] text-xl">
                    inventory
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-[#0F172A] truncate">
                    {entry.item_name}
                  </h3>
                  <p className="text-[10px] text-[#505f76]">
                    {formatDateFull(entry.purchase_date)}
                    {entry.vendor_name && ` · ${entry.vendor_name}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-sm text-[#0F172A]">
                    {formatTk(entry.total_price)}
                  </p>
                  <p className="text-[10px] text-[#505f76]">
                    {entry.quantity != null
                      ? `${entry.quantity} ${entry.unit || ""}`
                      : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mobile Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex justify-center gap-4 mt-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 border border-[#c6c6cd] rounded-lg bg-white text-sm disabled:opacity-30"
            >
              Previous
            </button>
            <span className="text-sm text-[#505f76] self-center">
              {page} / {data.pagination.totalPages}
            </span>
            <button
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 border border-[#c6c6cd] rounded-lg bg-white text-sm disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setShowMobileForm(true)}
        className="md:hidden fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-[#0F172A] text-white flex items-center justify-center shadow-xl active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>

      {/* Mobile Bottom Sheet Form */}
      {showMobileForm && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm"
            onClick={() => setShowMobileForm(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-2xl p-6 flex flex-col gap-6 max-h-[85vh] overflow-y-auto">
            <div className="w-12 h-1 bg-[#c6c6cd] rounded-full mx-auto mb-2" />
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl text-[#0F172A]">
                Log Consumable
              </h2>
              <button
                onClick={() => setShowMobileForm(false)}
                className="text-[#505f76]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {formContent(submitting)}
            <div className="h-6" />
          </div>
        </div>
      )}
    </div>
  );
}
