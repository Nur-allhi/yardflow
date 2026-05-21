"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
}

interface Subtype {
  id: string;
  name: string;
  category_id: string;
  default_price_per_kg: number | null;
}

interface Account {
  id: string;
  name: string;
  current_balance: number;
}

interface LineItem {
  key: number;
  category_id: string;
  subtype_id: string;
  quantity_kg: string;
  price_per_kg: string;
}

function formatMoney(n: number) {
  return "৳" + n.toLocaleString("en-IN");
}

function calcLineTotal(item: LineItem) {
  const qty = parseFloat(item.quantity_kg) || 0;
  const price = parseFloat(item.price_per_kg) || 0;
  return qty * price;
}

export default function QuickCashSalePage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [subtypesMap, setSubtypesMap] = useState<Record<string, Subtype[]>>({});
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [accountId, setAccountId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<LineItem[]>([
    { key: 1, category_id: "", subtype_id: "", quantity_kg: "", price_per_kg: "" },
  ]);
  let nextKey = 2;

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/inventory/categories");
    if (res.ok) setCategories(await res.json());
  }, []);

  const loadAccounts = useCallback(async () => {
    const res = await fetch("/api/accounts");
    if (res.ok) {
      const data = await res.json();
      setAccounts(data);
      if (data.length > 0) setAccountId(data[0].id);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    loadAccounts();
  }, [loadCategories, loadAccounts]);

  async function loadSubtypes(categoryId: string) {
    if (subtypesMap[categoryId]) return;
    const res = await fetch(
      `/api/inventory/subtypes?category_id=${categoryId}`,
    );
    if (res.ok) {
      const data = await res.json();
      setSubtypesMap((prev) => ({ ...prev, [categoryId]: data }));
    }
  }

  function handleCategoryChange(key: number, categoryId: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, category_id: categoryId, subtype_id: "" }
          : item,
      ),
    );
    if (categoryId) loadSubtypes(categoryId);
  }

  function handleItemChange(key: number, field: keyof LineItem, value: string) {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { key: nextKey++, category_id: "", subtype_id: "", quantity_kg: "", price_per_kg: "" },
    ]);
  }

  function removeItem(key: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.key !== key));
  }

  const grandTotal = items.reduce((sum, item) => sum + calcLineTotal(item), 0);
  const totalWeight = items.reduce(
    (sum, item) => sum + (parseFloat(item.quantity_kg) || 0),
    0,
  );
  const amountReceived = grandTotal;

  function getSubtypesFor(item: LineItem): Subtype[] {
    return subtypesMap[item.category_id] || [];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validItems = items.filter(
      (item) => item.subtype_id && item.quantity_kg && item.price_per_kg,
    );
    if (validItems.length === 0) {
      setError("Please add at least one item with complete details");
      return;
    }

    if (!accountId) {
      setError("Please select a payment account");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sale_date: saleDate,
          sale_type: "fabricated",
          is_quick_cash_sale: true,
          items: validItems.map((item) => ({
            subtype_id: item.subtype_id,
            quantity_kg: parseFloat(item.quantity_kg),
            price_per_kg: parseFloat(item.price_per_kg),
          })),
          amount_received: amountReceived,
          account_id: accountId,
          note: note || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create sale");
      }

      const sale = await res.json();
      router.push(`/sales/${sale.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/sales"
          className="w-9 h-9 flex items-center justify-center rounded-full border border-[#c6c6cd] text-[#505f76] hover:bg-[#f2f4f6] transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-display text-xl md:text-2xl font-bold text-[#0F172A]">
          Quick Cash Sale
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-[600px] mx-auto space-y-6">
          {/* Sale Details */}
          <section className="bg-white rounded-lg border border-[#c6c6cd]/50 shadow-sm p-5 md:p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-[#0F172A]">bolt</span>
              <h2 className="font-display text-lg font-semibold">Sale Details</h2>
            </div>
            <p className="text-sm text-[#505f76] mb-4">No customer record. Payment received in full.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#505f76]">
                  Sale Date
                </label>
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  required
                  className="w-full h-[42px] border border-[#c6c6cd] rounded bg-white px-3 text-sm focus:border-[#0F172A] focus:ring-0 outline-none transition-all"
                />
              </div>
            </div>
          </section>

          {/* Items */}
          <section className="bg-white rounded-lg border border-[#c6c6cd]/50 shadow-sm overflow-hidden">
            <div className="p-5 md:p-6 border-b border-[#c6c6cd]/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0F172A]">category</span>
                <h2 className="font-display text-lg font-semibold">Items</h2>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 text-[#059669] hover:bg-[#059669]/5 px-3 py-1.5 rounded transition-all text-sm font-bold"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add Item
              </button>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#f2f4f6] border-b border-[#c6c6cd]/50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#505f76]">Category</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#505f76]">Sub-type</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#505f76] text-right">Qty (kg)</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#505f76] text-right">Price/kg</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#505f76] text-right">Total</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c6c6cd]/30">
                  {items.map((item) => (
                    <tr key={item.key} className="hover:bg-[#F8FAFC]">
                      <td className="px-6 py-3">
                        <select
                          value={item.category_id}
                          onChange={(e) => handleCategoryChange(item.key, e.target.value)}
                          className="w-full h-[38px] border border-[#c6c6cd] rounded px-2 text-sm focus:border-[#0F172A] outline-none bg-white"
                        >
                          <option value="">Category</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <select
                          value={item.subtype_id}
                          onChange={(e) => handleItemChange(item.key, "subtype_id", e.target.value)}
                          disabled={!item.category_id}
                          className="w-full h-[38px] border border-[#c6c6cd] rounded px-2 text-sm focus:border-[#0F172A] outline-none bg-white disabled:opacity-40"
                        >
                          <option value="">Sub-type</option>
                          {getSubtypesFor(item).map((st) => (
                            <option key={st.id} value={st.id}>{st.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={item.quantity_kg}
                          onChange={(e) => handleItemChange(item.key, "quantity_kg", e.target.value)}
                          className="w-full h-[38px] border border-[#c6c6cd] rounded px-2 text-sm text-right font-mono focus:border-[#0F172A] outline-none"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#505f76]">৳</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price_per_kg}
                            onChange={(e) => handleItemChange(item.key, "price_per_kg", e.target.value)}
                            className="w-full h-[38px] pl-5 border border-[#c6c6cd] rounded px-2 text-sm text-right font-mono focus:border-[#0F172A] outline-none"
                            placeholder="0"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-sm font-semibold">
                        ৳{calcLineTotal(item).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            className="text-[#EF4444] hover:bg-red-50 p-1 rounded transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Items */}
            <div className="md:hidden space-y-3 p-4">
              {items.map((item) => (
                <div key={item.key} className="border border-[#c6c6cd]/50 rounded-lg p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={item.category_id}
                      onChange={(e) => handleCategoryChange(item.key, e.target.value)}
                      className="h-[38px] border border-[#c6c6cd] rounded px-2 text-sm outline-none bg-white"
                    >
                      <option value="">Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <select
                      value={item.subtype_id}
                      onChange={(e) => handleItemChange(item.key, "subtype_id", e.target.value)}
                      disabled={!item.category_id}
                      className="h-[38px] border border-[#c6c6cd] rounded px-2 text-sm outline-none bg-white disabled:opacity-40"
                    >
                      <option value="">Sub-type</option>
                      {getSubtypesFor(item).map((st) => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#505f76] block mb-1">Qty (kg)</label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={item.quantity_kg}
                        onChange={(e) => handleItemChange(item.key, "quantity_kg", e.target.value)}
                        className="w-full h-[38px] border border-[#c6c6cd] rounded px-2 text-sm font-mono outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#505f76] block mb-1">Price/kg</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#505f76]">৳</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.price_per_kg}
                          onChange={(e) => handleItemChange(item.key, "price_per_kg", e.target.value)}
                          className="w-full h-[38px] pl-5 border border-[#c6c6cd] rounded px-2 text-sm font-mono outline-none"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-dashed border-[#c6c6cd]/50">
                    <span className="text-sm font-mono font-bold">
                      ৳{calcLineTotal(item).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(item.key)} className="text-[#EF4444] text-xs font-bold">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Grand Total */}
            <div className="p-5 md:p-6 bg-[#f2f4f6]/50 border-t border-[#c6c6cd]/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#505f76]">{totalWeight.toFixed(3)} kg</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-[#505f76] uppercase tracking-wider">Total:</span>
                <span className="text-xl font-bold font-mono text-[#0F172A]">{formatMoney(grandTotal)}</span>
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="bg-white rounded-lg border border-[#c6c6cd]/50 shadow-sm p-5 md:p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-[#0F172A]">account_balance_wallet</span>
              <h2 className="font-display text-lg font-semibold">Payment</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#505f76]">
                  Amount Received
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#505f76] font-mono">৳</span>
                  <input
                    type="text"
                    value={formatMoney(amountReceived)}
                    readOnly
                    className="w-full h-[42px] pl-8 pr-3 border border-[#c6c6cd] rounded bg-[#f2f4f6] text-sm font-mono font-bold text-[#059669] outline-none cursor-default"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#505f76]">
                  Pay Into Account
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  required
                  className="w-full h-[42px] border border-[#c6c6cd] rounded bg-white px-3 text-sm focus:border-[#0F172A] focus:ring-0 outline-none"
                >
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatMoney(a.current_balance)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#505f76]">
                  Note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full border border-[#c6c6cd] rounded bg-white p-3 text-sm focus:border-[#0F172A] focus:ring-0 outline-none transition-all resize-none"
                  placeholder="Internal note..."
                />
              </div>
            </div>
          </section>

          {/* Info + Submit */}
          <div className="bg-[#059669]/5 border border-[#059669]/20 rounded-lg p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-[#059669] text-lg">info</span>
            <p className="text-sm font-medium text-[#059669]">
              This sale will be recorded as <strong>PAID</strong> immediately. No invoice will be pending.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-[#EF4444] text-sm font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 bg-[#0F172A] text-white font-bold rounded-lg hover:bg-[#0F172A]/90 transition-all active:scale-95 shadow-sm disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            {submitting ? "Saving..." : "Complete Sale"}
          </button>

          <div className="text-center">
            <Link
              href="/sales/new"
              className="text-sm text-[#059669] hover:underline inline-flex items-center gap-1"
            >
              Need to record a customer?
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
