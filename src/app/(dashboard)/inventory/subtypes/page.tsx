"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface Subtype {
  id: string;
  name: string;
  category_id: string;
  default_price_per_kg: string | null;
  unit: string | null;
  is_active: boolean;
  current_stock_kg: number;
  wac: number;
}

export default function SubtypesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subtypes, setSubtypes] = useState<Subtype[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("kg");
  const [loading, setLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/inventory/categories");
    if (res.ok) {
      const data = await res.json();
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategoryId((prev) => prev || data[0].id);
      }
    }
  }, []);

  const loadSubtypes = useCallback(async () => {
    if (!selectedCategoryId) return;
    const res = await fetch(`/api/inventory/subtypes?category_id=${selectedCategoryId}`);
    if (res.ok) setSubtypes(await res.json());
  }, [selectedCategoryId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadSubtypes();
  }, [loadSubtypes]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/inventory/subtypes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category_id: selectedCategoryId,
        default_price_per_kg: price ? Number(price) : undefined,
        unit,
      }),
    });
    if (res.ok) {
      setName("");
      setPrice("");
      setUnit("kg");
      setShowModal(false);
      await loadSubtypes();
    }
    setLoading(false);
  }

  const subtypeCount = (catId: string) =>
    subtypes.filter((st) => st.category_id === catId).length;

  const avgPrice =
    subtypes.length > 0
      ? subtypes.reduce((acc, st) => acc + st.wac, 0) / subtypes.length
      : 0;

  const topSubtype =
    subtypes.length > 0
      ? subtypes.reduce((best, st) => (st.current_stock_kg > best.current_stock_kg ? st : best), subtypes[0])
      : null;

  const totalStock = subtypes.reduce((acc, st) => acc + st.current_stock_kg, 0);

  return (
    <>
      {/* Breadcrumbs & Header (desktop) */}
      <div className="hidden md:block px-8 pt-8 pb-4">
        <nav className="flex items-center gap-2 text-xs text-[#505f76] mb-2 font-medium tracking-wide uppercase">
          <Link href="/" className="hover:text-[#0F172A]">Dashboard</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link href="/inventory" className="hover:text-[#0F172A]">Inventory</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-[#0F172A] font-bold">Sub-types</span>
        </nav>
        <h1 className="font-display text-2xl font-bold text-[#0F172A] tracking-tight">
          Inventory Management
        </h1>
      </div>

      {/* Tab Sub-navigation (desktop) */}
      <div className="hidden md:block px-8 border-b border-[#c6c6cd]">
        <div className="flex gap-8">
          <Link href="/inventory" className="text-[#505f76] hover:text-[#0F172A] pb-4 pt-4 text-sm transition-colors border-b-2 border-transparent">
            Stock Overview
          </Link>
          <Link href="/inventory/categories" className="text-[#505f76] hover:text-[#0F172A] pb-4 pt-4 text-sm transition-colors border-b-2 border-transparent">
            Categories
          </Link>
          <span className="text-[#059669] font-semibold border-b-2 border-[#059669] pb-4 pt-4 text-sm cursor-default">
            Sub-types
          </span>
          <span className="text-[#505f76] pb-4 pt-4 text-sm border-b-2 border-transparent cursor-default">
            Scrap Pool
          </span>
          <span className="text-[#505f76] pb-4 pt-4 text-sm border-b-2 border-transparent cursor-default">
            Consumables
          </span>
        </div>
      </div>

      {/* Mobile: Tab Navigation */}
      <div className="md:hidden px-4 pt-4 pb-2">
        <nav className="flex border-b border-[#c6c6cd]">
          <Link href="/inventory" className="flex-1 py-3 text-sm font-medium text-[#505f76] text-center">
            Stock Overview
          </Link>
          <Link href="/inventory/categories" className="flex-1 py-3 text-sm font-medium text-[#505f76] text-center">
            Categories
          </Link>
          <span className="flex-1 py-3 text-sm font-bold text-[#0F172A] text-center border-b-2 border-[#0F172A] cursor-default">
            Sub-types
          </span>
        </nav>
      </div>

      {/* Mobile: Horizontal Category Chips */}
      <div className="md:hidden flex gap-2 overflow-x-auto py-4 px-4 hide-scrollbar">
        {categories.map((cat) => {
          const isSelected = cat.id === selectedCategoryId;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? "bg-[#002114] text-[#059669] border border-[#059669]"
                  : "bg-[#f2f4f6] text-[#505f76] border border-[#c6c6cd]/50 hover:bg-[#eceef0]"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Mobile: Page Title & FAB */}
      <div className="md:hidden flex justify-between items-center px-4 mb-4">
        <h2 className="font-display font-bold text-lg text-[#0F172A]">
          {selectedCategory ? `${selectedCategory.name} — Sub-types` : "Sub-types"}
        </h2>
        {selectedCategory && (
          <button
            onClick={() => setShowModal(true)}
            className="w-10 h-10 rounded-full bg-[#0F172A] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        )}
      </div>

      {/* Two-Panel Content (desktop) */}
      <div className="hidden md:flex flex-1 p-8 grid grid-cols-12 gap-6 bg-[#F8FAFC">
        {/* Left Panel: Categories */}
        <section className="col-span-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-[#0F172A]">Categories</h3>
            <Link href="/inventory/categories" className="flex items-center gap-1 text-[#059669] hover:bg-[#059669]/10 px-2 py-1 rounded transition-colors text-xs font-semibold">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {categories.map((cat) => {
              const isSelected = cat.id === selectedCategoryId;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`flex items-center justify-between p-4 rounded-lg border-l-4 shadow-sm group text-left transition-all hover:translate-x-1 ${
                    isSelected
                      ? "bg-white border-l-[#059669]"
                      : "bg-[#f2f4f6] border-l-transparent hover:bg-[#eceef0]"
                  }`}
                >
                  <div>
                    <p className={`text-sm font-bold ${isSelected ? "text-[#0F172A]" : "text-[#505f76]"}`}>{cat.name}</p>
                    <p className="text-xs text-[#505f76]">{subtypeCount(cat.id)} sub-types</p>
                  </div>
                  <span className={`material-symbols-outlined text-[#76777d] ${isSelected ? "text-[#0F172A]" : "group-hover:text-[#0F172A]"}`}>
                    chevron_right
                  </span>
                </button>
              );
            })}
            {categories.length === 0 && (
              <div className="text-center py-8 text-xs text-[#505f76]">No categories yet</div>
            )}
            <Link href="/inventory/categories" className="flex items-center justify-center p-4 bg-transparent border-2 border-dashed border-[#c6c6cd] rounded-lg hover:border-[#059669] hover:bg-[#059669]/5 transition-all group mt-2">
              <div className="flex items-center gap-2 text-[#76777d] group-hover:text-[#059669]">
                <span className="material-symbols-outlined">add_circle</span>
                <span className="text-sm font-medium">Add Category</span>
              </div>
            </Link>
          </div>
        </section>

        {/* Right Panel: Sub-types Table */}
        <section className="col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-[#0F172A]">
              {selectedCategory ? (
                <>{selectedCategory.name} — <span className="text-[#505f76]">Sub-types</span></>
              ) : "Select a category"}
            </h3>
            {selectedCategory && (
              <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#0F172A] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#0F172A]/90 transition-all active:scale-95 shadow-sm text-sm">
                <span className="material-symbols-outlined text-[20px]">add</span>
                Add Sub-type
              </button>
            )}
          </div>

          {selectedCategory ? (
            subtypes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-[#c6c6cd]/30 py-12 text-center text-[#505f76] text-sm">
                No sub-types in this category yet
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-[#c6c6cd]/30 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#f2f4f6] border-b border-[#c6c6cd]/30">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider">Sub-type Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider">Default Price</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider">Unit</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c6c6cd]/20">
                    {subtypes.map((st) => (
                      <tr key={st.id} className="hover:bg-[#f7f9fb] transition-colors group">
                        <td className={`px-6 py-4 text-sm font-medium ${st.is_active ? "text-[#0F172A]" : "text-[#505f76]/60"}`}>{st.name}</td>
                        <td className="px-6 py-4 font-mono text-sm text-[#505f76]">
                          ৳{st.default_price_per_kg ? Number(st.default_price_per_kg).toFixed(2) : "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#505f76]">{st.unit || "kg"}</td>
                        <td className="px-6 py-4">
                          {st.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 text-success text-[11px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-success" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[11px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1 hover:text-[#059669] transition-colors">
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button className="p-1 hover:text-[#ba1a1a] transition-colors">
                              <span className="material-symbols-outlined text-[18px]">{st.is_active ? "block" : "check_circle"}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-[#c6c6cd]/30 py-16 text-center">
              <span className="material-symbols-outlined text-5xl text-[#c6c6cd] block mb-4">category</span>
              <p className="text-[#505f76] text-sm">Select a category to view sub-types</p>
            </div>
          )}

          {/* Desktop Stats Row */}
          {selectedCategory && subtypes.length > 0 && (
            <div className="hidden md:grid grid-cols-3 gap-4 mt-2">
              <div className="p-4 bg-[#002114] text-white rounded-lg flex items-center justify-between border-l-4 border-[#059669] shadow-sm">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">Top Sub-type</p>
                  <p className="text-sm font-bold">{topSubtype?.name || "—"}</p>
                </div>
                <span className="material-symbols-outlined text-[#059669]" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
              </div>
              <div className="p-4 bg-white border border-[#c6c6cd]/30 rounded-lg flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#505f76] tracking-wider">Avg Price</p>
                  <p className="text-sm font-mono font-bold text-[#0F172A]">৳{avgPrice.toFixed(2)} /kg</p>
                </div>
                <span className="material-symbols-outlined text-[#505f76]">payments</span>
              </div>
              <div className="p-4 bg-white border border-[#c6c6cd]/30 rounded-lg flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#505f76] tracking-wider">Total Stock</p>
                  <p className="text-sm font-mono font-bold text-[#0F172A]">{totalStock.toLocaleString("en-IN")} kg</p>
                </div>
                <span className="material-symbols-outlined text-[#505f76]">inventory_2</span>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Mobile: Sub-type Cards */}
      <div className="md:hidden px-4 pb-8">
        {selectedCategory && subtypes.length > 0 ? (
          <div className="space-y-3">
            {subtypes.map((st) => (
              <div key={st.id} className="bg-white p-4 rounded-xl border border-[#c6c6cd]/30 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-semibold text-[#0F172A]">{st.name}</h3>
                    <span className="text-xs text-[#505f76]">Unit: {st.unit || "kg"}</span>
                  </div>
                  {st.is_active ? (
                    <span className="px-2 py-1 bg-[#002114] text-[#059669] text-[10px] font-bold rounded-sm flex items-center gap-1 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" /> Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-[#e0e3e5] text-[#505f76] text-[10px] font-bold rounded-sm flex items-center gap-1 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#505f76]" /> Inactive
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-end border-t border-dashed border-[#c6c6cd]/50 pt-3">
                  <div>
                    <p className="text-[10px] uppercase text-[#505f76] font-medium tracking-wider">Default Price</p>
                    <p className="font-mono text-lg font-bold text-[#0F172A]">
                      ৳{st.default_price_per_kg ? Number(st.default_price_per_kg).toFixed(2) : "—"}/kg
                    </p>
                  </div>
                  <button className="text-[#505f76]">
                    <span className="material-symbols-outlined text-xl">edit</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : selectedCategory && subtypes.length === 0 ? (
          <div className="text-center py-12 text-[#505f76] text-sm bg-white rounded-xl border border-[#c6c6cd]/30">
            No sub-types in this category yet
          </div>
        ) : (
          <div className="text-center py-12 text-[#505f76] text-sm bg-white rounded-xl border border-[#c6c6cd]/30">
            Select a category to view sub-types
          </div>
        )}
      </div>

      {/* Desktop Modal */}
      {showModal && (
        <div className="hidden md:flex fixed inset-0 z-[60] items-center justify-center bg-[#0F172A]/40 backdrop-blur-sm transition-all duration-300"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-white w-[480px] p-8 rounded-xl shadow-lg border border-[#c6c6cd]/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl text-[#0F172A]">Add Sub-type</h2>
              <button className="text-[#76777d] hover:text-[#0F172A] transition-colors" onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-[#0F172A]">Sub-type Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full h-[42px] border border-[#c6c6cd] focus:border-[#059669] focus:ring-0 rounded text-sm px-4 outline-none"
                  placeholder="e.g. 30mm Ultra Thick" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-[#0F172A]">Default Price per kg</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-[#76777d]">৳</span>
                    <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
                      className="w-full h-[42px] pl-8 border border-[#c6c6cd] focus:border-[#059669] focus:ring-0 rounded text-sm font-mono outline-none" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-[#0F172A]">Unit</label>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)}
                    className="w-full h-[42px] border border-[#c6c6cd] focus:border-[#059669] focus:ring-0 rounded text-sm px-4 outline-none">
                    <option value="kg">kg</option>
                    <option value="ton">ton</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 h-[42px] bg-transparent text-[#505f76] hover:bg-[#f2f4f6] transition-colors font-bold text-sm rounded">Cancel</button>
                <button type="submit" disabled={loading}
                  className="flex-1 h-[42px] bg-[#0F172A] text-white hover:bg-[#0F172A]/90 transition-all active:scale-95 font-bold text-sm rounded shadow-md disabled:opacity-40">
                  {loading ? "Saving..." : "Save Sub-type"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile: Bottom Sheet */}
      {showModal && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-2xl p-6 flex flex-col gap-6 transition-transform">
            <div className="w-12 h-1 bg-[#c6c6cd] rounded-full mx-auto mb-2" />
            <h2 className="font-display font-bold text-xl text-[#0F172A]">Add Sub-type</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#505f76] uppercase tracking-wider">Sub-type Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full h-[42px] px-4 rounded border border-[#76777d] focus:ring-2 focus:ring-[#0F172A] focus:border-transparent outline-none"
                  placeholder="e.g., 20mm Super Heavy" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#505f76] uppercase tracking-wider">Default Price (৳)</label>
                  <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
                    className="w-full h-[42px] px-4 rounded border border-[#76777d] focus:ring-2 focus:ring-[#0F172A] focus:border-transparent outline-none font-mono"
                    placeholder="0.00" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#505f76] uppercase tracking-wider">Unit</label>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)}
                    className="w-full h-[42px] px-4 rounded border border-[#76777d] focus:ring-2 focus:ring-[#0F172A] outline-none">
                    <option value="kg">kg</option>
                    <option value="ton">Metric Ton</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-3 mt-4">
                <button type="submit" disabled={loading}
                  className="w-full h-12 bg-[#0F172A] text-white font-bold rounded-lg shadow-md active:scale-[0.98] transition-all">
                  {loading ? "Saving..." : "Save Sub-type"}</button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="w-full h-12 bg-transparent text-[#505f76] font-medium rounded-lg hover:bg-[#f2f4f6] transition-colors">Cancel</button>
              </div>
            </form>
            <div className="h-6" />
          </div>
        </div>
      )}
    </>
  );
}
