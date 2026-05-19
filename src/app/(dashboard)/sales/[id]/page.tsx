"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface SaleItem {
  id: string;
  subtype_id: string;
  quantity_kg: number;
  price_per_kg: number;
  total_amount: number;
  subtype_name: string | null;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  note: string | null;
  account_id: string;
  account_name: string | null;
}

interface SaleDetail {
  id: string;
  customer_id: string | null;
  sale_date: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  status: "paid" | "partial" | "due";
  sale_type: "fabricated" | "raw_passthrough" | "scrap" | null;
  note: string | null;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  is_quick_cash: boolean;
  items: SaleItem[];
  payments: Payment[];
}

interface Account {
  id: string;
  name: string;
  type: string;
  current_balance: number;
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
  return "৳" + n.toLocaleString("en-IN");
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    paid: { bg: "bg-success/10", text: "text-success", label: "Paid" },
    partial: { bg: "bg-warning/10", text: "text-warning", label: "Partial" },
    due: { bg: "bg-error/10", text: "text-error", label: "Due" },
  };
  const s = map[status] || map.due;
  return (
    <span
      className={`px-2 py-1 ${s.bg} ${s.text} text-[10px] font-bold rounded uppercase tracking-wider`}
    >
      {s.label}
    </span>
  );
}

function TypeChip({ type, isQuickCash }: { type: string | null; isQuickCash: boolean }) {
  if (isQuickCash) {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[#059669] text-[#059669] bg-[#059669]/5 uppercase">
        Quick Cash
      </span>
    );
  }
  const map: Record<string, { border: string; text: string; bg: string; label: string }> = {
    fabricated: { border: "border-[#0F172A]", text: "text-[#0F172A]", bg: "bg-[#0F172A]/5", label: "Fabricated" },
    raw_passthrough: { border: "border-[#505f76]", text: "text-[#505f76]", bg: "bg-[#505f76]/5", label: "Raw" },
    scrap: { border: "border-[#059669]", text: "text-[#059669]", bg: "bg-[#059669]/5", label: "Scrap" },
  };
  const s = map[type || ""] || map.fabricated;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${s.border} ${s.text} ${s.bg} uppercase`}>
      {s.label}
    </span>
  );
}

export default function SaleDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [payAmount, setPayAmount] = useState("");
  const [payAccountId, setPayAccountId] = useState("");
  const [payDate, setPayDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [payNote, setPayNote] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const loadSale = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sales/${id}`);
      if (!res.ok) throw new Error("Sale not found");
      const data = await res.json();
      setSale(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadAccounts = useCallback(async () => {
    const res = await fetch("/api/accounts");
    if (res.ok) {
      const data = await res.json();
      setAccounts(data);
      if (data.length > 0) setPayAccountId(data[0].id);
    }
  }, []);

  useEffect(() => {
    loadSale();
  }, [loadSale]);

  function openPaymentModal() {
    loadAccounts();
    setPayAmount(
      sale ? String(Math.ceil(sale.due_amount)) : "",
    );
    setPayError(null);
    setShowPaymentModal(true);
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!sale) return;

    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      setPayError("Please enter a valid amount");
      return;
    }
    if (amount > sale.due_amount) {
      setPayError("Amount cannot exceed due balance");
      return;
    }

    setPaying(true);
    setPayError(null);

    try {
      const res = await fetch(`/api/sales/${id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          account_id: payAccountId,
          payment_date: payDate,
          note: payNote || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to record payment");
      }

      setShowPaymentModal(false);
      setPayAmount("");
      setPayNote("");
      await loadSale();
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPaying(false);
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-6 bg-[#e6e8ea] rounded w-1/3" />
        <div className="h-12 bg-[#e6e8ea] rounded w-1/2" />
        <div className="h-64 bg-[#e6e8ea] rounded-xl" />
      </div>
    );
  }

  // Error
  if (error || !sale) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-[#EF4444] font-medium text-lg mb-2">
            {error || "Sale not found"}
          </p>
          <Link
            href="/sales"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white text-sm rounded-lg"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Sales
          </Link>
        </div>
      </div>
    );
  }

  const paidPercent =
    sale.total_amount > 0
      ? ((sale.paid_amount / sale.total_amount) * 100).toFixed(1)
      : "0";

  return (
    <div className="p-4 md:p-8">
      {/* Back + Title */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/sales"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-[#c6c6cd] text-[#505f76] hover:bg-[#f2f4f6] transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="font-display text-lg md:text-xl font-bold text-[#0F172A]">
            Sale #SAL-{id.slice(0, 4).toUpperCase()}
          </h1>
          <StatusChip status={sale.status} />
        </div>
        <div className="md:ml-auto">
          <button
            onClick={openPaymentModal}
            disabled={sale.status === "paid"}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0F172A] text-white font-bold text-sm rounded-lg hover:bg-[#0F172A]/90 transition-all active:scale-95 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">payments</span>
            {sale.status === "paid" ? "Fully Paid" : "Record Payment"}
          </button>
        </div>
      </div>

      {/* Desktop: Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-7 space-y-6">
          {/* Sale Info */}
          <div className="bg-white border border-[#c6c6cd]/50 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 md:px-6 py-4 border-b border-[#c6c6cd]/50 bg-[#f2f4f6]">
              <h3 className="font-display font-bold text-[#0F172A] flex items-center gap-2">
                <span className="material-symbols-outlined">info</span>
                Sale Information
              </h3>
            </div>
            <div className="p-5 md:p-6 grid grid-cols-2 gap-y-5">
              <div>
                <p className="text-[10px] uppercase font-bold text-[#505f76] tracking-wider mb-1">
                  Customer
                </p>
                {sale.is_quick_cash ? (
                  <span className="italic text-[#505f76] text-sm">Cash Sale</span>
                ) : (
                  <>
                    <p className="font-medium text-[#0F172A] text-sm">
                      {sale.customer_name || "—"}
                    </p>
                    {sale.customer_phone && (
                      <p className="text-xs text-[#505f76]">{sale.customer_phone}</p>
                    )}
                  </>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#505f76] tracking-wider mb-1">
                  Sale Type
                </p>
                <TypeChip type={sale.sale_type} isQuickCash={sale.is_quick_cash} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#505f76] tracking-wider mb-1">
                  Sale Date
                </p>
                <p className="font-medium text-[#0F172A] text-sm">
                  {formatDate(sale.sale_date)}
                </p>
              </div>
              {sale.note && (
                <div className="col-span-2">
                  <p className="text-[10px] uppercase font-bold text-[#505f76] tracking-wider mb-1">
                    Note
                  </p>
                  <p className="text-sm text-[#0F172A] italic">
                    &ldquo;{sale.note}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white border border-[#c6c6cd]/50 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 md:px-6 py-4 border-b border-[#c6c6cd]/50 bg-[#f2f4f6]">
              <h3 className="font-display font-bold text-[#0F172A] flex items-center gap-2">
                <span className="material-symbols-outlined">list_alt</span>
                Line Items
              </h3>
            </div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#e6e8ea] border-b border-[#c6c6cd]">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase text-[#505f76] tracking-wider">
                      Sub-type
                    </th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase text-[#505f76] tracking-wider text-right">
                      Qty (kg)
                    </th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase text-[#505f76] tracking-wider text-right">
                      Price/kg
                    </th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase text-[#505f76] tracking-wider text-right">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c6c6cd]/30">
                  {sale.items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-6 py-4 text-sm font-bold text-[#0F172A]">
                        {item.subtype_name || "—"}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-right">
                        {item.quantity_kg.toFixed(3)}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-right">
                        {formatMoney(item.price_per_kg)}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-right font-semibold">
                        {formatMoney(item.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#f2f4f6] border-t-2 border-[#0F172A]/10">
                    <td
                      colSpan={3}
                      className="px-6 py-4 font-display font-bold text-[#0F172A] text-right uppercase tracking-widest text-xs"
                    >
                      Total Amount
                    </td>
                    <td className="px-6 py-4 font-mono text-right text-lg font-bold text-[#0F172A]">
                      {formatMoney(sale.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Items */}
            <div className="md:hidden space-y-3 p-4">
              {sale.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg p-4 border border-[#c6c6cd]/30"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-[#0F172A] text-sm">
                      {item.subtype_name || "—"}
                    </h4>
                    <span className="font-mono text-sm font-bold">
                      {formatMoney(item.total_amount)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-[#505f76] uppercase font-bold">
                        Quantity
                      </p>
                      <p className="font-mono text-sm">
                        {item.quantity_kg.toFixed(3)} kg
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#505f76] uppercase font-bold">
                        Price/kg
                      </p>
                      <p className="font-mono text-sm">
                        {formatMoney(item.price_per_kg)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-5 space-y-6">
          {/* Financial Summary */}
          <div className="bg-[#0F172A] text-white rounded-xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#059669]/10 blur-[60px] rounded-full -mr-16 -mt-16" />
            <h3 className="font-display font-bold text-lg mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#059669]">
                account_balance_wallet
              </span>
              Financial Summary
            </h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Total Amount</span>
                <span className="font-mono font-bold text-white">
                  {formatMoney(sale.total_amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Total Paid</span>
                <span className="font-mono font-bold text-[#059669]">
                  {formatMoney(sale.paid_amount)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-white/20 pt-4">
                <span className="text-white font-bold text-sm">
                  Balance Due
                </span>
                <span
                  className={`font-mono font-bold text-lg ${
                    sale.due_amount > 0 ? "text-[#EAB308]" : "text-[#059669]"
                  }`}
                >
                  {formatMoney(sale.due_amount)}
                </span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                <span className="text-[#059669]">Paid {paidPercent}%</span>
                <span className="text-white/50">Due {100 - Number(paidPercent)}%</span>
              </div>
              <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-[#059669] rounded-full transition-all duration-500"
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white border border-[#c6c6cd]/50 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 md:px-6 py-4 border-b border-[#c6c6cd]/50 bg-[#f2f4f6]">
              <h3 className="font-display font-bold text-[#0F172A] text-sm uppercase tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">history</span>
                Payment Ledger
              </h3>
            </div>
            {sale.payments.length === 0 ? (
              <div className="p-6 text-center text-[#505f76] text-sm">
                <span className="material-symbols-outlined text-3xl block mb-2 text-[#c6c6cd]">
                  payments
                </span>
                No payments recorded yet
              </div>
            ) : (
              <div className="divide-y divide-[#c6c6cd]/30">
                {sale.payments.map((pmt) => (
                  <div
                    key={pmt.id}
                    className="p-5 md:p-6 flex items-start gap-4 bg-[#059669]/5"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#059669]/10 flex items-center justify-center text-[#059669]">
                      <span className="material-symbols-outlined">done_all</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-mono font-bold text-[#0F172A]">
                          {formatMoney(pmt.amount)}
                        </p>
                        <p className="text-xs text-[#505f76] font-medium">
                          {formatDate(pmt.payment_date)}
                        </p>
                      </div>
                      <p className="text-xs text-[#505f76]">
                        <span className="font-bold">Account:</span>{" "}
                        {pmt.account_name || "—"}
                      </p>
                      {pmt.note && (
                        <p className="text-xs text-[#505f76] italic mt-1">
                          &ldquo;{pmt.note}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="p-5 md:p-6 border-t border-[#c6c6cd]/50">
              <button
                onClick={openPaymentModal}
                disabled={sale.status === "paid"}
                className="w-full py-3 rounded-lg border-2 border-dashed border-[#c6c6cd] hover:border-[#0F172A] hover:text-[#0F172A] transition-all text-[#505f76] font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <span className="material-symbols-outlined">add</span>
                Add New Record
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Fixed Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-[#c6c6cd] px-4 py-3 z-40 shadow-lg">
        <button
          onClick={openPaymentModal}
          disabled={sale.status === "paid"}
          className="w-full h-12 bg-[#059669] text-white font-bold rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md disabled:opacity-40"
        >
          <span className="material-symbols-outlined">add_card</span>
          {sale.status === "paid" ? "Fully Paid" : "Record Payment"}
        </button>
      </div>

      <div className="md:hidden h-16" />

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0F172A]/40 backdrop-blur-sm p-4">
          <div
            className="absolute inset-0"
            onClick={() => setShowPaymentModal(false)}
          />
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg border border-[#c6c6cd]/30 relative z-10 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 pb-0">
              <h2 className="font-display font-bold text-xl text-[#0F172A]">
                Record Payment
              </h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-[#505f76] hover:text-[#0F172A] transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Outstanding Due Banner */}
            <div className="mx-6 mt-4 p-4 bg-[#EAB308]/10 border border-[#EAB308]/20 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[#505f76]">
                  Outstanding Due
                </span>
                <span className="font-mono font-bold text-[#EAB308] text-lg">
                  {formatMoney(sale.due_amount)}
                </span>
              </div>
            </div>

            <form onSubmit={handlePayment} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#505f76]">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[#505f76]">
                    ৳
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={sale.due_amount}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    required
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
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
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
                  Payment Date
                </label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  required
                  className="w-full h-[42px] border border-[#c6c6cd] rounded bg-white px-3 text-sm focus:border-[#0F172A] focus:ring-0 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#505f76]">
                  Note (optional)
                </label>
                <textarea
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  rows={2}
                  className="w-full border border-[#c6c6cd] rounded bg-white p-3 text-sm focus:border-[#0F172A] focus:ring-0 outline-none resize-none"
                  placeholder="Additional note..."
                />
              </div>

              {/* Payment Preview */}
              <div className="bg-[#f2f4f6] rounded-lg p-4 space-y-2 border border-[#c6c6cd]/50">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#505f76]">Total Sale</span>
                  <span className="font-mono">{formatMoney(sale.total_amount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#505f76]">Paying Now</span>
                  <span className="font-mono text-[#059669] font-bold">
                    -{formatMoney(parseFloat(payAmount) || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#c6c6cd]/50">
                  <span className="text-sm font-bold">New Due</span>
                  <span className="font-mono font-bold text-[#EAB308]">
                    {formatMoney(sale.due_amount - (parseFloat(payAmount) || 0))}
                  </span>
                </div>
              </div>

              {payError && (
                <p className="text-sm text-[#EF4444] font-medium">{payError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 h-[42px] bg-transparent text-[#505f76] hover:bg-[#f2f4f6] transition-colors font-bold text-sm rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="flex-1 h-[42px] bg-[#0F172A] text-white hover:bg-[#0F172A]/90 transition-all active:scale-95 font-bold text-sm rounded shadow-md disabled:opacity-40"
                >
                  {paying ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
