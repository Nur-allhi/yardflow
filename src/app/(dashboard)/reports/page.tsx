"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";

interface PeriodReport {
  id: string;
  period_type: "monthly" | "yearly" | "custom";
  start_date: string;
  end_date: string;
  total_income: string;
  total_cost: string;
  net_profit: string;
  result: "profit" | "loss";
  generated_at: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(n: number | string) {
  const val = typeof n === "string" ? parseFloat(n) : n;
  return val.toLocaleString("en-IN") + " tk";
}

function ResultBadge({ result }: { result: string }) {
  const isProfit = result === "profit";
  return (
    <span
      className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${
        isProfit
          ? "bg-success/10 text-success border border-success/20"
          : "bg-error/10 text-error border border-error/20"
      }`}
    >
      {isProfit ? "Profit" : "Loss"}
    </span>
  );
}

function PeriodLabel(row: PeriodReport) {
  if (row.period_type === "monthly") {
    const d = new Date(row.start_date);
    return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  }
  if (row.period_type === "yearly") {
    return new Date(row.start_date).getFullYear().toString();
  }
  return formatDate(row.start_date) + " - " + formatDate(row.end_date);
}

function DateRangeLabel(row: PeriodReport) {
  return formatDate(row.start_date) + " - " + formatDate(row.end_date);
}

export default function ReportsPage() {
  const { data: reports = [], isLoading, error, refetch } = useQuery<PeriodReport[]>({
    queryKey: ["reports"],
    queryFn: async () => {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error("Failed to load reports");
      const data = await res.json();
      return Array.isArray(data) ? data : data.reports || [];
    },
  });

  const typeLabel: Record<string, string> = {
    monthly: "Monthly",
    yearly: "Yearly",
    custom: "Custom",
  };

  return (
    <div className="p-4 md:p-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Reports', href: null }]} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-[2rem] font-bold text-primary-container tracking-tight">
            Reports
          </h1>
          <p className="text-secondary text-sm hidden md:block">
            Review historical yard performance and financial statements.
          </p>
        </div>
        <Link
          href="/reports/generate"
          className="flex items-center gap-2 px-4 py-2 bg-primary-container text-white font-semibold rounded-lg hover:bg-primary-container/90 transition-all text-sm shadow-sm active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">add_chart</span>
          Generate Report
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-outline-variant/30 p-6 animate-pulse">
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
      {!isLoading && !error && reports.length === 0 && (
        <div className="bg-white rounded-xl border border-outline-variant/30 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-outline-variant block mb-4">
            analytics
          </span>
          <p className="text-secondary text-sm font-medium mb-1">
            No reports generated yet
          </p>
          <p className="text-secondary text-xs">
            Create your first period report to see financial and volume analysis.
          </p>
          <Link
            href="/reports/generate"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary-container text-white text-sm font-semibold rounded-lg"
          >
            <span className="material-symbols-outlined text-lg">add_chart</span>
            Generate Report
          </Link>
        </div>
      )}

      {/* Desktop Table */}
      {!isLoading && !error && reports.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-high border-b border-outline-variant">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">Period</th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">Date Range</th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider text-right">Income</th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider text-right">Cost</th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider text-right">Profit</th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">Result</th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">Generated At</th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-background transition-colors group">
                  <td className="px-6 py-4 text-sm font-bold text-primary-container">
                    {PeriodLabel(r)}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {typeLabel[r.period_type] || r.period_type}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {DateRangeLabel(r)}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-right">
                    {formatMoney(r.total_income)}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-right">
                    {formatMoney(r.total_cost)}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-right font-semibold">
                    {formatMoney(r.net_profit)}
                  </td>
                  <td className="px-6 py-4">
                    <ResultBadge result={r.result} />
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {formatDate(r.generated_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/reports/${r.id}`}
                      className="text-tertiary font-bold text-sm hover:underline inline-flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Cards */}
      {!isLoading && !error && reports.length > 0 && (
        <div className="md:hidden space-y-4">
          {/* Generate CTA */}
          <Link
            href="/reports/generate"
            className="w-full h-[52px] bg-primary text-on-primary rounded-lg font-display font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>+ Generate New Report</span>
          </Link>

          {/* Section title */}
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-primary">Historical Log</h2>
            <span className="text-caption text-secondary font-medium">Sort: Newest</span>
          </div>

          {reports.map((r) => (
            <div key={r.id} className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/30 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-display text-lg font-semibold">{PeriodLabel(r)}</h3>
                <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant text-[10px] font-bold rounded-sm uppercase tracking-wider">
                  {typeLabel[r.period_type] || r.period_type}
                </span>
              </div>
              <div className="py-2">
                <p className={`font-code text-2xl font-bold tracking-tight ${r.result === "profit" ? "text-success" : "text-error"}`}>
                  {r.result === "profit" ? "৳+" : "৳-"}{formatMoney(r.net_profit).replace(" tk", "")}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-sm border ${r.result === "profit" ? "bg-success/10 text-success border-success/20" : "bg-error/10 text-error border-error/20"}`}>
                    {r.result === "profit" ? "PROFIT" : "LOSS"}
                  </span>
                  <span className="text-[11px] text-secondary">Generated: {formatDate(r.generated_at)}</span>
                </div>
              </div>
              <div className="pt-2 flex gap-2 border-t border-outline-variant/20">
                <Link
                  href={`/reports/${r.id}`}
                  className="flex-1 h-9 bg-white border border-primary text-primary text-sm font-semibold rounded flex items-center justify-center hover:bg-primary/5 transition-colors"
                >
                  View
                </Link>
                <button className="flex-1 h-9 bg-white border border-primary text-primary text-sm font-semibold rounded flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors">
                  <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                  Export PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
