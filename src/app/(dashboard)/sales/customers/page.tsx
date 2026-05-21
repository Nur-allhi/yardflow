"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  type: "regular" | "walk_in";
  opening_balance: number;
  is_active: boolean;
  total_purchases: number;
  total_paid: number;
  due_balance: number;
}

const ITEMS_PER_PAGE = 10;

function formatMoney(amount: number): string {
  return `৳${amount.toLocaleString("en-IN")}`;
}

function getTypeChip(type: string) {
  if (type === "regular") {
    return { bg: "bg-[#d0e1fb]", text: "text-[#0F172A]", label: "Regular" };
  }
  return { bg: "bg-[#e0e3e5]", text: "text-[#505f76]", label: "Walk-In" };
}

function getStatusChip(due: number) {
  if (due > 0) {
    return {
      bg: "bg-[#EAB308]/10",
      text: "text-[#CA8A04]",
      dot: "bg-[#CA8A04]",
      label: "Due",
    };
  }
  return {
    bg: "bg-[#22C55E]/10",
    text: "text-[#16A34A]",
    dot: "bg-[#16A34A]",
    label: "Settled",
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formType, setFormType] = useState<"regular" | "walk_in">("regular");
  const [formOpeningBalance, setFormOpeningBalance] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sales/customers");
      if (!res.ok) throw new Error("Failed to load customers");
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const totalCustomers = customers.length;
  const totalReceivable = customers.reduce((sum, c) => sum + c.due_balance, 0);
  const settledCustomers = customers.filter((c) => c.due_balance <= 0).length;

  const totalPages = Math.ceil(customers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = customers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  function resetForm() {
    setFormName("");
    setFormPhone("");
    setFormAddress("");
    setFormType("regular");
    setFormOpeningBalance("");
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/sales/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          phone: formPhone || undefined,
          address: formAddress || undefined,
          type: formType,
          opening_balance: formOpeningBalance ? Number(formOpeningBalance) : undefined,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create customer");
      }
      resetForm();
      setShowModal(false);
      setCurrentPage(1);
      await loadCustomers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setFormSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="h-4 w-64 bg-[#c6c6cd]/30 rounded mb-2 animate-pulse" />
        <div className="h-8 w-48 bg-[#c6c6cd]/30 rounded mb-8 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg border border-[#c6c6cd]/30 animate-pulse">
              <div className="h-4 w-24 bg-[#c6c6cd]/20 rounded mb-3" />
              <div className="h-8 w-32 bg-[#c6c6cd]/20 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-[#c6c6cd]/30">
          <div className="p-6 border-b border-[#c6c6cd]/20">
            <div className="h-6 w-40 bg-[#c6c6cd]/20 rounded animate-pulse" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-6 py-5 border-b border-[#c6c6cd]/10">
              <div className="h-4 w-full bg-[#c6c6cd]/20 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-lg p-8 text-center max-w-md mx-auto">
          <span className="material-symbols-outlined text-5xl text-[#ba1a1a] block mb-4">error_outline</span>
          <p className="text-[#ba1a1a] font-bold mb-2">Failed to Load Customers</p>
          <p className="text-[#93000a] text-sm mb-6">{error}</p>
          <button
            onClick={loadCustomers}
            className="px-6 py-2.5 bg-[#ba1a1a] text-white rounded-lg text-sm font-bold hover:bg-[#ba1a1a]/90 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block p-8">
        <nav className="flex items-center gap-2 text-xs text-[#505f76] mb-2 font-medium tracking-wide uppercase">
          <Link href="/" className="hover:text-[#0F172A]">Dashboard</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link href="/sales" className="hover:text-[#0F172A]">Sales</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-[#0F172A] font-bold">Customers</span>
        </nav>

        <div className="flex justify-between items-end mb-8">
          <h1 className="font-display text-2xl font-bold text-[#0F172A] tracking-tight">Customers</h1>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-[#0F172A] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#0F172A]/90 transition-all shadow-sm flex items-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Customer
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-[#c6c6cd]/30 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#505f76] font-medium mb-1">Total Customers</p>
              <p className="font-display text-2xl font-bold text-[#0F172A]">{totalCustomers}</p>
            </div>
            <div className="w-12 h-12 bg-[#f2f4f6] rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[#505f76]">groups</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-[#c6c6cd]/30 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#505f76] font-medium mb-1">Total Receivable</p>
              <p className="font-mono text-2xl font-bold text-[#CA8A04]">{formatMoney(totalReceivable)}</p>
            </div>
            <div className="w-12 h-12 bg-[#EAB308]/10 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[#EAB308]">payments</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-[#c6c6cd]/30 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#505f76] font-medium mb-1">Settled Customers</p>
              <p className="font-display text-2xl font-bold text-[#16A34A]">
                {settledCustomers}
                <span className="text-xs font-normal text-[#505f76] ml-1">(no due)</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-[#22C55E]/10 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[#22C55E]">check_circle</span>
            </div>
          </div>
        </div>

        {customers.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#c6c6cd]/30 py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-[#c6c6cd] block mb-4">groups</span>
            <p className="text-[#505f76] font-medium mb-2">No customers yet</p>
            <p className="text-[#505f76] text-xs mb-6">Add your first customer to get started</p>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="inline-flex items-center gap-2 bg-[#0F172A] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#0F172A]/90 transition-all"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add Customer
            </button>
          </div>
        ) : (
          <section className="bg-white rounded-xl border border-[#c6c6cd]/30 overflow-hidden">
            <div className="p-6 border-b border-[#c6c6cd]/20 flex justify-between items-center">
              <h3 className="font-display font-bold text-lg text-[#0F172A]">Customer Directory</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#f2f4f6] border-b border-[#c6c6cd]/20">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider">Customer Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider">Total Sales</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider">Total Received</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider">Due Balance</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#505f76] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c6c6cd]/10">
                  {paginatedCustomers.map((c) => {
                    const typeChip = getTypeChip(c.type);
                    const statusChip = getStatusChip(c.due_balance);
                    return (
                      <tr key={c.id} className="hover:bg-[#f7f9fb] transition-colors">
                        <td className="px-6 py-5 text-sm font-bold text-[#0F172A]">{c.name}</td>
                        <td className="px-6 py-5 text-sm text-[#505f76]">{c.phone || "—"}</td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex px-2 py-1 rounded text-[11px] font-semibold ${typeChip.bg} ${typeChip.text}`}>
                            {typeChip.label}
                          </span>
                        </td>
                        <td className="px-6 py-5 font-mono text-sm text-[#505f76]">{c.total_purchases}</td>
                        <td className="px-6 py-5 font-mono text-sm text-[#505f76]">{formatMoney(c.total_paid)}</td>
                        <td className={`px-6 py-5 font-mono text-sm font-bold ${c.due_balance > 0 ? "text-[#CA8A04]" : "text-[#16A34A]"}`}>
                          {formatMoney(c.due_balance)}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusChip.bg} ${statusChip.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusChip.dot}`} />
                            {statusChip.label}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end items-center gap-4">
                            <Link href={`/sales?customer_id=${c.id}`} className="text-[#059669] font-bold hover:underline decoration-2 text-sm">
                              View
                            </Link>
                            {c.due_balance > 0 ? (
                              <Link href={`/sales?customer_id=${c.id}&status=due`} className="bg-[#0F172A] text-white px-4 py-1.5 rounded-lg text-[12px] font-bold hover:bg-[#0F172A]/90 transition-all active:scale-95">
                                Receive Payment
                              </Link>
                            ) : (
                              <div className="w-[45px]" />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-[#c6c6cd]/20 flex items-center justify-between bg-[#f2f4f6]/30">
              <p className="text-xs text-[#505f76]">
                Showing {paginatedCustomers.length} of {customers.length} customer{customers.length !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-2 border border-[#c6c6cd] rounded bg-white hover:bg-[#f2f4f6] transition-colors disabled:opacity-40 text-[#505f76]"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-2 border border-[#c6c6cd] rounded bg-white hover:bg-[#f2f4f6] transition-colors disabled:opacity-40 text-[#505f76]"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Mobile */}
      <div className="md:hidden px-4 pb-24">
        {/* Summary Cards - Horizontal Scroll */}
        <section className="flex overflow-x-auto gap-4 -mx-4 px-4 py-4 hide-scrollbar">
          <div className="flex-shrink-0 w-56 bg-white p-4 rounded-xl border border-[#c6c6cd]/30 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[#505f76] uppercase tracking-wider">Total Customers</span>
              <span className="material-symbols-outlined text-[#505f76] text-lg">groups</span>
            </div>
            <p className="font-display text-xl font-bold text-[#0F172A]">{totalCustomers}</p>
          </div>
          <div className="flex-shrink-0 w-56 bg-white p-4 rounded-xl border border-[#c6c6cd]/30 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[#505f76] uppercase tracking-wider">Total Receivable</span>
              <span className="material-symbols-outlined text-[#EAB308] text-lg">payments</span>
            </div>
            <p className="font-mono text-lg font-bold text-[#CA8A04]">{formatMoney(totalReceivable)}</p>
          </div>
          <div className="flex-shrink-0 w-56 bg-white p-4 rounded-xl border border-[#c6c6cd]/30 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[#505f76] uppercase tracking-wider">Settled Customers</span>
              <span className="material-symbols-outlined text-[#059669] text-lg">check_circle</span>
            </div>
            <p className="font-display text-xl font-bold text-[#16A34A]">{settledCustomers}</p>
          </div>
        </section>

        <div className="flex justify-between items-center mb-4 mt-2">
          <h2 className="font-display font-bold text-lg text-[#0F172A]">Customer Accounts</h2>
        </div>

        {customers.length === 0 ? (
          <div className="text-center py-16 text-[#505f76] bg-white rounded-xl border border-[#c6c6cd]/30">
            <span className="material-symbols-outlined text-4xl text-[#c6c6cd] block mb-3">groups</span>
            <p className="text-sm font-medium mb-1">No customers yet</p>
            <p className="text-xs">Tap + to add your first customer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customers.map((c) => {
              const typeChip = getTypeChip(c.type);
              return (
                <div key={c.id} className="bg-white p-4 rounded-xl border border-[#c6c6cd]/30 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                      <h3 className="font-display font-bold text-base text-[#0F172A]">{c.name}</h3>
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${typeChip.bg} ${typeChip.text}`}>
                        {typeChip.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-[#505f76] uppercase tracking-wider mb-1">Due Amount</p>
                      <p className={`font-mono text-base font-bold ${c.due_balance > 0 ? "text-[#CA8A04]" : "text-[#0F172A]"}`}>
                        {formatMoney(c.due_balance)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[#505f76] pt-2 border-t border-[#c6c6cd]/20">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">call</span>
                      {c.phone || "—"}
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                      {c.total_purchases} sale{c.total_purchases !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Link href={`/sales?customer_id=${c.id}`} className="block flex-1 py-2.5 rounded-lg border border-[#0F172A] text-[#0F172A] font-bold text-sm transition-colors hover:bg-[#f2f4f6] active:scale-[0.98] text-center">
                      View
                    </Link>
                    {c.due_balance > 0 ? (
                      <Link href={`/sales?customer_id=${c.id}&status=due`} className="block flex-1 py-2.5 rounded-lg bg-[#0F172A] text-white font-bold text-sm transition-colors hover:bg-[#0F172A]/90 active:scale-[0.98] text-center">
                        Receive Payment
                      </Link>
                    ) : (
                      <button disabled className="flex-1 py-2.5 rounded-lg bg-[#e0e3e5] text-[#505f76] font-bold text-sm cursor-not-allowed">
                        Paid
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile FAB */}
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="fixed bottom-6 right-4 w-14 h-14 bg-[#0F172A] text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform z-40"
        >
          <span className="material-symbols-outlined text-2xl">add</span>
        </button>
      </div>

      {/* Desktop Modal */}
      {showModal && (
        <div
          className="hidden md:flex fixed inset-0 z-[60] items-center justify-center bg-[#0F172A]/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-white w-[480px] p-8 rounded-xl shadow-lg border border-[#c6c6cd]/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl text-[#0F172A]">Add Customer</h2>
              <button
                className="text-[#76777d] hover:text-[#0F172A] transition-colors"
                onClick={() => setShowModal(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {formError && (
              <div className="mb-4 p-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-lg text-sm text-[#ba1a1a] font-medium">
                {formError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-[#0F172A]">
                  Customer Name <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-[42px] border border-[#c6c6cd] focus:border-[#059669] focus:ring-0 rounded text-sm px-4 outline-none"
                  placeholder="e.g. Rahim Traders"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-[#0F172A]">Phone</label>
                  <input
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full h-[42px] border border-[#c6c6cd] focus:border-[#059669] focus:ring-0 rounded text-sm px-4 outline-none"
                    placeholder="01711-XXXXXX"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-[#0F172A]">Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as "regular" | "walk_in")}
                    className="w-full h-[42px] border border-[#c6c6cd] focus:border-[#059669] focus:ring-0 rounded text-sm px-4 outline-none"
                  >
                    <option value="regular">Regular</option>
                    <option value="walk_in">Walk-In</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-[#0F172A]">Address</label>
                <input
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full h-[42px] border border-[#c6c6cd] focus:border-[#059669] focus:ring-0 rounded text-sm px-4 outline-none"
                  placeholder="Optional"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-[#0F172A]">Opening Balance (৳)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formOpeningBalance}
                  onChange={(e) => setFormOpeningBalance(e.target.value)}
                  className="w-full h-[42px] border border-[#c6c6cd] focus:border-[#059669] focus:ring-0 rounded text-sm px-4 outline-none font-mono"
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-[42px] bg-transparent text-[#505f76] hover:bg-[#f2f4f6] transition-colors font-bold text-sm rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 h-[42px] bg-[#0F172A] text-white hover:bg-[#0F172A]/90 transition-all active:scale-95 font-bold text-sm rounded shadow-md disabled:opacity-40"
                >
                  {formSubmitting ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheet */}
      {showModal && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-2xl p-6 flex flex-col gap-6 transition-transform max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1 bg-[#c6c6cd] rounded-full mx-auto mb-2" />
            <h2 className="font-display font-bold text-xl text-[#0F172A]">Add Customer</h2>
            {formError && (
              <div className="p-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-lg text-sm text-[#ba1a1a] font-medium">
                {formError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#505f76] uppercase tracking-wider">
                  Customer Name <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-[42px] px-4 rounded border border-[#76777d] focus:ring-2 focus:ring-[#0F172A] focus:border-transparent outline-none"
                  placeholder="e.g. Rahim Traders"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#505f76] uppercase tracking-wider">Phone</label>
                  <input
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full h-[42px] px-4 rounded border border-[#76777d] focus:ring-2 focus:ring-[#0F172A] focus:border-transparent outline-none"
                    placeholder="01711-XXXXXX"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#505f76] uppercase tracking-wider">Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as "regular" | "walk_in")}
                    className="w-full h-[42px] px-4 rounded border border-[#76777d] focus:ring-2 focus:ring-[#0F172A] outline-none"
                  >
                    <option value="regular">Regular</option>
                    <option value="walk_in">Walk-In</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#505f76] uppercase tracking-wider">Address</label>
                <input
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full h-[42px] px-4 rounded border border-[#76777d] focus:ring-2 focus:ring-[#0F172A] focus:border-transparent outline-none"
                  placeholder="Optional"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#505f76] uppercase tracking-wider">Opening Balance (৳)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formOpeningBalance}
                  onChange={(e) => setFormOpeningBalance(e.target.value)}
                  className="w-full h-[42px] px-4 rounded border border-[#76777d] focus:ring-2 focus:ring-[#0F172A] focus:border-transparent outline-none font-mono"
                  placeholder="0.00"
                />
              </div>
              <div className="flex flex-col gap-3 mt-4">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full h-12 bg-[#0F172A] text-white font-bold rounded-lg shadow-md active:scale-[0.98] transition-all disabled:opacity-40"
                >
                  {formSubmitting ? "Saving..." : "Save Customer"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full h-12 bg-transparent text-[#505f76] font-medium rounded-lg hover:bg-[#f2f4f6] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
            <div className="h-6" />
          </div>
        </div>
      )}
    </>
  );
}
