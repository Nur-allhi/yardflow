"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumb";
import { useCustomers } from "@/hooks/useCustomers";
import { useAccounts } from "@/hooks/useAccounts";

interface LineItem {
  key: number;
  description: string;
  quantity_kg: string;
  price_per_kg: string;
}

function formatMoney(n: number) {
  return n.toLocaleString("en-IN") + " tk";
}

function calcLineTotal(item: LineItem) {
  const qty = parseFloat(item.quantity_kg) || 0;
  const price = parseFloat(item.price_per_kg) || 0;
  return qty * price;
}

export default function NewSimpleSalePage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/simple/mode")
      .then(r => r.json())
      .then(data => {
        if (data.mode === "detailed") router.replace("/sales");
      })
      .catch(() => {});
  }, [router]);

  const queryClient = useQueryClient();

  const { data: customersData } = useCustomers();
  const { data: accountsData } = useAccounts();

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [saleType, setSaleType] = useState<"fabricated" | "raw_passthrough">("fabricated");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
  const [paidAmount, setPaidAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<LineItem[]>([
    { key: 1, description: "", quantity_kg: "", price_per_kg: "" },
  ]);
  const nextKey = useRef(2);

  const customers = customersData ?? [];
  const accounts = accountsData ?? [];
  const showCustomerNameInput = !customerId;

  function handleItemChange(key: number, field: keyof LineItem, value: string) {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { key: nextKey.current++, description: "", quantity_kg: "", price_per_kg: "" },
    ]);
  }

  function removeItem(key: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.key !== key));
  }

  const grandTotal = items.reduce((sum, item) => sum + calcLineTotal(item), 0);
  const payAmount = parseFloat(paidAmount) || 0;

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/simple/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || JSON.stringify(err) || "Failed to create sale");
      }
      return res.json();
    },
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: ["simple-sales"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      router.push(`/sales-simple/${sale.id}`);
    },
    onError: (e) => {
      setError(e instanceof Error ? e.message : "Something went wrong");
    },
    onSettled: () => {
      setSubmitting(false);
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validItems = items.filter((item) => item.description && item.quantity_kg && item.price_per_kg);
    if (validItems.length === 0) {
      setError("Please add at least one item with complete details");
      return;
    }

    const pa = payAmount;
    if (pa > 0 && !accountId) {
      setError("Please select an account for payment");
      return;
    }

    setSubmitting(true);

    createMutation.mutate({
      customer_id: customerId || undefined,
      customer_name: showCustomerNameInput ? customerName || undefined : undefined,
      sale_type: saleType,
      sale_date: saleDate,
      note: note || undefined,
      items: validItems.map((item) => ({
        description: item.description,
        quantity_kg: parseFloat(item.quantity_kg),
        price_per_kg: parseFloat(item.price_per_kg),
      })),
      paid_amount: pa > 0 ? pa : undefined,
      account_id: accountId || undefined,
    });
  }

  return (
    <div className="p-4 md:p-8">
      <Breadcrumb items={[{ label: "Dashboard", href: "/" }, { label: "Simple Sales", href: "/sales-simple" }, { label: "New Sale", href: null }]} />
      <div className="flex items-center gap-3 mb-6">
        <Link href="/sales-simple" className="w-9 h-9 flex items-center justify-center rounded-full border border-outline-variant text-secondary hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-display text-xl md:text-2xl font-bold text-primary-container">New Simple Sale</h1>
        <Link href="/sales-simple/new/quick" className="ml-auto text-tertiary text-xs font-bold hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">bolt</span>
          Quick Cash
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-lg border border-outline-variant/50 shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary-container">category</span>
                <h2 className="font-display text-lg font-semibold">Sale Type</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(["fabricated", "raw_passthrough"] as const).map((type) => (
                  <label
                    key={type}
                    className={`relative cursor-pointer rounded-lg border-2 p-5 transition-all ${
                      saleType === type ? "border-primary-container bg-primary-container/5" : "border-outline-variant hover:border-primary-container"
                    }`}
                  >
                    <input type="radio" name="sale_type" value={type} checked={saleType === type} onChange={() => setSaleType(type)} className="sr-only" />
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-primary-container">{type === "fabricated" ? "Fabricated Sale" : "Raw Pass-through"}</h3>
                      {saleType === type && <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                    </div>
                    <p className="text-sm text-secondary">{type === "fabricated" ? "Processed by workers to customer spec." : "Sold directly without processing."}</p>
                  </label>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-lg border border-outline-variant/50 shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-primary-container">info</span>
                <h2 className="font-display text-lg font-semibold">Sale Info</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">Customer</label>
                  <select
                    value={customerId}
                    onChange={(e) => { setCustomerId(e.target.value); setCustomerName(""); }}
                    className="w-full h-[44px] border border-outline-variant rounded bg-white px-3 text-sm focus:border-primary-container focus:ring-0 outline-none transition-all"
                  >
                    <option value="">Select customer (or enter name below)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.due_balance > 0 ? ` (${formatMoney(c.due_balance)} due)` : ""}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">Sale Date</label>
                  <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} required className="w-full h-[44px] border border-outline-variant rounded bg-white px-3 text-sm focus:border-primary-container focus:ring-0 outline-none transition-all" />
                </div>
                {showCustomerNameInput && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-secondary">Customer Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full h-[44px] border border-outline-variant rounded bg-white px-3 text-sm focus:border-primary-container focus:ring-0 outline-none transition-all"
                      placeholder="Walk-in customer name"
                    />
                  </div>
                )}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">Note (optional)</label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full border border-outline-variant rounded bg-white p-3 text-sm focus:border-primary-container focus:ring-0 outline-none transition-all resize-none" placeholder="Delivery notes or special instructions..." />
                </div>
              </div>
            </section>

            <section className="bg-white rounded-lg border border-outline-variant/50 shadow-sm overflow-hidden">
              <div className="p-5 md:p-6 border-b border-outline-variant/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container">list_alt</span>
                  <h2 className="font-display text-lg font-semibold">Line Items</h2>
                </div>
                <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-tertiary hover:bg-tertiary/5 px-3 py-1.5 rounded transition-all text-sm font-bold">
                  <span className="material-symbols-outlined text-sm">add</span>
                  Add Item
                </button>
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low border-b border-outline-variant/50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Description</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary text-right">Qty (kg)</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary text-right">Price/kg</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary text-right">Total</th>
                      <th className="px-6 py-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {items.map((item) => (
                      <tr key={item.key} className="hover:bg-background">
                        <td className="px-6 py-3">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(item.key, "description", e.target.value)}
                            className="w-full h-[38px] border border-outline-variant rounded px-2 text-sm focus:border-primary-container outline-none"
                            placeholder="Item description"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={item.quantity_kg}
                            onChange={(e) => handleItemChange(item.key, "quantity_kg", e.target.value)}
                            autoComplete="off"
                            inputMode="decimal"
                            className="w-full h-[38px] border border-outline-variant rounded px-2 text-sm text-right font-mono focus:border-primary-container outline-none"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-secondary">৳</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.price_per_kg}
                              onChange={(e) => handleItemChange(item.key, "price_per_kg", e.target.value)}
                              autoComplete="off"
                              inputMode="decimal"
                              className="w-full h-[38px] pl-5 border border-outline-variant rounded px-2 text-sm text-right font-mono focus:border-primary-container outline-none"
                              placeholder="0"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right font-mono text-sm font-semibold">
                          ৳{calcLineTotal(item).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-3 text-center">
                          {items.length > 1 && (
                            <button type="button" onClick={() => removeItem(item.key)} className="text-error hover:bg-red-50 p-1 rounded transition-colors">
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3 p-4">
                {items.map((item) => (
                  <div key={item.key} className="border border-outline-variant/50 rounded-lg p-3 space-y-3">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(item.key, "description", e.target.value)}
                      className="w-full h-[38px] border border-outline-variant rounded px-2 text-sm outline-none"
                      placeholder="Item description"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-secondary block mb-1">Qty (kg)</label>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={item.quantity_kg}
                          onChange={(e) => handleItemChange(item.key, "quantity_kg", e.target.value)}
                          autoComplete="off"
                          inputMode="decimal"
                          className="w-full h-[38px] border border-outline-variant rounded px-2 text-sm font-mono outline-none"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-secondary block mb-1">Price/kg</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-secondary">৳</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price_per_kg}
                            onChange={(e) => handleItemChange(item.key, "price_per_kg", e.target.value)}
                            autoComplete="off"
                            inputMode="decimal"
                            className="w-full h-[38px] pl-5 border border-outline-variant rounded px-2 text-sm font-mono outline-none"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-outline-variant/50">
                      <span className="text-sm font-mono font-bold">৳{calcLineTotal(item).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      {items.length > 1 && <button type="button" onClick={() => removeItem(item.key)} className="text-error text-xs font-bold">Remove</button>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 md:p-6 bg-surface-container-low/50 border-t border-outline-variant/50 flex justify-end">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-secondary uppercase tracking-wider">Grand Total:</span>
                  <span className="text-xl font-bold font-mono text-primary-container">{formatMoney(grandTotal)}</span>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-lg border border-outline-variant/50 shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-primary-container">account_balance_wallet</span>
                <h2 className="font-display text-lg font-semibold">Payment</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">Amount Received</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-secondary font-mono">৳</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      autoComplete="off"
                      inputMode="decimal"
                      className="w-full h-[44px] pl-8 pr-3 border border-outline-variant rounded text-sm font-mono focus:border-primary-container focus:ring-0 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">Payment Account</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full h-[44px] border border-outline-variant rounded bg-white px-3 text-sm focus:border-primary-container focus:ring-0 outline-none"
                  >
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({formatMoney(a.current_balance)})</option>
                    ))}
                  </select>
                </div>
              </div>
              {payAmount > 0 && (
                <div className="md:hidden bg-primary-container text-white rounded-xl p-4 mt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/70">Receiving Now</span>
                    <span className="font-mono font-bold">{formatMoney(payAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/10 pt-3">
                    <span className="text-xs text-white/70">Remaining Due</span>
                    <span className={`font-mono font-bold text-lg ${grandTotal - payAmount > 0 ? "text-warning" : "text-tertiary-fixed"}`}>{formatMoney(grandTotal - payAmount)}</span>
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="hidden lg:block space-y-6">
            <div className="bg-primary-container text-white rounded-xl p-6 shadow-md sticky top-24">
              <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">receipt_long</span>
                Order Summary
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Total Items</span>
                  <span className="font-mono font-bold">{items.length}</span>
                </div>
                <div className="border-t border-white/20 my-3" />
                <div className="flex justify-between items-center">
                  <span className="text-white/80 font-semibold">Total Amount</span>
                  <span className="font-mono text-lg font-bold text-tertiary">{formatMoney(grandTotal)}</span>
                </div>
                {payAmount > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Receiving Now</span>
                      <span className="font-mono font-bold text-tertiary">{formatMoney(payAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/20 pt-3">
                      <span className="text-white font-bold text-sm">Remaining Due</span>
                      <span className={`font-mono font-bold text-lg ${grandTotal - payAmount > 0 ? "text-warning" : "text-tertiary"}`}>{formatMoney(grandTotal - payAmount)}</span>
                    </div>
                  </>
                )}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 h-12 bg-white text-primary-container font-bold rounded-lg hover:bg-white/90 transition-all active:scale-95 shadow-sm disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">save</span>
                    Save Sale
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-error text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-outline-variant px-4 py-3 z-40 shadow-lg">
          <div className="flex items-center gap-3">
            <Link href="/sales-simple" className="flex-1 h-12 border border-primary-container text-primary-container font-bold rounded-lg flex items-center justify-center active:scale-95 transition-all">Cancel</Link>
            <button type="submit" disabled={submitting} className="flex-[2] h-12 bg-primary-container text-white font-bold rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md disabled:opacity-40">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">save</span>
                  Save Sale
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="md:hidden h-20" />
    </div>
  );
}
