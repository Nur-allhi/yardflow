"use client";

import type { DataTableProps, SortDir } from "./types";

function SortIcon({ dir, active }: { dir: SortDir; active: boolean }) {
  return (
    <span
      className={`material-symbols-outlined text-[14px] transition-opacity ${
        active ? "text-tertiary" : "text-outline opacity-40"
      }`}
    >
      {dir === "asc" ? "arrow_upward" : "arrow_downward"}
    </span>
  );
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onSortChange,
  loading = false,
  emptyMessage = "No data found",
  mobileCard,
  page,
  totalPages,
  onPageChange,
  sortBy,
  sortDir,
}: DataTableProps<T>) {

  function handleSort(colKey: string) {
    if (!onSortChange) return;
    const isAsc = sortBy === colKey && sortDir === "asc";
    onSortChange(colKey, isAsc ? "desc" : "asc");
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-10 bg-surface-container-high rounded-lg" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 bg-surface-container-high rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white border border-outline-variant/30 rounded-xl shadow-sm overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-container-high border-b border-outline-variant">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 md:px-6 py-3 text-[10px] font-bold uppercase text-secondary tracking-wider ${
                    col.sortable ? "cursor-pointer select-none" : ""
                  } ${col.className || ""}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    {col.sortable && (
                      <SortIcon
                        dir="asc"
                        active={sortBy === col.key && sortDir === "asc"}
                      />
                    )}
                    {col.sortable && (
                      <SortIcon
                        dir="desc"
                        active={sortBy === col.key && sortDir === "desc"}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-secondary text-sm"
                >
                  <span className="material-symbols-outlined text-3xl block mb-2 text-outline-variant">
                    database
                  </span>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className="hover:bg-background transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 md:px-6 py-3 md:py-4 text-sm ${
                        col.className || ""
                      } ${col.hideOnMobile ? "hidden md:table-cell" : ""}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden divide-y divide-outline-variant/10">
        {data.length === 0 ? (
          <div className="p-8 text-center text-secondary text-sm">
            <span className="material-symbols-outlined text-3xl block mb-2 text-outline-variant">
              database
            </span>
            {emptyMessage}
          </div>
        ) : (
          data.map((row) => (
            <div key={keyExtractor(row)} className="p-4">
              {mobileCard(row)}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-t border-outline-variant/20">
          <button
            type="button"
            onClick={() => onPageChange((page || 1) - 1)}
            disabled={!page || page <= 1}
            className="px-3 py-1.5 text-xs font-medium text-secondary hover:bg-surface-container-low rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-secondary">
            Page {page || 1} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange((page || 1) + 1)}
            disabled={!page || page === totalPages}
            className="px-3 py-1.5 text-xs font-medium text-secondary hover:bg-surface-container-low rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
