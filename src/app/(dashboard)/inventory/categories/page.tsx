"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { InventoryNav } from "@/components/InventoryNav";

interface Category {
  id: string;
  name: string;
  description: string | null;
}

export default function CategoriesPage() {
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

  async function handleSave(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/inventory/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, description: editDescription || undefined }),
      });
      if (res.ok) {
        setEditingId(null);
        await loadCategories();
      }
    } catch {}
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    await fetch(`/api/inventory/categories/${id}`, { method: "DELETE" });
    await loadCategories();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/inventory/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || undefined }),
    });
    if (res.ok) {
      setName("");
      setDescription("");
      await loadCategories();
    }
    setLoading(false);
  }

  return (
    <div className="p-4 md:p-8">
      {/* Breadcrumbs + Header */}
      <nav className="flex items-center gap-2 text-xs text-[#505f76] mb-2 font-medium tracking-wide uppercase">
        <Link href="/" className="hover:text-[#0F172A]">Dashboard</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link href="/inventory" className="hover:text-[#0F172A]">Inventory</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-[#0F172A] font-bold">Categories</span>
      </nav>
      <h1 className="font-display text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight mb-2">
        Category Management
      </h1>

      <InventoryNav active="categories" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Add Category Form */}
        <div className="bg-white p-5 md:p-6 rounded-lg border border-[#c6c6cd]/30 shadow-sm">
          <h2 className="font-display font-bold text-lg mb-4">Add Category</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Category Name
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-[42px] px-4 border border-[#c6c6cd] rounded bg-white text-sm focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10 outline-none"
                placeholder="e.g. Iron Plates"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full p-4 border border-[#c6c6cd] rounded bg-white text-sm focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10 outline-none resize-none"
                placeholder="Optional description"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-5 py-2.5 bg-[#0F172A] text-white font-semibold rounded-md hover:bg-[#0F172A]/90 transition-all text-sm disabled:opacity-40"
            >
              {loading ? "Adding..." : "Add Category"}
            </button>
          </form>
        </div>

        {/* Existing Categories */}
        <div className="bg-white rounded-lg border border-[#c6c6cd]/30 shadow-sm overflow-hidden">
          <div className="px-5 md:px-6 py-4 border-b border-[#c6c6cd]/30">
            <h2 className="font-display font-bold text-lg">Existing Categories</h2>
          </div>
          {categories.length === 0 ? (
            <div className="p-6 text-center text-[#505f76] text-sm">
              No categories yet
            </div>
          ) : (
            <div className="divide-y divide-[#c6c6cd]/20">
              {categories.map((cat) => (
                <div key={cat.id} className="px-5 md:px-6 py-4 flex justify-between items-center group">
                  {editingId === cat.id ? (
                    <div className="w-full space-y-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full h-[42px] px-4 border border-[#c6c6cd] rounded bg-white text-sm focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10 outline-none"
                        placeholder="Category name"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={2}
                        className="w-full p-4 border border-[#c6c6cd] rounded bg-white text-sm focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10 outline-none resize-none"
                        placeholder="Description"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleSave(cat.id)}
                          disabled={saving}
                          className="px-4 py-2 bg-[#059669] text-white font-semibold rounded-md hover:bg-[#059669]/90 transition-all text-sm disabled:opacity-40">
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="px-4 py-2 border border-[#c6c6cd] text-[#505f76] font-semibold rounded-md hover:bg-[#f2f4f6] transition-all text-sm">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-medium text-[#0F172A]">{cat.name}</p>
                        {cat.description && (
                          <p className="text-xs text-[#505f76]">{cat.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(cat)}
                          className="opacity-0 group-hover:opacity-100 text-[#505f76] hover:text-[#0F172A] transition-all p-1"
                          title="Edit">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button onClick={() => handleDelete(cat.id)}
                          className="opacity-0 group-hover:opacity-100 text-[#ba1a1a] hover:text-[#93000a] transition-all p-1"
                          title="Delete">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                        <span className="text-[10px] md:text-xs text-[#505f76] font-mono ml-2">
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
