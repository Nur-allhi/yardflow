"use client";

import { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InventoryNav } from "@/components/InventoryNav";

interface Category {
  id: string;
  name: string;
  description: string | null;
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadCategories() {
    const res = await fetch("/api/inventory/categories");
    if (res.ok) setCategories(await res.json());
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description || "");
  }

  const saveMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; description: string | undefined }) => {
      const res = await fetch(`/api/inventory/categories/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, description: data.description }),
      });
      if (!res.ok) throw new Error("Failed to update");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditingId(null);
      loadCategories();
    },
    onSettled: () => {
      setSaving(false);
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/inventory/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      loadCategories();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/inventory/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setName("");
      setDescription("");
      loadCategories();
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  async function handleSave(id: string) {
    setSaving(true);
    saveMutation.mutate({ id, name: editName, description: editDescription || undefined });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    deleteMutation.mutate(id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    createMutation.mutate({ name, description: description || undefined });
  }

  return (
    <div className="p-4 md:p-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Inventory', href: '/inventory' }, { label: 'Categories', href: null }]} />
      <h1 className="font-display text-2xl md:text-3xl font-bold text-primary-container tracking-tight mb-2">
        Category Management
      </h1>

      <InventoryNav active="categories" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Add Category Form */}
        <div className="bg-white p-5 md:p-6 rounded-lg border border-outline-variant/30 shadow-sm">
          <h2 className="font-display font-bold text-lg mb-4">Add Category</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-container mb-1">
                Category Name
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-[42px] px-4 border border-outline-variant rounded bg-white text-sm focus:border-tertiary focus:ring-2 focus:ring-tertiary/10 outline-none"
                placeholder="e.g. Iron Plates"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-container mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full p-4 border border-outline-variant rounded bg-white text-sm focus:border-tertiary focus:ring-2 focus:ring-tertiary/10 outline-none resize-none"
                placeholder="Optional description"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-5 py-2.5 bg-primary-container text-white font-semibold rounded-md hover:bg-primary-container/90 transition-all text-sm disabled:opacity-40"
            >
              {loading ? "Adding..." : "Add Category"}
            </button>
          </form>
        </div>

        {/* Existing Categories */}
        <div className="bg-white rounded-lg border border-outline-variant/30 shadow-sm overflow-hidden">
          <div className="px-5 md:px-6 py-4 border-b border-outline-variant/30">
            <h2 className="font-display font-bold text-lg">Existing Categories</h2>
          </div>
          {categories.length === 0 ? (
            <div className="p-6 text-center text-secondary text-sm">
              No categories yet
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/20">
              {categories.map((cat) => (
                <div key={cat.id} className="px-5 md:px-6 py-4 flex justify-between items-center group">
                  {editingId === cat.id ? (
                    <div className="w-full space-y-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full h-[42px] px-4 border border-outline-variant rounded bg-white text-sm focus:border-tertiary focus:ring-2 focus:ring-tertiary/10 outline-none"
                        placeholder="Category name"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={2}
                        className="w-full p-4 border border-outline-variant rounded bg-white text-sm focus:border-tertiary focus:ring-2 focus:ring-tertiary/10 outline-none resize-none"
                        placeholder="Description"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleSave(cat.id)}
                          disabled={saving}
                          className="px-4 py-2 bg-tertiary text-white font-semibold rounded-md hover:bg-tertiary/90 transition-all text-sm disabled:opacity-40">
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="px-4 py-2 border border-outline-variant text-secondary font-semibold rounded-md hover:bg-surface-container-low transition-all text-sm">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-medium text-primary-container">{cat.name}</p>
                        {cat.description && (
                          <p className="text-xs text-secondary">{cat.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(cat)}
                          className="opacity-0 group-hover:opacity-100 text-secondary hover:text-primary-container transition-all p-1"
                          title="Edit">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button onClick={() => handleDelete(cat.id)}
                          className="opacity-0 group-hover:opacity-100 text-error hover:text-on-error-container transition-all p-1"
                          title="Delete">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                        <span className="text-[10px] md:text-xs text-secondary font-mono ml-2">
                          {cat.id.slice(0, 8)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
