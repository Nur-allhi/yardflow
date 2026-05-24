"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumb";
import { useAccounts } from "@/hooks/useAccounts";

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
      <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-tertiary text-tertiary bg-tertiary/5 uppercase">
        Quick Cash
      </span>
    );
  }
  const map: Record<string, { border: string; text: string; bg: string; label: string }> = {
    fabricated: { border: "border-primary-container", text: "text-primary-container", bg: "bg-primary-container/5", label: "Fabricated" },
    raw_passthrough: { border: "border-secondary", text: "text-secondary", bg: "bg-secondary/5", label: "Raw" },
    scrap: { border: "border-tertiary", text: "text-tertiary", bg: "bg-tertiary/5", label: "Scrap" },
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

  const queryClient = useQueryClient();

  const router = useRouter();

  useEffect(() => {
    fetch("/api/simple/mode")
      .then(r => r.json())
      .then(data => {
        if (data.mode === "simple") router.replace("/sales-simple");
      })
      .catch(() => {});
  }, [router]);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payAccountId, setPayAccountId] = useState("");
  const [payDate, setPayDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [payNote, setPayNote] = useState("");
  const [payError, setPayError] = useState<string | null>(null);

  const { data: sale, isLoading, error } = useQuery<SaleDetail>({
    queryKey: ["sale", id],
    queryFn: async () => {
      const res = await fetch(`/api/sales/${id}`);
      if (!res.ok) throw new Error("Failed to load sale");
      return res.json();
    },
  });

  const { data: accountsData } = useAccounts();

  const paymentMutation = useMutation({
    mutationFn: async (data: { amount: number; account_id: string; payment_date: string; note?: string }) => {
      const res = await fetch(`/api/sales/${id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to record payment");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sale", id] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setShowPaymentModal(false);
      setPayAmount("");
      setPayNote("");
    },
    onError: (e) => {
      setPayError(e instanceof Error ? e.message : "Something went wrong");
    },
  });

  function openPaymentModal() {
    if (accountsData && accountsData.length > 0) {
      setPayAccountId(accountsData[0].id);
    }
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

    paymentMutation.mutate({
      amount,
      account_id: payAccountId,
      payment_date: payDate,
      note: payNote || undefined,
    });
  }

  // Loading
  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-6 bg-surface-container-high rounded w-1/3" />
        <div className="h-12 bg-surface-container-high rounded w-1/2" />
        <div className="h-64 bg-surface-container-high rounded-xl" />
      </div>
    );
  }

  // Error
  if (error || !sale) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-error font-medium text-lg mb-2">
            {error?.message || "Sale not found"}
          </p>
          <Link
            href="/sales"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-container text-white text-sm rounded-lg"
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
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Sales', href: '/sales' }, { label: `Sale #${id.slice(0,4).toUpperCase()}`, href: null }]} />
      {/* Back + Title */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/sales"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-outline-variant text-secondary hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="font-display text-lg md:text-xl font-bold text-primary-container">
            Sale #SAL-{id.slice(0, 4).toUpperCase()}
          </h1>
          <StatusChip status={sale.status} />
        </div>
        <div className="md:ml-auto">
          <button
            onClick={openPaymentModal}
            disabled={sale.status === "paid"}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-container text-white font-bold text-sm rounded-lg hover:bg-primary-container/90 transition-all active:scale-95 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">payments</span>
            {sale.status === "paid" ? "Fully Paid" : "Record Payment"}
          </button>
        </div>
      </div>

      {/* Mobile Payment Summary */}
      <div className="md:hidden bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-tight">Total Amount</p>
            <h2 className="font-headline font-bold text-2xl text-primary font-mono tracking-tight">{formatMoney(sale.total_amount)}</h2>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-tight">Balance Due</p>
            <p className={`font-headline font-bold text-lg font-mono tracking-tight ${sale.due_amount > 0 ? "text-warning" : "text-success"}`}>
              {formatMoney(sale.due_amount)}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold">
            <span className="text-success">Received: {formatMoney(sale.paid_amount)}</span>
            <span className="text-on-surface-variant">{paidPercent}% Paid</span>
          </div>
          <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden flex">
            <div className="bg-success h-full transition-all duration-1000 ease-out" style={{ width: `${paidPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Desktop: Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-7 space-y-6">
          {/* Sale Info */}
          <div className="bg-white border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 md:px-6 py-4 border-b border-outline-variant/50 bg-surface-container-low">
              <h3 className="font-display font-bold text-primary-container flex items-center gap-2">
                <span className="material-symbols-outlined">info</span>
                Sale Information
              </h3>
            </div>
            <div className="p-5 md:p-6 grid grid-cols-2 gap-y-5">
              <div>
                <p className="text-[10px] uppercase font-bold text-secondary tracking-wider mb-1">
                  Customer
                </p>
                {sale.is_quick_cash ? (
                  <span className="italic text-secondary text-sm">Cash Sale</span>
                ) : (
                  <>
                    <Link
                      href={`/sales/customers/${sale.customer_id}`}
                      className="font-medium text-primary-container text-sm hover:underline"
                    >
                      {sale.customer_name || "—"}
                    </Link>
                    {sale.customer_phone && (
                      <p className="text-xs text-secondary">{sale.customer_phone}</p>
                    )}
                  </>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-secondary tracking-wider mb-1">
                  Sale Type
                </p>
                <TypeChip type={sale.sale_type} isQuickCash={sale.is_quick_cash} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-secondary tracking-wider mb-1">
                  Sale Date
                </p>
                <p className="font-medium text-primary-container text-sm">
                  {formatDate(sale.sale_date)}
                </p>
              </div>
              {sale.note && (
                <div className="col-span-2">
                  <p className="text-[10px] uppercase font-bold text-secondary tracking-wider mb-1">
                    Note
                  </p>
                  <p className="text-sm text-primary-container italic">
                    &ldquo;{sale.note}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 md:px-6 py-4 border-b border-outline-variant/50 bg-surface-container-low">
              <h3 className="font-display font-bold text-primary-container flex items-center gap-2">
                <span className="material-symbols-outlined">list_alt</span>
                Line Items
              </h3>
            </div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-high border-b border-outline-variant">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase text-secondary tracking-wider">
                      Sub-type
                    </th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase text-secondary tracking-wider text-right">
                      Qty (kg)
                    </th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase text-secondary tracking-wider text-right">
                      Price/kg
                    </th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase text-secondary tracking-wider text-right">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {sale.items.map((item) => (
                    <tr key={item.id} className="hover:bg-background">
                      <td className="px-6 py-4 text-sm font-bold text-primary-container">
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
                  <tr className="bg-surface-container-low border-t-2 border-primary-container/10">
                    <td
                      colSpan={3}
                      className="px-6 py-4 font-display font-bold text-primary-container text-right uppercase tracking-widest text-xs"
                    >
                      Total Amount
                    </td>
                    <td className="px-6 py-4 font-mono text-right text-lg font-bold text-primary-container">
                      {formatMoney(sale.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Items */}
            <div className="md:hidden bg-surface rounded-xl border border-outline-variant overflow-hidden">
              {sale.items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-4 ${idx < sale.items.length - 1 ? "border-b border-outline-variant" : ""}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-headline font-bold text-sm text-primary">
                      {item.subtype_name || "—"}
                    </h4>
                    <span className="font-mono font-bold text-primary">
                      {formatMoney(item.total_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-on-surface-variant">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">scale</span>
                      <span>{item.quantity_kg.toFixed(3)} kg</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">sell</span>
                      <span>{formatMoney(item.price_per_kg)}</span>
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
          <div className="bg-primary-container text-white rounded-xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/10 blur-[60px] rounded-full -mr-16 -mt-16" />
            <h3 className="font-display font-bold text-lg mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary">
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
                <span className="font-mono font-bold text-tertiary">
                  {formatMoney(sale.paid_amount)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-white/20 pt-4">
                <span className="text-white font-bold text-sm">
                  Balance Due
                </span>
                <span
                  className={`font-mono font-bold text-lg ${
                    sale.due_amount > 0 ? "text-warning" : "text-tertiary"
                  }`}
                >
                  {formatMoney(sale.due_amount)}
                </span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                <span className="text-tertiary">Paid {paidPercent}%</span>
                <span className="text-white/50">Due {100 - Number(paidPercent)}%</span>
              </div>
              <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-tertiary rounded-full transition-all duration-500"
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 md:px-6 py-4 border-b border-outline-variant/50 bg-surface-container-low">
              <h3 className="font-display font-bold text-primary-container text-sm uppercase tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">history</span>
                Payment Ledger
              </h3>
            </div>
            {sale.payments.length === 0 ? (
              <div className="p-6 text-center text-secondary text-sm">
                <span className="material-symbols-outlined text-3xl block mb-2 text-outline-variant">
                  payments
                </span>
                No payments recorded yet
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/30">
                {sale.payments.map((pmt) => (
                  <div
                    key={pmt.id}
                    className="p-5 md:p-6 flex items-start gap-4 bg-tertiary/5"
                  >
                    <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined">done_all</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-mono font-bold text-primary-container">
                          {formatMoney(pmt.amount)}
                        </p>
                        <p className="text-xs text-secondary font-medium">
                          {formatDate(pmt.payment_date)}
                        </p>
                      </div>
                      <p className="text-xs text-secondary">
                        <span className="font-bold">Account:</span>{" "}
                        {pmt.account_name || "—"}
                      </p>
                      {pmt.note && (
                        <p className="text-xs text-secondary italic mt-1">
                          &ldquo;{pmt.note}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="p-5 md:p-6 border-t border-outline-variant/50">
              <button
                onClick={openPaymentModal}
                disabled={sale.status === "paid"}
                className="w-full py-3 rounded-lg border-2 border-dashed border-outline-variant hover:border-primary-container hover:text-primary-container transition-all text-secondary font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <span className="material-symbols-outlined">add</span>
                Add New Record
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Fixed Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-md border-t border-outline-variant px-4 py-3 z-40 shadow-lg">
        <button
          onClick={openPaymentModal}
          disabled={sale.status === "paid"}
          className="w-full h-12 bg-on-tertiary-container text-on-tertiary font-headline font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all disabled:opacity-40"
        >
          <span className="material-symbols-outlined">payments</span>
          {sale.status === "paid" ? "Fully Paid" : "Collect Payment"}
        </button>
      </div>

      <div className="md:hidden h-16" />

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-primary-container/40 backdrop-blur-sm p-4">
          <div
            className="absolute inset-0"
            onClick={() => setShowPaymentModal(false)}
          />
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg border border-outline-variant/30 relative z-10 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 pb-0">
              <h2 className="font-display font-bold text-xl text-primary-container">
                Record Payment
              </h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-secondary hover:text-primary-container transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Outstanding Due Banner */}
            <div className="mx-6 mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-secondary">
                  Outstanding Due
                </span>
                <span className="font-mono font-bold text-warning text-lg">
                  {formatMoney(sale.due_amount)}
                </span>
              </div>
            </div>

            <form onSubmit={handlePayment} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-secondary">
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
                    className="w-full h-[42px] pl-8 pr-3 border border-outline-variant rounded text-sm font-mono focus:border-primary-container focus:ring-0 outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Pay From Account
                </label>
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
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  required
                  className="w-full h-[42px] border border-outline-variant rounded bg-white px-3 text-sm focus:border-primary-container focus:ring-0 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Note (optional)
                </label>
                <textarea
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  rows={2}
                  className="w-full border border-outline-variant rounded bg-white p-3 text-sm focus:border-primary-container focus:ring-0 outline-none resize-none"
                  placeholder="Additional note..."
                />
              </div>

              {/* Payment Preview */}
              <div className="bg-surface-container-low rounded-lg p-4 space-y-2 border border-outline-variant/50">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-secondary">Total Sale</span>
                  <span className="font-mono">{formatMoney(sale.total_amount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-secondary">Paying Now</span>
                  <span className="font-mono text-tertiary font-bold">
                    -{formatMoney(parseFloat(payAmount) || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-outline-variant/50">
                  <span className="text-sm font-bold">New Due</span>
                  <span className="font-mono font-bold text-warning">
                    {formatMoney(sale.due_amount - (parseFloat(payAmount) || 0))}
                  </span>
                </div>
              </div>

              {payError && (
                <p className="text-sm text-error font-medium">{payError}</p>
              )}

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
