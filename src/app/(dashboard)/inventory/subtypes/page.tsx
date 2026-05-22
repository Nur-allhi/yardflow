"use client";

import { useState, useEffect, useCallback } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InventoryNav } from "@/components/InventoryNav";

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
  const queryClient = useQueryClient();
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

  const createSubtypeMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/inventory/subtypes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create subtype");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtypes"] });
      setName("");
      setPrice("");
      setUnit("kg");
      setShowModal(false);
      loadSubtypes();
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    createSubtypeMutation.mutate({
      name,
      category_id: selectedCategoryId,
      default_price_per_kg: price ? Number(price) : undefined,
      unit,
    });
  }

  return (
    <div className="p-4 md:p-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Inventory', href: '/inventory' }, { label: 'Sub-types', href: null }]} />
      <h1 className="font-display text-2xl md:text-3xl font-bold text-primary-container tracking-tight mb-2">
        Sub-types Management
      </h1>

      <InventoryNav active="subtypes" />

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6">
        {categories.map((cat) => {
          const isSelected = cat.id === selectedCategoryId;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-tertiary-container text-on-tertiary-container border border-on-tertiary-container"
                  : "bg-surface-container-low text-on-surface-variant border border-outline-variant"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Mobile title & FAB */}
      <div className="md:hidden flex justify-between items-center mb-4">
        <h2 className="font-display font-bold text-lg text-on-surface">
          {selectedCategory ? `${selectedCategory.name} — Sub-types` : "Sub-types"}
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      {/* Main content card */}
      <div className="bg-white rounded-lg border border-outline-variant/30 shadow-sm overflow-hidden">
        {selectedCategory ? (
          <>
            <div className="hidden md:flex px-5 md:px-6 py-4 border-b border-outline-variant/30 items-center justify-between">
              <h2 className="font-display font-bold text-lg">
                {selectedCategory.name} — Sub-types
              </h2>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-primary-container text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-container/90 transition-all active:scale-95 shadow-sm text-sm"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                Add Sub-type
              </button>
            </div>

            {subtypes.length === 0 ? (
              <div className="p-6 text-center text-secondary text-sm">
                No sub-types in this category yet
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <table className="w-full text-left">
                    <thead className="bg-surface-container-high border-b border-outline-variant">
                      <tr>
                        <th className="px-5 md:px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">Sub-type Name</th>
                        <th className="px-5 md:px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">Default Price</th>
                        <th className="px-5 md:px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">Unit</th>
                        <th className="px-5 md:px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">Status</th>
                        <th className="px-5 md:px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {subtypes.map((st) => (
                        <tr key={st.id} className="hover:bg-background transition-colors group">
                          <td className={`px-5 md:px-6 py-4 text-sm font-medium ${st.is_active ? "text-primary-container" : "text-secondary/60"}`}>{st.name}</td>
                          <td className="px-5 md:px-6 py-4 font-mono text-sm text-secondary">
                            {st.default_price_per_kg ? Number(st.default_price_per_kg).toLocaleString("en-IN") + " tk" : "—"}
                          </td>
                          <td className="px-5 md:px-6 py-4 text-sm text-secondary">{st.unit || "kg"}</td>
                          <td className="px-5 md:px-6 py-4">
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
                          <td className="px-5 md:px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1 hover:text-tertiary transition-colors">
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button className="p-1 hover:text-error transition-colors">
                                <span className="material-symbols-outlined text-[18px]">{st.is_active ? "block" : "check_circle"}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3 p-4">
                  {subtypes.map((st) => (
                    <div key={st.id} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-semibold text-on-surface">{st.name}</h3>
                        </div>
                        {st.is_active ? (
                          <span className="px-2 py-1 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold rounded-sm flex items-center gap-1 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" />
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant text-[10px] font-bold rounded-sm flex items-center gap-1 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant" />
                            Archived
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-end border-t border-dashed border-outline-variant pt-3">
                        <div>
                          <p className="text-[10px] uppercase text-on-surface-variant font-medium tracking-wider">Default Price</p>
                          <p className="font-mono text-lg font-bold text-primary">
                            {st.default_price_per_kg ? `৳${Number(st.default_price_per_kg).toLocaleString("en-IN")}/kg` : "—"}
                          </p>
                        </div>
                        <button className="text-on-surface-variant">
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-outline-variant block mb-4">category</span>
            <p className="text-secondary text-sm">Select a category to view sub-types</p>
          </div>
        )}
      </div>

      {/* Desktop Modal */}
      {showModal && (
        <div className="hidden md:flex fixed inset-0 z-[60] items-center justify-center bg-primary-container/40 backdrop-blur-sm transition-all duration-300"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-white w-[480px] p-8 rounded-xl shadow-lg border border-outline-variant/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl text-primary-container">Add Sub-type</h2>
              <button className="text-outline hover:text-primary-container transition-colors" onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Sub-type Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)}
                  autoComplete="name" enterKeyHint="next"
                  className="w-full h-[44px] border border-outline-variant focus:border-primary focus:ring-0 rounded text-sm px-4 outline-none"
                  placeholder="e.g. 30mm Ultra Thick" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Default Price per kg</label>
                  <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
                    inputMode="decimal" autoComplete="off" enterKeyHint="next"
                    className="w-full h-[44px] px-4 border border-outline-variant focus:border-primary focus:ring-0 rounded text-sm font-mono outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Unit</label>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)} autoComplete="off"
                    className="w-full h-[44px] border border-outline-variant focus:border-primary focus:ring-0 rounded text-sm px-4 outline-none">
                    <option value="kg">kg</option>
                    <option value="ton">ton</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 h-[44px] bg-transparent text-on-surface-variant hover:bg-surface-container-low transition-colors font-bold text-sm rounded">Cancel</button>
                <button type="submit" disabled={loading}
                  className="flex-1 h-[44px] bg-primary text-on-primary hover:bg-primary/90 transition-all active:scale-95 font-bold text-sm rounded shadow-md disabled:opacity-40">
                  {loading ? "Saving..." : "Save Sub-type"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile: Bottom Sheet */}
      {showModal && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-primary-container/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-2xl p-6 flex flex-col gap-6 transition-transform">
            <div className="w-12 h-1 bg-outline-variant rounded-full mx-auto mb-2" />
            <h2 className="font-display font-bold text-xl text-primary-container">Add Sub-type</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Sub-type Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)}
                  autoComplete="name" enterKeyHint="next"
                  className="w-full h-[44px] px-4 rounded border border-outline focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="e.g., 20mm Super Heavy" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Default Price (tk)</label>
                  <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
                    inputMode="decimal" autoComplete="off" enterKeyHint="go"
                    className="w-full h-[44px] px-4 rounded border border-outline focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-mono"
                    placeholder="0.00" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Unit</label>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)} autoComplete="off"
                    className="w-full h-[44px] px-4 rounded border border-outline focus:ring-2 focus:ring-primary outline-none">
                    <option value="kg">kg</option>
                    <option value="ton">Metric Ton</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-3 mt-4">
                <button type="submit" disabled={loading}
                  className="w-full h-12 bg-primary text-on-primary font-bold rounded-lg shadow-md active:scale-[0.98] transition-all">
                  {loading ? "Saving..." : "Save Sub-type"}</button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="w-full h-12 bg-transparent text-on-surface-variant font-medium rounded-lg hover:bg-surface-container transition-colors">Cancel</button>
              </div>
            </form>
            <div className="h-6" />
          </div>
        </div>
      )}
    </div>
  );
}
