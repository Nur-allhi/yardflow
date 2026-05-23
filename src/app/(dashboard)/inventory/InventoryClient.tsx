"use client";

import { useState } from "react";
import Link from "next/link";

interface Subtype {
  id: string;
  name: string;
  current_stock_kg: number;
  wac: number;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  subtypes: Subtype[];
  total_weight: number;
  total_value: number;
}

interface StockData {
  categories: Category[];
  total_stock_kg: number | null;
  total_stock_value: number | null;
  scrap_pool_kg: number | null;
}

function getStatusInfo(kg: number) {
  if (kg <= 0) return { label: "Out of Stock", color: "bg-error/10 text-error", dot: "bg-error", badgeBg: "bg-error/10 text-error border border-error/20" };
  if (kg < 1000) return { label: "Low Stock", color: "bg-warning/10 text-warning", dot: "bg-warning animate-pulse", badgeBg: "bg-warning/10 text-warning border border-warning/20" };
  return { label: "In Stock", color: "bg-success/10 text-success", dot: "bg-success", badgeBg: "bg-on-tertiary-container/10 text-on-tertiary-container border border-on-tertiary-container/20" };
}

function formatTk(amount: number | null | undefined): string {
  const val = amount ?? 0;
  if (val === 0) return "৳0";
  const num = Math.round(val).toString();
  const last3 = num.slice(-3);
  const rest = num.slice(0, -3);
  const lakhFormatted = rest ? `${rest},${last3}` : last3;
  return `৳${lakhFormatted}`;
}

function formatKg(kg: number | null | undefined): string {
  return `${(kg ?? 0).toLocaleString("en-IN")} kg`;
}

function CategorySection({
  category,
  defaultOpen,
}: {
  category: Category;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="bg-white rounded-lg shadow-sm border border-outline-variant/30 overflow-hidden mb-6">
      <header
        className="px-6 py-5 bg-surface-container-low hidden md:flex justify-between items-center cursor-pointer hover:bg-surface-container transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-4">
          <span
            className={`material-symbols-outlined text-primary-container transition-transform duration-300 ${
              open ? "rotate-0" : "-rotate-90"
            }`}
          >
            expand_more
          </span>
          <h3 className="font-display font-bold text-lg text-primary-container">
            {category.name}
          </h3>
          <span className="px-2 py-0.5 bg-primary-container/5 text-primary-container text-[11px] font-bold rounded uppercase tracking-wider">
            {category.description || "Category"}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs text-secondary uppercase font-medium block">
              Total Weight
            </span>
            <span className="font-mono font-bold text-primary-container text-lg">
              {formatKg(category.total_weight)}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-outline-variant" />
          <div className="text-right">
            <span className="text-xs text-secondary uppercase font-medium block">
              Total Value
            </span>
            <span className="font-mono font-bold text-primary-container text-lg">
              {formatTk(category.total_value)}
            </span>
          </div>
        </div>
      </header>

      {/* Mobile: category header inline */}
      <div className="md:hidden flex items-center justify-between mb-3 px-4 pt-2">
        <h2 className="font-display font-semibold text-on-surface flex items-center gap-2">
          <span className="w-1 h-5 bg-primary rounded-full" />
          {category.name}
        </h2>
        <Link href="/inventory/subtypes" className="text-on-tertiary-container text-xs font-bold uppercase">
          View All
        </Link>
      </div>

      {category.subtypes.length > 0 && (
        <>
          {/* Desktop table */}
          {open && (
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-y border-outline-variant/40">
                    <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">Sub-type</th>
                    <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">Current Stock</th>
                    <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">WAC (tk/kg)</th>
                    <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">Stock Value</th>
                    <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {category.subtypes.map((st) => {
                    const status = getStatusInfo(st.current_stock_kg);
                    return (
                      <tr key={st.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-primary-container">{st.name}</div>
                          <div className="text-xs text-secondary">ID: {st.id.slice(0, 8)}</div>
                        </td>
                        <td className="px-6 py-4 font-mono font-medium text-primary-container">{formatKg(st.current_stock_kg)}</td>
                        <td className="px-6 py-4 font-mono text-secondary">৳{st.wac.toFixed(2)}</td>
                        <td className="px-6 py-4 font-mono font-bold text-primary-container">{formatTk(st.wac * st.current_stock_kg)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 ${status.color} text-[11px] font-bold rounded-full uppercase`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile cards */}
          <div className="md:hidden grid grid-cols-1 gap-3 p-3">
            {category.subtypes.map((st) => {
              const status = getStatusInfo(st.current_stock_kg);
              return (
                <div key={st.id} className="bg-surface p-4 rounded-xl border border-outline-variant shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-display font-semibold text-sm text-primary">{st.name}</h3>
                    <span className={`px-2 py-0.5 rounded-sm ${status.badgeBg} text-[10px] font-bold uppercase tracking-tight`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest mb-0.5">Current Stock</p>
                      <p className="font-mono text-xl md:text-2xl text-primary font-medium tracking-tighter">
                        {st.current_stock_kg.toLocaleString("en-IN")} <span className="text-sm font-normal">kg</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest mb-0.5">WAC</p>
                      <p className="font-mono text-sm text-on-surface-variant">৳{st.wac.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {open && category.subtypes.length === 0 && (
        <div className="hidden md:block px-6 py-8 text-center text-secondary text-sm">
          No sub-types in this category yet
        </div>
      )}
    </section>
  );
}

export function InventoryClient({ data }: { data: StockData | null }) {
  if (!data) {
    return (
      <div className="text-center py-16 text-secondary">
        <span className="material-symbols-outlined text-5xl block mb-4">
          inventory_2
        </span>
        <p>Could not load inventory data</p>
      </div>
    );
  }

  const lowStockCount = data.categories.reduce((count, cat) => {
    return (
      count +
      cat.subtypes.filter((st) => st.current_stock_kg > 0 && st.current_stock_kg < 1000).length
    );
  }, 0);

  return (
    <>
      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-10">
        <div className="bg-surface-container-lowest p-3 md:p-6 rounded-lg md:rounded-lg border border-outline-variant shadow-sm">
          <p className="text-on-surface-variant text-[10px] md:text-sm font-medium mb-1 uppercase tracking-wider md:normal-case">
            Total Stock
          </p>
          <div className="flex items-baseline gap-1 md:gap-2 mt-1 md:mt-2">
            <h2 className="text-lg md:text-3xl font-bold font-display text-primary">
              {(data.total_stock_kg ?? 0).toLocaleString("en-IN")}
            </h2>
            <span className="text-[10px] md:text-sm text-on-surface-variant font-mono">kg</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-3 md:p-6 rounded-lg md:rounded-lg border border-outline-variant shadow-sm">
          <p className="text-on-surface-variant text-[10px] md:text-sm font-medium mb-1 uppercase tracking-wider md:normal-case">
            Total Value
          </p>
          <div className="flex items-baseline gap-1 mt-1 md:mt-2">
            <span className="text-sm md:text-xl font-bold text-primary">৳</span>
            <h2 className="text-lg md:text-3xl font-bold font-display text-primary">
              {(data.total_stock_value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </h2>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-3 md:p-6 rounded-lg md:rounded-lg border border-outline-variant shadow-sm">
          <p className="text-on-surface-variant text-[10px] md:text-sm font-medium mb-1 uppercase tracking-wider md:normal-case">
            Scrap Pool
          </p>
          <div className="flex items-baseline gap-1 mt-1 md:mt-2">
            <h2 className="text-lg md:text-3xl font-bold font-display text-primary">
              {(data.scrap_pool_kg ?? 0).toLocaleString("en-IN")}
            </h2>
            <span className="text-[10px] md:text-sm text-on-surface-variant font-mono">kg</span>
          </div>
        </div>
        <div className="bg-error-container p-3 md:p-6 rounded-lg md:rounded-lg shadow-sm border border-error/20">
          <p className="text-on-error-container text-[10px] md:text-sm font-bold mb-1 uppercase tracking-wider md:normal-case">
            Low Alerts
          </p>
          <div className="flex items-center gap-1 md:gap-3 mt-1 md:mt-2">
            <span className="material-symbols-outlined text-error text-lg md:text-2xl">warning</span>
            <h2 className="text-lg md:text-3xl font-bold font-display text-on-error-container">
              {String(lowStockCount).padStart(2, "0")}
            </h2>
          </div>
        </div>
      </div>

      {/* Stock Content */}
      {data.categories.length === 0 ? (
        <div className="text-center py-16 text-secondary">
          <span className="material-symbols-outlined text-5xl block mb-4">
            category
          </span>
          <p className="text-lg font-medium mb-2">No inventory yet</p>
          <p className="text-sm">
            Start by adding a category and sub-type above
          </p>
        </div>
      ) : (
        data.categories.map((cat, i) => (
          <CategorySection
            key={cat.id}
            category={cat}
            defaultOpen={i === 0}
          />
        ))
      )}
    </>
  );
}
