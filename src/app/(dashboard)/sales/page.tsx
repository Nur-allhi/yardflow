"use client";

import Link from "next/link";

export default function SalesPage() {
  return (
    <div className="p-8">
      <nav className="flex items-center gap-2 text-xs text-[#505f76] mb-2 font-medium tracking-wide uppercase">
        <Link href="/" className="hover:text-[#0F172A]">Dashboard</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-[#0F172A] font-bold">Sales</span>
      </nav>
      <h1 className="font-display text-2xl font-bold text-[#0F172A] tracking-tight mb-8">Sales</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/sales/customers"
          className="bg-white p-6 rounded-xl border border-[#c6c6cd]/30 hover:shadow-md transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-[#f2f4f6] rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-[#505f76]">groups</span>
          </div>
          <div>
            <p className="font-display font-bold text-lg text-[#0F172A]">Customers</p>
            <p className="text-sm text-[#505f76]">Manage customer directory and receivables</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
