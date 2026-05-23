"use client";

import { useState, useRef, useEffect } from "react";
import type { ColumnDef, FilterType, FilterOption } from "./types";

interface FilterPopoverProps<T> {
  column: ColumnDef<T>;
  currentValue: string;
  onApply: (key: string, value: string) => void;
  onClear: (key: string) => void;
}

export default function FilterPopover<T>({
  column,
  currentValue,
  onApply,
  onClear,
}: FilterPopoverProps<T>) {
  const [open, setOpen] = useState(false);
  const [localValue, setLocalValue] = useState(currentValue || "");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filterType: FilterType = column.filterType || "text";
  const paramKey = column.filterParam || column.key;

  function handleApply() {
    if (filterType === "date-range") {
      const parts: string[] = [];
      if (dateFrom) parts.push(`date_from=${dateFrom}`);
      if (dateTo) parts.push(`date_to=${dateTo}`);
      onApply(paramKey, parts.join("&"));
    } else if (filterType === "select") {
      onApply(paramKey, localValue);
    } else {
      onApply(paramKey, localValue);
    }
    setOpen(false);
  }

  function handleClear() {
    setLocalValue("");
    setDateFrom("");
    setDateTo("");
    onClear(paramKey);
    setOpen(false);
  }

  const hasFilter = !!currentValue;

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`p-0.5 rounded transition-colors ${
          hasFilter
            ? "text-tertiary"
            : "text-outline hover:text-secondary"
        }`}
        aria-label={`Filter ${column.label}`}
      >
        <span className="material-symbols-outlined text-[16px]">
          filter_list
        </span>
      </button>

      {open && (
        <div className="absolute top-6 left-0 z-50 mt-1 w-56 bg-white border border-outline-variant rounded-lg shadow-lg p-3 space-y-3">
          <p className="text-[11px] font-bold uppercase text-secondary tracking-wider">
            Filter {column.label}
          </p>

          {filterType === "text" && (
            <input
              type="text"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              placeholder={`Search ${column.label.toLowerCase()}...`}
              className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-tertiary/30 focus:border-tertiary"
              autoFocus
            />
          )}

          {filterType === "date-range" && (
            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-tertiary/30 focus:border-tertiary"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-tertiary/30 focus:border-tertiary"
                />
              </div>
            </div>
          )}

          {filterType === "select" && column.filterOptions && (
            <select
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-tertiary/30 focus:border-tertiary bg-white"
            >
              <option value="">All</option>
              {column.filterOptions.map((opt: FilterOption) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 text-xs font-medium text-secondary hover:bg-surface-container-low rounded-md transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-3 py-1.5 text-xs font-medium bg-tertiary text-white rounded-md hover:bg-tertiary/90 transition-colors ml-auto"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
