"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccounts } from "@/hooks/useAccounts";
import { useCustomers } from "@/hooks/useCustomers";
import { useCategories, useSubtypes } from "@/hooks/useCategories";

interface Subtype {
  id: string;
  name: string;
  category_id: string;
  default_price_per_kg: number | null;
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

export default function NewSalePage() {
  const router = useRouter();

  const { data: customersData } = useCustomers();
  const { data: categoriesData } = useCategories();
  const { data: accountsData } = useAccounts();
  const { data: subtypesData } = useSubtypes();

  const [customerId, setCustomerId] = useState("");
  const [saleType, setSaleType] = useState<"fabricated" | "raw_passthrough">("fabricated");
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [amountReceived, setAmountReceived] = useState("");
  const [accountId, setAccountId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<LineItem[]>([
    { key: 1, category_id: "", subtype_id: "", quantity_kg: "", price_per_kg: "" },
  ]);
  const nextKey = useRef(2);

  const customers = (customersData ?? []).map((c) => ({
    ...c,
    due_balance: c.total_purchases - c.total_paid,
  }));
  const categories = categoriesData ?? [];
  const accounts = accountsData ?? [];
  const selectedCustomer = customers.find((c) => c.id === customerId);

  function handleCategoryChange(key: number, categoryId: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, category_id: categoryId, subtype_id: "" }
          : item,
      ),
    );
  }

  function handleItemChange(key: number, field: keyof LineItem, value: string) {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { key: nextKey.current++, category_id: "", subtype_id: "", quantity_kg: "", price_per_kg: "" },
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
  const validItemsCount = items.filter((i) => i.subtype_id).length;
  const payAmount = parseFloat(amountReceived) || 0;
  const remainingDue = grandTotal - payAmount;

  function getSubtypesFor(item: LineItem): Subtype[] {
    return (subtypesData ?? []).filter((st) => st.category_id === item.category_id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) {
      setError("Please select a customer");
      return;
    }

    const validItems = items.filter(
      (item) => item.subtype_id && item.quantity_kg && item.price_per_kg,
    );
    if (validItems.length === 0) {
      setError("Please add at least one item with complete details");
      return;
    }

    if (payAmount > 0 && !accountId) {
      setError("Please select an account for payment");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          sale_type: saleType,
          sale_date: saleDate,
          note: note || undefined,
          items: validItems.map((item) => ({
            subtype_id: item.subtype_id,
            quantity_kg: parseFloat(item.quantity_kg),
            price_per_kg: parseFloat(item.price_per_kg),
          })),
          amount_received: payAmount > 0 ? payAmount : undefined,
          account_id: accountId || undefined,
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
          New Sale
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sale Type */}
            <section className="bg-white rounded-lg border border-[#c6c6cd]/50 shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[#0F172A]">category</span>
                <h2 className="font-display text-lg font-semibold">Sale Type</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`relative cursor-pointer rounded-lg border-2 p-5 transition-all ${
                    saleType === "fabricated"
                      ? "border-[#0F172A] bg-[#0F172A]/5"
                      : "border-[#c6c6cd] hover:border-[#0F172A]"
                  }`}
                >
                  <input
                    type="radio"
                    name="sale_type"
                    value="fabricated"
                    checked={saleType === "fabricated"}
                    onChange={() => setSaleType("fabricated")}
                    className="sr-only"
                  />
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-[#0F172A]">Fabricated Sale</h3>
                    {saleType === "fabricated" && (
                      <span className="material-symbols-outlined text-[#0F172A]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    )}
                  </div>
                  <p className="text-sm text-[#505f76]">Iron processed by workers to customer spec.</p>
                </label>
                <label
                  className={`relative cursor-pointer rounded-lg border-2 p-5 transition-all ${
                    saleType === "raw_passthrough"
                      ? "border-[#0F172A] bg-[#0F172A]/5"
                      : "border-[#c6c6cd] hover:border-[#0F172A]"
                  }`}
                >
                  <input
                    type="radio"
                    name="sale_type"
                    value="raw_passthrough"
                    checked={saleType === "raw_passthrough"}
                    onChange={() => setSaleType("raw_passthrough")}
                    className="sr-only"
                  />
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-[#0F172A]">Raw Pass-through</h3>
                    {saleType === "raw_passthrough" && (
                      <span className="material-symbols-outlined text-[#0F172A]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    )}
                  </div>
                  <p className="text-sm text-[#505f76]">Sold directly without processing.</p>
                </label>
              </div>
            </section>

            {/* Sale Info */}
            <section className="bg-white rounded-lg border border-[#c6c6cd]/50 shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-[#0F172A]">info</span>
                <h2 className="font-display text-lg font-semibold">Sale Info</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#505f76]">
                    Customer
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    required
                    className="w-full h-[42px] border border-[#c6c6cd] rounded bg-white px-3 text-sm focus:border-[#0F172A] focus:ring-0 outline-none transition-all"
                  >
                    <option value="">Select customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.due_balance > 0 ? ` (${formatMoney(c.due_balance)} due)` : ""}
                      </option>
                    ))}
                  </select>
                  {selectedCustomer && selectedCustomer.due_balance > 0 && (
                    <p className="text-xs text-[#EAB308] flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[14px]">warning</span>
                      Customer due: {formatMoney(selectedCustomer.due_balance)}
                    </p>
                  )}
                </div>
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
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#505f76]">
                    Note (optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="w-full border border-[#c6c6cd] rounded bg-white p-3 text-sm focus:border-[#0F172A] focus:ring-0 outline-none transition-all resize-none"
                    placeholder="Delivery notes or special instructions..."
                  />
                </div>
              </div>
            </section>

            {/* Items */}
            <section className="bg-white rounded-lg border border-[#c6c6cd]/50 shadow-sm overflow-hidden">
              <div className="p-5 md:p-6 border-b border-[#c6c6cd]/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0F172A]">list_alt</span>
                  <h2 className="font-display text-lg font-semibold">Material Line Items</h2>
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
              <div className="p-5 md:p-6 bg-[#f2f4f6]/50 border-t border-[#c6c6cd]/50 flex justify-end">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-[#505f76] uppercase tracking-wider">Grand Total:</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#505f76]">
                      Amount Received (optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#505f76] font-mono">৳</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={grandTotal}
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        className="w-full h-[42px] pl-8 pr-3 border border-[#c6c6cd] rounded text-sm font-mono focus:border-[#0F172A] focus:ring-0 outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#505f76]">
                      Pay From Account
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
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
                </div>
              </div>
            </section>
          </div>

          {/* Right: Order Summary (Desktop) */}
          <div className="hidden lg:block space-y-6">
            <div className="bg-[#0F172A] text-white rounded-xl p-6 shadow-md sticky top-24">
              <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#059669]">receipt_long</span>
                Order Summary
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Total Items</span>
                  <span className="font-mono font-bold">{validItemsCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Total Weight</span>
                  <span className="font-mono font-bold">{totalWeight.toFixed(3)} kg</span>
                </div>
                <div className="border-t border-white/20 my-3" />
                <div className="flex justify-between items-center">
                  <span className="text-white/80 font-semibold">Total Amount</span>
                  <span className="font-mono text-lg font-bold text-[#059669]">{formatMoney(grandTotal)}</span>
                </div>
                {payAmount > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Receiving Now</span>
                      <span className="font-mono font-bold text-[#059669]">{formatMoney(payAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/20 pt-3">
                      <span className="text-white font-bold text-sm">Remaining Due</span>
                      <span className={`font-mono font-bold text-lg ${remainingDue > 0 ? "text-[#EAB308]" : "text-[#059669]"}`}>
                        {formatMoney(remainingDue)}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 h-12 bg-white text-[#0F172A] font-bold rounded-lg hover:bg-white/90 transition-all active:scale-95 shadow-sm disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">save</span>
                {submitting ? "Creating..." : "Save Sale"}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-[#EF4444] text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Mobile: Sticky Bottom Bar */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-[#c6c6cd] px-4 py-3 z-40 flex items-center justify-between shadow-lg">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#505f76] font-bold uppercase tracking-tight">
              {validItemsCount} Items
            </span>
            <span className="font-mono font-bold text-[#0F172A]">{formatMoney(grandTotal)}</span>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#0F172A] text-white px-6 py-3 rounded-lg font-bold text-sm flex items-center gap-2 active:scale-95 transition-all shadow-md disabled:opacity-40"
          >
            {submitting ? "Creating..." : "Save Sale"}
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
        </div>
      </form>

      <div className="md:hidden h-20" />
    </div>
  );
}
