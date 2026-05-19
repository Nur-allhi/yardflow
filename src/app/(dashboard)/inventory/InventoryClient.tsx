"use client";

import { useState } from "react";
import Link from "next/link";

interface Subtype {
  id: string;
  name: string;
  current_stock_kg: number;
  wac: number;
  default_price_per_kg: string | null;
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
  total_stock_kg: number;
  total_stock_value: number;
  scrap_pool_kg: number;
}

function getStatusInfo(kg: number) {
  if (kg <= 0) return { label: "Out of Stock", color: "bg-error/10 text-error", dot: "bg-error", badgeBg: "bg-error/10 text-error border border-error/20" };
  if (kg < 1000) return { label: "Low Stock", color: "bg-warning/10 text-warning", dot: "bg-warning animate-pulse", badgeBg: "bg-warning/10 text-warning border border-warning/20" };
  return { label: "In Stock", color: "bg-success/10 text-success", dot: "bg-success", badgeBg: "bg-[#059669]/10 text-[#059669] border border-[#059669]/20" };
}

function formatTk(amount: number): string {
  if (amount === 0) return "৳0";
  const num = Math.round(amount).toString();
  const last3 = num.slice(-3);
  const rest = num.slice(0, -3);
  const lakhFormatted = rest ? `${rest},${last3}` : last3;
  return `৳${lakhFormatted}`;
}

function formatKg(kg: number): string {
  return `${kg.toLocaleString("en-IN")} kg`;
}

const tabs = [
  { key: "stock", label: "Stock Overview" },
  { key: "categories", label: "Categories" },
  { key: "subtypes", label: "Sub-types" },
  { key: "scrap", label: "Scrap Pool" },
  { key: "consumables", label: "Consumables" },
];

function CategorySection({
  category,
  defaultOpen,
}: {
  category: Category;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="bg-white rounded-lg shadow-sm border border-[#c6c6cd]/30 overflow-hidden mb-6">
      <header
        className="px-6 py-5 bg-[#f2f4f6] hidden md:flex justify-between items-center cursor-pointer hover:bg-[#eceef0] transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-4">
          <span
            className={`material-symbols-outlined text-[#0F172A] transition-transform duration-300 ${
              open ? "rotate-0" : "-rotate-90"
            }`}
          >
            expand_more
          </span>
          <h3 className="font-display font-bold text-lg text-[#0F172A]">
            {category.name}
          </h3>
          <span className="px-2 py-0.5 bg-[#0F172A]/5 text-[#0F172A] text-[11px] font-bold rounded uppercase tracking-wider">
            {category.description || "Category"}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs text-[#505f76] uppercase font-medium block">
              Total Weight
            </span>
            <span className="font-mono font-bold text-[#0F172A] text-lg">
              {formatKg(category.total_weight)}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-[#c6c6cd]" />
          <div className="text-right">
            <span className="text-xs text-[#505f76] uppercase font-medium block">
              Total Value
            </span>
            <span className="font-mono font-bold text-[#0F172A] text-lg">
              {formatTk(category.total_value)}
            </span>
          </div>
        </div>
      </header>

      {/* Mobile: category header inline */}
      <div className="md:hidden px-4 py-3 bg-[#f2f4f6] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 bg-[#0F172A] rounded-full" />
          <h3 className="font-display font-bold text-[#0F172A]">{category.name}</h3>
        </div>
        <Link href="/inventory/subtypes" className="text-[#059669] text-xs font-bold uppercase">
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
                  <tr className="bg-white border-y border-[#c6c6cd]/40">
                    <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider">Sub-type</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider">Current Stock</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider">WAC (tk/kg)</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider">Stock Value</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c6c6cd]/20">
                  {category.subtypes.map((st) => {
                    const status = getStatusInfo(st.current_stock_kg);
                    return (
                      <tr key={st.id} className="hover:bg-[#f2f4f6] transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#0F172A]">{st.name}</div>
                          <div className="text-xs text-[#505f76]">ID: {st.id.slice(0, 8)}</div>
                        </td>
                        <td className="px-6 py-4 font-mono font-medium text-[#0F172A]">{formatKg(st.current_stock_kg)}</td>
                        <td className="px-6 py-4 font-mono text-[#505f76]">৳{st.wac.toFixed(2)}</td>
                        <td className="px-6 py-4 font-mono font-bold text-[#0F172A]">{formatTk(st.wac * st.current_stock_kg)}</td>
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
                <div key={st.id} className="bg-white p-4 rounded-xl border border-[#c6c6cd]/30 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-display font-semibold text-sm text-[#0F172A]">{st.name}</h3>
                    <span className={`px-2 py-0.5 rounded-sm ${status.badgeBg} text-[10px] font-bold uppercase tracking-tight`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[#505f76] text-[10px] uppercase font-bold tracking-widest mb-0.5">Current Stock</p>
                      <p className="font-mono text-xl md:text-2xl text-[#0F172A] font-medium tracking-tighter">
                        {st.current_stock_kg.toLocaleString("en-IN")} <span className="text-sm font-normal">kg</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#505f76] text-[10px] uppercase font-bold tracking-widest mb-0.5">WAC</p>
                      <p className="font-mono text-sm text-[#505f76]">৳{st.wac.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {open && category.subtypes.length === 0 && (
        <div className="hidden md:block px-6 py-8 text-center text-[#505f76] text-sm">
          No sub-types in this category yet
        </div>
      )}
    </section>
  );
}

export function InventoryClient({ data }: { data: StockData | null }) {
  const [activeTab, setActiveTab] = useState("stock");

  if (!data) {
    return (
      <div className="text-center py-16 text-[#505f76]">
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
        <div className="bg-white p-3 md:p-6 rounded-lg md:rounded-lg shadow-sm border border-[#c6c6cd]/30">
          <p className="text-[#505f76] text-[10px] md:text-sm font-medium mb-1 uppercase tracking-wider md:normal-case">
            Total Stock
          </p>
          <div className="flex items-baseline gap-1 md:gap-2 mt-1 md:mt-2">
            <h2 className="text-lg md:text-3xl font-bold font-display text-[#0F172A]">
              {data.total_stock_kg.toLocaleString("en-IN")}
            </h2>
            <span className="text-[10px] md:text-sm text-[#505f76] font-mono">kg</span>
          </div>
        </div>
        <div className="bg-white p-3 md:p-6 rounded-lg md:rounded-lg shadow-sm border border-[#c6c6cd]/30">
          <p className="text-[#505f76] text-[10px] md:text-sm font-medium mb-1 uppercase tracking-wider md:normal-case">
            Total Value
          </p>
          <div className="flex items-baseline gap-1 mt-1 md:mt-2">
            <span className="text-sm md:text-xl font-bold text-[#0F172A]">৳</span>
            <h2 className="text-lg md:text-3xl font-bold font-display text-[#0F172A]">
              {data.total_stock_value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </h2>
          </div>
        </div>
        <div className="bg-white p-3 md:p-6 rounded-lg md:rounded-lg shadow-sm border border-[#c6c6cd]/30">
          <p className="text-[#505f76] text-[10px] md:text-sm font-medium mb-1 uppercase tracking-wider md:normal-case">
            Scrap Pool
          </p>
          <div className="flex items-baseline gap-1 mt-1 md:mt-2">
            <h2 className="text-lg md:text-3xl font-bold font-display text-[#0F172A]">
              {data.scrap_pool_kg.toLocaleString("en-IN")}
            </h2>
            <span className="text-[10px] md:text-sm text-[#505f76] font-mono">kg</span>
          </div>
        </div>
        <div className="bg-[#ffdad6] p-3 md:p-6 rounded-lg md:rounded-lg shadow-sm border border-[#ba1a1a]/20">
          <p className="text-[#93000a] text-[10px] md:text-sm font-bold mb-1 uppercase tracking-wider md:normal-case">
            Low Alerts
          </p>
          <div className="flex items-center gap-1 md:gap-3 mt-1 md:mt-2">
            <span className="material-symbols-outlined text-[#ba1a1a] text-lg md:text-2xl">warning</span>
            <h2 className="text-lg md:text-3xl font-bold font-display text-[#93000a]">
              {String(lowStockCount).padStart(2, "0")}
            </h2>
          </div>
        </div>
      </div>

      {/* Desktop: Text Tabs Sub-navigation */}
      <div className="hidden md:flex border-b border-[#c6c6cd] mb-8 gap-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 border-b-2 text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "border-[#059669] text-[#059669] font-bold"
                : "border-transparent text-[#505f76] hover:text-[#0F172A] font-medium"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile: Horizontal Scrollable Pill Tabs */}
      <div className="md:hidden flex gap-2 overflow-x-auto py-4 -mx-4 px-4 sticky top-0 bg-[#F8FAFC] z-30 hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-[#002114] text-[#059669] font-bold shadow-sm border border-[#059669]"
                : "bg-[#eceef0] text-[#505f76] hover:bg-[#e0e3e5]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "stock" && (
        <>
          {data.categories.length === 0 ? (
            <div className="text-center py-16 text-[#505f76]">
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
      )}

      {activeTab === "categories" && (
        <div className="text-center py-16 text-[#505f76]">
          <p className="text-lg font-medium mb-2">Category Management</p>
          <Link
            href="/inventory/categories"
            className="text-[#059669] hover:underline text-sm"
          >
            Go to Categories
          </Link>
        </div>
      )}

      {activeTab === "subtypes" && (
        <div className="text-center py-16 text-[#505f76]">
          <p className="text-lg font-medium mb-2">Sub-type Management</p>
          <Link
            href="/inventory/subtypes"
            className="text-[#059669] hover:underline text-sm"
          >
            Go to Sub-types
          </Link>
        </div>
      )}

      {activeTab === "scrap" && (
        <div className="text-center py-16 text-[#505f76]">
          <span className="material-symbols-outlined text-5xl block mb-4">
            recycling
          </span>
          <p className="text-lg font-medium mb-2">Scrap Pool</p>
          <p className="text-sm">{data.scrap_pool_kg.toLocaleString("en-IN")} kg accumulated</p>
        </div>
      )}

      {activeTab === "consumables" && (
        <div className="text-center py-16 text-[#505f76]">
          <span className="material-symbols-outlined text-5xl block mb-4">
            inventory
          </span>
          <p className="text-lg font-medium mb-2">Consumables</p>
          <p className="text-sm">Coming soon</p>
        </div>
      )}
    </>
  );
}
