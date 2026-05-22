"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function NewAccountPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [type, setType] = useState<"cash" | "bank">("cash");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (formData: Record<string, unknown>) => {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create account");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      router.push("/accounts");
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Account name is required");
      return;
    }
    if (type === "bank" && !bankName.trim()) {
      setError("Bank name is required for bank accounts");
      return;
    }

    setError(null);

    mutation.mutate({
      name: name.trim(),
      type,
      bank_name: type === "bank" ? bankName.trim() : undefined,
      account_number: type === "bank" ? accountNumber.trim() || undefined : undefined,
      opening_balance: openingBalance ? parseFloat(openingBalance) : 0,
    });
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
          New Account
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-lg mx-auto space-y-6">
          <section className="bg-white rounded-lg border border-outline-variant/50 shadow-sm p-5 md:p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-primary-container">account_balance</span>
              <h2 className="font-display text-lg font-semibold">Account Details</h2>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-error-container border border-error/20 rounded-lg text-sm text-error font-medium">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Account Name <span className="text-error">*</span>
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                  enterKeyHint="next"
                  className="w-full h-[44px] border border-outline-variant rounded px-3 text-sm focus:border-primary-container focus:ring-0 outline-none"
                  placeholder="e.g. Main Cash"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Type <span className="text-error">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {(["cash", "bank"] as const).map((option) => (
                    <label
                      key={option}
                      className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                        type === option
                          ? "border-primary-container bg-primary-container/5"
                          : "border-outline-variant hover:border-primary-container"
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={option}
                        checked={type === option}
                        onChange={() => setType(option)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary-container">
                          {option === "cash" ? "payments" : "account_balance"}
                        </span>
                        <span className="font-bold text-sm text-primary-container capitalize">{option}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {type === "bank" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Bank Name <span className="text-error">*</span>
                    </label>
                    <input
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      autoComplete="organization"
                      enterKeyHint="next"
                      className="w-full h-[44px] border border-outline-variant rounded px-3 text-sm focus:border-primary-container focus:ring-0 outline-none"
                      placeholder="e.g. Sonali Bank"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Account Number
                    </label>
                    <input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      autoComplete="off"
                      enterKeyHint="next"
                      className="w-full h-[44px] border border-outline-variant rounded px-3 text-sm focus:border-primary-container focus:ring-0 outline-none"
                      placeholder="e.g. 1234567890"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Opening Balance (tk)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  autoComplete="off"
                  inputMode="decimal"
                  enterKeyHint="next"
                  className="w-full h-[44px] border border-outline-variant rounded px-3 text-sm font-mono focus:border-primary-container focus:ring-0 outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>
          </section>

          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/accounts"
              className="flex-1 h-[44px] bg-transparent text-secondary hover:bg-surface-container-low transition-colors font-bold text-sm rounded border border-outline-variant flex items-center justify-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              enterKeyHint="send"
              className="flex-1 h-[44px] bg-primary-container text-white hover:bg-primary-container/90 transition-all active:scale-95 font-bold text-sm rounded shadow-md disabled:opacity-40"
            >
              {mutation.isPending ? "Saving..." : "Save Account"}
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
            {mutation.isPending ? "Saving..." : "Save Account"}
          </button>
        </div>
      </form>

      <div className="md:hidden h-20" />
    </div>
  );
}
