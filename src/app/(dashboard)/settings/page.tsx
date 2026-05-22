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
}

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "" });
  const [org, setOrg] = useState<OrgData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
      });
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
      setTimeout(() => setSaved(false), 2500);
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
      <div className="flex gap-4 mb-6 border-b border-outline-variant/30">
        <span className="px-4 py-2 border-b-2 border-primary-container text-primary-container font-bold text-sm">General</span>
        <Link href="/settings/team" className="px-4 py-2 text-secondary font-medium text-sm hover:text-primary-container">Team</Link>
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
        <div className="max-w-2xl bg-red-50 border border-red-200 rounded-xl p-6 text-center">
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
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          <div className="bg-white rounded-xl border border-outline-variant p-6 md:p-8 shadow-sm">
            {/* Company Name */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-primary-container uppercase tracking-wider mb-2">
                Company Name
              </label>
              <input
                value={form.name}
                onChange={handleChange("name")}
                className="w-full px-4 py-3 bg-white border border-outline-variant rounded-lg text-sm text-primary-container outline-none focus:ring-1 focus:ring-tertiary focus:border-tertiary"
                placeholder="Enter company name"
                required
              />
            </div>

            {/* Address */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-primary-container uppercase tracking-wider mb-2">
                Address
              </label>
              <textarea
                value={form.address}
                onChange={handleChange("address")}
                rows={3}
                className="w-full px-4 py-3 bg-white border border-outline-variant rounded-lg text-sm text-primary-container outline-none focus:ring-1 focus:ring-tertiary focus:border-tertiary resize-none"
                placeholder="Enter company address"
              />
            </div>

            {/* Phone */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-primary-container uppercase tracking-wider mb-2">
                Phone
              </label>
              <input
                value={form.phone}
                onChange={handleChange("phone")}
                className="w-full px-4 py-3 bg-white border border-outline-variant rounded-lg text-sm text-primary-container outline-none focus:ring-1 focus:ring-tertiary focus:border-tertiary"
                placeholder="Enter phone number"
              />
            </div>

            {/* Email */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-primary-container uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                value={form.email}
                onChange={handleChange("email")}
                type="email"
                className="w-full px-4 py-3 bg-white border border-outline-variant rounded-lg text-sm text-primary-container outline-none focus:ring-1 focus:ring-tertiary focus:border-tertiary"
                placeholder="Enter email address"
              />
            </div>

            {/* Divider */}
            <hr className="border-outline-variant/50 mb-6" />

            {/* Plan Info */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-primary-container uppercase tracking-wider mb-1">
                  Current Plan
                </p>
                <p className="font-mono text-sm font-bold text-tertiary capitalize">
                  {org?.plan || "—"}
                </p>
              </div>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-primary-container text-white font-semibold rounded-lg hover:bg-primary-container/90 transition-all text-sm shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mutation.isPending ? (
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
