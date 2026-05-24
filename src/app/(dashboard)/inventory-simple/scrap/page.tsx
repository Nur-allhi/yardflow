"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { InventorySimpleNav } from "@/components/InventorySimpleNav";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ScrapMovement {
  id: string;
  movement_type: "in" | "out";
  quantity_kg: number;
  reference_id: string | null;
  movement_date: string;
  note: string | null;
  balance: number;
}

interface ScrapData {
  current_kg: number;
  estimated_value: number;
  estimated_price_per_kg: number;
  days_since_last_sale: number | null;
  last_sale_kg: number;
  last_sale_date: string | null;
  movements: ScrapMovement[];
}

function formatTk(amount: number): string {
  if (amount === 0) return "৳0";
  return "৳" + amount.toLocaleString("en-IN");
}

function formatKg(kg: number): string {
  return (
    kg.toLocaleString("en-IN", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }) + " kg"
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ScrapPoolPage() {
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
  const [addScrapKg, setAddScrapKg] = useState("");
  const [addScrapDate, setAddScrapDate] = useState(new Date().toISOString().split("T")[0]);
  const [addScrapNote, setAddScrapNote] = useState("");
  const [addingScrap, setAddingScrap] = useState(false);
  const [addScrapMsg, setAddScrapMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data, isLoading, error } = useQuery<ScrapData>({
    queryKey: ["scrap"],
    queryFn: async () => {
      const res = await fetch("/api/inventory/scrap");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load scrap pool");
      }
      return res.json();
    },
  });

  const addScrapMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/inventory/scrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add scrap");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scrap"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setAddScrapMsg({ type: "success", text: "Scrap added successfully!" });
      setAddScrapKg("");
      setAddScrapNote("");
      setTimeout(() => setAddScrapMsg(null), 3000);
    },
    onError: (err) => {
      setAddScrapMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to add scrap" });
    },
    onSettled: () => {
      setAddingScrap(false);
    },
  });

  async function handleAddScrap(e: React.FormEvent) {
    e.preventDefault();
    if (!addScrapKg || Number(addScrapKg) <= 0) return;
    setAddingScrap(true);
    setAddScrapMsg(null);
    addScrapMutation.mutate({
      quantity_kg: Number(addScrapKg),
      movement_date: addScrapDate,
      note: addScrapNote || undefined,
    });
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-surface-container-highest rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-surface-container rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-surface-container rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <span className="material-symbols-outlined text-4xl text-error block mb-3">
            error
          </span>
          <p className="text-error font-medium mb-2">Failed to load scrap pool</p>
          <p className="text-sm text-secondary mb-4">{error?.message}</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["scrap"] })}
            className="px-5 py-2 bg-primary-container text-white font-semibold rounded-md hover:bg-primary-container/90 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center py-16 text-secondary">
          <span className="material-symbols-outlined text-5xl block mb-4">
            recycling
          </span>
          <p className="text-lg font-medium mb-2">No scrap pool data</p>
          <p className="text-sm">Start by adding scrap from period reconciliation</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Header */}
      <div className="hidden md:block p-4 md:p-8 pb-0">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Inventory', href: '/inventory-simple' }, { label: 'Scrap Pool', href: null }]} />
        <h1 className="font-display text-2xl md:text-3xl font-bold text-primary-container tracking-tight mb-6">
          Scrap Pool
        </h1>

        <InventorySimpleNav active="scrap" />
      </div>

      {/* Mobile Top AppBar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-outline-variant sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button className="text-on-surface">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="font-headline font-bold text-lg text-primary tracking-tight">
            Scrap Pool
          </h1>
        </div>
        <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container">
          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-on-surface-variant">
            RM
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8">
        {/* KPI Cards */}
        <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 mb-8 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-2 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0">
          {/* Card 1: Current Scrap Pool */}
          <div className="min-w-[280px] md:min-w-0 bg-primary-container p-5 rounded-xl text-on-primary shadow-md flex flex-col justify-between flex-shrink-0 snap-center">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-tertiary-fixed">layers</span>
              <span className="text-xs font-mono text-on-primary-container">Updated live</span>
            </div>
            <div>
              <p className="text-sm font-medium text-on-primary-container">
                Current Scrap Pool
              </p>
              <h3 className="text-3xl font-mono font-bold mt-1 tracking-tighter">
                {(data.current_kg).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}<span className="text-lg ml-1 font-normal opacity-70">kg</span>
              </h3>
            </div>
          </div>

          {/* Card 2: Estimated Value */}
          <div className="min-w-[280px] md:min-w-0 bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between flex-shrink-0 snap-center">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-on-tertiary-container">payments</span>
              <span className="text-xs font-mono text-on-tertiary-container">@ {formatTk(data.estimated_price_per_kg)}/kg</span>
            </div>
            <div>
              <p className="text-sm font-medium text-on-surface-variant">
                Estimated Value
              </p>
              <h3 className="text-3xl font-mono font-bold mt-1 tracking-tighter">
                {formatTk(data.estimated_value)}
              </h3>
            </div>
          </div>

          {/* Card 3: Last Scrap Sale */}
          <div className="min-w-[280px] md:min-w-0 bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between flex-shrink-0 snap-center">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-on-surface-variant">history</span>
              <span className="text-xs font-mono text-on-surface-variant">{data.last_sale_date ? formatDate(data.last_sale_date) : "No sales"}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-on-surface-variant">
                Last Scrap Sale
              </p>
              {data.days_since_last_sale !== null ? (
                <h3 className="text-3xl font-mono font-bold mt-1 tracking-tighter">
                  {data.days_since_last_sale}<span className="text-lg ml-1 font-normal opacity-70 text-on-surface-variant">days ago</span>
                </h3>
              ) : (
                <p className="text-lg font-medium text-on-surface-variant mt-1">No sales yet</p>
              )}
            </div>
            {data.last_sale_kg > 0 && (
              <div className="text-xs text-on-surface-variant font-mono mt-2">
                {formatKg(data.last_sale_kg)} sold
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Two-column split on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 md:gap-8">
          {/* Left: Scrap Movement History (60%) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg md:text-xl font-bold text-primary-container">
                Scrap Movement History
              </h3>
              {data.movements.length > 0 && (
                <span className="text-xs text-secondary font-mono">
                  {data.movements.length} entries
                </span>
              )}
            </div>

            {data.movements.length === 0 ? (
              <div className="bg-white rounded-lg border border-outline-variant/30 p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-outline-variant block mb-3">
                  history
                </span>
                <p className="text-sm text-secondary">No scrap movements yet</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block bg-white rounded-lg border border-outline-variant/30 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant/50">
                        <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">
                          Qty (kg)
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">
                          Reference
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider text-right">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {data.movements.map((m) => (
                        <tr
                          key={m.id}
                          className="hover:bg-[#f7f9fb] transition-colors"
                        >
                          <td className="px-4 py-4 font-mono text-xs text-secondary">
                            {formatDate(m.movement_date)}
                          </td>
                          <td className="px-4 py-4">
                            {m.movement_type === "in" ? (
                              <span className="bg-tertiary/10 text-tertiary px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-tighter">
                                Added
                              </span>
                            ) : (
                              <span className="bg-primary-container text-white px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-tighter">
                                Sold
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 font-mono font-medium text-sm">
                            <span
                              className={
                                m.movement_type === "in"
                                  ? "text-tertiary"
                                  : "text-error"
                              }
                            >
                              {m.movement_type === "in" ? "+" : "-"}
                              {m.quantity_kg.toLocaleString("en-IN", {
                                minimumFractionDigits: 3,
                                maximumFractionDigits: 3,
                              })}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs text-secondary truncate max-w-[140px]">
                            {m.note || (
                              <span className="italic opacity-60">
                                {m.movement_type === "in"
                                  ? "Period addition"
                                  : "Scrap sale"}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 font-mono text-sm font-bold text-right">
                            <span
                              className={
                                m.balance > 0
                                  ? "text-primary-container"
                                  : "text-secondary"
                              }
                            >
                              {m.balance.toLocaleString("en-IN", {
                                minimumFractionDigits: 3,
                                maximumFractionDigits: 3,
                              })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {data.movements.map((m) => (
                    <div
                      key={m.id}
                      className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-mono uppercase text-on-surface-variant tracking-widest">
                            {formatDate(m.movement_date)}
                          </p>
                          <h4 className="font-bold text-on-surface mt-0.5">
                            {m.note || (m.movement_type === "in" ? "Scrap Generation" : "Scrap Sale")}
                          </h4>
                        </div>
                        {m.movement_type === "in" ? (
                          <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold uppercase tracking-tighter">
                            ADDED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container text-[10px] font-bold uppercase tracking-tighter">
                            SOLD
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-outline-variant/30">
                        <div>
                          <p className="text-[10px] text-on-surface-variant uppercase">Quantity</p>
                          <p className={`font-mono font-bold ${m.movement_type === "in" ? "text-on-tertiary-container" : "text-error"}`}>
                            {m.movement_type === "in" ? "+" : "-"}{m.quantity_kg.toLocaleString("en-IN", {
                              minimumFractionDigits: 3,
                              maximumFractionDigits: 3,
                            })} kg
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-on-surface-variant uppercase text-right">Balance</p>
                          <p className="font-mono font-bold text-on-surface text-right">
                            {m.balance.toLocaleString("en-IN", {
                              minimumFractionDigits: 3,
                              maximumFractionDigits: 3,
                            })} kg
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: Add Scrap + Sell Scrap */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="font-display text-lg md:text-xl font-bold text-primary-container">Add Scrap</h3>
            <div className="bg-white p-6 rounded-lg border border-outline-variant/30 shadow-sm">
              <form onSubmit={handleAddScrap} className="space-y-5">
                {addScrapMsg && (
                  <div className={`p-3 rounded-md text-sm font-medium ${
                    addScrapMsg.type === "success" ? "bg-success/10 text-success" : "bg-error-container text-on-error-container"
                  }`}>
                    {addScrapMsg.text}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-wider">Quantity (kg)</label>
                  <input type="number" min="0" step="0.001" value={addScrapKg}
                    onChange={(e) => setAddScrapKg(e.target.value)} required placeholder="0.000"
                    inputMode="decimal" autoComplete="off" enterKeyHint="next"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-md font-mono text-sm py-2.5 px-3 focus:ring-1 focus:ring-primary-container focus:border-primary-container transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-wider">Date</label>
                  <input type="date" value={addScrapDate}
                    onChange={(e) => setAddScrapDate(e.target.value)} required
                    autoComplete="off" enterKeyHint="next"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-md text-sm py-2 px-3 focus:ring-1 focus:ring-primary-container focus:border-primary-container transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-wider">Note</label>
                  <textarea value={addScrapNote} onChange={(e) => setAddScrapNote(e.target.value)}
                    placeholder="Source of scrap..." rows={2}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-md text-sm py-2.5 px-3 focus:ring-1 focus:ring-primary-container focus:border-primary-container transition-all resize-none" />
                </div>
                <button type="submit" disabled={addingScrap}
                  className="w-full py-3 bg-tertiary text-white font-bold rounded-md hover:bg-tertiary/90 transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  {addingScrap ? "Adding..." : "Add Scrap"}
                </button>
              </form>
            </div>

            <Link
              href="/sales/scrap/new"
              className="flex items-center justify-center gap-2 w-full py-3 bg-primary-container text-white font-bold rounded-lg hover:bg-primary-container/90 transition-all active:scale-[0.98] text-center text-sm"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              Sell Scrap
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-24 right-6 z-40">
        <Link
          href="/sales/scrap/new"
          className="bg-primary text-on-primary h-14 pl-5 pr-6 rounded-full flex items-center gap-2 shadow-lg active:scale-95 duration-150"
        >
          <span className="material-symbols-outlined">add_shopping_cart</span>
          <span className="font-bold text-sm">+ Sell Scrap</span>
        </Link>
      </div>
    </>
  );
}
