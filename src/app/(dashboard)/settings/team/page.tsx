"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumb";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "worker";
  is_active: boolean;
  created_at: string;
}

interface InviteForm {
  name: string;
  email: string;
  password: string;
  role: "owner" | "manager" | "worker";
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="px-2 py-1 text-[10px] font-black uppercase bg-success/10 text-success rounded-sm border border-success/20">
      Active
    </span>
  ) : (
    <span className="px-2 py-1 text-[10px] font-black uppercase bg-secondary/10 text-secondary rounded-sm border border-secondary/20">
      Inactive
    </span>
  );
}

export default function TeamPage() {
  const queryClient = useQueryClient();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteForm>({
    name: "",
    email: "",
    password: "",
    role: "worker",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const inviteMutation = useMutation({
    mutationFn: async (formData: InviteForm) => {
      const res = await fetch("/api/settings/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        if (data.error && typeof data.error === "string") {
          throw new Error(data.error);
        }
        if (data.error && typeof data.error === "object") {
          const firstError = Object.values(data.error as Record<string, string[]>)[0]?.[0];
          throw new Error(firstError || "Failed to invite member");
        }
        throw new Error("Failed to invite member");
      }
      return res.json();
    },
    onSuccess: () => {
      setInviteOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (err: Error) => {
      setInviteError(err.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (params: { id: string; is_active: boolean }) => {
      const res = await fetch(`/api/settings/team/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: params.is_active }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
    onError: () => {
      setError("Failed to update member status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/settings/team/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
    },
    onSuccess: () => {
      setDeleteConfirm(null);
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const { data: membersData, isLoading: loading, error: loadError, refetch: loadData } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const res = await fetch("/api/settings/team");
      if (!res.ok) throw new Error("Failed to load team members");
      return res.json() as Promise<TeamMember[]>;
    },
  });

  useEffect(() => {
    if (membersData) {
      setMembers(membersData);
    }
  }, [membersData]);

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()),
  );

  function handleRoleLabel(role: string) {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  function resetForm() {
    setInviteForm({ name: "", email: "", password: "", role: "worker" });
    setFormErrors({});
    setInviteError(null);
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setFormErrors({});
    setInviteError(null);

    const errors: FormErrors = {};
    if (!inviteForm.name.trim()) errors.name = "Name is required";
    if (!inviteForm.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email))
      errors.email = "Invalid email address";
    if (!inviteForm.password) errors.password = "Password is required";
    else if (inviteForm.password.length < 6)
      errors.password = "Must be at least 6 characters";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    inviteMutation.mutate(inviteForm);
  }

  function handleToggle(member: TeamMember) {
    toggleMutation.mutate({ id: member.id, is_active: !member.is_active });
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id);
  }

  return (
    <div className="p-4 md:p-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Settings', href: '/settings' }, { label: 'Team', href: null }]} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-[2rem] font-bold text-primary-container tracking-tight">
            Team Management
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              resetForm();
              setInviteOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-container text-white font-semibold rounded-lg hover:bg-primary-container/90 transition-all text-sm shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Invite Member
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-outline-variant/50">
        <Link
          href="/settings"
          className="px-4 py-3 text-sm text-secondary hover:text-primary-container transition-colors"
        >
          Settings
        </Link>
        <Link
          href="/settings/team"
          className="px-4 py-3 text-sm font-bold text-tertiary border-b-2 border-tertiary"
        >
          Team
        </Link>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-outline-variant rounded-lg text-sm outline-none focus:ring-0"
            placeholder="Search members..."
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-outline-variant/30 p-6 animate-pulse"
            >
              <div className="h-4 bg-surface-container-high rounded w-1/3 mb-3" />
              <div className="h-4 bg-surface-container-high rounded w-1/4 mb-3" />
              <div className="h-4 bg-surface-container-high rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {(error || loadError) && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-error font-medium text-sm">{error || (loadError instanceof Error ? loadError.message : "Failed to load team members")}</p>
          <button
            onClick={() => loadData()}
            className="mt-3 px-4 py-2 bg-primary-container text-white text-sm rounded-lg"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !(error || loadError) && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-outline-variant/30 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-outline-variant block mb-4">
            group
          </span>
          {search ? (
            <>
              <p className="text-secondary text-sm font-medium mb-1">
                No members match your search
              </p>
              <p className="text-secondary text-xs">Try a different name or email</p>
            </>
          ) : (
            <>
              <p className="text-secondary text-sm font-medium mb-1">
                No team members yet
              </p>
              <p className="text-secondary text-xs">
                Invite your first team member to get started
              </p>
              <button
                onClick={() => {
                  resetForm();
                  setInviteOpen(true);
                }}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary-container text-white text-sm font-semibold rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">person_add</span>
                Invite Member
              </button>
            </>
          )}
        </div>
      )}

      {/* Desktop Table */}
      {!loading && !(error || loadError) && filtered.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-high border-b border-outline-variant">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-primary-container uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          m.is_active
                            ? "bg-secondary-container text-primary-container"
                            : "bg-surface-container-highest text-secondary"
                        }`}
                      >
                        {getInitials(m.name)}
                      </div>
                      <span className="font-bold text-sm">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                    {m.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-bold px-2 py-1 rounded bg-surface-container-low text-secondary">
                      {handleRoleLabel(m.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge active={m.is_active} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div
                      className="flex justify-end gap-2"
                    >
                      <button
                        onClick={() => handleToggle(m)}
                        disabled={toggleMutation.isPending}
                        className={`text-xs font-bold px-3 py-1 rounded ${
                          m.is_active
                            ? "bg-warning/10 text-warning hover:bg-warning/20"
                            : "bg-success/10 text-success hover:bg-success/20"
                        } disabled:opacity-50 transition-colors`}
                      >
                        {toggleMutation.isPending
                          ? "..."
                          : m.is_active
                            ? "Deactivate"
                            : "Activate"}
                      </button>
                      {m.role !== "owner" && (
                        <button
                          onClick={() => setDeleteConfirm(m.id)}
                          className="text-xs font-bold px-3 py-1 rounded bg-error/10 text-error hover:bg-error/20 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm leading-none align-middle">
                            delete
                          </span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Card List */}
      {!loading && !(error || loadError) && filtered.length > 0 && (
        <div className="md:hidden space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-secondary">
              Team Members
            </h2>
          </div>
          {filtered.map((m) => (
            <div
              key={m.id}
              className="block bg-white rounded-lg p-4 shadow-sm border border-outline-variant/20"
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    m.is_active
                      ? "bg-secondary-container text-primary-container"
                      : "bg-surface-container-highest text-secondary"
                  }`}
                >
                  {getInitials(m.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-primary-container text-base truncate">
                    {m.name}
                  </h3>
                  <p className="text-xs text-secondary font-medium truncate">
                    {m.email}
                  </p>
                </div>
                <StatusBadge active={m.is_active} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-outline-variant/30">
                <div>
                  <p className="text-[11px] text-secondary font-medium mb-0.5">
                    Role
                  </p>
                  <p className="text-sm font-bold text-primary-container">
                    {handleRoleLabel(m.role)}
                  </p>
                </div>
                <div className="flex gap-1 justify-end items-end">
                  <button
                    onClick={() => handleToggle(m)}
                    disabled={toggleMutation.isPending}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                      m.is_active
                        ? "bg-warning/10 text-warning"
                        : "bg-success/10 text-success"
                    } disabled:opacity-50`}
                  >
                    {toggleMutation.isPending
                      ? "..."
                      : m.is_active
                        ? "Deactivate"
                        : "Activate"}
                  </button>
                  {m.role !== "owner" && (
                    <button
                      onClick={() => setDeleteConfirm(m.id)}
                      className="p-1.5 text-xs font-bold rounded-lg bg-error/10 text-error"
                    >
                      <span className="material-symbols-outlined text-lg">
                        delete
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {inviteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => {
            if (!inviteMutation.isPending) {
              setInviteOpen(false);
              resetForm();
            }
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/50">
              <h2 className="font-display text-lg font-bold text-primary-container">
                Invite Team Member
              </h2>
              <button
                onClick={() => {
                  setInviteOpen(false);
                  resetForm();
                }}
                disabled={inviteMutation.isPending}
                className="text-secondary hover:text-primary-container disabled:opacity-50"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              {inviteError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-error">
                  {inviteError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  value={inviteForm.name}
                  onChange={(e) =>
                    setInviteForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-0 ${
                    formErrors.name ? "border-red-400 bg-red-50" : "border-outline-variant"
                  }`}
                  placeholder="John Doe"
                />
                {formErrors.name && (
                  <p className="text-xs text-error mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-0 ${
                    formErrors.email ? "border-red-400 bg-red-50" : "border-outline-variant"
                  }`}
                  placeholder="john@example.com"
                />
                {formErrors.email && (
                  <p className="text-xs text-error mt-1">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={inviteForm.password}
                  onChange={(e) =>
                    setInviteForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-0 ${
                    formErrors.password
                      ? "border-red-400 bg-red-50"
                      : "border-outline-variant"
                  }`}
                  placeholder="Min. 6 characters"
                />
                {formErrors.password && (
                  <p className="text-xs text-error mt-1">
                    {formErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) =>
                    setInviteForm((f) => ({
                      ...f,
                      role: e.target.value as InviteForm["role"],
                    }))
                  }
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm outline-none focus:ring-0 bg-white"
                >
                  <option value="worker">Worker</option>
                  <option value="manager">Manager</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setInviteOpen(false);
                    resetForm();
                  }}
                  disabled={inviteMutation.isPending}
                  className="flex-1 px-4 py-2 border border-outline-variant text-secondary font-semibold rounded-lg text-sm hover:bg-surface-container-low transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary-container text-white font-semibold rounded-lg text-sm hover:bg-primary-container/90 transition-all disabled:opacity-50 active:scale-95"
                >
                  {inviteMutation.isPending ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => !deleteMutation.isPending && setDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-error">
                  warning
                </span>
              </div>
              <div>
                <h3 className="font-display font-bold text-primary-container">
                  Remove Member
                </h3>
                <p className="text-xs text-secondary">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <p className="text-sm text-secondary mb-6">
              Are you sure you want to remove this team member? They will lose access
              to this organization.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 border border-outline-variant text-secondary font-semibold rounded-lg text-sm hover:bg-surface-container-low transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-error text-white font-semibold rounded-lg text-sm hover:bg-error/90 transition-all disabled:opacity-50 active:scale-95"
              >
                {deleteMutation.isPending ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
