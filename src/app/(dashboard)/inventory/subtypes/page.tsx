"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  const [unit, setUnit] = useState("kg");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUnit, setEditUnit] = useState("kg");

  const router = useRouter();

  useEffect(() => {
    fetch("/api/simple/mode")
      .then(r => r.json())
      .then(data => {
        if (data.mode === "simple") router.replace("/inventory-simple");
      })
      .catch(() => {});
  }, [router]);

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
      setUnit("kg");
      setShowModal(false);
      loadSubtypes();
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const updateSubtypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/inventory/subtypes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update subtype");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtypes"] });
      setEditingId(null);
      setEditName("");
      setEditUnit("kg");
      loadSubtypes();
    },
  });

  function startEdit(st: Subtype) {
    setEditingId(st.id);
    setEditName(st.name);
    setEditUnit(st.unit || "kg");
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    updateSubtypeMutation.mutate({
      id: editingId,
      data: {
        name: editName,
        category_id: selectedCategoryId,
        unit: editUnit,
      },
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditUnit("kg");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    createSubtypeMutation.mutate({
      name,
      category_id: selectedCategoryId,
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
                  ? "bg-tertiary-container text-white border border-tertiary-container"
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
                        <th className="px-5 md:px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">Unit</th>
                        <th className="px-5 md:px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">Status</th>
                        <th className="px-5 md:px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {subtypes.map((st) => {
                        const isEditing = editingId === st.id;
                        return (
                          <tr key={st.id} className="hover:bg-background transition-colors group">
                            {isEditing ? (
                              <>
                                <td className="px-5 md:px-6 py-4" colSpan={4}>
                                  <form onSubmit={handleEditSubmit} className="flex items-center gap-3">
                                    <input required value={editName} onChange={(e) => setEditName(e.target.value)}
                                      className="w-48 h-[38px] border border-outline-variant rounded px-3 text-sm outline-none focus:border-primary"
                                      placeholder="Sub-type name" />
                                    <select value={editUnit} onChange={(e) => setEditUnit(e.target.value)}
                                      className="w-24 h-[38px] border border-outline-variant rounded px-2 text-sm outline-none bg-white">
                                      <option value="kg">kg</option>
                                      <option value="ton">ton</option>
                                    </select>
                                    <button type="submit" disabled={updateSubtypeMutation.isPending}
                                      className="px-4 h-[38px] bg-primary text-on-primary font-bold text-sm rounded hover:bg-primary/90 disabled:opacity-40">
                                      {updateSubtypeMutation.isPending ? "Saving..." : "Save"}
                                    </button>
                                    <button type="button" onClick={cancelEdit}
                                      className="px-4 h-[38px] border border-outline-variant text-on-surface-variant font-bold text-sm rounded hover:bg-surface-container-low">
                                      Cancel
                                    </button>
                                  </form>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className={`px-5 md:px-6 py-4 text-sm font-medium ${st.is_active ? "text-primary-container" : "text-secondary/60"}`}>{st.name}</td>
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
                                    <button onClick={() => startEdit(st)} className="p-1 hover:text-tertiary transition-colors">
                                      <span className="material-symbols-outlined text-[18px]">edit</span>
                                    </button>
                                    <button className="p-1 hover:text-error transition-colors">
                                      <span className="material-symbols-outlined text-[18px]">{st.is_active ? "block" : "check_circle"}</span>
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3 p-4">
                  {subtypes.map((st) => {
                    const isEditing = editingId === st.id;
                    return (
                      <div key={st.id} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-3">
                        {isEditing ? (
                          <form onSubmit={handleEditSubmit} className="space-y-3">
                            <input required value={editName} onChange={(e) => setEditName(e.target.value)}
                              className="w-full h-[44px] border border-outline-variant rounded px-3 text-sm outline-none focus:border-primary"
                              placeholder="Sub-type name" />
                            <select value={editUnit} onChange={(e) => setEditUnit(e.target.value)}
                              className="w-full h-[44px] border border-outline-variant rounded px-3 text-sm outline-none bg-white">
                              <option value="kg">kg</option>
                              <option value="ton">Metric Ton</option>
                            </select>
                            <div className="flex gap-2">
                              <button type="submit" disabled={updateSubtypeMutation.isPending}
                                className="flex-1 h-11 bg-primary text-on-primary font-bold rounded-lg disabled:opacity-40">
                                {updateSubtypeMutation.isPending ? "Saving..." : "Save"}
                              </button>
                              <button type="button" onClick={cancelEdit}
                                className="flex-1 h-11 border border-outline-variant text-on-surface-variant font-bold rounded-lg">
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-sm font-semibold text-on-surface">{st.name}</h3>
                              </div>
                              {st.is_active ? (
                                <span className="px-2 py-1 bg-tertiary-container text-white text-[10px] font-bold rounded-sm flex items-center gap-1 uppercase">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
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
                                <p className="text-[10px] uppercase text-on-surface-variant font-medium tracking-wider">Unit</p>
                                <p className="font-mono text-lg font-bold text-primary">{st.unit || "kg"}</p>
                              </div>
                              <button onClick={() => startEdit(st)} className="text-on-surface-variant">
                                <span className="material-symbols-outlined text-xl">edit</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
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
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Unit</label>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)} autoComplete="off"
                    className="w-full h-[44px] border border-outline-variant focus:border-primary focus:ring-0 rounded text-sm px-4 outline-none">
                    <option value="kg">kg</option>
                    <option value="ton">ton</option>
                  </select>
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
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Unit</label>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)} autoComplete="off"
                    className="w-full h-[44px] px-4 rounded border border-outline focus:ring-2 focus:ring-primary outline-none">
                    <option value="kg">kg</option>
                    <option value="ton">Metric Ton</option>
                  </select>
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
