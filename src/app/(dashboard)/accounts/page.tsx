"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Account {
  id: string;
  name: string;
  type: "cash" | "bank";
  bank_name: string | null;
  account_number: string | null;
  current_balance: number;
  is_active: boolean;
}

interface Transaction {
  id: string;
  account_id: string;
  type: "credit" | "debit";
  amount: number;
  reference_type: string;
  reference_id: string | null;
  note: string | null;
  transaction_date: string;
  account_name: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function formatMoney(n: number) {
  return "৳" + n.toLocaleString("en-IN");
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [remark, setRemark] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [transferMsg, setTransferMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/accounts").then((r) => r.json()),
      fetch("/api/accounts/transactions?limit=10").then((r) => r.json()),
    ])
      .then(([accts, txns]) => {
        setAccounts(accts);
        setTransactions(txns);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalBalance = accounts.reduce(
    (s, a) => s + (a.is_active ? a.current_balance : 0),
    0,
  );

  const fromAccount = accounts.find((a) => a.id === fromId);

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!fromId || !toId || !amount || !transferDate) return;
    setTransferring(true);
    setTransferMsg(null);
    try {
      const res = await fetch("/api/accounts/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_account_id: fromId,
          to_account_id: toId,
          amount: Number(amount),
          transfer_date: transferDate,
          note: remark || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Transfer failed");
      }
      setTransferMsg({ type: "success", text: "Transfer completed successfully!" });
      setFromId("");
      setToId("");
      setAmount("");
      setRemark("");
      const [accts, txns] = await Promise.all([
        fetch("/api/accounts").then((r) => r.json()),
        fetch("/api/accounts/transactions?limit=10").then((r) => r.json()),
      ]);
      setAccounts(accts);
      setTransactions(txns);
      setTimeout(() => setTransferMsg(null), 3000);
    } catch (err) {
      setTransferMsg({ type: "error", text: err instanceof Error ? err.message : "Transfer failed" });
    } finally {
      setTransferring(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-gray-100 rounded-lg" />
            ))}
          </div>
          <div className="h-16 bg-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="font-headline font-bold text-2xl md:text-3xl text-[#0F172A]">
            Accounts
          </h1>
          <p className="text-sm text-[#505f76]">
            Manage your cash flows and bank accounts across the yard.
          </p>
        </div>
        <Link
          href="/accounts/new"
          className="px-5 py-2.5 bg-white border-2 border-[#0F172A] text-[#0F172A] hover:bg-[#0F172A]/5 transition-colors font-semibold rounded-md flex items-center justify-center gap-2 text-sm"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Add Account
        </Link>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {accounts.length === 0 && (
          <div className="col-span-full text-center py-12 text-[#505f76]">
            <span className="material-symbols-outlined text-5xl block mb-4">
              account_balance
            </span>
            <p>No accounts yet. Add your first account to get started.</p>
          </div>
        )}
        {accounts.map((acc) => {
          const isCash = acc.type === "cash";
          return (
            <Link
              key={acc.id}
              href={`/accounts/${acc.id}`}
              className="bg-white p-5 md:p-6 rounded-lg shadow-sm border border-[#c6c6cd]/30 flex flex-col justify-between hover:shadow-md transition-shadow group"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-[#d0e1fb]/30 rounded-md">
                    <span className="material-symbols-outlined text-[#54647a]">
                      {isCash ? "payments" : "account_balance"}
                    </span>
                  </div>
                  <span className="text-[10px] bg-[#e0e3e5] px-2 py-0.5 rounded text-[#505f76] uppercase font-bold tracking-tighter">
                    {isCash ? "Physical Ledger" : "Bank Account"}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-[#76777d] font-medium uppercase tracking-wider mb-1">
                    {acc.name}
                  </p>
                  <h3 className="text-[28px] md:text-[32px] font-mono font-bold text-[#0F172A]">
                    {formatMoney(acc.current_balance)}
                  </h3>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#c6c6cd]/20">
                <span className="text-[#069669] font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  View Transactions{" "}
                  <span className="material-symbols-outlined text-sm">
                    arrow_forward
                  </span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Total Bar */}
      {accounts.length > 0 && (
        <div className="bg-[#131B2E] p-4 md:p-6 rounded-lg flex justify-center items-center gap-2 md:gap-4 text-center border-l-4 border-[#85f8c4] shadow-lg">
          <span className="text-[#7c839b] font-headline font-semibold text-sm md:text-lg">
            Total Across All Accounts:
          </span>
          <span className="text-xl md:text-3xl font-mono font-bold text-white">
            {formatMoney(totalBalance)}
          </span>
        </div>
      )}

      {/* Bottom Grid: Transactions + Transfer */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        {/* Recent Transactions */}
        <div className="xl:col-span-2 bg-white rounded-lg shadow-sm border border-[#c6c6cd]/30 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-[#c6c6cd]/20 flex justify-between items-center bg-[#f2f4f6]/50">
            <h2 className="font-headline font-semibold text-[#0F172A]">
              Recent Transactions — All Accounts
            </h2>
          </div>
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-[#505f76] text-sm">
              No transactions yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-white text-left border-b border-[#c6c6cd]/20">
                    <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] font-bold text-[#76777d] uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] font-bold text-[#76777d] uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] font-bold text-[#76777d] uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] font-bold text-[#76777d] uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] font-bold text-[#76777d] uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c6c6cd]/10 text-sm">
                  {transactions.map((tx) => {
                    const isCredit = tx.type === "credit";
                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-white transition-colors"
                      >
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-[#191c1e]">
                          {formatDate(tx.transaction_date)}
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-[#505f76] font-medium">
                          {tx.account_name}
                        </td>
                        <td
                          className={`px-4 md:px-6 py-3 md:py-4 whitespace-nowrap font-mono font-bold flex items-center gap-1 ${
                            isCredit ? "text-[#16A34A]" : "text-[#ba1a1a]"
                          }`}
                        >
                          <span className="material-symbols-outlined text-xs">
                            {isCredit ? "arrow_upward" : "arrow_downward"}
                          </span>
                          {formatMoney(tx.amount)}
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          {tx.reference_id ? (
                            <span className="text-[#069669] hover:underline text-xs font-medium">
                              #
                              {tx.reference_type === "purchase_payment"
                                ? "PUR"
                                : tx.reference_type === "sale_payment"
                                  ? "SAL"
                                  : tx.reference_type === "salary"
                                    ? "SLR"
                                    : tx.reference_type === "transfer"
                                      ? "TRF"
                                      : "REF"}
                              -{tx.reference_id.slice(0, 8)}
                            </span>
                          ) : (
                            <span className="text-[#76777d]">&mdash;</span>
                          )}
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 text-[#505f76] max-w-[200px] truncate">
                          {tx.note || (
                            <span className="text-[#76777d]">&mdash;</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transfer Card */}
        <div className="bg-white rounded-lg shadow-sm border border-[#c6c6cd]/30 flex flex-col h-full">
          <div className="p-4 md:p-6 border-b border-[#c6c6cd]/20 bg-[#f2f4f6]/50">
            <h2 className="font-headline font-semibold text-[#0F172A]">
              Transfer Between Accounts
            </h2>
          </div>
          <form onSubmit={handleTransfer} className="p-4 md:p-6 space-y-4 md:space-y-5 flex-1">
            {transferMsg && (
              <div
                className={`p-3 rounded-md text-sm font-medium ${
                  transferMsg.type === "success"
                    ? "bg-[#22C55E]/10 text-[#16A34A]"
                    : "bg-[#ffdad6] text-[#93000a]"
                }`}
              >
                {transferMsg.text}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#191c1e] uppercase tracking-tight">
                From Account
              </label>
              <select
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                required
                className="w-full bg-[#f2f4f6] border border-[#c6c6cd] rounded-md text-sm py-2.5 px-3 focus:ring-1 focus:ring-[#0F172A] focus:border-[#0F172A] transition-all"
              >
                <option value="">Select source</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatMoney(a.current_balance)})
                  </option>
                ))}
              </select>
              {fromAccount && (
                <p className="text-xs text-[#76777d]">
                  Balance: {formatMoney(fromAccount.current_balance)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#191c1e] uppercase tracking-tight">
                To Account
              </label>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                required
                className="w-full bg-[#f2f4f6] border border-[#c6c6cd] rounded-md text-sm py-2.5 px-3 focus:ring-1 focus:ring-[#0F172A] focus:border-[#0F172A] transition-all"
              >
                <option value="">Select destination</option>
                {accounts
                  .filter((a) => a.id !== fromId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatMoney(a.current_balance)})
                    </option>
                  ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#191c1e] uppercase tracking-tight">
                  Amount (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full bg-[#f2f4f6] border border-[#c6c6cd] rounded-md font-mono text-sm py-2.5 px-3 focus:ring-1 focus:ring-[#0F172A] focus:border-[#0F172A] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#191c1e] uppercase tracking-tight">
                  Date
                </label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  required
                  className="w-full bg-[#f2f4f6] border border-[#c6c6cd] rounded-md text-sm py-2 px-3 focus:ring-1 focus:ring-[#0F172A] focus:border-[#0F172A] transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#191c1e] uppercase tracking-tight">
                Remarks
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Reason for transfer..."
                rows={2}
                className="w-full bg-[#f2f4f6] border border-[#c6c6cd] rounded-md text-sm py-2.5 px-3 focus:ring-1 focus:ring-[#0F172A] focus:border-[#0F172A] transition-all resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={transferring}
              className="w-full bg-[#0F172A] text-white font-bold py-3 rounded-md hover:bg-[#45464d] transition-colors active:scale-[0.98] duration-100 flex justify-center items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-xl">
                swap_horiz
              </span>
              {transferring ? "Transferring..." : "Execute Transfer"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
