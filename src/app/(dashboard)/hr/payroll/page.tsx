"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccounts } from "@/hooks/useAccounts";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";

interface PayrollRow {
  worker_id: string;
  worker_name: string;
  designation: string | null;
  base_salary: number;
  advances_taken: number;
  net_payable: number;
  paid_amount: number;
  status: "pending" | "partial" | "paid";
}

interface PayrollData {
  workers: PayrollRow[];
  summary: {
    total_salary: number;
    total_advances: number;
    total_payable: number;
  };
}

function formatMoney(n: number) {
  return (n ?? 0).toLocaleString("en-IN") + " tk";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    paid: { bg: "bg-success/10", text: "text-success", label: "Paid" },
    partial: { bg: "bg-warning/10", text: "text-warning", label: "Partial" },
    pending: { bg: "bg-error/10", text: "text-error", label: "Pending" },
  };
  const s = map[status] || map.pending;
  return (
    <span
      className={`px-2 py-1 ${s.bg} ${s.text} text-[10px] font-bold rounded uppercase tracking-wider`}
    >
      {s.label}
    </span>
  );
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function PayrollPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Pay modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payTarget, setPayTarget] = useState<PayrollRow | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payAccountId, setPayAccountId] = useState("");
  const [payDate, setPayDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [payError, setPayError] = useState<string | null>(null);

  const payMutation = useMutation({
    mutationFn: async (formData: Record<string, unknown>) => {
      const res = await fetch("/api/hr/payroll/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to process payment");
      }
      return res.json();
    },
    onSuccess: () => {
      setShowPayModal(false);
      setPayTarget(null);
      queryClient.invalidateQueries({ queryKey: ["payroll", selectedMonth, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["workers"] });
    },
    onError: (err: Error) => {
      setPayError(err.message);
    },
  });

  const queryClient = useQueryClient();

  const { data: payroll, isLoading, error, refetch } = useQuery<PayrollData>({
    queryKey: ["payroll", selectedMonth, selectedYear],
    queryFn: async () => {
      const res = await fetch(`/api/hr/payroll?month=${selectedMonth}&year=${selectedYear}`);
      if (!res.ok) throw new Error("Failed to load payroll data");
      return res.json();
    },
  });

  const { data: accounts = [] } = useAccounts();

  function openPayModal(row: PayrollRow) {
    setPayTarget(row);
    if (accounts.length > 0 && !payAccountId) {
      setPayAccountId(accounts[0].id);
    }
    const defaultAmount = Math.max(0, Math.ceil(row.net_payable - row.paid_amount));
    setPayAmount(String(defaultAmount));
    setPayError(null);
    setShowPayModal(true);
  }

  function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!payTarget) return;

    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      setPayError("Please enter a valid amount");
      return;
    }

    setPayError(null);

    payMutation.mutate({
      worker_id: payTarget.worker_id,
      month: selectedMonth,
      year: selectedYear,
      paid_amount: amount,
      account_id: payAccountId,
      payment_date: payDate,
    });
  }

  const years = Array.from(
    { length: 5 },
    (_, i) => now.getFullYear() - 2 + i,
  );

  return (
    <div className="p-4 md:p-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Payroll', href: null }]} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-[2rem] font-bold text-primary-container tracking-tight">
            Payroll
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="h-[42px] border border-outline-variant rounded-lg bg-white px-3 text-sm focus:border-primary-container outline-none"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="h-[42px] border border-outline-variant rounded-lg bg-white px-3 text-sm focus:border-primary-container outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-outline-variant/50">
        <Link
          href="/hr/workers"
          className="px-4 py-3 text-sm text-secondary hover:text-primary-container transition-colors"
        >
          Workers
        </Link>
        <Link
          href="/hr/advances/new"
          className="px-4 py-3 text-sm text-secondary hover:text-primary-container transition-colors"
        >
          Advances
        </Link>
        <Link
          href="/hr/payroll"
          className="px-4 py-3 text-sm font-bold text-tertiary border-b-2 border-tertiary"
        >
          Payroll
        </Link>
      </div>

      {/* Stats Row */}
      <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-6 mb-6 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
        <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-white p-4 md:p-6 rounded-xl border border-outline-variant/30 md:border-outline-variant shadow-sm">
          <p className="text-secondary text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">
            Total Salary
          </p>
          <p className="font-mono text-lg md:text-2xl font-bold text-primary-container">
            {payroll ? formatMoney(payroll.summary.total_salary) : "—"}
          </p>
        </div>
        <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-white p-4 md:p-6 rounded-xl border border-outline-variant/30 md:border-outline-variant shadow-sm">
          <p className="text-secondary text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">
            Total Advances
          </p>
          <p className="font-mono text-lg md:text-2xl font-bold text-warning">
            {payroll ? formatMoney(payroll.summary.total_advances) : "—"}
          </p>
        </div>
        <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-white p-4 md:p-6 rounded-xl border border-outline-variant/30 md:border-outline-variant shadow-sm">
          <p className="text-secondary text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">
            Total Payable
          </p>
          <p className="font-mono text-lg md:text-2xl font-bold text-tertiary">
            {payroll ? formatMoney(payroll.summary.total_payable) : "—"}
          </p>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-outline-variant/30 p-6 animate-pulse"
            >
              <div className="h-4 bg-surface-container-high rounded w-1/3 mb-3" />
              <div className="h-4 bg-surface-container-high rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-error font-medium text-sm">{error?.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-4 py-2 bg-primary-container text-white text-sm rounded-lg"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && payroll && payroll.workers.length === 0 && (
        <div className="bg-white rounded-xl border border-outline-variant/30 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-outline-variant block mb-4">
            payroll
          </span>
          <p className="text-secondary text-sm font-medium mb-1">
            No workers found
          </p>
          <p className="text-secondary text-xs">
            Add workers first to run payroll
          </p>
          <Link
            href="/hr/workers/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary-container text-white text-sm font-semibold rounded-lg"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Worker
          </Link>
        </div>
      )}

      {/* Desktop Table */}
      {!isLoading && !error && payroll && payroll.workers.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-high border-b border-outline-variant">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">
                  Worker Name
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider text-right">
                  Base Salary
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider text-right">
                  Advances Taken
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider text-right">
                  Net Payable
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {payroll.workers.map((row) => (
                <tr
                  key={row.worker_id}
                  className="hover:bg-background transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary-container text-primary-container flex items-center justify-center font-bold text-xs">
                        {getInitials(row.worker_name)}
                      </div>
                      <span className="font-bold text-sm">
                        {row.worker_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                    {row.designation || "—"}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-right">
                    {formatMoney(row.base_salary)}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-right text-warning">
                    {formatMoney(row.advances_taken)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {row.net_payable < 0 ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono text-sm font-bold text-warning">
                          {formatMoney(row.net_payable)}
                        </span>
                        <span className="px-1.5 py-0.5 bg-[#FEF3C7] text-[#92400E] text-[9px] font-bold rounded uppercase tracking-wider whitespace-nowrap">
                          Over-advanced
                        </span>
                        <span className="text-[10px] text-secondary leading-tight max-w-[200px] text-right">
                          Advances exceed base salary. Net payable will carry to next month.
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono text-sm font-bold text-primary-container">
                        {formatMoney(row.net_payable)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusChip status={row.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {row.status !== "paid" && (
                      <button
                        onClick={() => openPayModal(row)}
                        className="text-xs font-bold px-3 py-1 rounded bg-primary-container text-white hover:bg-primary-container/90"
                      >
                        Pay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Cards */}
      {!isLoading && !error && payroll && payroll.workers.length > 0 && (
        <div className="md:hidden space-y-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-secondary">
            {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </h2>
          {payroll.workers.map((row) => (
            <div
              key={row.worker_id}
              className="bg-white rounded-lg p-4 shadow-sm border border-outline-variant/20"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-secondary-container text-primary-container flex items-center justify-center font-bold text-sm">
                  {getInitials(row.worker_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-primary-container text-base truncate">
                    {row.worker_name}
                  </h3>
                  <p className="text-xs text-secondary font-medium">
                    {row.designation || "—"}
                  </p>
                </div>
                <StatusChip status={row.status} />
              </div>
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-outline-variant/30">
                <div>
                  <p className="text-[11px] text-secondary font-medium">Salary</p>
                  <p className="font-mono text-sm font-bold">
                    {formatMoney(row.base_salary)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-secondary font-medium">Advances</p>
                  <p className="font-mono text-sm font-bold text-warning">
                    {formatMoney(row.advances_taken)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-secondary font-medium">Payable</p>
                  {row.net_payable < 0 ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-sm font-bold text-warning">
                        {formatMoney(row.net_payable)}
                      </span>
                      <span className="self-start px-1.5 py-0.5 bg-[#FEF3C7] text-[#92400E] text-[9px] font-bold rounded uppercase tracking-wider whitespace-nowrap">
                        Over-advanced — carry forward
                      </span>
                    </div>
                  ) : (
                    <p className="font-mono text-sm font-bold text-tertiary">
                      {formatMoney(row.net_payable)}
                    </p>
                  )}
                </div>
              </div>
              {row.status !== "paid" && (
                <button
                  onClick={() => openPayModal(row)}
                  className="w-full mt-3 py-2.5 bg-primary-container text-white font-bold text-sm rounded-lg active:scale-95 transition-transform"
                >
                  Pay {Math.max(0, row.net_payable - row.paid_amount) > 0 ? formatMoney(row.net_payable - row.paid_amount) : formatMoney(0)}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && payTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-primary-container/40 backdrop-blur-sm p-4">
          <div
            className="absolute inset-0"
            onClick={() => setShowPayModal(false)}
          />
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg border border-outline-variant/30 relative z-10 overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-0">
              <h2 className="font-display font-bold text-xl text-primary-container">
                Pay Salary
              </h2>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-secondary hover:text-primary-container transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mx-6 mt-4 p-4 bg-tertiary/10 border border-tertiary/20 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-primary-container">
                    {payTarget.worker_name}
                  </p>
                  <p className="text-xs text-secondary">
                    {payTarget.designation || ""}
                  </p>
                </div>
                <span className={`font-mono font-bold text-lg ${payTarget.net_payable < 0 ? "text-warning" : "text-tertiary"}`}>
                  {formatMoney(payTarget.net_payable)}
                </span>
              </div>
              {payTarget.net_payable < 0 && (
                <div className="mt-3 px-3 py-2 bg-[#FEF3C7] border border-[#FCD34D]/50 rounded-lg">
                  <p className="text-xs font-bold text-[#92400E]">
                    This worker has been over-advanced. Net payable is negative.
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handlePay} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Amount to Pay
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-secondary">
                    ৳
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={Math.max(0, payTarget.net_payable - payTarget.paid_amount)}
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
                  {accounts.map((a) => (
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

              {payError && (
                <p className="text-sm text-error font-medium">{payError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 h-[42px] bg-transparent text-secondary hover:bg-surface-container-low transition-colors font-bold text-sm rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payMutation.isPending || payTarget.net_payable < 0}
                  className="flex-1 h-[42px] bg-primary-container text-white hover:bg-primary-container/90 transition-all active:scale-95 font-bold text-sm rounded shadow-md disabled:opacity-40"
                >
                  {payMutation.isPending ? "Processing..." : payTarget.net_payable < 0 ? "Cannot Pay — Negative Balance" : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
