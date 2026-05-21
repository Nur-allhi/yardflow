"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function GenerateReportPage() {
  const router = useRouter();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const [periodType, setPeriodType] = useState<"monthly" | "yearly" | "custom">("monthly");
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalOtherExpenses, setTotalOtherExpenses] = useState<number | string>("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setError(null);

    let start_date: string;
    let end_date: string;

    if (periodType === "monthly") {
      start_date = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      end_date = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    } else if (periodType === "yearly") {
      start_date = `${year}-01-01`;
      end_date = `${year}-12-31`;
    } else {
      if (!startDate || !endDate) {
        setError("Please select both start and end dates");
        setGenerating(false);
        return;
      }
      if (new Date(endDate) < new Date(startDate)) {
        setError("End date must be after start date");
        setGenerating(false);
        return;
      }
      start_date = startDate;
      end_date = endDate;
    }

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period_type: periodType,
          start_date,
          end_date,
          total_other_expenses: totalOtherExpenses === "" ? 0 : Number(totalOtherExpenses),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate report");
      }

      const report = await res.json();
      router.push(`/reports/${report.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  const selectedLabel =
    periodType === "monthly"
      ? `${MONTHS[month]} ${year}`
      : periodType === "yearly"
        ? `${year}`
        : startDate && endDate
          ? `${startDate} to ${endDate}`
          : "Select dates";

  return (
    <div className="p-4 md:p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#505f76] mb-2 font-medium tracking-wide uppercase">
        <Link href="/" className="hover:text-[#0F172A]">ERP</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link href="/reports" className="hover:text-[#0F172A]">Reports</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-[#0F172A] font-bold">Generate</span>
      </nav>

      {/* Back */}
      <Link
        href="/reports"
        className="inline-flex items-center gap-1 text-sm font-medium text-[#505f76] hover:text-[#0F172A] transition-colors mb-6"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Reports
      </Link>

      <h1 className="font-display text-2xl md:text-[2rem] font-bold text-[#0F172A] tracking-tight mb-8">
        Generate Period Report
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        {/* Left: Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <div>
            <h3 className="font-display text-lg font-semibold text-[#0F172A]">Select Report Period</h3>
            <p className="text-sm text-[#505f76]">Choose the duration for financial and volume analysis.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Period Type Chips */}
            <div className="space-y-3">
              {([
                { value: "monthly", label: "Monthly", desc: "Single calendar month" },
                { value: "yearly", label: "Yearly", desc: "Full fiscal year performance" },
                { value: "custom", label: "Custom Date Range", desc: "Select start and end dates" },
              ] as const).map((opt) => (
                <label
                  key={opt.value}
                  className={`relative flex items-center p-4 bg-white rounded-xl cursor-pointer transition-all shadow-sm ${
                    periodType === opt.value
                      ? "border-2 border-[#0F172A]"
                      : "border border-[#c6c6cd] hover:border-[#76777d]"
                  }`}
                >
                  <input
                    type="radio"
                    name="period"
                    value={opt.value}
                    checked={periodType === opt.value}
                    onChange={() => setPeriodType(opt.value)}
                    className="hidden"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-[#0F172A]">{opt.label}</p>
                    <p className="text-sm text-[#505f76]">{opt.desc}</p>
                  </div>
                  <span
                    className={`material-symbols-outlined ${
                      periodType === opt.value ? "text-[#0F172A]" : "text-[#c6c6cd]"
                    }`}
                    style={{ fontVariationSettings: periodType === opt.value ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {periodType === opt.value ? "check_circle" : "radio_button_unchecked"}
                  </span>
                </label>
              ))}
            </div>

            {/* Conditional Selectors */}
            <div className="bg-[#f2f4f6] rounded-xl p-4 space-y-3 border border-[#c6c6cd]/50">
              {periodType === "monthly" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[#505f76] mb-1 block">
                      Month
                    </label>
                    <select
                      value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}
                      className="w-full h-[42px] bg-white border border-[#c6c6cd] rounded px-3 text-sm outline-none focus:border-[#0F172A]"
                    >
                      {MONTHS.map((m, i) => (
                        <option key={m} value={i}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[#505f76] mb-1 block">
                      Year
                    </label>
                    <select
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full h-[42px] bg-white border border-[#c6c6cd] rounded px-3 text-sm outline-none focus:border-[#0F172A]"
                    >
                      {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {periodType === "yearly" && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#505f76] mb-1 block">
                    Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full h-[42px] bg-white border border-[#c6c6cd] rounded px-3 text-sm outline-none focus:border-[#0F172A]"
                  >
                    {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              )}

              {periodType === "custom" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[#505f76] mb-1 block">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-[42px] bg-white border border-[#c6c6cd] rounded px-3 text-sm outline-none focus:border-[#0F172A]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[#505f76] mb-1 block">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-[42px] bg-white border border-[#c6c6cd] rounded px-3 text-sm outline-none focus:border-[#0F172A]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Other Expenses */}
            <div className="bg-white rounded-xl border border-[#c6c6cd] p-4 shadow-sm">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#505f76] mb-1 block">
                Other Expenses (tk)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={totalOtherExpenses}
                onChange={(e) => setTotalOtherExpenses(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full h-[42px] bg-white border border-[#c6c6cd] rounded px-3 text-sm outline-none focus:border-[#0F172A]"
              />
              <p className="text-xs text-[#505f76] mt-1">Rent, electricity, transportation, etc.</p>
            </div>

            {/* Selected Summary */}
            <div className="bg-white rounded-xl border border-[#c6c6cd] p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#505f76] mb-1">Selected Period</p>
              <p className="font-display font-bold text-lg text-[#0F172A]">{selectedLabel}</p>
            </div>

            {error && (
              <p className="text-sm text-[#ba1a1a] font-medium bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={generating}
              className="w-full h-12 bg-[#0F172A] text-white font-bold rounded-lg hover:bg-[#0F172A]/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {generating ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">refresh</span>
                  Generating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">refresh</span>
                  Generate Report
                </>
              )}
            </button>
            <p className="text-xs text-[#505f76] text-center italic">
              Report will be saved automatically after generation
            </p>
          </form>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-xl shadow-sm border border-[#c6c6cd] overflow-hidden min-h-[400px] flex flex-col">
            <div className="p-6 md:p-8 border-b border-[#c6c6cd]">
              <h2 className="font-display text-xl font-bold text-[#0F172A]">
                Period Report — {selectedLabel}
              </h2>
              <p className="text-[#505f76] text-sm mt-1">
                Configure the period above and generate a report to see full financial and volume analysis.
              </p>
            </div>
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <span className="material-symbols-outlined text-5xl text-[#c6c6cd] block mb-4">analytics</span>
                <p className="text-[#505f76] text-sm font-medium">Preview will appear after generation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
