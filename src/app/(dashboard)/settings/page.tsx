"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

interface OrgData {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  plan: string;
}

export default function SettingsPage() {
  const [org, setOrg] = useState<OrgData | null>(null);
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      const data: OrgData = await res.json();
      setOrg(data);
      setForm({
        name: data.name || "",
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      const data: OrgData = await res.json();
      setOrg(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

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
        <span className="text-[#0F172A] font-bold">Settings</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-[2rem] font-bold text-[#0F172A] tracking-tight">
            Organization Settings
          </h1>
        </div>
        {saved && (
          <div className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-lg border border-success/20 text-sm font-bold animate-pulse">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            Saved
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="max-w-2xl space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-[#c6c6cd]/30 p-6 animate-pulse">
              <div className="h-3 bg-[#e6e8ea] rounded w-1/4 mb-3" />
              <div className="h-10 bg-[#e6e8ea] rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="max-w-2xl bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <span className="material-symbols-outlined text-4xl text-[#EF4444] block mb-2">
            error
          </span>
          <p className="text-[#EF4444] font-medium text-sm">{error}</p>
          <button
            onClick={loadData}
            className="mt-3 px-4 py-2 bg-[#0F172A] text-white text-sm font-semibold rounded-lg"
          >
            Retry
          </button>
        </div>
      )}

      {/* Form */}
      {!loading && !error && (
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          <div className="bg-white rounded-xl border border-[#c6c6cd] p-6 md:p-8 shadow-sm">
            {/* Company Name */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                Company Name
              </label>
              <input
                value={form.name}
                onChange={handleChange("name")}
                className="w-full px-4 py-3 bg-white border border-[#c6c6cd] rounded-lg text-sm text-[#0F172A] outline-none focus:ring-1 focus:ring-[#059669] focus:border-[#059669]"
                placeholder="Enter company name"
                required
              />
            </div>

            {/* Address */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                Address
              </label>
              <textarea
                value={form.address}
                onChange={handleChange("address")}
                rows={3}
                className="w-full px-4 py-3 bg-white border border-[#c6c6cd] rounded-lg text-sm text-[#0F172A] outline-none focus:ring-1 focus:ring-[#059669] focus:border-[#059669] resize-none"
                placeholder="Enter company address"
              />
            </div>

            {/* Phone */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                Phone
              </label>
              <input
                value={form.phone}
                onChange={handleChange("phone")}
                className="w-full px-4 py-3 bg-white border border-[#c6c6cd] rounded-lg text-sm text-[#0F172A] outline-none focus:ring-1 focus:ring-[#059669] focus:border-[#059669]"
                placeholder="Enter phone number"
              />
            </div>

            {/* Email */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                value={form.email}
                onChange={handleChange("email")}
                type="email"
                className="w-full px-4 py-3 bg-white border border-[#c6c6cd] rounded-lg text-sm text-[#0F172A] outline-none focus:ring-1 focus:ring-[#059669] focus:border-[#059669]"
                placeholder="Enter email address"
              />
            </div>

            {/* Divider */}
            <hr className="border-[#c6c6cd]/50 mb-6" />

            {/* Plan Info */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                  Current Plan
                </p>
                <p className="font-mono text-sm font-bold text-[#059669] capitalize">
                  {org?.plan || "—"}
                </p>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-[#0F172A] text-white font-semibold rounded-lg hover:bg-[#0F172A]/90 transition-all text-sm shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined text-lg animate-spin">
                      progress_activity
                    </span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">save</span>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
