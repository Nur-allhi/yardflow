"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";

interface ImportPreview {
  fileName: string;
  entities: Record<string, number>;
}

interface ImportResult {
  imported: Record<string, number>;
  errors: string[];
}

const CSV_ENTITIES = [
  { value: "accounts", label: "Accounts" },
  { value: "purchases", label: "Purchases" },
  { value: "sales", label: "Sales" },
  { value: "categories", label: "Categories" },
  { value: "subtypes", label: "Subtypes" },
  { value: "consumables", label: "Consumables" },
  { value: "workers", label: "Workers" },
  { value: "payroll", label: "Payroll" },
  { value: "advances", label: "Advances" },
  { value: "scrap", label: "Scrap" },
];

async function downloadFile(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

export default function DataManagementPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedCsvEntity, setSelectedCsvEntity] = useState("");

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [eraseForm, setEraseForm] = useState({ password: "", confirmation: "" });
  const [deleteForm, setDeleteForm] = useState({ password: "", confirmation: "" });

  const exportJsonMutation = useMutation({
    mutationFn: async () => {
      await downloadFile(
        "/api/settings/data/export",
        `yardflow-export-${new Date().toISOString().split("T")[0]}.json`,
      );
    },
  });

  const exportCsvMutation = useMutation({
    mutationFn: async (table: string) => {
      await downloadFile(`/api/settings/data/export?format=csv&table=${table}`, `${table}.csv`);
    },
  });

  const exportAllCsvMutation = useMutation({
    mutationFn: async () => {
      await downloadFile(
        "/api/settings/data/export?format=csv&table=all",
        `yardflow-all-${new Date().toISOString().split("T")[0]}.zip`,
      );
    },
  });

  const importMutation = useMutation({
    mutationFn: async (data: unknown) => {
      const res = await fetch("/api/settings/data/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Import failed");
      }
      return res.json() as Promise<ImportResult>;
    },
    onSuccess: (result) => {
      setImportResult(result);
      setImportFile(null);
      setImportPreview(null);
    },
  });

  const eraseMutation = useMutation({
    mutationFn: async (form: { password: string; confirmation: string }) => {
      const res = await fetch("/api/settings/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to erase data");
      }
    },
    onSuccess: () => {
      setEraseForm({ password: "", confirmation: "" });
    },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async (form: { password: string; confirmation: string }) => {
      const res = await fetch("/api/settings/organization", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete organization");
      }
    },
    onSuccess: () => {
      router.push("/login");
    },
  });

  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.endsWith(".json")) return;
    setImportFile(file);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const entities: Record<string, number> = {};
        for (const key of Object.keys(data)) {
          if (Array.isArray(data[key])) {
            entities[key] = data[key].length;
          }
        }
        setImportPreview({ fileName: file.name, entities });
      } catch {
        setImportPreview(null);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClickUpload = () => fileInputRef.current?.click();

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleStartImport = () => {
    if (!importFile || !importPreview) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        importMutation.mutate(data);
      } catch {
        /* ignore parse errors — already validated on preview */
      }
    };
    reader.readAsText(importFile);
  };

  return (
    <div className="p-4 md:p-8">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Settings", href: "/settings" },
          { label: "Data Management", href: null },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-[2rem] font-bold text-primary tracking-tight">
            Data Management
          </h1>
          <p className="font-body text-on-surface-variant text-sm">
            Export, import, or erase your organization data
          </p>
        </div>
      </div>

      {/* Pill Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Link
          href="/settings"
          className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors"
        >
          General
        </Link>
        <Link
          href="/settings/team"
          className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors"
        >
          Team Members
        </Link>
        <Link
          href="/settings/logs"
          className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors"
        >
          Activity Logs
        </Link>
        <span className="px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap bg-primary text-on-primary">
          Data Management
        </span>
      </div>

      <div className="max-w-2xl space-y-8">
        {/* ===== Section 1: Export ===== */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-6 md:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">file_download</span>
            <h3 className="font-display text-sm font-bold text-primary uppercase tracking-wider">
              Export
            </h3>
          </div>

          {/* Export All Data (JSON) */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-on-surface">Export All Data (JSON)</p>
              <p className="text-xs text-on-surface-variant">Complete backup of all your business data</p>
            </div>
            <button
              onClick={() => exportJsonMutation.mutate()}
              disabled={exportJsonMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 transition-all text-sm shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {exportJsonMutation.isPending ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-lg">download</span>
              )}
              Download JSON
            </button>
          </div>

          <div className="border-t border-outline-variant/20" />

          {/* Export as CSV */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-on-surface">Export as CSV</p>
              <p className="text-xs text-on-surface-variant">Export a specific entity as CSV</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedCsvEntity}
                onChange={(e) => setSelectedCsvEntity(e.target.value)}
                className="h-[42px] px-4 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="">Select entity...</option>
                {CSV_ENTITIES.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (selectedCsvEntity) exportCsvMutation.mutate(selectedCsvEntity);
                }}
                disabled={!selectedCsvEntity || exportCsvMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 transition-all text-sm shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {exportCsvMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-lg">download</span>
                )}
                Download
              </button>
            </div>
          </div>

          <div className="border-t border-outline-variant/20" />

          {/* Download All CSV (ZIP) */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-on-surface">Download All CSV (ZIP)</p>
              <p className="text-xs text-on-surface-variant">Export all entities as a single ZIP archive</p>
            </div>
            <button
              onClick={() => exportAllCsvMutation.mutate()}
              disabled={exportAllCsvMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 transition-all text-sm shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {exportAllCsvMutation.isPending ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-lg">folder_zip</span>
              )}
              Download ZIP
            </button>
          </div>
        </div>

        {/* ===== Section 2: Import ===== */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-6 md:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">file_upload</span>
            <h3 className="font-display text-sm font-bold text-primary uppercase tracking-wider">
              Import
            </h3>
          </div>

          {/* Drop zone — shown when no file is selected and no result */}
          {!importFile && !importResult && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleClickUpload}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-outline-variant hover:border-primary/50 hover:bg-surface-container-low"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <span className="material-symbols-outlined text-4xl text-on-surface-variant block mb-3">
                cloud_upload
              </span>
              <p className="text-sm font-semibold text-on-surface mb-1">
                {isDragOver ? "Drop your file here" : "Drag & drop your JSON file here"}
              </p>
              <p className="text-xs text-on-surface-variant">or click to browse — .json files only</p>
            </div>
          )}

          {/* Invalid JSON file selected */}
          {importFile && !importPreview && !importResult && (
            <div className="text-center py-4">
              <p className="text-sm text-error mb-2">Could not parse the selected JSON file</p>
              <button
                onClick={() => {
                  setImportFile(null);
                  setImportPreview(null);
                }}
                className="text-sm text-primary font-semibold hover:underline"
              >
                Try a different file
              </button>
            </div>
          )}

          {/* Preview after file selected */}
          {importFile && importPreview && !importResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-lg border border-outline-variant/20">
                <span className="material-symbols-outlined text-primary">description</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">
                    {importPreview.fileName}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {Object.values(importPreview.entities).reduce((a, b) => a + b, 0)} records found
                  </p>
                </div>
                <button
                  onClick={() => {
                    setImportFile(null);
                    setImportPreview(null);
                  }}
                  className="p-1 hover:bg-surface-container-highest rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-lg text-on-surface-variant">
                    close
                  </span>
                </button>
              </div>

              {/* Entity breakdown */}
              <div className="space-y-2">
                {Object.entries(importPreview.entities).map(([entity, count]) => (
                  <div key={entity} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-on-surface capitalize">
                      {entity.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {importMutation.isError && (
                <div className="bg-error/10 border border-error/20 rounded-lg p-3 text-sm text-error">
                  {importMutation.error?.message || "Import failed"}
                </div>
              )}

              <button
                onClick={handleStartImport}
                disabled={importMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary/90 transition-all text-sm shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {importMutation.isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">upload</span>
                    Start Import
                  </>
                )}
              </button>
            </div>
          )}

          {/* Import result summary */}
          {importResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-success">check_circle</span>
                <p className="text-sm font-bold text-success">Import Complete</p>
              </div>

              <div className="space-y-2">
                {Object.entries(importResult.imported).map(([entity, count]) => (
                  <div key={entity} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-on-surface capitalize">
                      {entity.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-bold text-success">
                      {count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {importResult.errors.length > 0 && (
                <div className="bg-error/10 border border-error/20 rounded-lg p-3">
                  <p className="text-xs font-bold text-error uppercase tracking-wider mb-2">
                    Errors
                  </p>
                  <ul className="space-y-1">
                    {importResult.errors.map((err, i) => (
                      <li key={i} className="text-xs text-error">
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => {
                  setImportResult(null);
                  setImportFile(null);
                  setImportPreview(null);
                }}
                className="w-full px-4 py-2 border border-outline-variant text-on-surface-variant font-semibold rounded-lg text-sm hover:bg-surface-container-low transition-colors"
              >
                Import Another File
              </button>
            </div>
          )}
        </div>

        {/* ===== Section 3: Danger Zone ===== */}
        <div className="space-y-4">
          <h3 className="font-display text-sm font-bold text-error uppercase tracking-wider flex items-center gap-2">
            <span
              className="material-symbols-outlined text-lg"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
            Danger Zone
          </h3>

          {/* Card 1: Erase All Data */}
          <div className="bg-surface-container-lowest rounded-xl border-2 border-error/30 p-6 md:p-8 shadow-sm space-y-4">
            <div>
              <h4 className="font-display text-base font-bold text-on-surface">Erase All Data</h4>
              <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                Permanently delete all your business data (inventory, purchases, sales, HR, reports,
                activity logs). Your organization profile and team members will be kept.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={eraseForm.password}
                  onChange={(e) => setEraseForm((f) => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                  className="w-full h-[44px] px-4 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:ring-2 focus:ring-error focus:border-transparent transition-all"
                  placeholder="Enter your password"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Type <span className="font-mono text-error">ERASE</span> to confirm
                </label>
                <input
                  type="text"
                  value={eraseForm.confirmation}
                  onChange={(e) => setEraseForm((f) => ({ ...f, confirmation: e.target.value }))}
                  autoComplete="off"
                  className="w-full h-[44px] px-4 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:ring-2 focus:ring-error focus:border-transparent transition-all font-mono"
                  placeholder="Type ERASE"
                />
              </div>
            </div>

            {eraseMutation.isError && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-3 text-sm text-error">
                {eraseMutation.error?.message}
              </div>
            )}
            {eraseMutation.isSuccess && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-sm text-success">
                All data has been erased successfully.
              </div>
            )}

            <button
              onClick={() => eraseMutation.mutate(eraseForm)}
              disabled={
                eraseMutation.isPending ||
                eraseForm.confirmation !== "ERASE" ||
                !eraseForm.password
              }
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-error text-white font-bold rounded-lg hover:bg-error/90 transition-all text-sm shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {eraseMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Erasing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">delete_forever</span>
                  Erase All Data
                </>
              )}
            </button>
          </div>

          {/* Card 2: Delete Organization */}
          <div className="bg-surface-container-lowest rounded-xl border-2 border-error/30 p-6 md:p-8 shadow-sm space-y-4">
            <div>
              <h4 className="font-display text-base font-bold text-on-surface">
                Delete Organization
              </h4>
              <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                Permanently delete your entire organization including all data, users, and settings.
                This action cannot be undone.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={deleteForm.password}
                  onChange={(e) => setDeleteForm((f) => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                  className="w-full h-[44px] px-4 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:ring-2 focus:ring-error focus:border-transparent transition-all"
                  placeholder="Enter your password"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Type <span className="font-mono text-error">DELETE ORGANIZATION</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteForm.confirmation}
                  onChange={(e) => setDeleteForm((f) => ({ ...f, confirmation: e.target.value }))}
                  autoComplete="off"
                  className="w-full h-[44px] px-4 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:ring-2 focus:ring-error focus:border-transparent transition-all font-mono"
                  placeholder="Type DELETE ORGANIZATION"
                />
              </div>
            </div>

            {deleteOrgMutation.isError && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-3 text-sm text-error">
                {deleteOrgMutation.error?.message}
              </div>
            )}

            <button
              onClick={() => deleteOrgMutation.mutate(deleteForm)}
              disabled={
                deleteOrgMutation.isPending ||
                deleteForm.confirmation !== "DELETE ORGANIZATION" ||
                !deleteForm.password
              }
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-error text-white font-bold rounded-lg hover:bg-error/90 transition-all text-sm shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {deleteOrgMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">dangerous</span>
                  Delete Organization
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
