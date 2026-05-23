"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";

interface Worker {
  id: string;
  name: string;
  phone: string | null;
  designation: string | null;
  monthly_salary: number;
  join_date: string | null;
  is_active: boolean;
  this_month_advances: number;
}

interface Summary {
  total_workers: number;
  monthly_payroll: number;
  pending_advances: number;
}

function formatMoney(n: number) {
  return (n ?? 0).toLocaleString("en-IN") + " tk";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="px-2 py-1 text-[10px] font-black uppercase bg-success/10 text-success rounded-sm border border-success/20">
      Active
    </span>
  ) : (
    <span className="px-2 py-1 text-[10px] font-black uppercase bg-secondary/10 text-secondary rounded-sm border border-secondary/20">
      Inactive
    </span>
  );
}

export default function WorkersPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, error, refetch } = useQuery<{
    workers: Worker[];
    summary: Summary;
  }>({
    queryKey: ["workers"],
    queryFn: async () => {
      const res = await fetch("/api/hr/workers");
      if (!res.ok) throw new Error("Failed to load workers");
      return res.json();
    },
  });

  const workers: Worker[] = data?.workers ?? [];
  const summary: Summary | null = data?.summary ?? null;

  const filtered = workers.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-4 md:p-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Workers', href: null }]} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-[2rem] font-bold text-primary-container tracking-tight">
            HR & Payroll
          </h1>
        </div>
        <div className="flex gap-3">
          <Link
            href="/hr/workers/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary-container text-white font-semibold rounded-lg hover:bg-primary-container/90 transition-all text-sm shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Worker
          </Link>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-outline-variant/50">
        <Link
          href="/hr/workers"
          className="px-4 py-3 text-sm font-bold text-tertiary border-b-2 border-tertiary"
        >
          Workers
        </Link>
        <Link
          href="/hr/advances/new"
          className="px-4 py-3 text-sm text-secondary hover:text-primary-container transition-colors"
        >
          Advances
        </Link>
        <Link
          href="/hr/payroll"
          className="px-4 py-3 text-sm text-secondary hover:text-primary-container transition-colors"
        >
          Payroll
        </Link>
      </div>

      {/* Stats Row */}
      <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-6 mb-6 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
        <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-white p-4 md:p-6 rounded-xl border border-outline-variant/30 md:border-outline-variant shadow-sm">
          <p className="text-secondary text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">
            Total Workers
          </p>
          <p className="font-mono text-lg md:text-2xl font-bold text-primary-container">
            {summary ? summary.total_workers : "—"}
          </p>
        </div>
        <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-white p-4 md:p-6 rounded-xl border border-outline-variant/30 md:border-outline-variant shadow-sm">
          <p className="text-secondary text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">
            Total Monthly Payroll
          </p>
          <p className="font-mono text-lg md:text-2xl font-bold text-tertiary">
            {summary ? formatMoney(summary.monthly_payroll) : "—"}
          </p>
        </div>
        <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-white p-4 md:p-6 rounded-xl border border-outline-variant/30 md:border-outline-variant shadow-sm">
          <p className="text-secondary text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">
            Pending Advances
          </p>
          <p className="font-mono text-lg md:text-2xl font-bold text-warning">
            {summary ? formatMoney(summary.pending_advances) : "—"}
          </p>
        </div>
        <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-white p-4 md:p-6 rounded-xl border border-outline-variant/30 md:border-outline-variant shadow-sm">
          <p className="text-secondary text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">
            Active Workers
          </p>
          <p className="font-mono text-lg md:text-2xl font-bold text-primary-container">
            {summary ? `${summary.total_workers}` : "—"}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-outline-variant rounded-lg text-sm outline-none focus:ring-0"
            placeholder="Search workers..."
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-outline-variant/30 p-6 animate-pulse"
            >
              <div className="h-4 bg-surface-container-high rounded w-1/3 mb-3" />
              <div className="h-4 bg-surface-container-high rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-error font-medium text-sm">{error?.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-4 py-2 bg-primary-container text-white text-sm rounded-lg"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-outline-variant/30 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-outline-variant block mb-4">
            groups
          </span>
          <p className="text-secondary text-sm font-medium mb-1">
            No workers yet
          </p>
          <p className="text-secondary text-xs">
            Start by adding your first worker
          </p>
          <Link
            href="/hr/workers/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary-container text-white text-sm font-semibold rounded-lg"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Worker
          </Link>
        </div>
      )}

      {/* Desktop Table */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-high border-b border-outline-variant">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">
                  Worker Name
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">
                  Monthly Salary
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">
                  This Month Advances
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">
                  Net Payable
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {filtered.map((w) => (
                <tr
                  key={w.id}
                  className="hover:bg-background transition-colors cursor-pointer group"
                  onClick={() => window.location.href = `/hr/workers/${w.id}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${w.is_active ? 'bg-secondary-container text-primary-container' : 'bg-surface-container-highest text-secondary'}`}>
                        {getInitials(w.name)}
                      </div>
                      <span className="font-bold text-sm">{w.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                    {w.designation || "—"}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm font-bold">
                    {formatMoney(w.monthly_salary)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge active={w.is_active} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-mono text-sm font-bold ${w.this_month_advances > 0 ? 'text-warning' : 'text-outline'}`}>
                      {w.this_month_advances > 0 ? formatMoney(w.this_month_advances) : "0 tk"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-mono text-sm font-bold ${w.monthly_salary - w.this_month_advances > 0 ? 'text-tertiary' : w.monthly_salary - w.this_month_advances < 0 ? 'text-error' : 'text-outline'}`}>
                      {formatMoney(Math.max(0, w.monthly_salary - w.this_month_advances))}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/hr/workers/${w.id}`}
                        className="text-xs font-bold px-3 py-1 rounded bg-surface-container-low text-secondary hover:bg-surface-container-high"
                      >
                        View
                      </Link>
                      <Link
                        href={`/hr/advances/new?worker_id=${w.id}`}
                        className="text-xs font-bold px-3 py-1 rounded bg-tertiary/10 text-tertiary hover:bg-tertiary/20"
                      >
                        Advance
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Card List */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="md:hidden space-y-3">
          {filtered.map((w) => (
            <div
              key={w.id}
              onClick={() => window.location.href = `/hr/workers/${w.id}`}
              className="bg-surface-container-lowest rounded-lg border border-outline-variant/50 shadow-sm p-4 flex flex-col space-y-4 cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-display font-bold text-on-surface text-lg">{w.name}</h3>
                  <p className="font-body text-secondary text-sm">{w.designation || "—"}</p>
                  {w.phone && <p className="font-body text-on-surface-variant text-xs mt-0.5">{w.phone}</p>}
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-code font-bold text-on-surface text-base">{formatMoney(w.monthly_salary)}</span>
                  <span className={`px-2 py-0.5 rounded-sm text-[10px] uppercase font-bold mt-1 ${
                    w.is_active
                      ? "bg-success/10 text-success"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}>
                    {w.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {w.this_month_advances > 0 ? (
                  <div className="inline-flex items-center bg-warning/10 text-warning px-2 py-1 rounded-sm border border-warning/20">
                    <span className="material-symbols-outlined text-[14px] mr-1">payments</span>
                    <span className="font-code text-xs font-bold">{formatMoney(w.this_month_advances)} Advances</span>
                  </div>
                ) : (
                  <span className="text-secondary text-xs italic">No pending advances</span>
                )}
                {w.monthly_salary - w.this_month_advances > 0 && (
                  <div className="inline-flex items-center bg-tertiary/10 text-tertiary px-2 py-1 rounded-sm border border-tertiary/20">
                    <span className="material-symbols-outlined text-[14px] mr-1">account_balance_wallet</span>
                    <span className="font-code text-xs font-bold">{formatMoney(w.monthly_salary - w.this_month_advances)} Net</span>
                  </div>
                )}
              </div>
              <div className="pt-2 flex gap-3" onClick={(e) => e.stopPropagation()}>
                <Link
                  href={`/hr/workers/${w.id}`}
                  className="flex-1 py-2 rounded-lg border border-primary text-primary font-bold text-sm text-center hover:bg-primary/5"
                >
                  View
                </Link>
                <Link
                  href={`/hr/advances/new?worker_id=${w.id}`}
                  className="flex-1 py-2 rounded-lg bg-primary text-on-primary font-bold text-sm text-center hover:bg-primary/90"
                >
                  Advance
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
