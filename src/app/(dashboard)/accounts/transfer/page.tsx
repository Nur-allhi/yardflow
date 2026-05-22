"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccounts } from "@/hooks/useAccounts";

function formatMoney(n: number) {
  return n.toLocaleString("en-IN") + " tk";
}

export default function TransferPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: accountsData, isLoading: loading, error: accountsLoadError, refetch: loadAccounts } = useAccounts();
  const [error, setError] = useState<string | null>(null);

  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [note, setNote] = useState("");
  const mutation = useMutation({
    mutationFn: async (formData: Record<string, unknown>) => {
      const res = await fetch("/api/accounts/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to process transfer");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
      router.push("/accounts");
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const accounts = (accountsData ?? []).filter((a) => a.current_balance >= 0);
  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);
  const numAmount = parseFloat(amount) || 0;

  function validate(): string | null {
    if (!fromAccountId) return "Please select a source account";
    if (!toAccountId) return "Please select a destination account";
    if (fromAccountId === toAccountId) return "Source and destination accounts must be different";
    if (!numAmount || numAmount <= 0) return "Please enter a valid amount";
    if (fromAccount && numAmount > fromAccount.current_balance) return "Insufficient balance in source account";
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    mutation.mutate({
      from_account_id: fromAccountId,
      to_account_id: toAccountId,
      amount: numAmount,
      transfer_date: transferDate,
      note: note.trim() || undefined,
    });
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-6 bg-surface-container-high rounded w-1/3" />
        <div className="h-12 bg-surface-container-high rounded w-1/2" />
        <div className="h-64 bg-surface-container-high rounded-xl" />
      </div>
    );
  }

  const loadError = accountsLoadError ? (accountsLoadError instanceof Error ? accountsLoadError.message : "Failed to load accounts") : null;
  if ((error || loadError) && accounts.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-error font-medium text-lg mb-2">Failed to Load Accounts</p>
          <p className="text-sm mb-4">{error || loadError}</p>
          <button
            onClick={() => loadAccounts()}
            className="px-4 py-2 bg-primary-container text-white text-sm rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/accounts"
          className="w-9 h-9 flex items-center justify-center rounded-full border border-outline-variant text-secondary hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-display text-xl md:text-2xl font-bold text-primary-container">
          Transfer Between Accounts
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-lg mx-auto space-y-6">
          <section className="bg-white rounded-lg border border-outline-variant/50 shadow-sm p-5 md:p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-primary-container">swap_horiz</span>
              <h2 className="font-display text-lg font-semibold">Transfer Details</h2>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-error-container border border-error/20 rounded-lg text-sm text-error font-medium">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                  From Account <span className="text-error">*</span>
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  required
                  className="w-full h-[42px] border border-outline-variant rounded bg-white px-3 text-sm focus:border-primary-container focus:ring-0 outline-none"
                >
                  <option value="">Select source account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatMoney(a.current_balance)})
                    </option>
                  ))}
                </select>
                {fromAccount && (
                  <p className="text-xs text-secondary flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span>
                    Current balance: {formatMoney(fromAccount.current_balance)}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                  To Account <span className="text-error">*</span>
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  required
                  className="w-full h-[42px] border border-outline-variant rounded bg-white px-3 text-sm focus:border-primary-container focus:ring-0 outline-none"
                >
                  <option value="">Select destination account</option>
                  {accounts
                    .filter((a) => a.id !== fromAccountId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatMoney(a.current_balance)})
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Amount <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-secondary">tk </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={fromAccount?.current_balance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full h-[42px] pl-8 pr-3 border border-outline-variant rounded text-sm font-mono focus:border-primary-container focus:ring-0 outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Transfer Date <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  required
                  className="w-full h-[42px] border border-outline-variant rounded bg-white px-3 text-sm focus:border-primary-container focus:ring-0 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full border border-outline-variant rounded bg-white p-3 text-sm focus:border-primary-container focus:ring-0 outline-none resize-none"
                  placeholder="Reason for transfer..."
                />
              </div>

              {/* Transfer Preview */}
              {fromAccount && toAccount && numAmount > 0 && (
                <div className="bg-surface-container-low rounded-lg p-4 space-y-2 border border-outline-variant/50">
                  <p className="text-[10px] uppercase font-bold text-secondary tracking-widest mb-3">Transfer Preview</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-secondary">{fromAccount.name}</span>
                    <span className="font-mono text-error font-bold">-{formatMoney(numAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-secondary">{toAccount.name}</span>
                    <span className="font-mono text-success font-bold">+{formatMoney(numAmount)}</span>
                  </div>
                  <div className="border-t border-outline-variant/50 pt-2 mt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-secondary">New balance ({fromAccount.name})</span>
                      <span className="font-mono font-bold">{formatMoney(fromAccount.current_balance - numAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="text-secondary">New balance ({toAccount.name})</span>
                      <span className="font-mono font-bold">{formatMoney(toAccount.current_balance + numAmount)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/accounts"
              className="flex-1 h-[42px] bg-transparent text-secondary hover:bg-surface-container-low transition-colors font-bold text-sm rounded border border-outline-variant flex items-center justify-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 h-[42px] bg-primary-container text-white hover:bg-primary-container/90 transition-all active:scale-95 font-bold text-sm rounded shadow-md disabled:opacity-40"
            >
              {mutation.isPending ? "Processing..." : "Transfer"}
            </button>
          </div>
        </div>

        {/* Mobile sticky bottom bar */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-outline-variant px-4 py-3 z-40 flex items-center gap-3 shadow-lg">
          <Link
            href="/accounts"
            className="flex-1 h-12 bg-transparent text-secondary font-bold text-sm rounded-lg border border-outline-variant flex items-center justify-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 h-12 bg-primary-container text-white font-bold text-sm rounded-lg shadow-md active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {mutation.isPending ? "Processing..." : "Transfer"}
          </button>
        </div>
      </form>

      <div className="md:hidden h-20" />
    </div>
  );
}
