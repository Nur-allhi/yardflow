"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { useQuery } from "@tanstack/react-query";

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
  reference_name: string | null;
  reference_url: string | null;
  note: string | null;
  transaction_date: string;
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
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(n: number) {
  return n.toLocaleString("en-IN") + " tk";
}

export default function AccountDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: account, isLoading, error } = useQuery<AccountDetail>({
    queryKey: ["account", id],
    queryFn: async () => {
      const res = await fetch(`/api/accounts/${id}`);
      if (!res.ok) throw new Error("Failed to load account");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-6 bg-surface-container-high rounded w-1/3" />
        <div className="h-12 bg-surface-container-high rounded w-1/2" />
        <div className="h-64 bg-surface-container-high rounded-xl" />
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-error font-medium text-lg mb-2">
            {error?.message || "Account not found"}
          </p>
          <Link
            href="/accounts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-container text-white text-sm rounded-lg"
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
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Accounts', href: '/accounts' }, { label: `Account #${id.slice(0,4).toUpperCase()}`, href: null }]} />
      {/* Back + Title */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/accounts"
          className="w-9 h-9 flex items-center justify-center rounded-full border border-outline-variant text-secondary hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-display text-lg md:text-xl font-bold text-primary-container">
          {account.name}
        </h1>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${account.is_active ? "bg-success/10 text-success" : "bg-surface-container-highest text-secondary"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${account.is_active ? "bg-success" : "bg-secondary"}`} />
          {account.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Account Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Account Info */}
        <div className="lg:col-span-7 space-y-6">
          {/* Account Details Card */}
          <div className="bg-white border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 md:px-6 py-4 border-b border-outline-variant/50 bg-surface-container-low">
              <h3 className="font-display font-bold text-primary-container flex items-center gap-2">
                <span className="material-symbols-outlined">info</span>
                Account Details
              </h3>
            </div>
            <div className="p-5 md:p-6 grid grid-cols-2 gap-y-5">
              <div>
                <p className="text-[10px] uppercase font-bold text-secondary tracking-wider mb-1">Type</p>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold ${account.type === "cash" ? "bg-success/10 text-success" : "bg-secondary-container text-primary-container"}`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {account.type === "cash" ? "payments" : "account_balance"}
                  </span>
                  {account.type === "cash" ? "Cash" : "Bank"}
                </span>
              </div>
              {account.type === "bank" && (
                <>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-secondary tracking-wider mb-1">Bank Name</p>
                    <p className="font-medium text-primary-container text-sm">{account.bank_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-secondary tracking-wider mb-1">Account Number</p>
                    <p className="font-medium text-primary-container text-sm">{account.account_number || "—"}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 md:px-6 py-4 border-b border-outline-variant/50 bg-surface-container-low">
              <h3 className="font-display font-bold text-primary-container flex items-center gap-2">
                <span className="material-symbols-outlined">receipt_long</span>
                Transaction History
              </h3>
            </div>

            {account.transactions.length === 0 ? (
              <div className="p-6 text-center text-secondary text-sm">
                <span className="material-symbols-outlined text-3xl block mb-2 text-outline-variant">
                  receipt_long
                </span>
                No transactions yet
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-container-high border-b border-outline-variant">
                      <tr>
                        <th className="px-6 py-3 text-[10px] font-bold uppercase text-secondary tracking-wider">Date</th>
                        <th className="px-6 py-3 text-[10px] font-bold uppercase text-secondary tracking-wider">Description</th>
                        <th className="px-6 py-3 text-[10px] font-bold uppercase text-secondary tracking-wider text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30">
                      {account.transactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-background">
                          <td className="px-6 py-4 text-sm text-secondary whitespace-nowrap">
                            {formatDate(txn.transaction_date)}
                          </td>
                          <td className="px-6 py-4">
                            {txn.reference_url ? (
                              <Link href={txn.reference_url} className="text-tertiary hover:underline text-sm font-medium">
                                {descriptionLabel(txn)}
                                {txn.note && <span className="text-secondary font-normal ml-1">· {txn.note}</span>}
                              </Link>
                            ) : (
                              <span className="text-sm text-secondary">
                                {descriptionLabel(txn)}
                                {txn.note && <span className="ml-1">· {txn.note}</span>}
                              </span>
                            )}
                          </td>
                          <td className={`px-6 py-4 font-mono text-sm text-right font-semibold ${
                            txn.type === "credit" ? "text-success" : "text-error"
                          }`}>
                            {txn.type === "credit" ? "+" : "-"}{formatMoney(txn.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Transactions */}
                <div className="md:hidden space-y-3 p-4">
                  {account.transactions.map((txn) => (
                    <div key={txn.id} className="border border-outline-variant/30 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="space-y-1">
                          <p className="text-xs text-secondary">{formatDate(txn.transaction_date)}</p>
                          {txn.reference_url ? (
                            <Link href={txn.reference_url} className="text-tertiary hover:underline text-sm font-medium">
                              {descriptionLabel(txn)}
                            </Link>
                          ) : (
                            <p className="text-sm text-secondary">{descriptionLabel(txn)}</p>
                          )}
                        </div>
                        <p className={`font-mono text-base font-bold ${
                          txn.type === "credit" ? "text-success" : "text-error"
                        }`}>
                          {txn.type === "credit" ? "+" : "-"}{formatMoney(txn.amount)}
                        </p>
                      </div>
                      {txn.note && (
                        <p className="text-[11px] text-secondary italic pt-2 border-t border-outline-variant/20 mt-2">{txn.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Balance Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-primary-container text-white rounded-xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/10 blur-[60px] rounded-full -mr-16 -mt-16" />
            <h3 className="font-display font-bold text-lg mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary">
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

          <div className="bg-white border border-outline-variant/50 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary-container">analytics</span>
              <h3 className="font-display font-bold text-primary-container">Quick Stats</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary">Total Credits</span>
                <span className="font-mono font-bold text-success">
                  {formatMoney(
                    account.transactions
                      .filter((t) => t.type === "credit")
                      .reduce((s, t) => s + t.amount, 0),
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary">Total Debits</span>
                <span className="font-mono font-bold text-error">
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
