"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

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
  return "\u09F3" + (n ?? 0).toLocaleString("en-IN");
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
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#505f76] mb-2 font-medium tracking-wide uppercase">
        <Link href="/" className="hover:text-[#0F172A]">
          Dashboard
        </Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-[#0F172A] font-bold">ERP</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-[#0F172A] font-bold">HR</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-[2rem] font-bold text-[#0F172A] tracking-tight">
            HR & Payroll
          </h1>
        </div>
        <div className="flex gap-3">
          <Link
            href="/hr/workers/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white font-semibold rounded-lg hover:bg-[#0F172A]/90 transition-all text-sm shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Worker
          </Link>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-[#c6c6cd]/50">
        <Link
          href="/hr/workers"
          className="px-4 py-3 text-sm font-bold text-[#059669] border-b-2 border-[#059669]"
        >
          Workers
        </Link>
        <Link
          href="/hr/advances/new"
          className="px-4 py-3 text-sm text-[#505f76] hover:text-[#0F172A] transition-colors"
        >
          Advances
        </Link>
        <Link
          href="/hr/payroll"
          className="px-4 py-3 text-sm text-[#505f76] hover:text-[#0F172A] transition-colors"
        >
          Payroll
        </Link>
      </div>

      {/* Stats Row */}
      <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-6 mb-6 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
        <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-white p-4 md:p-6 rounded-xl border border-[#c6c6cd]/30 md:border-[#c6c6cd] shadow-sm">
          <p className="text-[#505f76] text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">
            Total Workers
          </p>
          <p className="font-mono text-lg md:text-2xl font-bold text-[#0F172A]">
            {summary ? summary.total_workers : "—"}
          </p>
        </div>
        <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-white p-4 md:p-6 rounded-xl border border-[#c6c6cd]/30 md:border-[#c6c6cd] shadow-sm">
          <p className="text-[#505f76] text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">
            Total Monthly Payroll
          </p>
          <p className="font-mono text-lg md:text-2xl font-bold text-[#059669]">
            {summary ? formatMoney(summary.monthly_payroll) : "—"}
          </p>
        </div>
        <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-white p-4 md:p-6 rounded-xl border border-[#c6c6cd]/30 md:border-[#c6c6cd] shadow-sm">
          <p className="text-[#505f76] text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">
            Pending Advances
          </p>
          <p className="font-mono text-lg md:text-2xl font-bold text-[#EAB308]">
            {summary ? formatMoney(summary.pending_advances) : "—"}
          </p>
        </div>
        <div className="flex-shrink-0 min-w-[140px] md:min-w-0 bg-white p-4 md:p-6 rounded-xl border border-[#c6c6cd]/30 md:border-[#c6c6cd] shadow-sm">
          <p className="text-[#505f76] text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">
            Active Workers
          </p>
          <p className="font-mono text-lg md:text-2xl font-bold text-[#0F172A]">
            {summary ? `${summary.total_workers}` : "—"}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#505f76] text-lg">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#c6c6cd] rounded-lg text-sm outline-none focus:ring-0"
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
              className="bg-white rounded-xl border border-[#c6c6cd]/30 p-6 animate-pulse"
            >
              <div className="h-4 bg-[#e6e8ea] rounded w-1/3 mb-3" />
              <div className="h-4 bg-[#e6e8ea] rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-[#EF4444] font-medium text-sm">{error?.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-4 py-2 bg-[#0F172A] text-white text-sm rounded-lg"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-[#c6c6cd]/30 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-[#c6c6cd] block mb-4">
            groups
          </span>
          <p className="text-[#505f76] text-sm font-medium mb-1">
            No workers yet
          </p>
          <p className="text-[#505f76] text-xs">
            Start by adding your first worker
          </p>
          <Link
            href="/hr/workers/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#0F172A] text-white text-sm font-semibold rounded-lg"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Worker
          </Link>
        </div>
      )}

      {/* Desktop Table */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl border border-[#c6c6cd] overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#e6e8ea] border-b border-[#c6c6cd]">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Worker Name
                </th>
                <th className="px-6 py-4 text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-4 text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Monthly Salary
                </th>
                <th className="px-6 py-4 text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  This Month Advances
                </th>
                <th className="px-6 py-4 text-xs font-bold text-[#0F172A] uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c6c6cd]/50">
              {filtered.map((w) => (
                <tr
                  key={w.id}
                  className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                  onClick={() => window.location.href = `/hr/workers/${w.id}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${w.is_active ? 'bg-[#d0e1fb] text-[#0F172A]' : 'bg-[#e0e3e5] text-[#505f76]'}`}>
                        {getInitials(w.name)}
                      </div>
                      <span className="font-bold text-sm">{w.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#505f76]">
                    {w.designation || "—"}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm font-bold">
                    {formatMoney(w.monthly_salary)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge active={w.is_active} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-mono text-sm font-bold ${w.this_month_advances > 0 ? 'text-[#EAB308]' : 'text-[#76777d]'}`}>
                      {w.this_month_advances > 0 ? formatMoney(w.this_month_advances) : "\u09F30"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/hr/workers/${w.id}`}
                        className="text-xs font-bold px-3 py-1 rounded bg-[#f2f4f6] text-[#505f76] hover:bg-[#e6e8ea]"
                      >
                        View
                      </Link>
                      <Link
                        href={`/hr/advances/new?worker_id=${w.id}`}
                        className="text-xs font-bold px-3 py-1 rounded bg-[#059669]/10 text-[#059669] hover:bg-[#059669]/20"
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
          <div className="flex justify-between items-center">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-[#505f76]">
              Workers
            </h2>
          </div>
          {filtered.map((w) => (
            <div
              key={w.id}
              onClick={() => window.location.href = `/hr/workers/${w.id}`}
              className="block bg-white rounded-lg p-4 shadow-sm border border-[#c6c6cd]/20 cursor-pointer"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${w.is_active ? 'bg-[#d0e1fb] text-[#0F172A]' : 'bg-[#e0e3e5] text-[#505f76]'}`}>
                  {getInitials(w.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-[#0F172A] text-base truncate">
                    {w.name}
                  </h3>
                  <p className="text-xs text-[#505f76] font-medium">
                    {w.designation || "—"}
                  </p>
                </div>
                <StatusBadge active={w.is_active} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#c6c6cd]/30">
                <div>
                  <p className="text-[11px] text-[#505f76] font-medium mb-0.5">
                    Salary
                  </p>
                  <p className="font-mono text-sm font-bold text-[#0F172A]">
                    {formatMoney(w.monthly_salary)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#505f76] font-medium mb-0.5">
                    Advances
                  </p>
                  <p className={`font-mono text-sm font-bold ${w.this_month_advances > 0 ? 'text-[#EAB308]' : 'text-[#76777d]'}`}>
                    {w.this_month_advances > 0 ? formatMoney(w.this_month_advances) : "\u09F30"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-[#c6c6cd]/30" onClick={(e) => e.stopPropagation()}>
                <Link
                  href={`/hr/workers/${w.id}`}
                  className="flex-1 py-2 text-[#059669] font-bold text-sm bg-[#059669]/5 rounded-lg text-center"
                >
                  View
                </Link>
                <Link
                  href={`/hr/advances/new?worker_id=${w.id}`}
                  className="flex-1 py-2 bg-[#0F172A] text-white font-bold text-sm rounded-lg text-center"
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
