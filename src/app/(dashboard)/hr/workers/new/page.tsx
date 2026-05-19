"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewWorkerPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const salary = parseFloat(monthlySalary);
    if (!name.trim()) {
      setError("Worker name is required");
      return;
    }
    if (!salary || salary <= 0) {
      setError("Monthly salary must be a positive number");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/hr/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || undefined,
          designation: designation.trim() || undefined,
          monthly_salary: salary,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create worker");
      }

      router.push("/hr/workers");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 md:p-8">
      {/* Back + Title */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/hr/workers"
          className="w-9 h-9 flex items-center justify-center rounded-full border border-[#c6c6cd] text-[#505f76] hover:bg-[#f2f4f6] transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-display text-xl md:text-2xl font-bold text-[#0F172A]">
          Add Worker
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-lg border border-[#c6c6cd]/50 shadow-sm p-5 md:p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#505f76]">
              Name <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full h-[42px] border border-[#c6c6cd] rounded bg-white px-3 text-sm focus:border-[#0F172A] focus:ring-0 outline-none transition-all"
              placeholder="Full name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#505f76]">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-[42px] border border-[#c6c6cd] rounded bg-white px-3 text-sm focus:border-[#0F172A] focus:ring-0 outline-none transition-all"
              placeholder="015xxxxxxxx"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#505f76]">
              Designation
            </label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full h-[42px] border border-[#c6c6cd] rounded bg-white px-3 text-sm focus:border-[#0F172A] focus:ring-0 outline-none transition-all"
              placeholder="e.g. Welder, Helper, Manager"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#505f76]">
              Monthly Salary (৳) <span className="text-[#EF4444]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[#505f76]">
                ৳
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value)}
                required
                className="w-full h-[42px] pl-8 pr-3 border border-[#c6c6cd] rounded bg-white text-sm font-mono focus:border-[#0F172A] focus:ring-0 outline-none transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-[#EF4444] text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Desktop: Submit */}
          <div className="hidden md:flex items-center gap-3 pt-4 border-t border-[#c6c6cd]/50">
            <Link
              href="/hr/workers"
              className="px-5 py-2.5 bg-transparent text-[#505f76] hover:bg-[#f2f4f6] transition-colors font-bold text-sm rounded-lg"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#0F172A] text-white font-bold text-sm rounded-lg hover:bg-[#0F172A]/90 transition-all active:scale-95 shadow-sm disabled:opacity-40"
            >
              {submitting ? "Saving..." : "Save Worker"}
            </button>
          </div>
        </div>

        {/* Mobile: Sticky Bottom Bar */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-[#c6c6cd] px-4 py-3 z-40 flex items-center gap-3 shadow-lg">
          <Link
            href="/hr/workers"
            className="flex-1 h-12 flex items-center justify-center bg-transparent text-[#505f76] hover:bg-[#f2f4f6] transition-colors font-bold text-sm rounded-lg border border-[#c6c6cd]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 h-12 flex items-center justify-center bg-[#0F172A] text-white font-bold text-sm rounded-lg active:scale-95 transition-all shadow-md disabled:opacity-40"
          >
            {submitting ? "Saving..." : "Save Worker"}
          </button>
        </div>
      </form>

      <div className="md:hidden h-20" />
    </div>
  );
}
