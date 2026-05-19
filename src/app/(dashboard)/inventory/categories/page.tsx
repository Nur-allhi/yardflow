"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

  async function loadCategories() {
    const res = await fetch("/api/inventory/categories");
    if (res.ok) setCategories(await res.json());
  }

  useEffect(() => {
    loadCategories();
  }, []);

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
      <h1 className="font-display text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight mb-6 md:mb-8">
        Category Management
      </h1>

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
                <div key={cat.id} className="px-5 md:px-6 py-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-[#0F172A]">{cat.name}</p>
                    {cat.description && (
                      <p className="text-xs text-[#505f76]">{cat.description}</p>
                    )}
                  </div>
                  <span className="text-[10px] md:text-xs text-[#505f76] font-mono">
                    {cat.id.slice(0, 8)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
