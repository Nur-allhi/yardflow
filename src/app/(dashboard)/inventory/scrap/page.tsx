"use client";

import { useState } from "react";
import Link from "next/link";
import { InventoryNav } from "@/components/InventoryNav";
import { useQuery } from "@tanstack/react-query";

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
  const [addScrapKg, setAddScrapKg] = useState("");
  const [addScrapDate, setAddScrapDate] = useState(new Date().toISOString().split("T")[0]);
  const [addScrapNote, setAddScrapNote] = useState("");
  const [addingScrap, setAddingScrap] = useState(false);
  const [addScrapMsg, setAddScrapMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data, isLoading, error, refetch } = useQuery<ScrapData>({
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

  async function handleAddScrap(e: React.FormEvent) {
    e.preventDefault();
    if (!addScrapKg || Number(addScrapKg) <= 0) return;
    setAddingScrap(true);
    setAddScrapMsg(null);
    try {
      const res = await fetch("/api/inventory/scrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity_kg: Number(addScrapKg),
          movement_date: addScrapDate,
          note: addScrapNote || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add scrap");
      }
      setAddScrapMsg({ type: "success", text: "Scrap added successfully!" });
      setAddScrapKg("");
      setAddScrapNote("");
      refetch();
      setTimeout(() => setAddScrapMsg(null), 3000);
    } catch (err) {
      setAddScrapMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to add scrap" });
    } finally {
      setAddingScrap(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-[#e0e3e5] rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-[#eceef0] rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-[#eceef0] rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <span className="material-symbols-outlined text-4xl text-[#ba1a1a] block mb-3">
            error
          </span>
          <p className="text-[#ba1a1a] font-medium mb-2">Failed to load scrap pool</p>
          <p className="text-sm text-[#505f76] mb-4">{error?.message}</p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2 bg-[#0F172A] text-white font-semibold rounded-md hover:bg-[#0F172A]/90 transition-colors text-sm"
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
        <div className="text-center py-16 text-[#505f76]">
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
        <nav className="flex items-center gap-2 text-xs text-[#505f76] mb-2 font-medium tracking-wide uppercase">
          <Link href="/" className="hover:text-[#0F172A]">
            Dashboard
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link href="/inventory" className="hover:text-[#0F172A]">
            Inventory
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-[#0F172A] font-bold">Scrap Pool</span>
        </nav>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight mb-6">
          Scrap Pool
        </h1>

        <InventoryNav active="scrap" />
      </div>

      {/* Mobile Top AppBar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#c6c6cd] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button className="text-[#0F172A]">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="font-display text-lg font-bold text-[#0F172A]">
            Scrap Pool
          </h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#d0e1fb] flex items-center justify-center text-xs font-bold text-[#0F172A]">
          RM
        </div>
      </div>

      <div className="p-4 md:p-8">
        {/* KPI Cards */}
        <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 mb-8 overflow-x-auto hide-scrollbar pb-2 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0">
          {/* Card 1: Current Scrap Pool */}
          <div className="min-w-[180px] md:min-w-0 bg-white p-5 md:p-6 rounded-lg shadow-sm border border-[#c6c6cd]/30 flex flex-col justify-between flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[#505f76] text-xs md:text-sm font-medium">
                Current Scrap Pool
              </span>
              <span className="material-symbols-outlined text-[#059669] text-xl">
                database
              </span>
            </div>
            <div className="mt-3 md:mt-4">
              <span className="text-2xl md:text-4xl font-mono font-bold text-[#059669]">
                {(data.current_kg).toLocaleString("en-IN", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
              <span className="text-[#059669] font-medium ml-1 text-sm md:text-base">
                kg
              </span>
            </div>
            <div className="text-[10px] text-[#505f76] uppercase tracking-wider flex items-center gap-1 mt-2">
              <span className="material-symbols-outlined text-[12px] text-[#059669]">
                trending_up
              </span>
              Updated live
            </div>
          </div>

          {/* Card 2: Estimated Value */}
          <div className="min-w-[180px] md:min-w-0 bg-white p-5 md:p-6 rounded-lg shadow-sm border border-[#c6c6cd]/30 flex flex-col justify-between flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[#505f76] text-xs md:text-sm font-medium">
                Estimated Value
              </span>
              <span className="material-symbols-outlined text-[#505f76] text-xl">
                payments
              </span>
            </div>
            <div className="mt-3 md:mt-4">
              <span className="text-2xl md:text-4xl font-mono font-bold text-[#0F172A]">
                {formatTk(data.estimated_value)}
              </span>
            </div>
            <div className="text-xs md:text-sm text-[#505f76] font-mono bg-[#f2f4f6] px-2 py-0.5 rounded w-fit mt-2">
              @ {formatTk(data.estimated_price_per_kg)}/kg
            </div>
          </div>

          {/* Card 3: Last Scrap Sale */}
          <div className="min-w-[180px] md:min-w-0 bg-white p-5 md:p-6 rounded-lg shadow-sm border border-[#c6c6cd]/30 flex flex-col justify-between flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[#505f76] text-xs md:text-sm font-medium">
                Last Scrap Sale
              </span>
              <span className="material-symbols-outlined text-[#505f76] text-xl">
                history
              </span>
            </div>
            <div className="mt-3 md:mt-4">
              {data.days_since_last_sale !== null ? (
                <>
                  <span className="text-2xl md:text-4xl font-mono font-bold text-[#0F172A]">
                    {data.days_since_last_sale}
                  </span>
                  <span className="text-[#505f76] font-medium ml-1 text-sm md:text-base">
                    days ago
                  </span>
                </>
              ) : (
                <span className="text-lg md:text-xl font-medium text-[#505f76]">
                  No sales yet
                </span>
              )}
            </div>
            {data.last_sale_kg > 0 && (
              <div className="text-xs md:text-sm text-[#505f76] flex items-center gap-2 mt-2">
                <span className="font-mono">{formatKg(data.last_sale_kg)} sold</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Two-column split on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 md:gap-8">
          {/* Left: Scrap Movement History (60%) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg md:text-xl font-bold text-[#0F172A]">
                Scrap Movement History
              </h3>
              {data.movements.length > 0 && (
                <span className="text-xs text-[#505f76] font-mono">
                  {data.movements.length} entries
                </span>
              )}
            </div>

            {data.movements.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#c6c6cd]/30 p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-[#c6c6cd] block mb-3">
                  history
                </span>
                <p className="text-sm text-[#505f76]">No scrap movements yet</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block bg-white rounded-lg border border-[#c6c6cd]/30 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f2f4f6] border-b border-[#c6c6cd]/50">
                        <th className="px-4 py-3 text-xs font-bold text-[#505f76] uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-[#505f76] uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-[#505f76] uppercase tracking-wider">
                          Qty (kg)
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-[#505f76] uppercase tracking-wider">
                          Reference
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-[#505f76] uppercase tracking-wider text-right">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c6c6cd]/20">
                      {data.movements.map((m) => (
                        <tr
                          key={m.id}
                          className="hover:bg-[#f7f9fb] transition-colors"
                        >
                          <td className="px-4 py-4 font-mono text-xs text-[#505f76]">
                            {formatDate(m.movement_date)}
                          </td>
                          <td className="px-4 py-4">
                            {m.movement_type === "in" ? (
                              <span className="bg-[#059669]/10 text-[#059669] px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-tighter">
                                Added
                              </span>
                            ) : (
                              <span className="bg-[#0F172A] text-white px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-tighter">
                                Sold
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 font-mono font-medium text-sm">
                            <span
                              className={
                                m.movement_type === "in"
                                  ? "text-[#059669]"
                                  : "text-[#ba1a1a]"
                              }
                            >
                              {m.movement_type === "in" ? "+" : "-"}
                              {m.quantity_kg.toLocaleString("en-IN", {
                                minimumFractionDigits: 3,
                                maximumFractionDigits: 3,
                              })}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs text-[#505f76] truncate max-w-[140px]">
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
                                  ? "text-[#0F172A]"
                                  : "text-[#505f76]"
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
                      className="bg-white p-4 rounded-xl border border-[#c6c6cd]/30 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-mono text-xs text-[#505f76]">
                          {formatDate(m.movement_date)}
                        </span>
                        {m.movement_type === "in" ? (
                          <span className="bg-[#059669]/10 text-[#059669] px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-tighter">
                            Added
                          </span>
                        ) : (
                          <span className="bg-[#0F172A] text-white px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-tighter">
                            Sold
                          </span>
                        )}
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-lg font-mono font-bold">
                            <span
                              className={
                                m.movement_type === "in"
                                  ? "text-[#059669]"
                                  : "text-[#ba1a1a]"
                              }
                            >
                              {m.movement_type === "in" ? "+" : "-"}
                              {m.quantity_kg.toLocaleString("en-IN", {
                                minimumFractionDigits: 3,
                                maximumFractionDigits: 3,
                              })}
                            </span>
                          </p>
                          <p className="text-[10px] text-[#505f76] mt-0.5">
                            {m.note ||
                              (m.movement_type === "in"
                                ? "Period addition"
                                : "Scrap sale")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-[#505f76] uppercase tracking-wider font-medium">
                            Balance
                          </p>
                          <p className="font-mono text-sm font-bold text-[#0F172A]">
                            {m.balance.toLocaleString("en-IN", {
                              minimumFractionDigits: 3,
                              maximumFractionDigits: 3,
                            })}{" "}
                            kg
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: Add Scrap Card */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="font-display text-lg md:text-xl font-bold text-[#0F172A]">Add Scrap</h3>
            <div className="bg-white p-6 rounded-lg border border-[#c6c6cd]/30 shadow-sm">
              <form onSubmit={handleAddScrap} className="space-y-5">
                {addScrapMsg && (
                  <div className={`p-3 rounded-md text-sm font-medium ${
                    addScrapMsg.type === "success" ? "bg-[#22C55E]/10 text-[#16A34A]" : "bg-[#ffdad6] text-[#93000a]"
                  }`}>
                    {addScrapMsg.text}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#505f76] uppercase tracking-wider">Quantity (kg)</label>
                  <input type="number" min="0" step="0.001" value={addScrapKg}
                    onChange={(e) => setAddScrapKg(e.target.value)} required placeholder="0.000"
                    className="w-full bg-[#f2f4f6] border border-[#c6c6cd] rounded-md font-mono text-sm py-2.5 px-3 focus:ring-1 focus:ring-[#0F172A] focus:border-[#0F172A] transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#505f76] uppercase tracking-wider">Date</label>
                  <input type="date" value={addScrapDate}
                    onChange={(e) => setAddScrapDate(e.target.value)} required
                    className="w-full bg-[#f2f4f6] border border-[#c6c6cd] rounded-md text-sm py-2 px-3 focus:ring-1 focus:ring-[#0F172A] focus:border-[#0F172A] transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#505f76] uppercase tracking-wider">Note</label>
                  <textarea value={addScrapNote} onChange={(e) => setAddScrapNote(e.target.value)}
                    placeholder="Source of scrap..." rows={2}
                    className="w-full bg-[#f2f4f6] border border-[#c6c6cd] rounded-md text-sm py-2.5 px-3 focus:ring-1 focus:ring-[#0F172A] focus:border-[#0F172A] transition-all resize-none" />
                </div>
                <button type="submit" disabled={addingScrap}
                  className="w-full py-3 bg-[#059669] text-white font-bold rounded-md hover:bg-[#059669]/90 transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  {addingScrap ? "Adding..." : "Add Scrap"}
                </button>
              </form>
            </div>
          </div>

          {/* Right: New Scrap Sale Card (40%) */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="font-display text-lg md:text-xl font-bold text-[#0F172A]">
              New Scrap Sale
            </h3>
            <div className="bg-white p-6 rounded-lg border border-[#c6c6cd]/30 shadow-sm">
              <div className="space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-dashed border-[#c6c6cd]/50">
                  <span className="w-12 h-12 rounded-full bg-[#059669]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#059669] text-2xl">
                      sell
                    </span>
                  </span>
                  <div>
                    <p className="font-display font-semibold text-[#0F172A]">
                      Quick Scrap Sale
                    </p>
                    <p className="text-xs text-[#505f76]">
                      Sell accumulated scrap in bulk
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#f2f4f6] rounded-lg p-3">
                    <p className="text-[10px] uppercase font-bold text-[#505f76] tracking-wider mb-1">
                      Available
                    </p>
                    <p className="font-mono font-bold text-[#059669]">
                      {data.current_kg.toLocaleString("en-IN", {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      })}{" "}
                      kg
                    </p>
                  </div>
                  <div className="bg-[#f2f4f6] rounded-lg p-3">
                    <p className="text-[10px] uppercase font-bold text-[#505f76] tracking-wider mb-1">
                      Est. Price
                    </p>
                    <p className="font-mono font-bold text-[#0F172A]">
                      {formatTk(data.estimated_price_per_kg)}/kg
                    </p>
                  </div>
                </div>

                <div className="bg-[#059669]/5 border border-[#059669]/20 rounded-lg p-4">
                  <p className="text-xs text-[#505f76] mb-1">
                    Estimated Total Value
                  </p>
                  <p className="text-xl font-mono font-bold text-[#059669]">
                    {formatTk(data.estimated_value)}
                  </p>
                </div>

                <Link
                  href="/sales/scrap/new"
                  className="block w-full py-3 bg-[#0F172A] text-white font-bold rounded-lg hover:bg-[#0F172A]/90 transition-all active:scale-[0.98] text-center text-sm"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">
                      add_circle
                    </span>
                    Sell Scrap
                  </span>
                </Link>

                <p className="text-[10px] text-center text-[#505f76]">
                  You will be redirected to the scrap sale form
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-20 right-6 z-40">
        <Link
          href="/sales/scrap/new"
          className="w-14 h-14 rounded-full bg-[#0F172A] text-white flex items-center justify-center shadow-lg hover:bg-[#0F172A]/90 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-2xl">add</span>
        </Link>
      </div>
    </>
  );
}
