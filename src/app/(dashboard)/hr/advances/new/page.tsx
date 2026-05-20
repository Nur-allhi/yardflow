"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Worker {
  id: string;
  name: string;
}

interface Account {
  id: string;
  name: string;
  current_balance: number;
}

function formatMoney(n: number) {
  return "\u09F3" + (n ?? 0).toLocaleString("en-IN");
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function NewAdvancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [workersRes, accountsRes] = await Promise.all([
        fetch("/api/hr/workers"),
        fetch("/api/accounts"),
      ]);
      if (workersRes.ok) {
        const data = await workersRes.json();
        setWorkers(data.workers || data);
      }
      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setAccounts(data);
      }
    } catch {
      // handled by empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  async function handleSubmit(e: React.FormEvent) {
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

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/hr/advances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worker_id: workerId,
          amount: advanceAmount,
          account_id: accountId,
          advance_date: advanceDate,
          month,
          year,
          note: note.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to record advance");
      }

      router.push(`/hr/workers/${workerId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8 animate-pulse">
        <div className="h-6 bg-[#e6e8ea] rounded w-1/3 mb-6" />
        <div className="h-96 bg-[#e6e8ea] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Back + Title */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/hr/workers"
          className="w-9 h-9 flex items-center justify-center rounded-full border border-[#c6c6cd] text-[#505f76] hover:bg-[#f2f4f6] transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-display text-xl md:text-2xl font-bold text-[#0F172A]">
          Record Salary Advance
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-lg border border-[#c6c6cd]/50 shadow-sm p-5 md:p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#505f76]">
              Worker <span className="text-[#EF4444]">*</span>
            </label>
            <select
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              required
              className="w-full h-[42px] border border-[#c6c6cd] rounded bg-white px-3 text-sm focus:border-[#0F172A] focus:ring-0 outline-none transition-all"
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
              <label className="text-xs font-bold uppercase tracking-wider text-[#505f76]">
                Amount (৳) <span className="text-[#EF4444]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[#505f76]">
                  ৳
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full h-[42px] pl-8 pr-3 border border-[#c6c6cd] rounded bg-white text-sm font-mono focus:border-[#0F172A] focus:ring-0 outline-none transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#505f76]">
                Pay From Account <span className="text-[#EF4444]">*</span>
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                className="w-full h-[42px] border border-[#c6c6cd] rounded bg-white px-3 text-sm focus:border-[#0F172A] focus:ring-0 outline-none transition-all"
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
                Date <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="date"
                value={advanceDate}
                onChange={(e) => setAdvanceDate(e.target.value)}
                required
                className="w-full h-[42px] border border-[#c6c6cd] rounded bg-white px-3 text-sm focus:border-[#0F172A] focus:ring-0 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#505f76]">
                Month/Year
              </label>
              <input
                type="text"
                value={`${monthLabel} ${year}`}
                readOnly
                className="w-full h-[42px] border border-[#c6c6cd] rounded bg-[#f2f4f6] px-3 text-sm font-medium text-[#0F172A] cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#505f76]">
              Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full border border-[#c6c6cd] rounded bg-white p-3 text-sm focus:border-[#0F172A] focus:ring-0 outline-none transition-all resize-none"
              placeholder="Additional details..."
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-[#EF4444] text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Desktop: Submit */}
          <div className="hidden md:flex items-center gap-3 pt-4 border-t border-[#c6c6cd]/50">
            <Link
              href="/hr/workers"
              className="px-5 py-2.5 bg-transparent text-[#505f76] hover:bg-[#f2f4f6] transition-colors font-bold text-sm rounded-lg"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#0F172A] text-white font-bold text-sm rounded-lg hover:bg-[#0F172A]/90 transition-all active:scale-95 shadow-sm disabled:opacity-40"
            >
              {submitting ? "Recording..." : "Record Advance"}
            </button>
          </div>
        </div>

        {/* Mobile: Sticky Bottom Bar */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-[#c6c6cd] px-4 py-3 z-40 flex items-center gap-3 shadow-lg">
          <Link
            href="/hr/workers"
            className="flex-1 h-12 flex items-center justify-center bg-transparent text-[#505f76] hover:bg-[#f2f4f6] transition-colors font-bold text-sm rounded-lg border border-[#c6c6cd]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 h-12 flex items-center justify-center bg-[#0F172A] text-white font-bold text-sm rounded-lg active:scale-95 transition-all shadow-md disabled:opacity-40"
          >
            {submitting ? "Recording..." : "Record Advance"}
          </button>
        </div>
      </form>

      <div className="md:hidden h-20" />
    </div>
  );
}
