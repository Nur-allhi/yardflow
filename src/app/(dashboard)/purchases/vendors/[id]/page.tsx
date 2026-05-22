"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccounts } from "@/hooks/useAccounts";

interface VendorPurchase {
  id: string;
  purchase_date: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  status: "paid" | "partial" | "due";
  note: string | null;
}

interface VendorPayment {
  id: string;
  purchase_id: string;
  amount: number;
  payment_date: string;
  note: string | null;
  account_id: string;
  account_name: string | null;
}

interface VendorDetail {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  type: "shipyard" | "consumable" | "other";
  opening_balance: number;
  is_active: boolean;
  purchases: VendorPurchase[];
  payments: VendorPayment[];
  summary: {
    total_purchases: number;
    total_purchase_amount: number;
    total_paid: number;
    total_due: number;
  };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(n: number) {
  return n.toLocaleString("en-IN") + " tk";
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    paid: { bg: "bg-success/10", text: "text-success", label: "Paid" },
    partial: { bg: "bg-warning/10", text: "text-warning", label: "Partial" },
    due: { bg: "bg-error/10", text: "text-error", label: "Due" },
  };
  const s = map[status] || map.due;
  return (
    <span className={`px-2 py-1 ${s.bg} ${s.text} text-[10px] font-bold rounded uppercase tracking-wider`}>
      {s.label}
    </span>
  );
}

function getTypeChip(type: string) {
  if (type === "shipyard") {
    return { bg: "bg-secondary-container", text: "text-primary-container", label: "Shipyard" };
  }
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  return { bg: "bg-surface-container-highest", text: "text-secondary", label };
}

export default function VendorProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const queryClient = useQueryClient();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payPurchaseId, setPayPurchaseId] = useState("");
  const [payAccountId, setPayAccountId] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payNote, setPayNote] = useState("");
  const [payError, setPayError] = useState<string | null>(null);

  const { data: vendor, isLoading, error } = useQuery<VendorDetail>({
    queryKey: ["vendor", id],
    queryFn: async () => {
      const res = await fetch(`/api/purchases/vendors/${id}`);
      if (!res.ok) throw new Error("Failed to load vendor");
      return res.json();
    },
  });

  const { data: accountsData } = useAccounts();

  function openPaymentModal() {
    if (accountsData && accountsData.length > 0) {
      setPayAccountId(accountsData[0].id);
    }
    setPayAmount("");
    setPayPurchaseId("");
    setPayError(null);
    setShowPaymentModal(true);
  }

  const paymentMutation = useMutation({
    mutationFn: async (data: {
      payPurchaseId: string;
      amount: number;
      account_id: string;
      payment_date: string;
      note: string;
      vendorId: string;
      vendorName: string;
    }) => {
      const { payPurchaseId: purchaseId, amount, account_id, payment_date, note, vendorId, vendorName } = data;
      const url = purchaseId === "opening-balance"
        ? `/api/purchases/vendors/${vendorId}/pay-opening-balance`
        : `/api/purchases/${purchaseId}/payments`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          account_id,
          payment_date,
          note: note || `Payment against vendor: ${vendorName}`,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to record payment");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor", id] });
      setShowPaymentModal(false);
      setPayAmount("");
      setPayPurchaseId("");
      setPayNote("");
    },
    onError: (e) => {
      setPayError(e instanceof Error ? e.message : "Something went wrong");
    },
  });

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!vendor) return;

    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      setPayError("Please enter a valid amount");
      return;
    }
    if (!payPurchaseId) {
      setPayError("Please select a purchase to pay against");
      return;
    }

    if (payPurchaseId === "opening-balance") {
      if (amount > vendor.opening_balance) {
        setPayError("Amount cannot exceed the opening balance");
        return;
      }
    } else {
      const selectedPurchase = vendor.purchases.find((p) => p.id === payPurchaseId);
      if (selectedPurchase && amount > selectedPurchase.due_amount) {
        setPayError("Amount cannot exceed the selected purchase's due balance");
        return;
      }
    }

    paymentMutation.mutate({
      payPurchaseId,
      amount,
      account_id: payAccountId,
      payment_date: payDate,
      note: payNote || "",
      vendorId: vendor.id,
      vendorName: vendor.name,
    });
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-6 bg-surface-container-high rounded w-1/3" />
        <div className="h-12 bg-surface-container-high rounded w-1/2" />
        <div className="h-64 bg-surface-container-high rounded-xl" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-error font-medium text-lg mb-2">
            {error?.message || "Vendor not found"}
          </p>
          <Link
            href="/purchases/vendors"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-container text-white text-sm rounded-lg"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Vendors
          </Link>
        </div>
      </div>
    );
  }

  const typeChip = getTypeChip(vendor.type);
  const duePurchases = vendor.purchases.filter((p) => p.status !== "paid");

  return (
    <div className="p-4 md:p-8">
      {/* Back + Title */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/purchases/vendors"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-outline-variant text-secondary hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="font-display text-lg md:text-xl font-bold text-primary-container">
            {vendor.name}
          </h1>
          <span className={`inline-flex px-2 py-1 rounded text-[11px] font-semibold ${typeChip.bg} ${typeChip.text}`}>
            {typeChip.label}
          </span>
        </div>
        <div className="md:ml-auto">
          <button
            onClick={openPaymentModal}
            disabled={vendor.summary.total_due <= 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-container text-white font-bold text-sm rounded-lg hover:bg-primary-container/90 transition-all active:scale-95 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">payments</span>
            Record Payment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-7 space-y-6">
          {/* Vendor Info */}
          <div className="bg-white border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 md:px-6 py-4 border-b border-outline-variant/50 bg-surface-container-low">
              <h3 className="font-display font-bold text-primary-container flex items-center gap-2">
                <span className="material-symbols-outlined">business</span>
                Vendor Details
              </h3>
            </div>
            <div className="p-5 md:p-6 grid grid-cols-2 gap-y-5">
              <div>
                <p className="text-[10px] uppercase font-bold text-secondary tracking-wider mb-1">Phone</p>
                <p className="font-medium text-primary-container text-sm">{vendor.phone || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-secondary tracking-wider mb-1">Address</p>
                <p className="font-medium text-primary-container text-sm">{vendor.address || "—"}</p>
              </div>
            </div>
          </div>

          {/* Purchases Table */}
          <div className="bg-white border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 md:px-6 py-4 border-b border-outline-variant/50 bg-surface-container-low">
              <h3 className="font-display font-bold text-primary-container flex items-center gap-2">
                <span className="material-symbols-outlined">receipt_long</span>
                Purchase History
              </h3>
            </div>
            {vendor.purchases.length === 0 ? (
              <div className="p-6 text-center text-secondary text-sm">
                <span className="material-symbols-outlined text-3xl block mb-2 text-outline-variant">receipt_long</span>
                No purchases recorded for this vendor
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-high border-b border-outline-variant">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase text-secondary tracking-wider">Date</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase text-secondary tracking-wider text-right">Total</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase text-secondary tracking-wider text-right">Paid</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase text-secondary tracking-wider text-right">Due</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase text-secondary tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {vendor.purchases.map((p) => (
                      <tr key={p.id} className="hover:bg-surface-bright">
                        <td className="px-6 py-4">
                          <Link href={`/purchases/${p.id}`} className="font-medium text-sm text-primary-container hover:text-tertiary hover:underline">
                            {formatDate(p.purchase_date)}
                          </Link>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-right">{formatMoney(p.total_amount)}</td>
                        <td className="px-6 py-4 font-mono text-sm text-right">{formatMoney(p.paid_amount)}</td>
                        <td className={`px-6 py-4 font-mono text-sm text-right font-bold ${p.due_amount > 0 ? "text-warning" : "text-success"}`}>
                          {formatMoney(p.due_amount)}
                        </td>
                        <td className="px-6 py-4"><StatusChip status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-5 space-y-6">
          {/* Financial Summary */}
          <div className="bg-primary-container text-white rounded-xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/10 blur-[60px] rounded-full -mr-16 -mt-16" />
            <h3 className="font-display font-bold text-lg mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary">account_balance_wallet</span>
              Financial Summary
            </h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Opening Balance</span>
                <span className="font-mono font-bold text-white">{formatMoney(vendor.opening_balance)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Total Purchases</span>
                <span className="font-mono font-bold text-white">{formatMoney(vendor.summary.total_purchase_amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Total Paid</span>
                <span className="font-mono font-bold text-tertiary">{formatMoney(vendor.summary.total_paid)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/20 pt-4">
                <span className="text-white font-bold text-sm">Total Due</span>
                <span className={`font-mono font-bold text-lg ${vendor.summary.total_due > 0 ? "text-warning" : "text-tertiary"}`}>
                  {formatMoney(vendor.summary.total_due)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 md:px-6 py-4 border-b border-outline-variant/50 bg-surface-container-low">
              <h3 className="font-display font-bold text-primary-container text-sm uppercase tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">history</span>
                Payment History
              </h3>
            </div>
            {vendor.payments.length === 0 ? (
              <div className="p-6 text-center text-secondary text-sm">
                <span className="material-symbols-outlined text-3xl block mb-2 text-outline-variant">payments</span>
                No payments recorded yet
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/30">
                {vendor.payments.map((pmt) => (
                  <div key={pmt.id} className="p-5 md:p-6 flex items-start gap-4 bg-tertiary/5">
                    <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined">done_all</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-mono font-bold text-primary-container">{formatMoney(pmt.amount)}</p>
                        <p className="text-xs text-secondary font-medium">{formatDate(pmt.payment_date)}</p>
                      </div>
                      <p className="text-xs text-secondary">
                        <span className="font-bold">Account:</span> {pmt.account_name || "—"}
                      </p>
                      {pmt.note && <p className="text-xs text-secondary italic mt-1">&ldquo;{pmt.note}&rdquo;</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="p-5 md:p-6 border-t border-outline-variant/50">
              <button
                onClick={openPaymentModal}
                disabled={vendor.summary.total_due <= 0}
                className="w-full py-3 rounded-lg border-2 border-dashed border-outline-variant hover:border-primary-container hover:text-primary-container transition-all text-secondary font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <span className="material-symbols-outlined">add</span>
                Record Payment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Fixed Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-outline-variant px-4 py-3 z-40 shadow-lg">
        <button
          onClick={openPaymentModal}
          disabled={vendor.summary.total_due <= 0}
          className="w-full h-12 bg-primary-container text-white font-bold rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md disabled:opacity-40"
        >
          <span className="material-symbols-outlined">payments</span>
          Record Payment
        </button>
      </div>
      <div className="md:hidden h-16" />

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-primary-container/40 backdrop-blur-sm p-4">
          <div className="absolute inset-0" onClick={() => setShowPaymentModal(false)} />
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg border border-outline-variant/30 relative z-10 overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-0">
              <h2 className="font-display font-bold text-xl text-primary-container">Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-secondary hover:text-primary-container transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mx-6 mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-secondary">Total Due</span>
                <span className="font-mono font-bold text-warning text-lg">{formatMoney(vendor.summary.total_due)}</span>
              </div>
              <div className="text-xs text-secondary mt-1">
                Opening: {formatMoney(vendor.opening_balance)} + Purchase Dues: {formatMoney(vendor.summary.total_due - vendor.opening_balance)}
              </div>
            </div>

            <form onSubmit={handlePayment} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Pay Against Purchase <span className="text-error">*</span>
                </label>
                <select
                  value={payPurchaseId}
                  onChange={(e) => {
                    setPayPurchaseId(e.target.value);
                    if (e.target.value === "opening-balance") {
                      setPayAmount(String(Math.ceil(vendor.opening_balance)));
                    } else {
                      const p = vendor.purchases.find((pp) => pp.id === e.target.value);
                      if (p) setPayAmount(String(Math.ceil(p.due_amount)));
                    }
                  }}
                  required
                  className="w-full h-[42px] border border-outline-variant rounded bg-white px-3 text-sm focus:border-primary-container focus:ring-0 outline-none"
                >
                  <option value="">Select a purchase</option>
                  {vendor.opening_balance > 0 && (
                    <option value="opening-balance">
                      Opening Balance — Due: {formatMoney(vendor.opening_balance)}
                    </option>
                  )}
                  {duePurchases.map((p) => (
                    <option key={p.id} value={p.id}>
                      {formatDate(p.purchase_date)} — Due: {formatMoney(p.due_amount)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-secondary">৳</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    required
                    className="w-full h-[42px] pl-8 pr-3 border border-outline-variant rounded text-sm font-mono focus:border-primary-container focus:ring-0 outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">Pay From Account</label>
                <select
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  required
                  className="w-full h-[42px] border border-outline-variant rounded bg-white px-3 text-sm focus:border-primary-container focus:ring-0 outline-none"
                >
                  <option value="">Select account</option>
                  {accountsData?.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatMoney(a.current_balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">Payment Date</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  required
                  className="w-full h-[42px] border border-outline-variant rounded bg-white px-3 text-sm focus:border-primary-container focus:ring-0 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">Note (optional)</label>
                <textarea
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  rows={2}
                  className="w-full border border-outline-variant rounded bg-white p-3 text-sm focus:border-primary-container focus:ring-0 outline-none resize-none"
                  placeholder="Additional note..."
                />
              </div>

              {payError && <p className="text-sm text-error font-medium">{payError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 h-[42px] bg-transparent text-secondary hover:bg-surface-container-low transition-colors font-bold text-sm rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                    disabled={paymentMutation.isPending}
                  className="flex-1 h-[42px] bg-primary-container text-white hover:bg-primary-container/90 transition-all active:scale-95 font-bold text-sm rounded shadow-md disabled:opacity-40"
                >
                    {paymentMutation.isPending ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
