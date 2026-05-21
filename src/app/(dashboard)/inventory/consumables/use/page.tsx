"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InventoryNav } from "@/components/InventoryNav";

interface ConsumableItem {
  id: string;
  item_name: string;
  stock_quantity: number;
  unit: string | null;
}

export default function UseConsumablePage() {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [consumableId, setConsumableId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [usedAt, setUsedAt] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");

  const { data: itemsData, isLoading: loading, error: loadError } = useQuery<ConsumableItem[]>({
    queryKey: ["consumables"],
    queryFn: async () => {
      const res = await fetch("/api/inventory/consumables?limit=100");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      return json.entries
        .filter((e: ConsumableItem) => e.stock_quantity > 0)
        .map((e: ConsumableItem) => ({
          ...e,
          stock_quantity: Number(e.stock_quantity),
        }));
    },
  });

  useEffect(() => {
    if (itemsData && itemsData.length > 0 && !consumableId) {
      setConsumableId(itemsData[0].id);
    }
  }, [itemsData, consumableId]);

  const items = itemsData ?? [];
  const selectedItem = items.find((i) => i.id === consumableId);

  const useConsumableMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setQuantity("");
      setNote("");
      setUsedAt(new Date().toISOString().split("T")[0]);
    },
    onError: (e) => {
      setError(e instanceof Error ? e.message : "Failed to record usage");
    },
    onSettled: () => {
      setSubmitting(false);
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consumableId) return;
    setSubmitting(true);
    setError(null);
    useConsumableMutation.mutate({
      consumable_id: consumableId,
      quantity: parseFloat(quantity) || 0,
      used_at: usedAt,
      note: note || undefined,
    });
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#059669] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const itemsError = error || (loadError ? "Could not load consumables" : null);
  if ((error || loadError) && items.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center py-16 text-[#505f76]">
          <span className="material-symbols-outlined text-5xl block mb-4">error_outline</span>
          <p className="text-lg font-medium mb-2">Error</p>
          <p className="text-sm">{itemsError}</p>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ["consumables"] })} className="mt-4 px-5 py-2 bg-[#0F172A] text-white rounded-md text-sm">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <nav className="flex items-center gap-2 text-xs text-[#505f76] mb-2 font-medium tracking-wide uppercase">
        <Link href="/" className="hover:text-[#0F172A]">Dashboard</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link href="/inventory" className="hover:text-[#0F172A]">Inventory</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link href="/inventory/consumables" className="hover:text-[#0F172A]">Consumables</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-[#0F172A] font-bold">Use</span>
      </nav>
      <h1 className="font-display text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight mb-2">
        Record Consumption
      </h1>
      <p className="text-sm text-[#505f76] mb-6">
        Deduct items from inventory stock.
      </p>

      <InventoryNav active="consumables" />

      {items.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#c6c6cd]/30 shadow-sm py-16 text-center text-[#505f76]">
          <span className="material-symbols-outlined text-5xl block mb-4">inventory</span>
          <p className="text-lg font-medium mb-2">No items in stock</p>
          <p className="text-sm">Add consumable purchases first.</p>
          <Link href="/inventory/consumables" className="mt-4 inline-block px-5 py-2 bg-[#0F172A] text-white rounded-md text-sm">
            Go to Consumables
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-[#c6c6cd]/30 shadow-md p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#0F172A] mb-1">Item</label>
            <select
              required
              value={consumableId}
              onChange={(e) => setConsumableId(e.target.value)}
              className="w-full h-[42px] border border-[#c6c6cd] rounded px-4 text-sm focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10 outline-none"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.item_name} ({item.stock_quantity} {item.unit || "pcs"} in stock)
                </option>
              ))}
            </select>
          </div>

          {selectedItem && (
            <div className="bg-[#f0fdf4] border border-[#86efac] rounded p-3 text-sm text-[#166534]">
              <span className="font-bold">{selectedItem.stock_quantity}</span> {selectedItem.unit || "pcs"} available
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-[#0F172A] mb-1">
              Quantity Used
            </label>
            <input
              type="number"
              step="any"
              min="0.001"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="w-full h-[42px] border border-[#c6c6cd] rounded px-4 text-sm font-mono focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#0F172A] mb-1">Date</label>
            <input
              type="date"
              required
              value={usedAt}
              onChange={(e) => setUsedAt(e.target.value)}
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
              placeholder="Reason for usage..."
            />
          </div>

          {error && (
            <div className="bg-[#fef2f2] border border-[#fca5a5] rounded p-3 text-sm text-[#991b1b]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !consumableId || !quantity || parseFloat(quantity) <= 0}
            className="w-full h-[46px] bg-[#DC2626] text-white font-bold rounded-lg hover:bg-[#DC2626]/90 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[20px]">remove</span>
            {submitting ? "Recording..." : "Record Consumption"}
          </button>
        </form>
      )}
    </div>
  );
}
