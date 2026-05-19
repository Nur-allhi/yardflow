"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface AccountDetail {
  id: string;
  name: string;
  type: "cash" | "bank";
  bank_name: string | null;
  account_number: string | null;
  current_balance: number;
  is_active: boolean;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  reference_type: string;
  reference_id: string | null;
  note: string | null;
  transaction_date: string;
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

export default function AccountDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccount = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/accounts/${id}`);
      if (!res.ok) throw new Error("Account not found");
      const data = await res.json();
      setAccount(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-6 bg-[#e6e8ea] rounded w-1/3" />
        <div className="h-12 bg-[#e6e8ea] rounded w-1/2" />
        <div className="h-64 bg-[#e6e8ea] rounded-xl" />
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-[#EF4444] font-medium text-lg mb-2">
            {error || "Account not found"}
          </p>
          <Link
            href="/accounts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white text-sm rounded-lg"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Accounts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Back + Title */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/accounts"
          className="w-9 h-9 flex items-center justify-center rounded-full border border-[#c6c6cd] text-[#505f76] hover:bg-[#f2f4f6] transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-display text-lg md:text-xl font-bold text-[#0F172A]">
          {account.name}
        </h1>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${account.is_active ? "bg-[#22C55E]/10 text-[#16A34A]" : "bg-[#e0e3e5] text-[#505f76]"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${account.is_active ? "bg-[#16A34A]" : "bg-[#505f76]"}`} />
          {account.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Account Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Account Info */}
        <div className="lg:col-span-7 space-y-6">
          {/* Account Details Card */}
          <div className="bg-white border border-[#c6c6cd]/50 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 md:px-6 py-4 border-b border-[#c6c6cd]/50 bg-[#f2f4f6]">
              <h3 className="font-display font-bold text-[#0F172A] flex items-center gap-2">
                <span className="material-symbols-outlined">info</span>
                Account Details
              </h3>
            </div>
            <div className="p-5 md:p-6 grid grid-cols-2 gap-y-5">
              <div>
                <p className="text-[10px] uppercase font-bold text-[#505f76] tracking-wider mb-1">Type</p>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold ${account.type === "cash" ? "bg-[#22C55E]/10 text-[#16A34A]" : "bg-[#d0e1fb] text-[#0F172A]"}`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {account.type === "cash" ? "payments" : "account_balance"}
                  </span>
                  {account.type === "cash" ? "Cash" : "Bank"}
                </span>
              </div>
              {account.type === "bank" && (
                <>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#505f76] tracking-wider mb-1">Bank Name</p>
                    <p className="font-medium text-[#0F172A] text-sm">{account.bank_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#505f76] tracking-wider mb-1">Account Number</p>
                    <p className="font-medium text-[#0F172A] text-sm">{account.account_number || "—"}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white border border-[#c6c6cd]/50 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 md:px-6 py-4 border-b border-[#c6c6cd]/50 bg-[#f2f4f6]">
              <h3 className="font-display font-bold text-[#0F172A] flex items-center gap-2">
                <span className="material-symbols-outlined">receipt_long</span>
                Transaction History
              </h3>
            </div>

            {account.transactions.length === 0 ? (
              <div className="p-6 text-center text-[#505f76] text-sm">
                <span className="material-symbols-outlined text-3xl block mb-2 text-[#c6c6cd]">
                  receipt_long
                </span>
                No transactions yet
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#e6e8ea] border-b border-[#c6c6cd]">
                      <tr>
                        <th className="px-6 py-3 text-[10px] font-bold uppercase text-[#505f76] tracking-wider">Date</th>
                        <th className="px-6 py-3 text-[10px] font-bold uppercase text-[#505f76] tracking-wider">Type</th>
                        <th className="px-6 py-3 text-[10px] font-bold uppercase text-[#505f76] tracking-wider text-right">Amount</th>
                        <th className="px-6 py-3 text-[10px] font-bold uppercase text-[#505f76] tracking-wider">Reference</th>
                        <th className="px-6 py-3 text-[10px] font-bold uppercase text-[#505f76] tracking-wider">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c6c6cd]/30">
                      {account.transactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-[#F8FAFC]">
                          <td className="px-6 py-4 text-sm text-[#505f76] whitespace-nowrap">
                            {formatDate(txn.transaction_date)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                              txn.type === "credit"
                                ? "bg-[#22C55E]/10 text-[#16A34A]"
                                : "bg-[#EF4444]/10 text-[#DC2626]"
                            }`}>
                              {txn.type === "credit" ? "Credit" : "Debit"}
                            </span>
                          </td>
                          <td className={`px-6 py-4 font-mono text-sm text-right font-semibold ${
                            txn.type === "credit" ? "text-[#16A34A]" : "text-[#DC2626]"
                          }`}>
                            {txn.type === "credit" ? "+" : "-"}{formatMoney(txn.amount)}
                          </td>
                          <td className="px-6 py-4 text-sm text-[#505f76] capitalize">
                            {txn.reference_type.replace(/_/g, " ")}
                          </td>
                          <td className="px-6 py-4 text-sm text-[#505f76] italic max-w-[200px] truncate">
                            {txn.note || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Transactions */}
                <div className="md:hidden space-y-3 p-4">
                  {account.transactions.map((txn) => (
                    <div key={txn.id} className="border border-[#c6c6cd]/30 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="space-y-1">
                          <p className="text-xs text-[#505f76]">{formatDate(txn.transaction_date)}</p>
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            txn.type === "credit"
                              ? "bg-[#22C55E]/10 text-[#16A34A]"
                              : "bg-[#EF4444]/10 text-[#DC2626]"
                          }`}>
                            {txn.type === "credit" ? "Credit" : "Debit"}
                          </span>
                        </div>
                        <p className={`font-mono text-base font-bold ${
                          txn.type === "credit" ? "text-[#16A34A]" : "text-[#DC2626]"
                        }`}>
                          {txn.type === "credit" ? "+" : "-"}{formatMoney(txn.amount)}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-[#505f76] pt-2 border-t border-[#c6c6cd]/20">
                        <div>
                          <span className="font-bold uppercase tracking-wider">Reference</span>
                          <p className="capitalize">{txn.reference_type.replace(/_/g, " ")}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold uppercase tracking-wider">Note</span>
                          <p className="italic">{txn.note || "—"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Balance Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0F172A] text-white rounded-xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#059669]/10 blur-[60px] rounded-full -mr-16 -mt-16" />
            <h3 className="font-display font-bold text-lg mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#059669]">
                account_balance_wallet
              </span>
              Balance Summary
            </h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Current Balance</span>
                <span className="font-mono text-2xl font-bold text-white">
                  {formatMoney(account.current_balance)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-white/20 pt-4">
                <span className="text-white/70 text-sm">Total Transactions</span>
                <span className="font-mono font-bold text-white">
                  {account.transactions.length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#c6c6cd]/50 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#0F172A]">analytics</span>
              <h3 className="font-display font-bold text-[#0F172A]">Quick Stats</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#505f76]">Total Credits</span>
                <span className="font-mono font-bold text-[#16A34A]">
                  {formatMoney(
                    account.transactions
                      .filter((t) => t.type === "credit")
                      .reduce((s, t) => s + t.amount, 0),
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#505f76]">Total Debits</span>
                <span className="font-mono font-bold text-[#DC2626]">
                  {formatMoney(
                    account.transactions
                      .filter((t) => t.type === "debit")
                      .reduce((s, t) => s + t.amount, 0),
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
