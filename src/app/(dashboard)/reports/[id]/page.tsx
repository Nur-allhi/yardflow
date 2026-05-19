"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface ReportDetail {
  id: string;
  period_type: "monthly" | "yearly" | "custom";
  start_date: string;
  end_date: string;
  total_purchased_kg: string;
  total_sold_fabricated_kg: string;
  total_sold_raw_kg: string;
  total_scrap_sold_kg: string;
  current_stock_kg: string;
  burnout_kg: string;
  burnout_percent: string;
  total_income: string;
  total_purchase_cost: string;
  total_consumables_cost: string;
  total_salary_cost: string;
  total_other_expenses: string;
  total_cost: string;
  net_profit: string;
  profit_per_kg: string;
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
  return "৳" + val.toLocaleString("en-IN");
}

function formatKg(n: number | string) {
  const val = typeof n === "string" ? parseFloat(n) : n;
  return val.toLocaleString("en-IN") + " kg";
}

function DetailRow({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-[#c6c6cd]/30 last:border-b-0">
      <span className="text-sm text-[#505f76]">{label}</span>
      <span className={`${mono ? "font-mono" : ""} ${bold ? "font-bold" : "font-medium"} text-sm text-[#191c1e]`}>
        {value}
      </span>
    </div>
  );
}

export default function ReportDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${id}`);
      if (!res.ok) throw new Error("Report not found");
      setReport(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-6 bg-[#e6e8ea] rounded w-1/3" />
        <div className="h-16 bg-[#e6e8ea] rounded-xl" />
        <div className="h-64 bg-[#e6e8ea] rounded-xl" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-[#ba1a1a] font-medium text-lg mb-2">
            {error || "Report not found"}
          </p>
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white text-sm rounded-lg"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  const isProfit = report.result === "profit";
  const dateLabel =
    report.period_type === "monthly"
      ? formatDate(report.start_date) + " - " + formatDate(report.end_date)
      : formatDate(report.start_date) + " - " + formatDate(report.end_date);

  return (
    <div className="p-4 md:p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#505f76] mb-2 font-medium tracking-wide uppercase">
        <Link href="/" className="hover:text-[#0F172A]">ERP</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link href="/reports" className="hover:text-[#0F172A]">Reports</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-[#0F172A] font-bold">Report</span>
      </nav>

      {/* Back + Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/reports"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-[#c6c6cd] text-[#505f76] hover:bg-[#f2f4f6] transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="font-display text-lg md:text-xl font-bold text-[#0F172A]">
            Period Report — {dateLabel}
          </h1>
        </div>
        <div className="md:ml-auto flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white font-bold text-sm rounded-lg hover:bg-[#0F172A]/90 transition-all active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            Print / PDF
          </button>
        </div>
      </div>

      {/* Result Banner */}
      <section className="mb-8">
        <div className="bg-white rounded-xl border border-[#c6c6cd] shadow-sm overflow-hidden flex items-stretch">
          <div className={`w-2 ${isProfit ? "bg-[#059669]" : "bg-[#ba1a1a]"}`} />
          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between flex-1 gap-6">
            <div>
              <p className="text-[#505f76] text-xs font-bold uppercase tracking-wider mb-1">
                {isProfit ? "Net Profit" : "Net Loss"}
              </p>
              <h3 className={`font-mono text-3xl md:text-4xl font-bold tracking-tight ${isProfit ? "text-[#059669]" : "text-[#ba1a1a]"}`}>
                {formatMoney(report.net_profit)}
              </h3>
              <div className="mt-2 flex items-center gap-2 text-[#505f76]">
                <span className="material-symbols-outlined text-lg">{isProfit ? "trending_up" : "trending_down"}</span>
                <span className="text-sm font-medium">
                  Profit per kg: <span className="font-mono font-semibold text-[#191c1e]">{formatMoney(report.profit_per_kg)}</span>
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 md:border-l md:border-[#c6c6cd] md:pl-8">
              <div>
                <p className="text-[#505f76] text-[10px] font-bold uppercase tracking-wider">Total Income</p>
                <p className="font-mono text-xl font-semibold text-[#059669]">{formatMoney(report.total_income)}</p>
              </div>
              <div>
                <p className="text-[#505f76] text-[10px] font-bold uppercase tracking-wider">Total Cost</p>
                <p className="font-mono text-xl font-semibold text-[#ba1a1a]">{formatMoney(report.total_cost)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Volume Analysis (Left) */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-[#c6c6cd] rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 md:px-6 py-4 border-b border-[#c6c6cd]/50 bg-[#f2f4f6]">
              <h3 className="font-display font-bold text-[#0F172A] flex items-center gap-2">
                <span className="material-symbols-outlined">scale</span>
                Volume Analysis
              </h3>
            </div>
            <div className="p-5 md:p-6 space-y-1">
              <DetailRow label="Total Purchased" value={formatKg(report.total_purchased_kg)} mono />
              <DetailRow label="Sold (Fabricated)" value={formatKg(report.total_sold_fabricated_kg)} mono />
              <DetailRow label="Sold (Raw)" value={formatKg(report.total_sold_raw_kg)} mono />
              <DetailRow label="Scrap Sold" value={formatKg(report.total_scrap_sold_kg)} mono />
              <DetailRow label="Current Stock" value={formatKg(report.current_stock_kg)} mono />
              <DetailRow
                label="Burnout (Gap)"
                value={`${formatKg(report.burnout_kg)} (${parseFloat(report.burnout_percent).toFixed(2)}%)`}
                mono
              />
            </div>
            {/* Burnout Visual Indicator */}
            <div className="px-5 md:px-6 pb-5 md:pb-6">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
                <span className="text-[#505f76]">Burnout Rate</span>
                <span className={parseFloat(report.burnout_percent) > 5 ? "text-[#EAB308]" : "text-[#059669]"}>
                  {parseFloat(report.burnout_percent).toFixed(2)}%
                </span>
              </div>
              <div className="h-2 w-full bg-[#e6e8ea] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    parseFloat(report.burnout_percent) > 5 ? "bg-[#EAB308]" : "bg-[#059669]"
                  }`}
                  style={{ width: `${Math.min(100, parseFloat(report.burnout_percent) * 10)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financial Analysis (Right) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Income Section */}
          <div className="bg-white border border-[#c6c6cd] rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 md:px-6 py-4 border-b border-[#c6c6cd]/50 bg-[#f2f4f6] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#059669]">trending_up</span>
              <h3 className="font-display font-bold text-[#0F172A]">Income</h3>
            </div>
            <div className="p-5 md:p-6 space-y-1">
              <DetailRow label="Fabricated Sales Revenue" value={formatMoney(report.total_income)} mono />
              <DetailRow label="Raw Pass-through Sales" value={formatMoney("0")} mono />
              <DetailRow label="Scrap Sales Revenue" value={formatMoney("0")} mono />
              <div className="flex justify-between items-center pt-3 mt-1 border-t-2 border-[#0F172A]/10">
                <span className="font-display font-bold text-[#0F172A] text-sm">Total Income</span>
                <span className="font-display font-bold text-lg text-[#059669]">{formatMoney(report.total_income)}</span>
              </div>
            </div>
          </div>

          {/* Costs Section */}
          <div className="bg-white border border-[#c6c6cd] rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 md:px-6 py-4 border-b border-[#c6c6cd]/50 bg-[#f2f4f6] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ba1a1a]">trending_down</span>
              <h3 className="font-display font-bold text-[#0F172A]">Costs</h3>
            </div>
            <div className="p-5 md:p-6 space-y-1">
              <DetailRow label="Purchase Cost" value={formatMoney(report.total_purchase_cost)} mono />
              <DetailRow label="Consumables Cost" value={formatMoney(report.total_consumables_cost)} mono />
              <DetailRow label="Salary Cost" value={formatMoney(report.total_salary_cost)} mono />
              <DetailRow label="Other Expenses" value={formatMoney(report.total_other_expenses)} mono />
              <div className="flex justify-between items-center pt-3 mt-1 border-t border-[#c6c6cd]">
                <span className="font-display font-bold text-[#0F172A] text-sm">Total Cost</span>
                <span className="font-display font-bold text-lg">{formatMoney(report.total_cost)}</span>
              </div>
            </div>
          </div>

          {/* Net Result Card */}
          <div className={`rounded-xl border-l-[12px] p-6 md:p-8 flex items-center justify-between shadow-sm ${
            isProfit
              ? "bg-[#059669]/5 border-[#059669]"
              : "bg-[#ba1a1a]/5 border-[#ba1a1a]"
          }`}>
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${
                isProfit ? "text-[#059669]/70" : "text-[#ba1a1a]/70"
              }`}>
                {isProfit ? "Net Profit" : "Net Loss"}
              </p>
              <h2 className={`font-mono text-3xl md:text-4xl font-bold tracking-tight ${
                isProfit ? "text-[#059669]" : "text-[#ba1a1a]"
              }`}>
                {formatMoney(report.net_profit)}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#505f76]">Profit per kg</p>
              <p className="font-mono text-xl font-semibold text-[#191c1e]">{formatMoney(report.profit_per_kg)}</p>
            </div>
          </div>

          {/* Report Meta */}
          <div className="text-xs text-[#505f76] flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Generated: {formatDate(report.generated_at)}</span>
            <span className="w-1 h-1 rounded-full bg-[#c6c6cd]" />
            <span>Type: {report.period_type}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
