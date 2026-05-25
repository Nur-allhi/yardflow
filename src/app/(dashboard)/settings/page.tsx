"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface OrgData {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  plan: string;
  inventory_mode: "detailed" | "simple";
}

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "", inventory_mode: "detailed" as "detailed" | "simple" });
  const [org, setOrg] = useState<OrgData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [originalMode, setOriginalMode] = useState<string>("detailed");

  const { data: orgData, isLoading: loading, error: loadError, refetch: loadData } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      const data: OrgData = await res.json();
      setForm({
        name: data.name || "",
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
        inventory_mode: data.inventory_mode || "detailed",
      });
      setOriginalMode(data.inventory_mode || "detailed");
      return data;
    },
  });

  useEffect(() => {
    if (orgData) setOrg(orgData);
  }, [orgData]);

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const mutation = useMutation({
    mutationFn: async (formData: Record<string, unknown>) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json() as Promise<OrgData>;
    },
    onSuccess: (data) => {
      setOrg(data);
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      if (data.inventory_mode !== originalMode) {
        setTimeout(() => { window.location.reload(); }, 800);
      } else {
        setTimeout(() => setSaved(false), 2500);
      }
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setError(null);
    mutation.mutate(form);
  };

  return (
    <div className="p-4 md:p-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Settings', href: null }]} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-[2rem] font-bold text-primary-container tracking-tight">
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

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <span className="px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap bg-primary text-on-primary">General</span>
        <Link href="/settings/team" className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors">Team Members</Link>
        <Link href="/settings/logs" className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors">Activity Logs</Link>
        <Link href="/settings/data" className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors">Data Management</Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="max-w-2xl space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-outline-variant/30 p-6 animate-pulse">
              <div className="h-3 bg-surface-container-high rounded w-1/4 mb-3" />
              <div className="h-10 bg-surface-container-high rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && (error || loadError) && (
        <div role="alert" aria-live="polite" className="max-w-2xl bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <span className="material-symbols-outlined text-4xl text-error block mb-2">
            error
          </span>
          <p className="text-error font-medium text-sm">{error || (loadError instanceof Error ? loadError.message : "Failed to load settings")}</p>
          <button
            onClick={() => loadData()}
            className="mt-3 px-4 py-2 bg-primary-container text-white text-sm font-semibold rounded-lg"
          >
            Retry
          </button>
        </div>
      )}

      {/* Form */}
      {!loading && !(error || loadError) && (
        <><form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          {/* Organization Profile Card */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-6 md:p-8 shadow-sm space-y-5">
            <h3 className="font-display text-sm font-bold text-primary uppercase tracking-wider">Organization Profile</h3>
            {/* Company Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">
                Org Name
              </label>
              <input
                value={form.name}
                onChange={handleChange("name")}
                autoComplete="organization"
                enterKeyHint="next"
                className="w-full h-[44px] px-4 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium"
                placeholder="Enter company name"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">
                Phone
              </label>
              <input
                value={form.phone}
                onChange={handleChange("phone")}
                autoComplete="tel"
                inputMode="tel"
                enterKeyHint="next"
                className="w-full h-[44px] px-4 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium"
                placeholder="Enter phone number"
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">
                Physical Address
              </label>
              <textarea
                value={form.address}
                onChange={handleChange("address")}
                rows={3}
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium resize-none"
                placeholder="Enter company address"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">
                Email
              </label>
              <input
                value={form.email}
                onChange={handleChange("email")}
                type="email"
                autoComplete="email"
                inputMode="email"
                enterKeyHint="next"
                className="w-full h-[44px] px-4 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium"
                placeholder="Enter email address"
              />
            </div>

            {/* Inventory Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">
                Inventory Mode
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, inventory_mode: "detailed" }))}
                  className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                    form.inventory_mode === "detailed"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-outline-variant text-on-surface-variant hover:border-primary/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">category</span>
                  <span className="text-left">
                    <span className="block">Detailed</span>
                    <span className="block text-[11px] font-normal opacity-70">Categories + Sub-types</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, inventory_mode: "simple" }))}
                  className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                    form.inventory_mode === "simple"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-outline-variant text-on-surface-variant hover:border-primary/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">inventory_2</span>
                  <span className="text-left">
                    <span className="block">Simple</span>
                    <span className="block text-[11px] font-normal opacity-70">Single pool, no sub-types</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Plan + Save */}
            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Current Plan
                </p>
                <p className="font-code text-sm font-bold text-on-tertiary-container capitalize">
                  {org?.plan || "—"}
                </p>
              </div>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary/90 transition-all text-sm shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
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

        {/* Danger Zone - Mobile Only */}
        <div className="md:hidden bg-surface-container-lowest rounded-xl border-l-4 border-l-error border border-outline-variant/20 p-6 shadow-sm mt-6">
          <div className="flex items-start gap-3 mb-4">
            <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <h3 className="font-display text-sm font-bold text-error uppercase tracking-wider">Danger Zone</h3>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
            Manage data export, import, and erasure in the <span className="font-bold">Data Management</span> section.
          </p>
          <Link href="/settings/data" className="block w-full py-3 px-4 border border-error text-error font-bold text-sm rounded-lg hover:bg-error/5 active:bg-error/10 transition-all text-center">
            Go to Data Management
          </Link>
        </div></>
      )}
    </div>
  );
}
