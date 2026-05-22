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
  note: string | null;
  transaction_date: string;
  account_name: string;
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

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
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

      {/* Total Bar */}
      {(accountsData ?? []).length > 0 && (
        <div className="bg-primary-container p-4 md:p-6 rounded-lg flex justify-center items-center gap-2 md:gap-4 text-center border-l-4 border-tertiary-fixed shadow-lg">
          <span className="text-on-primary-container font-headline font-semibold text-sm md:text-lg">
            Total Across All Accounts:
          </span>
          <span className="text-xl md:text-3xl font-mono font-bold text-white">
            {formatMoney(totalBalance)}
          </span>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low/50">
          <h2 className="font-headline font-semibold text-primary-container">
            Recent Transactions — All Accounts
          </h2>
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
                    Amount
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] font-bold text-outline uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] font-bold text-outline uppercase tracking-wider">
                    Description
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
                      <td
                        className={`px-4 md:px-6 py-3 md:py-4 whitespace-nowrap font-mono font-bold flex items-center gap-1 ${
                          isCredit ? "text-success" : "text-error"
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {isCredit ? "arrow_upward" : "arrow_downward"}
                        </span>
                        {formatMoney(tx.amount)}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        {tx.reference_id ? (
                          <span className="text-tertiary hover:underline text-xs font-medium">
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
                          <span className="text-outline">&mdash;</span>
                        )}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-secondary max-w-[200px] truncate">
                        {tx.note || (
                          <span className="text-outline">&mdash;</span>
                        )}
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
                <div key={tx.id} className="bg-white rounded-lg border border-outline-variant/20 p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs text-secondary">{formatDate(tx.transaction_date)}</p>
                      <p className="text-sm font-medium text-primary-container">{tx.account_name}</p>
                    </div>
                    <div className={`font-mono font-bold flex items-center gap-1 shrink-0 ${isCredit ? "text-success" : "text-error"}`}>
                      <span className="material-symbols-outlined text-xs">
                        {isCredit ? "arrow_upward" : "arrow_downward"}
                      </span>
                      {formatMoney(tx.amount)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>
                      {tx.reference_id ? (
                        <span className="text-tertiary font-medium">
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
                        <span className="text-outline">&mdash;</span>
                      )}
                    </span>
                    <span className="text-secondary truncate ml-2 max-w-[50%]">
                      {tx.note || <span className="text-outline">&mdash;</span>}
                    </span>
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
