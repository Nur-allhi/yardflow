"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumb";
import { useAccounts } from "@/hooks/useAccounts";

function formatMoney(n: number) {
  return n.toLocaleString("en-IN") + " tk";
}

export default function QuickCashSalePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: accountsData } = useAccounts();

  const [customerName, setCustomerName] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [quantityKg, setQuantityKg] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [accountId, setAccountId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qty = parseFloat(quantityKg) || 0;
  const price = parseFloat(pricePerKg) || 0;
  const totalAmount = qty * price;

  const accounts = accountsData ?? [];

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

    if (!description || !quantityKg || !pricePerKg) {
      setError("Please fill in all item details");
      return;
    }

    if (!accountId) {
      setError("Please select an account (quick cash requires immediate payment)");
      return;
    }

    setSubmitting(true);

    createMutation.mutate({
      customer_name: customerName || undefined,
      sale_type: "raw_passthrough",
      is_quick_cash_sale: true,
      sale_date: saleDate,
      note: note || undefined,
      items: [{ description, quantity_kg: qty, price_per_kg: price }],
      paid_amount: totalAmount,
      account_id: accountId,
    });
  }

  return (
    <div className="p-4 md:p-8">
      <Breadcrumb items={[{ label: "Dashboard", href: "/" }, { label: "Simple Sales", href: "/sales-simple" }, { label: "Quick Cash", href: null }]} />
      <div className="flex items-center gap-3 mb-6">
        <Link href="/sales-simple/new" className="w-9 h-9 flex items-center justify-center rounded-full border border-outline-variant text-secondary hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-display text-xl md:text-2xl font-bold text-primary-container">Quick Cash Sale</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-lg border border-outline-variant/50 shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-primary-container">person</span>
                <h2 className="font-display text-lg font-semibold">Customer</h2>
              </div>
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
            </section>

            <section className="bg-white rounded-lg border border-outline-variant/50 shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-primary-container">info</span>
                <h2 className="font-display text-lg font-semibold">Sale Info</h2>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">Sale Date</label>
                <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} required className="w-full h-[44px] border border-outline-variant rounded bg-white px-3 text-sm focus:border-primary-container focus:ring-0 outline-none transition-all" />
              </div>
            </section>

            <section className="bg-white rounded-lg border border-outline-variant/50 shadow-sm overflow-hidden">
              <div className="p-5 md:p-6 border-b border-outline-variant/50">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container">inventory_2</span>
                  <h2 className="font-display text-lg font-semibold">Item</h2>
                </div>
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low border-b border-outline-variant/50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Description</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary text-right">Qty (kg)</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary text-right">Price/kg</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-background">
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full h-[38px] border border-outline-variant rounded px-2 text-sm focus:border-primary-container outline-none"
                          placeholder="Item description"
                          required
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={quantityKg}
                          onChange={(e) => setQuantityKg(e.target.value)}
                          autoComplete="off"
                          inputMode="decimal"
                          className="w-full h-[38px] border border-outline-variant rounded px-2 text-sm text-right font-mono focus:border-primary-container outline-none"
                          placeholder="0"
                          required
                        />
                      </td>
                      <td className="px-6 py-3">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-secondary">৳</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={pricePerKg}
                            onChange={(e) => setPricePerKg(e.target.value)}
                            autoComplete="off"
                            inputMode="decimal"
                            className="w-full h-[38px] pl-5 border border-outline-variant rounded px-2 text-sm text-right font-mono focus:border-primary-container outline-none"
                            placeholder="0"
                            required
                          />
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-sm font-semibold">
                        ৳{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="md:hidden p-4 space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-secondary block mb-1">Description</label>
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-[38px] border border-outline-variant rounded px-2 text-sm outline-none" placeholder="Item description" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-secondary block mb-1">Qty (kg)</label>
                    <input type="number" step="0.001" min="0" value={quantityKg} onChange={(e) => setQuantityKg(e.target.value)} autoComplete="off" inputMode="decimal" className="w-full h-[38px] border border-outline-variant rounded px-2 text-sm font-mono outline-none" placeholder="0" required />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-secondary block mb-1">Price/kg</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-secondary">৳</span>
                      <input type="number" step="0.01" min="0" value={pricePerKg} onChange={(e) => setPricePerKg(e.target.value)} autoComplete="off" inputMode="decimal" className="w-full h-[38px] pl-5 border border-outline-variant rounded px-2 text-sm font-mono outline-none" placeholder="0" required />
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-dashed border-outline-variant/50 flex justify-end">
                  <span className="text-sm font-mono font-bold">Total: ৳{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-lg border border-outline-variant/50 shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-primary-container">account_balance_wallet</span>
                <h2 className="font-display text-lg font-semibold">Payment</h2>
              </div>
              <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-secondary">Auto-pay amount</span>
                  <span className="font-mono font-bold text-success text-lg">{formatMoney(totalAmount)}</span>
                </div>
                <p className="text-xs text-secondary mt-1">Quick cash sales are paid in full immediately.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">Payment Account</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  required
                  className="w-full h-[44px] border border-outline-variant rounded bg-white px-3 text-sm focus:border-primary-container focus:ring-0 outline-none"
                >
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({formatMoney(a.current_balance)})</option>
                  ))}
                </select>
              </div>
              <div className="mt-4 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">Note (optional)</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full border border-outline-variant rounded bg-white p-3 text-sm focus:border-primary-container focus:ring-0 outline-none resize-none" placeholder="Quick cash note..." />
              </div>
            </section>
          </div>

          <div className="hidden lg:block space-y-6">
            <div className="bg-primary-container text-white rounded-xl p-6 shadow-md sticky top-24">
              <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">bolt</span>
                Quick Summary
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Total Amount</span>
                  <span className="font-mono text-lg font-bold text-tertiary">{formatMoney(totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-success">
                  <span className="text-sm font-bold">Paid Now</span>
                  <span className="font-mono font-bold">{formatMoney(totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-white/20 pt-3">
                  <span className="text-white font-bold text-sm">Status</span>
                  <span className="px-2 py-0.5 bg-success/20 text-success text-[10px] font-bold rounded uppercase">Paid</span>
                </div>
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
                    <span className="material-symbols-outlined text-lg">payments</span>
                    Complete Quick Sale
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
            <Link href="/sales-simple/new" className="flex-1 h-12 border border-primary-container text-primary-container font-bold rounded-lg flex items-center justify-center active:scale-95 transition-all">Cancel</Link>
            <button type="submit" disabled={submitting} className="flex-[2] h-12 bg-primary-container text-white font-bold rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md disabled:opacity-40">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">payments</span>
                  Complete
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
