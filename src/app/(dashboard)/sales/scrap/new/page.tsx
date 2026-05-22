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

export default function ScrapSalePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const accounts = accountsData ?? [];

  const today = new Date().toISOString().split("T")[0];
  const [saleDate, setSaleDate] = useState(today);
  const [buyerName, setBuyerName] = useState("");
  const [quantityKg, setQuantityKg] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [accountId, setAccountId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qty = parseFloat(quantityKg) || 0;
  const price = parseFloat(pricePerKg) || 0;
  const totalAmount = qty * price;

  const received = amountReceived === "" ? totalAmount : (parseFloat(amountReceived) || 0);

  function handleReceivedChange(value: string) {
    if (value === "") {
      setAmountReceived("");
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setAmountReceived(value);
    }
  }

  const createScrapSaleMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/sales/scrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create scrap sale");
      }
      return res.json();
    },
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["scrap"] });
      router.push(`/sales/${sale.id}`);
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

    if (!quantityKg || qty <= 0) {
      setError("Please enter a valid quantity");
      return;
    }
    if (!pricePerKg || price <= 0) {
      setError("Please enter a valid price per kg");
      return;
    }
    if (!accountId) {
      setError("Please select a payment account");
      return;
    }

    setSubmitting(true);
    setError(null);

    createScrapSaleMutation.mutate({
      sale_date: saleDate,
      buyer_name: buyerName || undefined,
      quantity_kg: qty,
      price_per_kg: price,
      total_amount: totalAmount,
      amount_received: received,
      account_id: accountId,
      note: note || undefined,
    });
  }

  return (
    <div className="p-4 md:p-8 pb-28 md:pb-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Sales', href: '/sales' }, { label: 'Scrap Sale', href: null }]} />
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/sales"
          className="w-9 h-9 flex items-center justify-center rounded-full border border-outline-variant text-secondary hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-display text-xl md:text-2xl font-bold text-primary-container">
          Sell Scrap
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-[600px] mx-auto space-y-6">
          {/* Scrap Sale Details */}
          <section className="bg-white rounded-lg border border-outline-variant/50 shadow-sm p-5 md:p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-primary-container">delete_sweep</span>
              <h2 className="font-display text-lg font-semibold">Scrap Sale Details</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Sale Date
                  </label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    required
                    className="w-full h-[44px] border border-outline-variant rounded bg-white px-3 text-sm focus:border-primary-container focus:ring-0 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Buyer Name <span className="font-normal normal-case text-[#8a9bb5]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    autoComplete="name"
                    enterKeyHint="next"
                    placeholder="e.g. Scrap Dealer"
                    className="w-full h-[44px] border border-outline-variant rounded bg-white px-3 text-sm focus:border-primary-container focus:ring-0 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Quantity (kg)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(e.target.value)}
                    required
                    autoComplete="off"
                    inputMode="decimal"
                    enterKeyHint="next"
                    placeholder="0"
                    className="w-full h-[44px] border border-outline-variant rounded bg-white px-3 text-sm font-mono focus:border-primary-container focus:ring-0 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Price per kg (৳)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-secondary font-mono">৳</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pricePerKg}
                      onChange={(e) => setPricePerKg(e.target.value)}
                      required
                      autoComplete="off"
                      inputMode="decimal"
                      enterKeyHint="next"
                      placeholder="0"
                      className="w-full h-[44px] pl-7 pr-3 border border-outline-variant rounded bg-white text-sm font-mono focus:border-primary-container focus:ring-0 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Total Amount */}
              <div className="bg-surface-container-low/70 rounded-lg p-4 flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-wider text-secondary">Total Amount</span>
                <span className="text-xl font-bold font-mono text-primary-container">
                  {totalAmount > 0 ? formatMoney(totalAmount) : "৳0"}
                </span>
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="bg-white rounded-lg border border-outline-variant/50 shadow-sm p-5 md:p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-primary-container">account_balance_wallet</span>
              <h2 className="font-display text-lg font-semibold">Payment</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Amount Received
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-secondary font-mono">৳</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amountReceived === "" ? "" : amountReceived}
                    onChange={(e) => handleReceivedChange(e.target.value)}
                    autoComplete="off"
                    inputMode="decimal"
                    enterKeyHint="next"
                    placeholder={totalAmount > 0 ? formatMoney(totalAmount).replace("৳", "") : "0"}
                    className="w-full h-[44px] pl-7 pr-3 border border-outline-variant rounded bg-white text-sm font-mono focus:border-primary-container focus:ring-0 outline-none transition-all"
                  />
                </div>
                <p className="text-[11px] text-[#8a9bb5]">
                  Leave empty to default to total amount ({totalAmount > 0 ? formatMoney(totalAmount) : "৳0"})
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Pay Into Account
                </label>
                {accountsLoading ? (
                  <div className="h-[44px] bg-surface-container-low rounded animate-pulse" />
                ) : (
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    required
                    className="w-full h-[44px] border border-outline-variant rounded bg-white px-3 text-sm focus:border-primary-container focus:ring-0 outline-none"
                  >
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatMoney(a.current_balance)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Note <span className="font-normal normal-case text-[#8a9bb5]">(optional)</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  autoComplete="off"
                  enterKeyHint="next"
                  className="w-full border border-outline-variant rounded bg-white p-3 text-sm focus:border-primary-container focus:ring-0 outline-none transition-all resize-none"
                  placeholder="Internal note..."
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-error text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Desktop submit */}
          <button
            type="submit"
            disabled={submitting}
            enterKeyHint="send"
            className="hidden md:flex w-full h-12 bg-primary-container text-white font-bold rounded-lg hover:bg-primary-container/90 transition-all active:scale-95 shadow-sm disabled:opacity-40 items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">sell</span>
            {submitting ? "Saving..." : "Record Scrap Sale"}
          </button>
        </div>
      </form>

      {/* Mobile sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-outline-variant/50 p-4 pb-6 shadow-lg z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-secondary uppercase tracking-wider">Total</span>
          <span className="text-lg font-bold font-mono text-primary-container">
            {totalAmount > 0 ? formatMoney(totalAmount) : "৳0"}
          </span>
        </div>
        <button
          type="submit"
          disabled={submitting}
          enterKeyHint="send"
          form=""
          onClick={(_e) => {
            const form = document.querySelector("form");
            if (form) form.requestSubmit();
          }}
          className="w-full h-12 bg-primary-container text-white font-bold rounded-lg hover:bg-primary-container/90 transition-all active:scale-95 shadow-sm disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">sell</span>
          {submitting ? "Saving..." : "Record Scrap Sale"}
        </button>
      </div>
    </div>
  );
}
