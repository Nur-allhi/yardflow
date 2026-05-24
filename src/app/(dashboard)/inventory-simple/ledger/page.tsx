"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumb";
import { InventorySimpleNav } from "@/components/InventorySimpleNav";

interface Movement {
  id: string;
  organization_id: string;
  movement_type: "in" | "out";
  quantity_kg: number;
  price_per_kg: number | null;
  total_value: number | null;
  reference_type: string;
  reference_id: string | null;
  description: string | null;
  movement_date: string;
  note: string | null;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

interface MovementsResponse {
  data: Movement[];
  pagination: Pagination;
}

function formatTk(amount: number): string {
  return amount.toLocaleString("en-IN") + " tk";
}

function formatKg(kg: number): string {
  return kg.toFixed(3) + " kg";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-4"><div className="h-3 w-20 bg-surface-container-highest rounded" /></td>
      <td className="px-4 py-4"><div className="h-5 w-10 bg-surface-container-highest rounded" /></td>
      <td className="px-4 py-4"><div className="h-3 w-24 bg-surface-container-highest rounded" /></td>
      <td className="px-4 py-4"><div className="h-3 w-16 bg-surface-container-highest rounded" /></td>
      <td className="px-4 py-4"><div className="h-3 w-20 bg-surface-container-highest rounded" /></td>
      <td className="px-4 py-4"><div className="h-3 w-32 bg-surface-container-highest rounded" /></td>
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-outline-variant/30 p-4 animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-3 w-24 bg-surface-container-highest rounded" />
        <div className="h-5 w-12 bg-surface-container-highest rounded" />
      </div>
      <div className="h-4 w-32 bg-surface-container-highest rounded" />
      <div className="flex justify-between pt-2 border-t border-outline-variant/30">
        <div className="h-3 w-16 bg-surface-container-highest rounded" />
        <div className="h-3 w-20 bg-surface-container-highest rounded" />
      </div>
    </div>
  );
}

export default function LedgerPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", "20");
  if (typeFilter) queryParams.set("type", typeFilter);
  if (fromDate) queryParams.set("from", fromDate);
  if (toDate) queryParams.set("to", toDate);

  const { data, isLoading, error, refetch } = useQuery<MovementsResponse>({
    queryKey: ["simple-movements", page, typeFilter, fromDate, toDate],
    queryFn: async () => {
      const res = await fetch(`/api/simple/movements?${queryParams.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load movements");
      }
      return res.json();
    },
  });

  const totalPages = data ? Math.ceil(data.pagination.total / data.pagination.limit) : 1;

  function handleFilterChange() {
    setPage(1);
  }

  return (
    <div className="p-4 md:p-8">
      <div className="hidden md:block">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Inventory", href: "/inventory-simple" },
            { label: "Ledger", href: null },
          ]}
        />
        <h1 className="font-display text-[2rem] font-bold text-primary-container tracking-tight">
          Movement Ledger
        </h1>
      </div>

      <InventorySimpleNav active="ledger" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); handleFilterChange(); }}
          className="h-10 px-3 border border-outline-variant rounded-lg text-sm bg-white font-medium"
        >
          <option value="">All Types</option>
          <option value="in">In</option>
          <option value="out">Out</option>
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => { setFromDate(e.target.value); handleFilterChange(); }}
          placeholder="From"
          className="h-10 px-3 border border-outline-variant rounded-lg text-sm bg-white font-medium"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => { setToDate(e.target.value); handleFilterChange(); }}
          placeholder="To"
          className="h-10 px-3 border border-outline-variant rounded-lg text-sm bg-white font-medium"
        />
        {(typeFilter || fromDate || toDate) && (
          <button
            onClick={() => { setTypeFilter(""); setFromDate(""); setToDate(""); setPage(1); }}
            className="h-10 px-4 border border-error/30 text-error rounded-lg text-sm font-medium hover:bg-error/5 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center mb-6">
          <span className="material-symbols-outlined text-4xl text-error block mb-3">
            error
          </span>
          <p className="text-error font-medium mb-2">Failed to load movements</p>
          <p className="text-sm text-secondary mb-4">{error?.message}</p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2 bg-primary-container text-white font-semibold rounded-md hover:bg-primary-container/90 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div>
          <div className="hidden md:block bg-white rounded-lg border border-outline-variant/30 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/50">
                  <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Price/kg</th>
                  <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && data && data.data.length === 0 && (
        <div className="bg-white rounded-lg border border-outline-variant/30 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-secondary block mb-4">
            swap_vert
          </span>
          <p className="text-lg font-medium text-secondary mb-1">No movements found</p>
          <p className="text-sm text-secondary">
            {typeFilter || fromDate || toDate
              ? "Try adjusting your filters"
              : "Movements will appear here once inventory is recorded"}
          </p>
        </div>
      )}

      {/* Data Table (Desktop) */}
      {!isLoading && !error && data && data.data.length > 0 && (
        <>
          <div className="hidden md:block bg-white rounded-lg border border-outline-variant/30 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/50">
                  <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Price/kg</th>
                  <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {data.data.map((m) => {
                  const qty = Number(m.quantity_kg);
                  const price = m.price_per_kg ?? 0;
                  const total = m.total_value ?? qty * price;
                  return (
                    <tr key={m.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-4 py-4 font-mono text-xs text-secondary">
                        {formatDate(m.movement_date)}
                      </td>
                      <td className="px-4 py-4">
                        {m.movement_type === "in" ? (
                          <span className="bg-success/10 text-success px-2 py-0.5 rounded text-xs font-bold uppercase">
                            In
                          </span>
                        ) : (
                          <span className="bg-error/10 text-error px-2 py-0.5 rounded text-xs font-bold uppercase">
                            Out
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 font-mono text-sm">
                        <span className={m.movement_type === "in" ? "text-success" : "text-error"}>
                          {m.movement_type === "in" ? "+" : "-"}{formatKg(qty)}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-sm text-secondary">
                        {price > 0 ? formatTk(price) : "—"}
                      </td>
                      <td className="px-4 py-4 font-mono text-sm font-semibold text-primary-container">
                        {formatTk(total)}
                      </td>
                      <td className="px-4 py-4 text-xs text-secondary italic max-w-[200px] truncate">
                        {m.note || m.description || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {data.data.map((m) => {
              const qty = Number(m.quantity_kg);
              const price = m.price_per_kg ?? 0;
              const total = m.total_value ?? qty * price;
              return (
                <div
                  key={m.id}
                  className="bg-white rounded-lg border border-outline-variant/30 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-secondary">
                      {formatDate(m.movement_date)}
                    </span>
                    {m.movement_type === "in" ? (
                      <span className="bg-success/10 text-success px-2 py-0.5 rounded text-xs font-bold uppercase">
                        In
                      </span>
                    ) : (
                      <span className="bg-error/10 text-error px-2 py-0.5 rounded text-xs font-bold uppercase">
                        Out
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-mono text-sm font-bold">
                      <span className={m.movement_type === "in" ? "text-success" : "text-error"}>
                        {m.movement_type === "in" ? "+" : "-"}{formatKg(qty)}
                      </span>
                    </span>
                    <span className="font-mono text-sm font-semibold text-primary-container">
                      {formatTk(total)}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-secondary">
                      {price > 0 ? `${formatTk(price)}/kg` : ""}
                    </span>
                    <span className="text-xs text-secondary italic truncate ml-2">
                      {m.note || m.description || ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-secondary">
              Showing {data.data.length} of {data.pagination.total} movements
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 border border-outline-variant rounded-lg bg-white text-sm font-medium hover:bg-surface-container-low transition-colors disabled:opacity-30"
              >
                Previous
              </button>
              <span className="flex items-center text-xs text-secondary px-2">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 border border-outline-variant rounded-lg bg-white text-sm font-medium hover:bg-surface-container-low transition-colors disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
