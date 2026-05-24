"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import { InventorySimpleNav } from "@/components/InventorySimpleNav";
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

interface ConsumptionEntry {
  id: string;
  item_name: string;
  quantity: number;
  unit: string | null;
  used_at: string;
  note: string | null;
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
  consumptions: ConsumptionEntry[];
}

function formatTk(amount: number): string {
  if (amount === 0) return "0 tk";
  return `${Math.round(amount).toLocaleString("en-IN")} tk`;
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
  const router = useRouter();

  useEffect(() => {
    fetch("/api/simple/mode")
      .then(r => r.json())
      .then(data => {
        if (data.mode === "detailed") router.replace("/inventory");
      })
      .catch(() => {});
  }, [router]);

  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);

  const [useConsumableId, setUseConsumableId] = useState("");
  const [useQuantity, setUseQuantity] = useState("");
  const [useDate, setUseDate] = useState(new Date().toISOString().split("T")[0]);
  const [useNote, setUseNote] = useState("");

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

  const recordUseMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/inventory/consumables/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to record usage");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumables"] });
      setUseConsumableId("");
      setUseQuantity("");
      setUseNote("");
      setUseDate(new Date().toISOString().split("T")[0]);
      setShowUseModal(false);
    },
  });

  async function handleUseSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!useConsumableId) return;
    recordUseMutation.mutate({
      consumable_id: useConsumableId,
      quantity: parseFloat(useQuantity) || 0,
      used_at: useDate,
      note: useNote || undefined,
    });
  }

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
        <label className="block text-sm font-bold text-primary-container mb-1">
          Item Name
        </label>
        <input
          required
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          list="item-suggestions"
          autoComplete="name" enterKeyHint="next"
          className="w-full h-[42px] border border-outline-variant rounded px-4 text-sm focus:border-tertiary focus:ring-2 focus:ring-tertiary/10 outline-none"
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
          <label className="block text-sm font-bold text-primary-container mb-1">
            Qty
          </label>
          <input
            type="number"
            step="any"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            inputMode="decimal" autoComplete="off" enterKeyHint="next"
            className="w-full h-[42px] border border-outline-variant rounded px-4 text-sm font-mono focus:border-tertiary focus:ring-2 focus:ring-tertiary/10 outline-none"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-primary-container mb-1">
            Unit
          </label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            autoComplete="off"
            className="w-full h-[42px] border border-outline-variant rounded px-4 text-sm focus:border-tertiary focus:ring-2 focus:ring-tertiary/10 outline-none"
          >
            <option value="pcs">pcs</option>
            <option value="box">box</option>
            <option value="kg">kg</option>
            <option value="roll">roll</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-bold text-primary-container mb-1">
          Unit Price (৳)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          inputMode="decimal" autoComplete="off" enterKeyHint="next"
          className="w-full h-[42px] border border-outline-variant rounded px-4 text-sm font-mono focus:border-tertiary focus:ring-2 focus:ring-tertiary/10 outline-none"
          placeholder="0.00"
        />
      </div>
      <div className="bg-surface-container-low p-3 rounded border border-dashed border-outline-variant">
        <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
          Total Amount
        </label>
        <div className="text-xl font-mono font-bold text-tertiary">
          {formatTk(totalAmount)}
        </div>
      </div>
      <div>
        <label className="block text-sm font-bold text-primary-container mb-1">
          Vendor Name{" "}
          <span className="text-xs font-normal text-secondary">(Optional)</span>
        </label>
        <input
          value={vendorName}
          onChange={(e) => setVendorName(e.target.value)}
          autoComplete="name" enterKeyHint="next"
          className="w-full h-[42px] border border-outline-variant rounded px-4 text-sm focus:border-tertiary focus:ring-2 focus:ring-tertiary/10 outline-none"
          placeholder="Search or add vendor"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-primary-container mb-1">
          Pay From Account
        </label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          autoComplete="off"
          className="w-full h-[42px] border border-outline-variant rounded px-4 text-sm focus:border-tertiary focus:ring-2 focus:ring-tertiary/10 outline-none"
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
        <label className="block text-sm font-bold text-primary-container mb-1">
          Date
        </label>
        <input
          type="date"
          required
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          autoComplete="off" enterKeyHint="next"
          className="w-full h-[42px] border border-outline-variant rounded px-4 text-sm focus:border-tertiary focus:ring-2 focus:ring-tertiary/10 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-primary-container mb-1">
          Note <span className="text-xs font-normal text-secondary">(Optional)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full p-3 border border-outline-variant rounded text-sm focus:border-tertiary focus:ring-2 focus:ring-tertiary/10 outline-none resize-none"
          placeholder="Add a note..."
        />
      </div>
      <button
        type="submit"
        disabled={submitting || !itemName || totalAmount <= 0}
        className="w-full h-[46px] bg-primary-container text-white font-bold rounded-lg hover:bg-primary-container/90 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] disabled:opacity-40"
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
          <div className="w-8 h-8 border-4 border-tertiary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center py-16 text-secondary">
          <span className="material-symbols-outlined text-5xl block mb-4">
            error_outline
          </span>
          <p className="text-lg font-medium mb-2">Error</p>
          <p className="text-sm">{error?.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-5 py-2 bg-primary-container text-white rounded-md text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Inventory', href: '/inventory-simple' }, { label: 'Consumables', href: null }]} />
      <h1 className="font-display text-2xl md:text-3xl font-bold text-primary-container tracking-tight mb-1">
        Consumables Log
      </h1>
      <p className="text-body-sm text-on-surface-variant mb-2">Track shipyard operational supplies and expenses</p>

      <div className="flex items-center justify-between gap-4">
        <InventorySimpleNav active="consumables" />
        <button
          onClick={() => setShowUseModal(true)}
          className="flex items-center gap-1.5 px-4 h-[38px] bg-error text-white text-sm font-bold rounded-lg hover:bg-error/90 transition-all flex-shrink-0 shadow-sm active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]">remove</span>
          Use Item
        </button>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 md:mb-8">
        <div className="bg-surface-container-low p-4 md:p-6 rounded-xl border border-outline-variant shadow-sm">
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-2">
            This Month Spent
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-warning">
              {formatTk(data?.summary.total_spent_this_month ?? 0)}
            </span>
          </div>
        </div>
        <div className="bg-surface-container-low p-4 md:p-6 rounded-xl border border-outline-variant shadow-sm">
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-2">
            Total Items Logged
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-primary">
              {data?.summary.total_items ?? 0}
            </span>
            <span className="text-[10px] text-on-surface-variant">entries total</span>
          </div>
        </div>
        <div className="bg-surface-container-low p-4 md:p-6 rounded-xl border border-outline-variant shadow-sm">
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-2">
            Most Used Item
          </p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold font-display text-primary">
              {data?.summary.most_used_item ?? "—"}
            </span>
            {data?.summary.most_used_item && (
              <span className="bg-info/10 text-info px-3 py-1 rounded-full text-xs font-bold uppercase">
                Top
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: Two-Column Layout */}
      <div className="hidden md:flex flex-col lg:flex-row gap-8 items-start">
        {/* Left: Purchases + Consumption */}
        <div className="flex-1 w-full overflow-hidden space-y-8">
          {!data || data.entries.length === 0 ? (
            <div className="bg-white rounded-lg border border-outline-variant/30 shadow-sm py-16 text-center text-secondary">
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
              <div className="bg-white rounded-lg border border-outline-variant/30 shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-surface-container-low border-b border-outline-variant/40">
                    <tr>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Date</th>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Item</th>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Stock</th>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Qty</th>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Unit Price</th>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Total</th>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Vendor</th>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Account</th>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {data.entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-4 py-4 text-sm whitespace-nowrap">
                          {formatDate(entry.purchase_date)}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-primary-container">
                          {entry.item_name}
                        </td>
                        <td className="px-4 py-4 text-sm font-mono">
                          <span className={entry.stock_quantity > 0 ? "text-tertiary" : "text-error"}>
                            {entry.stock_quantity} {entry.unit || ""}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm font-mono text-secondary">
                          {entry.quantity != null
                            ? `${entry.quantity} ${entry.unit || ""}`
                            : "—"}
                        </td>
                        <td className="px-4 py-4 text-sm font-mono text-secondary">
                          {entry.unit_price != null
                            ? formatTk(entry.unit_price)
                            : "—"}
                        </td>
                        <td className="px-4 py-4 text-sm font-mono font-semibold text-primary-container">
                          {formatTk(entry.total_price)}
                        </td>
                        <td className="px-4 py-4 text-sm text-secondary">
                          {entry.vendor_name || "—"}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {entry.account_name ? (
                            <span className="px-2 py-0.5 rounded bg-surface-container-highest text-xs font-medium">
                              {entry.account_name}
                            </span>
                          ) : (
                            <span className="text-secondary">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs text-secondary italic">
                          {entry.note || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-surface-container-high border-t-2 border-outline">
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-4 text-right text-sm font-bold text-secondary uppercase tracking-wider"
                      >
                        Monthly Total:
                      </td>
                      <td className="px-4 py-4 text-base font-mono font-bold text-primary-container">
                        {formatTk(data.summary.total_spent_this_month)}
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex justify-between items-center px-2">
                <p className="text-xs text-secondary">
                  Showing {data.entries.length} of {data.pagination.total} logs
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 border border-outline-variant rounded bg-white text-xs hover:bg-surface-container-low transition-colors disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= data.pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 border border-outline-variant rounded bg-white text-xs hover:bg-surface-container-low transition-colors disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Consumption History */}
          <div className="bg-white rounded-lg border border-outline-variant/30 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-outline-variant/30 flex items-center justify-between">
              <h3 className="font-display font-bold text-primary-container">Consumption History</h3>
              {data?.consumptions && data.consumptions.length > 0 && (
                <span className="text-xs text-secondary font-mono">{data.consumptions.length} entries</span>
              )}
            </div>
            {!data?.consumptions || data.consumptions.length === 0 ? (
              <div className="p-8 text-center text-secondary text-sm">No consumption recorded yet</div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead className="bg-surface-container-low border-b border-outline-variant/40">
                  <tr>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Date</th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Item</th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Qty Used</th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {data.consumptions.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-4 py-4 text-sm whitespace-nowrap">{formatDate(c.used_at)}</td>
                      <td className="px-4 py-4 text-sm font-medium text-primary-container">{c.item_name}</td>
                      <td className="px-4 py-4 text-sm font-mono text-error">{c.quantity} {c.unit || ""}</td>
                      <td className="px-4 py-4 text-sm text-secondary italic">{c.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Form Sidebar */}
        <aside className="w-full lg:w-[320px] flex-shrink-0">
          <div className="bg-white rounded-lg border border-outline-variant/30 shadow-md p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-6">
              <span
                className="material-symbols-outlined text-tertiary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                add_circle
              </span>
              <h3 className="font-display font-bold text-lg text-primary-container">
                Log Consumable
              </h3>
            </div>
            {formContent(submitting)}
          </div>
        </aside>
      </div>

      {/* Mobile: Stats (horizontal scroll) */}
      <div className="md:hidden flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar mb-4">
        <div className="flex-shrink-0 w-40 bg-surface-container-low border border-outline-variant rounded-xl p-4 shadow-sm">
          <p className="text-caption text-on-surface-variant mb-1">This Month Spent</p>
          <p className="text-h3 font-mono font-bold text-warning">
            {formatTk(data?.summary.total_spent_this_month ?? 0)}
          </p>
        </div>
        <div className="flex-shrink-0 w-40 bg-surface-container-low border border-outline-variant rounded-xl p-4 shadow-sm">
          <p className="text-caption text-on-surface-variant mb-1">Total Items Logged</p>
          <p className="text-h3 font-display font-bold text-primary">
            {data?.summary.total_items ?? 0}
          </p>
        </div>
        <div className="flex-shrink-0 w-40 bg-surface-container-low border border-outline-variant rounded-xl p-4 shadow-sm">
          <p className="text-caption text-on-surface-variant mb-1">Most Used</p>
          <p className="text-body font-bold text-primary truncate">
            {data?.summary.most_used_item ?? "—"}
          </p>
        </div>
      </div>

        {/* Mobile: Recent Entries */}
      <div className="md:hidden mt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-semibold text-lg text-on-surface">
            Recent Purchases
          </h3>
          <span className="material-symbols-outlined text-on-surface-variant">filter_list</span>
        </div>
        {!data || data.entries.length === 0 ? (
          <div className="bg-surface border border-outline-variant rounded-lg py-12 text-center text-on-surface-variant text-sm">
            <span className="material-symbols-outlined text-4xl block mb-2">
              inventory
            </span>
            No entries yet
          </div>
        ) : (
          <div className="space-y-3">
            {data.entries.map((entry) => {
              const icon = entry.item_name.toLowerCase().includes("rod") || entry.item_name.toLowerCase().includes("weld")
                ? "bolt" : entry.item_name.toLowerCase().includes("paper") || entry.item_name.toLowerCase().includes("grind")
                ? "auto_fix_high" : entry.item_name.toLowerCase().includes("gas") || entry.item_name.toLowerCase().includes("cylinder")
                ? "propane_tank" : entry.item_name.toLowerCase().includes("glove") || entry.item_name.toLowerCase().includes("safety")
                ? "security" : "construction";
              return (
                <div
                  key={entry.id}
                  className="bg-surface border border-outline-variant rounded-lg p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-surface-container-highest w-12 h-12 rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">
                        {icon}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">{entry.item_name}</p>
                      <p className="text-caption text-on-surface-variant">
                        {formatDateFull(entry.purchase_date)} • {entry.quantity || 0} {entry.unit || "pcs"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium text-on-surface">
                      {formatTk(entry.total_price)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile: Consumption History */}
        <div className="mt-6 mb-4">
          <h3 className="font-display font-semibold text-lg text-on-surface mb-3">Consumption History</h3>
          {!data?.consumptions || data.consumptions.length === 0 ? (
            <div className="bg-surface border border-outline-variant rounded-lg py-8 text-center text-on-surface-variant text-sm">
              No consumption recorded yet
            </div>
          ) : (
            <div className="space-y-2">
              {data.consumptions.map((c) => (
                <div key={c.id} className="bg-surface border border-outline-variant rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-on-surface">{c.item_name}</p>
                    <p className="text-[10px] text-on-surface-variant">{formatDateFull(c.used_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-error">-{c.quantity} {c.unit || "pcs"}</p>
                    {c.note && <p className="text-[10px] text-on-surface-variant">{c.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex justify-center gap-4 mt-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 border border-outline-variant rounded-lg bg-white text-sm disabled:opacity-30"
            >
              Previous
            </button>
            <span className="text-sm text-secondary self-center">
              {page} / {data.pagination.totalPages}
            </span>
            <button
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 border border-outline-variant rounded-lg bg-white text-sm disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-24 right-6 flex flex-col gap-3 z-40">
        <button
          onClick={() => setShowUseModal(true)}
          className="w-14 h-14 bg-error text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform duration-150"
        >
          <span className="material-symbols-outlined text-3xl">remove</span>
        </button>
        <button
          onClick={() => setShowMobileForm(true)}
          className="w-14 h-14 bg-on-tertiary-container text-on-primary rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform duration-150"
        >
          <span className="material-symbols-outlined text-3xl">add</span>
        </button>
      </div>

      {/* Use Item Modal (Desktop) */}
      {showUseModal && (
        <div className="hidden md:flex fixed inset-0 z-[60] items-center justify-center bg-primary-container/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowUseModal(false); }}
        >
          <div className="bg-white w-[480px] p-8 rounded-xl shadow-lg border border-outline-variant/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl text-primary-container">Record Consumption</h2>
              <button className="text-outline hover:text-primary-container transition-colors" onClick={() => setShowUseModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleUseSubmit} className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Item</label>
                <select required value={useConsumableId} onChange={(e) => setUseConsumableId(e.target.value)}
                  className="w-full h-[44px] border border-outline-variant rounded px-3 text-sm outline-none bg-white focus:border-primary">
                  <option value="">Select item</option>
                  {data?.entries.filter((e) => e.stock_quantity > 0).map((e) => (
                    <option key={e.id} value={e.id}>{e.item_name} ({e.stock_quantity} {e.unit || "pcs"} in stock)</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Quantity Used</label>
                <input type="number" step="any" min="0.001" required value={useQuantity}
                  onChange={(e) => setUseQuantity(e.target.value)} placeholder="0"
                  inputMode="decimal" autoComplete="off" enterKeyHint="next"
                  className="w-full h-[44px] border border-outline-variant rounded px-4 text-sm font-mono outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Date</label>
                <input type="date" required value={useDate} onChange={(e) => setUseDate(e.target.value)}
                  autoComplete="off" enterKeyHint="next"
                  className="w-full h-[44px] border border-outline-variant rounded px-4 text-sm outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Note (Optional)</label>
                <textarea value={useNote} onChange={(e) => setUseNote(e.target.value)} rows={2}
                  className="w-full border border-outline-variant rounded p-3 text-sm outline-none focus:border-primary resize-none"
                  placeholder="Reason for usage..." />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button type="button" onClick={() => setShowUseModal(false)}
                  className="flex-1 h-[44px] bg-transparent text-on-surface-variant hover:bg-surface-container-low transition-colors font-bold text-sm rounded">Cancel</button>
                <button type="submit" disabled={recordUseMutation.isPending || !useConsumableId || !useQuantity}
                  className="flex-1 h-[44px] bg-error text-white hover:bg-error/90 transition-all active:scale-95 font-bold text-sm rounded disabled:opacity-40">
                  {recordUseMutation.isPending ? "Recording..." : "Record Consumption"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Use Item Bottom Sheet (Mobile) */}
      {showUseModal && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setShowUseModal(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl shadow-2xl p-6 pb-10 max-h-[85vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-outline-variant rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl text-primary">Record Consumption</h2>
              <button onClick={() => setShowUseModal(false)} className="text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleUseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-1">Item</label>
                <select required value={useConsumableId} onChange={(e) => setUseConsumableId(e.target.value)}
                  className="w-full h-[44px] border border-outline-variant rounded px-4 text-sm outline-none bg-white">
                  <option value="">Select item</option>
                  {data?.entries.filter((e) => e.stock_quantity > 0).map((e) => (
                    <option key={e.id} value={e.id}>{e.item_name} ({e.stock_quantity} {e.unit || "pcs"} in stock)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-1">Quantity Used</label>
                <input type="number" step="any" min="0.001" required value={useQuantity}
                  onChange={(e) => setUseQuantity(e.target.value)} placeholder="0"
                  inputMode="decimal" autoComplete="off" enterKeyHint="next"
                  className="w-full h-[44px] border border-outline-variant rounded px-4 text-sm font-mono outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-1">Date</label>
                <input type="date" required value={useDate} onChange={(e) => setUseDate(e.target.value)}
                  autoComplete="off" enterKeyHint="next"
                  className="w-full h-[44px] border border-outline-variant rounded px-4 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-1">Note (Optional)</label>
                <textarea value={useNote} onChange={(e) => setUseNote(e.target.value)} rows={2}
                  className="w-full border border-outline-variant rounded p-3 text-sm outline-none resize-none"
                  placeholder="Reason for usage..." />
              </div>
              {recordUseMutation.isError && (
                <div className="bg-error/10 text-error rounded-lg p-3 text-sm">
                  {recordUseMutation.error instanceof Error ? recordUseMutation.error.message : "Failed to record usage"}
                </div>
              )}
              <button type="submit" disabled={recordUseMutation.isPending || !useConsumableId || !useQuantity}
                className="w-full h-[46px] bg-error text-white font-bold rounded-lg hover:bg-error/90 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] disabled:opacity-40">
                {recordUseMutation.isPending ? "Recording..." : "Record Consumption"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheet Form */}
      {showMobileForm && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
            onClick={() => setShowMobileForm(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl shadow-2xl p-6 pb-10 max-h-[85vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-outline-variant rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl text-primary">
                Log Consumable
              </h2>
              <button
                onClick={() => setShowMobileForm(false)}
                className="text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {formContent(submitting)}
          </div>
        </div>
      )}
    </div>
  );
}
