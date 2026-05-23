"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";

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
  reference_name: string | null;
  reference_url: string | null;
  note: string | null;
  transaction_date: string;
  account_name: string;
}

function descriptionLabel(tx: Transaction): string {
  if (tx.reference_name) {
    const prefix =
      tx.reference_type === "purchase_payment"
        ? "Payment to"
        : tx.reference_type === "sale_payment"
          ? "Receipt from"
          : tx.reference_type === "salary"
            ? "Salary for"
            : tx.reference_type === "advance"
              ? "Advance to"
              : tx.reference_type === "transfer"
                ? "Transfer to"
                : "";
    return prefix ? `${prefix} ${tx.reference_name}` : tx.note || "Manual entry";
  }
  return tx.note || "Manual entry";
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function formatMoney(n: number) {
  return n.toLocaleString("en-IN") + " tk";
}

export default function AccountsPage() {
const { data: accountsData, isLoading: accountsLoading } = useQuery<Account[]>({
  queryKey: ["accounts"],
  queryFn: async () => {
    const res = await fetch("/api/accounts");
    if (!res.ok) throw new Error("Failed to load accounts");
    return res.json();
  },
  refetchInterval: 30000,
});

const { data: transactionsData } = useQuery<Transaction[]>({
  queryKey: ["recent-transactions"],
  queryFn: async () => {
    const res = await fetch("/api/accounts/transactions?limit=10");
    if (!res.ok) throw new Error("Failed to load transactions");
    return res.json();
  },
});

  const totalBalance = (accountsData ?? []).reduce(
    (s, a) => s + (a.is_active ? a.current_balance : 0),
    0,
  );

  if (accountsLoading) {
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
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Accounts', href: null }]} />
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="font-headline font-bold text-2xl md:text-3xl text-primary-container">
            Accounts
          </h1>
          <p className="text-sm text-secondary">
            Manage your cash flows and bank accounts across the yard.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/accounts/deposit"
            className="px-5 py-2.5 bg-white border-2 border-tertiary text-tertiary hover:bg-tertiary/5 transition-colors font-semibold rounded-md flex items-center justify-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-xl">payments</span>
            Deposit
          </Link>
          <Link
            href="/accounts/transfer"
            className="px-5 py-2.5 bg-white border-2 border-primary-container text-primary-container hover:bg-primary-container/5 transition-colors font-semibold rounded-md flex items-center justify-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-xl">swap_horiz</span>
            Transfer
          </Link>
          <Link
            href="/accounts/new"
            className="px-5 py-2.5 bg-white border-2 border-primary-container text-primary-container hover:bg-primary-container/5 transition-colors font-semibold rounded-md flex items-center justify-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Add Account
          </Link>
        </div>
      </div>

      {/* Desktop: Account Cards Grid */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {(accountsData ?? []).length === 0 && (
          <div className="col-span-full text-center py-12 text-secondary">
            <span className="material-symbols-outlined text-5xl block mb-4">
              account_balance
            </span>
            <p>No accounts yet. Add your first account to get started.</p>
          </div>
        )}
        {(accountsData ?? []).map((acc) => {
          const isCash = acc.type === "cash";
          return (
            <Link
              key={acc.id}
              href={`/accounts/${acc.id}`}
              className="bg-white p-5 md:p-6 rounded-lg shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow group"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-secondary-container/30 rounded-md">
                    <span className="material-symbols-outlined text-on-secondary-container">
                      {isCash ? "payments" : "account_balance"}
                    </span>
                  </div>
                  <span className="text-[10px] bg-surface-container-highest px-2 py-0.5 rounded text-secondary uppercase font-bold tracking-tighter">
                    {isCash ? "Physical Ledger" : "Bank Account"}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-outline font-medium uppercase tracking-wider mb-1">
                    {acc.name}
                  </p>
                  <h3 className="text-[28px] md:text-[32px] font-mono font-bold text-primary-container">
                    {formatMoney(acc.current_balance)}
                  </h3>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-outline-variant/20">
                <span className="text-tertiary font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
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

      {/* Mobile: Account Cards Horizontal Scroll */}
      <div className="md:hidden">
        {(accountsData ?? []).length === 0 ? (
          <div className="text-center py-12 text-secondary">
            <span className="material-symbols-outlined text-5xl block mb-4">
              account_balance
            </span>
            <p>No accounts yet. Add your first account to get started.</p>
          </div>
        ) : (
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6">
            {(accountsData ?? []).map((acc) => {
              const isCash = acc.type === "cash";
              return (
                <Link
                  key={acc.id}
                  href={`/accounts/${acc.id}`}
                  className={`min-w-[280px] snap-center p-5 rounded-xl shadow-md border flex flex-col justify-between shrink-0 ${isCash ? "bg-primary-container text-white border-primary-container/20" : "bg-surface-container-highest border-outline-variant"}`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-sm uppercase ${isCash ? "bg-on-primary-container text-primary-container" : "bg-secondary text-white"}`}>
                        {isCash ? "CASH" : "BANK"}
                      </span>
                      <span className={`material-symbols-outlined ${isCash ? "text-white/60" : "text-secondary"}`}>
                        {isCash ? "payments" : "account_balance"}
                      </span>
                    </div>
                    <h2 className="font-display text-lg font-medium">
                      {acc.name}
                    </h2>
                  </div>
                  <div className={`font-code text-2xl font-bold mt-4 ${isCash ? "text-white" : "text-primary"}`}>
                    {formatMoney(acc.current_balance)}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Total Bar */}
      {(accountsData ?? []).length > 0 && (
        <>
          <div className="hidden md:flex bg-primary-container p-4 md:p-6 rounded-lg justify-center items-center gap-2 md:gap-4 text-center border-l-4 border-tertiary-fixed shadow-lg">
            <span className="text-on-primary-container font-display font-semibold text-sm md:text-lg">
              Total Across All Accounts:
            </span>
            <span className="text-xl md:text-3xl font-code font-bold text-white">
              {formatMoney(totalBalance)}
            </span>
          </div>
          <div className="md:hidden w-full bg-surface-container-low border-y border-outline-variant py-3 px-4 flex justify-between items-center">
            <span className="text-caption text-on-surface-variant font-medium">Total Across All Accounts</span>
            <span className="font-code font-bold text-primary text-base">{formatMoney(totalBalance)}</span>
          </div>
        </>
      )}

      {/* Mobile: Transfer Funds Button */}
      <div className="md:hidden">
        <Link
          href="/accounts/transfer"
          className="w-full bg-primary text-white py-4 rounded-lg font-display font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
        >
          <span className="material-symbols-outlined">swap_horiz</span>
          Transfer Funds
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low/50">
          <h2 className="font-display font-semibold text-primary-container">
            Recent Transactions
          </h2>
          <span className="text-tertiary-container text-caption font-bold">View All</span>
        </div>
        {(transactionsData ?? []).length === 0 ? (
          <div className="p-8 text-center text-secondary text-sm">
            No transactions yet.
          </div>
        ) : (
          <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white text-left border-b border-outline-variant/20">
                  <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] font-bold text-outline uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] font-bold text-outline uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] font-bold text-outline uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] font-bold text-outline uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-sm">
                {(transactionsData ?? []).map((tx) => {
                  const isCredit = tx.type === "credit";
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-white transition-colors"
                    >
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-on-background">
                        {formatDate(tx.transaction_date)}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-secondary font-medium">
                        {tx.account_name}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        {tx.reference_url ? (
                          <Link href={tx.reference_url} className="text-tertiary hover:underline text-sm font-medium">
                            {descriptionLabel(tx)}
                          </Link>
                        ) : (
                          <span className="text-secondary text-sm">
                            {descriptionLabel(tx)}
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-4 md:px-6 py-3 md:py-4 whitespace-nowrap font-mono font-bold ${
                          isCredit ? "text-success" : "text-error"
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">
                            {isCredit ? "arrow_upward" : "arrow_downward"}
                          </span>
                          {formatMoney(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3 p-4">
            {(transactionsData ?? []).map((tx) => {
              const isCredit = tx.type === "credit";
              return (
                <div key={tx.id} className="bg-surface p-4 rounded-lg border border-outline-variant shadow-sm flex items-center gap-4 active:bg-surface-container-low transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCredit ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {isCredit ? "arrow_upward" : "arrow_downward"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-on-surface text-sm truncate">
                        {tx.reference_url ? (
                          <Link href={tx.reference_url} className="hover:underline text-tertiary">
                            {descriptionLabel(tx)}
                          </Link>
                        ) : (
                          descriptionLabel(tx)
                        )}
                      </h4>
                      <span className={`font-code text-sm font-bold shrink-0 ${isCredit ? "text-tertiary-container" : "text-error"}`}>
                        {isCredit ? "+" : "-"}{formatMoney(tx.amount)}
                      </span>
                    </div>
                    {tx.note && <p className="text-caption text-on-surface-variant mt-0.5">{tx.note}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-outline uppercase font-bold">{formatDate(tx.transaction_date)}</span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant" />
                      <span className="text-[10px] text-outline uppercase font-bold">{tx.account_name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}      </div>
    </div>
  );
}
