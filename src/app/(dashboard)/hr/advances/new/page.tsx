"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumb";
import { useAccounts } from "@/hooks/useAccounts";
import { useWorkers } from "@/hooks/useWorkers";

function formatMoney(n: number) {
  return (n ?? 0).toLocaleString("en-IN") + " tk";
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface Advance {
  id: string;
  amount: number;
  advance_date: string;
  month: number;
  year: number;
  note: string | null;
  account_name: string | null;
}

interface WorkerDetail {
  id: string;
  name: string;
  phone: string | null;
  designation: string | null;
  monthly_salary: number;
  join_date: string | null;
  is_active: boolean;
  advances: Advance[];
}

export default function NewAdvancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const { data: workersData, isLoading: workersLoading } = useWorkers();
  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const loading = workersLoading || accountsLoading;
  const [error, setError] = useState<string | null>(null);

  const [workerId, setWorkerId] = useState(searchParams.get("worker_id") || "");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [advanceDate, setAdvanceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [note, setNote] = useState("");

  const selectedDate = advanceDate ? new Date(advanceDate) : new Date();
  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();
  const monthLabel = MONTH_NAMES[month - 1];

  const workers = workersData?.workers ?? [];
  const accounts = accountsData ?? [];

  const { data: workerDetail } = useQuery<WorkerDetail>({
    queryKey: ["worker", workerId],
    queryFn: async () => {
      const res = await fetch(`/api/hr/workers/${workerId}`);
      if (!res.ok) throw new Error("Failed to load worker");
      const data = await res.json();
      return { ...data.worker, advances: data.advances };
    },
    enabled: !!workerId,
  });

  const totalAdvances = workerDetail
    ? workerDetail.advances.reduce((sum, a) => sum + a.amount, 0)
    : 0;
  const netPayable = workerDetail
    ? Math.max(0, workerDetail.monthly_salary - totalAdvances)
    : 0;

  const mutation = useMutation({
    mutationFn: async (formData: Record<string, unknown>) => {
      const res = await fetch("/api/hr/advances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to record advance");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["worker", workerId] });
      router.push(`/hr/workers/${workerId}`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const advanceAmount = parseFloat(amount);
    if (!workerId) {
      setError("Please select a worker");
      return;
    }
    if (!advanceAmount || advanceAmount <= 0) {
      setError("Amount must be a positive number");
      return;
    }
    if (!accountId) {
      setError("Please select an account");
      return;
    }

    setError(null);

    mutation.mutate({
      worker_id: workerId,
      amount: advanceAmount,
      account_id: accountId,
      advance_date: advanceDate,
      month,
      year,
      note: note.trim() || undefined,
    });
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8 animate-pulse">
        <div className="h-6 bg-surface-container-high rounded w-1/3 mb-6" />
        <div className="h-96 bg-surface-container-high rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Workers', href: '/hr/workers' }, { label: 'New Advance', href: null }]} />
      {/* Back + Title */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/hr/workers"
          className="w-9 h-9 flex items-center justify-center rounded-full border border-outline-variant text-secondary hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-display text-xl md:text-2xl font-bold text-primary-container">
          Record Salary Advance
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Advance Details */}
            <section className="bg-white rounded-lg border border-outline-variant/50 shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-primary-container">
                  info
                </span>
                <h2 className="font-display text-lg font-semibold">
                  Advance Details
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Worker <span className="text-error">*</span>
                  </label>
                  <select
                    value={workerId}
                    onChange={(e) => setWorkerId(e.target.value)}
                    required
                    className="w-full h-[44px] border border-outline-variant rounded bg-white px-3 text-sm focus:border-primary-container focus:ring-0 outline-none transition-all"
                  >
                    <option value="">Select worker</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatMoney(w.monthly_salary)}/mo)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Date <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    value={advanceDate}
                    onChange={(e) => setAdvanceDate(e.target.value)}
                    required
                    className="w-full h-[44px] border border-outline-variant rounded bg-white px-3 text-sm focus:border-primary-container focus:ring-0 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Amount (৳) <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-secondary">
                      ৳
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      autoComplete="off"
                      inputMode="decimal"
                      enterKeyHint="next"
                      className="w-full h-[44px] pl-8 pr-3 border border-outline-variant rounded bg-white text-sm font-mono focus:border-primary-container focus:ring-0 outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Pay From Account <span className="text-error">*</span>
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    required
                    className="w-full h-[44px] border border-outline-variant rounded bg-white px-3 text-sm focus:border-primary-container focus:ring-0 outline-none transition-all"
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
                    Month/Year
                  </label>
                  <input
                    type="text"
                    value={`${monthLabel} ${year}`}
                    readOnly
                    className="w-full h-[44px] border border-outline-variant rounded bg-surface-container-low px-3 text-sm font-medium text-primary-container cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="mt-5 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Note
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  autoComplete="off"
                  enterKeyHint="next"
                  className="w-full border border-outline-variant rounded bg-white p-3 text-sm focus:border-primary-container focus:ring-0 outline-none transition-all resize-none"
                  placeholder="Additional details..."
                />
              </div>
            </section>
          </div>

          {/* Right: Sidebar Summary */}
          <div className="hidden lg:block space-y-6">
            <div className="bg-primary-container text-white rounded-xl p-6 shadow-md sticky top-24">
              <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">
                  account_balance
                </span>
                Summary
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Worker</span>
                  <span className="font-mono font-bold text-right max-w-[160px] truncate">
                    {workerDetail ? workerDetail.name : "—"}
                  </span>
                </div>
                {workerDetail && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Monthly Salary</span>
                      <span className="font-mono font-bold">
                        {formatMoney(workerDetail.monthly_salary)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Month</span>
                      <span className="font-mono font-bold">
                        {monthLabel} {year}
                      </span>
                    </div>

                    {/* Advance History */}
                    <div className="border-t border-white/20 pt-4">
                      <h4 className="text-[11px] uppercase font-bold tracking-wider text-white/60 mb-3 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">history</span>
                        Advance History
                      </h4>
                      {workerDetail.advances.length === 0 ? (
                        <p className="text-white/50 text-xs italic">No advances recorded</p>
                      ) : (
                        <>
                          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
                            {workerDetail.advances.map((a) => (
                              <div
                                key={a.id}
                                className="flex justify-between items-center bg-white/10 rounded-lg px-3 py-2"
                              >
                                <div className="flex flex-col">
                                  <span className="text-xs text-white/80">
                                    {formatDate(a.advance_date)}
                                  </span>
                                  <span className="text-[10px] text-white/50">
                                    {MONTH_NAMES[a.month - 1]} {a.year}
                                  </span>
                                </div>
                                <span className="font-mono text-sm font-bold text-warning">
                                  {formatMoney(a.amount)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Totals */}
                          <div className="border-t border-white/20 pt-3 mt-3 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-white/70 text-sm">Total Advances</span>
                              <span className="font-mono font-bold text-warning">
                                {formatMoney(totalAdvances)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-white/70 text-sm">Net Payable</span>
                              <span className="font-mono font-bold text-tertiary">
                                {formatMoney(netPayable)}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
                <div className="border-t border-white/20 my-3" />
                <div className="flex justify-between items-center">
                  <span className="text-white/80 font-semibold">
                    Advance Amount
                  </span>
                  <span className="font-mono text-lg font-bold text-tertiary">
                    {amount ? formatMoney(parseFloat(amount) || 0) : "—"}
                  </span>
                </div>
              </div>
              <button
                type="submit"
                disabled={mutation.isPending}
                enterKeyHint="send"
                className="w-full mt-6 h-12 bg-white text-primary-container font-bold rounded-lg hover:bg-white/90 transition-all active:scale-95 shadow-sm disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {mutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Recording...
                  </span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">save</span>
                    Record Advance
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" aria-live="polite" className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-error text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Mobile: Sticky Bottom Bar */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-outline-variant px-4 py-3 z-40 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tight">
              {workerDetail ? workerDetail.name : "No worker"} — {monthLabel} {year}
            </span>
            <span className="font-mono font-bold text-on-surface">
              {amount ? formatMoney(parseFloat(amount) || 0) : "0 tk"}
            </span>
          </div>
          <button
            type="submit"
            disabled={mutation.isPending}
            enterKeyHint="send"
            className="bg-primary text-on-primary px-6 py-3 rounded-lg font-bold text-sm flex items-center gap-2 active:scale-95 transition-all shadow-md disabled:opacity-40"
          >
            {mutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <>
                Save Advance
                <span className="material-symbols-outlined text-sm">send</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Mobile bottom spacing */}
      <div className="md:hidden h-20" />
    </div>
  );
}
