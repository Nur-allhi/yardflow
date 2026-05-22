"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccounts } from "@/hooks/useAccounts";
import { useWorkers } from "@/hooks/useWorkers";

function formatMoney(n: number) {
  return (n ?? 0).toLocaleString("en-IN") + " tk";
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

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

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-lg border border-outline-variant/50 shadow-sm p-5 md:p-6 space-y-5">
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
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

          <div className="space-y-1.5">
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

          {error && (
            <div role="alert" aria-live="polite" className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-error text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Desktop: Submit */}
          <div className="hidden md:flex items-center gap-3 pt-4 border-t border-outline-variant/50">
            <Link
              href="/hr/workers"
              className="px-5 py-2.5 bg-transparent text-secondary hover:bg-surface-container-low transition-colors font-bold text-sm rounded-lg"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              enterKeyHint="send"
              className="px-5 py-2.5 bg-primary-container text-white font-bold text-sm rounded-lg hover:bg-primary-container/90 transition-all active:scale-95 shadow-sm disabled:opacity-40"
            >
              {mutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Recording...
                </span>
              ) : "Record Advance"}
            </button>
          </div>
        </div>

        {/* Mobile: Sticky Bottom Bar */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-outline-variant px-4 py-3 z-40 flex items-center gap-3 shadow-lg">
          <Link
            href="/hr/workers"
            className="flex-1 h-12 flex items-center justify-center bg-transparent text-secondary hover:bg-surface-container-low transition-colors font-bold text-sm rounded-lg border border-outline-variant"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 h-12 flex items-center justify-center bg-primary-container text-white font-bold text-sm rounded-lg active:scale-95 transition-all shadow-md disabled:opacity-40"
          >
            {mutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Recording...
                </span>
              ) : "Record Advance"}
          </button>
        </div>
      </form>

      <div className="md:hidden h-20" />
    </div>
  );
}
