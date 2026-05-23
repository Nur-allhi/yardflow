"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";

interface LogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  changes: Record<string, unknown> | null;
  created_at: string;
  user_name: string | null;
}

interface LogsResponse {
  logs: LogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

const ENTITY_TYPES = [
  { value: "", label: "All Entities" },
  { value: "purchase", label: "Purchases" },
  { value: "sale", label: "Sales" },
  { value: "category", label: "Categories" },
  { value: "subtype", label: "Subtypes" },
  { value: "consumable", label: "Consumables" },
  { value: "scrap", label: "Scrap" },
  { value: "worker", label: "Workers" },
  { value: "advance", label: "Advances" },
  { value: "payroll", label: "Payroll" },
  { value: "account", label: "Accounts" },
  { value: "organization", label: "Organization" },
  { value: "user", label: "Users" },
  { value: "report", label: "Reports" },
];

const ACTIONS = [
  { value: "", label: "All Actions" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "payment", label: "Payment" },
  { value: "transfer", label: "Transfer" },
  { value: "login", label: "Login" },
];

const ACTION_COLORS: Record<string, string> = {
  create: "bg-success/10 text-success border-success/20",
  update: "bg-tertiary/10 text-tertiary border-tertiary/20",
  delete: "bg-error/10 text-error border-error/20",
  payment: "bg-warning/10 text-warning border-warning/20",
  transfer: "bg-primary/10 text-primary border-primary/20",
  login: "bg-secondary/10 text-secondary border-secondary/20",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", "50");
  if (entityType) queryParams.set("entity_type", entityType);
  if (action) queryParams.set("action", action);
  if (debouncedSearch) queryParams.set("search", debouncedSearch);

  const { data, isLoading, error, refetch } = useQuery<LogsResponse>({
    queryKey: ["activity-logs", page, entityType, action, debouncedSearch],
    queryFn: async () => {
      const res = await fetch(`/api/settings/logs?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to load activity logs");
      return res.json();
    },
  });

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    const timeout = setTimeout(() => {
      setDebouncedSearch(e.target.value);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }

  function handleEntityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setEntityType(e.target.value);
    setPage(1);
  }

  function handleActionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setAction(e.target.value);
    setPage(1);
  }

  const logs = data?.logs ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="p-4 md:p-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Settings', href: '/settings' }, { label: 'Activity Logs', href: null }]} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-[2rem] font-bold text-primary-container tracking-tight">
            Activity Logs
          </h1>
          <p className="font-body text-on-surface-variant text-sm">
            {data ? `${data.total} event${data.total !== 1 ? "s" : ""}` : "Loading..."}
          </p>
        </div>
      </div>

      {/* Pill Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Link href="/settings" className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors">General</Link>
        <Link href="/settings/team" className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors">Team Members</Link>
        <span className="px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap bg-primary text-on-primary">Activity Logs</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            value={search}
            onChange={handleSearchChange}
            autoComplete="off"
            enterKeyHint="search"
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="Search events..."
          />
        </div>
        <select
          value={entityType}
          onChange={handleEntityChange}
          className="bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        >
          {ENTITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          value={action}
          onChange={handleActionChange}
          className="bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        >
          {ACTIONS.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-outline-variant/30 p-6 animate-pulse">
              <div className="h-4 bg-surface-container-high rounded w-1/3 mb-3" />
              <div className="h-4 bg-surface-container-high rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
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

      {/* Empty */}
      {!isLoading && !error && logs.length === 0 && (
        <div className="bg-white rounded-xl border border-outline-variant/30 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-outline-variant block mb-4">
            history
          </span>
          <p className="text-secondary text-sm font-medium mb-1">
            No activity recorded yet
          </p>
          <p className="text-secondary text-xs">
            Events will appear here as you use the system
          </p>
        </div>
      )}

      {/* Desktop Table */}
      {!isLoading && !error && logs.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-high border-b border-outline-variant">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">Entity</th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-secondary">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {log.user_name || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-sm border ${ACTION_COLORS[log.action] || "bg-surface-container-high text-secondary border-outline-variant"}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                    {log.entity_type.replace(/_/g, " ")}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {log.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Card List */}
      {!isLoading && !error && logs.length > 0 && (
        <div className="md:hidden space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-sm border ${ACTION_COLORS[log.action] || "bg-surface-container-high text-secondary border-outline-variant"}`}>
                    {log.action}
                  </span>
                  <span className="text-xs text-secondary capitalize">{log.entity_type.replace(/_/g, " ")}</span>
                </div>
                <span className="font-mono text-[10px] text-secondary">{formatDate(log.created_at)}</span>
              </div>
              <p className="text-sm text-on-surface mb-2">{log.description}</p>
              <p className="text-xs text-secondary">{log.user_name || "—"}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 text-sm font-bold rounded-lg border border-outline-variant text-secondary hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <span className="text-sm text-secondary font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 text-sm font-bold rounded-lg border border-outline-variant text-secondary hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
