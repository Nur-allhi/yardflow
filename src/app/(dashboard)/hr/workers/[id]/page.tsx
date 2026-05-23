"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { useQuery } from "@tanstack/react-query";

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

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(n: number) {
  return (n ?? 0).toLocaleString("en-IN") + " tk";
}

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function WorkerDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: workerRaw, isLoading, error } = useQuery<{ worker: WorkerDetail; advances: Advance[] }>({
    queryKey: ["worker", id],
    queryFn: async () => {
      const res = await fetch(`/api/hr/workers/${id}`);
      if (!res.ok) throw new Error("Failed to load worker");
      return res.json();
    },
  });

  const worker: WorkerDetail | null = workerRaw
    ? { ...workerRaw.worker, advances: workerRaw.advances }
    : null;

  // Loading
  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-6 bg-surface-container-high rounded w-1/3" />
        <div className="h-12 bg-surface-container-high rounded w-1/2" />
        <div className="h-64 bg-surface-container-high rounded-xl" />
      </div>
    );
  }

  // Error
  if (error || !worker) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-error font-medium text-lg mb-2">
            {error?.message || "Worker not found"}
          </p>
          <Link
            href="/hr/workers"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-container text-white text-sm rounded-lg"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Workers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Workers', href: '/hr/workers' }, { label: 'Worker Profile', href: null }]} />
      {/* Back + Title */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/hr/workers"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-outline-variant text-secondary hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${worker.is_active ? 'bg-secondary-container text-primary-container' : 'bg-surface-container-highest text-secondary'}`}>
              {getInitials(worker.name)}
            </div>
            <h1 className="font-display text-lg md:text-xl font-bold text-primary-container">
              {worker.name}
            </h1>
          </div>
        </div>
        <div className="md:ml-auto hidden md:flex gap-3">
          <Link
            href={`/hr/advances/new?worker_id=${worker.id}`}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-container text-white font-bold text-sm rounded-lg hover:bg-primary-container/90 transition-all active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Record Advance
          </Link>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-6">
        {/* KPI Grid */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant">
            <p className="text-on-surface-variant text-[11px] font-medium uppercase tracking-tight mb-1">Monthly Salary</p>
            <p className="font-code text-lg font-semibold text-primary">{formatMoney(worker.monthly_salary)}</p>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant">
            <p className="text-on-surface-variant text-[11px] font-medium uppercase tracking-tight mb-1">Total Advances</p>
            <p className="font-code text-lg font-semibold text-warning">
              {worker.advances.length > 0 ? formatMoney(worker.advances.reduce((sum, a) => sum + a.amount, 0)) : "0 tk"}
            </p>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant">
            <p className="text-on-surface-variant text-[11px] font-medium uppercase tracking-tight mb-1">Net Payable</p>
            <p className="font-code text-lg font-semibold text-on-tertiary-container">
              {formatMoney(Math.max(0, worker.monthly_salary - worker.advances.reduce((sum, a) => sum + a.amount, 0)))}
            </p>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant">
            <p className="text-on-surface-variant text-[11px] font-medium uppercase tracking-tight mb-1">Status</p>
            <span className={`px-2 py-0.5 rounded-sm text-[10px] uppercase font-bold inline-block ${
              worker.is_active
                ? "bg-success/10 text-success"
                : "bg-surface-container-high text-on-surface-variant"
            }`}>
              {worker.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </section>

        {/* Advance History Section */}
        <section className="space-y-3">
          <h2 className="font-display font-semibold text-on-surface">Advance History</h2>
          {worker.advances.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 text-center">
              <span className="material-symbols-outlined text-3xl text-outline-variant block mb-2">account_balance_wallet</span>
              <p className="text-secondary text-sm">No advances recorded</p>
            </div>
          ) : (
            <div className="space-y-3">
              {worker.advances.map((a) => (
                <div key={a.id} className="flex gap-4 p-4 bg-surface-container-low rounded-lg border-l-4 border-warning">
                  <div className="flex-shrink-0 bg-warning/10 text-warning w-10 h-10 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-on-surface">{formatDate(a.advance_date)}</h4>
                      <span className="font-code font-bold text-warning">{formatMoney(a.amount)}</span>
                    </div>
                    <p className="text-caption text-on-surface-variant">{MONTH_NAMES[a.month - 1]} {a.year}</p>
                    {a.note && (
                      <p className="text-caption text-on-surface-variant italic mt-0.5">&ldquo;{a.note}&rdquo;</p>
                    )}
                    {a.account_name && (
                      <p className="text-caption text-on-surface-variant">Payment: {a.account_name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Calculation Summary */}
        <div className="bg-primary-container p-6 rounded-xl text-on-primary space-y-4 shadow-lg">
          <h3 className="text-caption font-bold uppercase tracking-widest text-on-primary-container">Calculation Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b border-on-primary-container/20 pb-2">
              <span className="text-body-sm opacity-80">Base Salary</span>
              <span className="font-code text-body">{formatMoney(worker.monthly_salary)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-on-primary-container/20 pb-2">
              <span className="text-body-sm opacity-80">Total Advances</span>
              <span className="font-code text-body text-warning">
                {worker.advances.length > 0 ? formatMoney(worker.advances.reduce((sum, a) => sum + a.amount, 0)) : "0 tk"}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-lg">Net Payable</span>
              <span className="font-code text-xl font-bold text-on-tertiary-container">
                {formatMoney(Math.max(0, worker.monthly_salary - worker.advances.reduce((sum, a) => sum + a.amount, 0)))}
              </span>
            </div>
          </div>
        </div>

        {/* Fixed Bottom CTA */}
        <div className="h-24" />
      </div>

      {/* Mobile Fixed Button */}
      <div className="md:hidden fixed bottom-[72px] left-0 w-full p-4 bg-gradient-to-t from-background via-background/80 to-transparent z-40">
        <Link
          href={`/hr/advances/new?worker_id=${worker.id}`}
          className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Record Advance
        </Link>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Worker Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 md:px-6 py-4 border-b border-outline-variant/50 bg-surface-container-low">
                <h3 className="font-display font-bold text-primary-container flex items-center gap-2">
                  <span className="material-symbols-outlined">person</span>
                  Worker Information
                </h3>
              </div>
              <div className="p-5 md:p-6 space-y-5">
                <div className="grid grid-cols-2 gap-y-5">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-secondary tracking-wider mb-1">
                      Phone
                    </p>
                    <p className="font-medium text-primary-container text-sm">
                      {worker.phone || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-secondary tracking-wider mb-1">
                      Designation
                    </p>
                    <p className="font-medium text-primary-container text-sm">
                      {worker.designation || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-secondary tracking-wider mb-1">
                      Monthly Salary
                    </p>
                    <p className="font-mono font-bold text-primary-container text-sm">
                      {formatMoney(worker.monthly_salary)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-secondary tracking-wider mb-1">
                      Join Date
                    </p>
                    <p className="font-medium text-primary-container text-sm">
                      {worker.join_date ? formatDate(worker.join_date) : "—"}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-outline-variant/30">
                  <p className="text-[10px] uppercase font-bold text-secondary tracking-wider mb-1">
                    Status
                  </p>
                  <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-sm border ${
                    worker.is_active
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-secondary/10 text-secondary border-secondary/20"
                  }`}>
                    {worker.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Advance History */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 md:px-6 py-4 border-b border-outline-variant/50 bg-surface-container-low flex justify-between items-center">
                <h3 className="font-display font-bold text-primary-container flex items-center gap-2">
                  <span className="material-symbols-outlined">history</span>
                  Advance History
                </h3>
              </div>

              {worker.advances.length === 0 ? (
                <div className="p-8 text-center text-secondary text-sm">
                  <span className="material-symbols-outlined text-4xl block mb-3 text-outline-variant">
                    account_balance_wallet
                  </span>
                  No advances recorded
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-surface-container-high border-b border-outline-variant">
                        <tr>
                          <th className="px-6 py-3 text-[10px] font-bold uppercase text-secondary tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-[10px] font-bold uppercase text-secondary tracking-wider text-right">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-[10px] font-bold uppercase text-secondary tracking-wider">
                            Month/Year
                          </th>
                          <th className="px-6 py-3 text-[10px] font-bold uppercase text-secondary tracking-wider">
                            Note
                          </th>
                          <th className="px-6 py-3 text-[10px] font-bold uppercase text-secondary tracking-wider">
                            Account
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/30">
                        {worker.advances.map((a) => (
                          <tr key={a.id} className="hover:bg-background">
                            <td className="px-6 py-4 text-sm">
                              {formatDate(a.advance_date)}
                            </td>
                            <td className="px-6 py-4 font-mono text-sm font-bold text-right text-warning">
                              <Link href="/hr/payroll" className="hover:underline">
                                {formatMoney(a.amount)}
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {MONTH_NAMES[a.month - 1]} {a.year}
                            </td>
                            <td className="px-6 py-4 text-sm text-secondary max-w-[200px] truncate">
                              {a.note || "—"}
                            </td>
                            <td className="px-6 py-4 text-sm text-secondary">
                              {a.account_name || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards (hidden on desktop) */}
                  <div className="md:hidden space-y-3 p-4">
                    {worker.advances.map((a) => (
                      <div
                        key={a.id}
                        className="bg-white rounded-lg p-4 border border-outline-variant/30"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs text-secondary font-medium">
                            {formatDate(a.advance_date)}
                          </p>
                          <Link href="/hr/payroll" className="font-mono font-bold text-warning hover:underline">
                            {formatMoney(a.amount)}
                          </Link>
                        </div>
                        <div className="flex justify-between text-xs text-secondary">
                          <span>{MONTH_NAMES[a.month - 1]} {a.year}</span>
                          <span>{a.account_name || ""}</span>
                        </div>
                        {a.note && (
                          <p className="text-xs text-secondary italic mt-1">
                            &ldquo;{a.note}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
