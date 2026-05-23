# DataTable Plan — Reusable Filtered Table Component

## Goal
Replace ad-hoc table rendering across the app with a reusable `<DataTable>` component that provides per-column filters, sorting, pagination, and a consistent mobile card view.

---

## 1. Component Design

### Props

```tsx
type ColumnDef<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;          // default: true
  filterType?: "text" | "date-range" | "select";
  filterOptions?: { label: string; value: string }[];
  filterParam?: string;          // API query param (defaults to key)
  render: (row: T) => React.ReactNode;
  hideOnMobile?: boolean;
};

type DataTableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onFilterChange: (params: URLSearchParams) => void;
  onSortChange?: (key: string, dir: "asc" | "desc") => void;
  loading?: boolean;
  emptyMessage?: string;
  mobileCard: (row: T) => React.ReactNode;
  // Server-side pagination
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
};
```

### Filter UI per column

| filterType | Control | API param example |
|---|---|---|
| `"text"` | Search input (with debounce) | `?item_name__like=rod` |
| `"date-range"` | From/To date inputs | `?date_from=2026-05-01&date_to=2026-05-23` |
| `"select"` | Dropdown (single) | `?status=paid` |
| *(default)* | Falls back to text search | `?field__like=value` |

Filter controls appear in a popover/pill when user clicks the filter icon next to each column header.

### Active filters display
A horizontal chip bar showing all active filters with an "×" to remove each:

```
[Status: Paid ×] [Date: May 2026 ×] [Clear All]
```

### Mobile
On screens <md, the table is hidden and `mobileCard` renders each row as a card instead.

---

## 2. Pages to Migrate (in order)

| # | Page | File | Tables | Current filters | Effort |
|---|------|------|--------|----------------|--------|
| 1 | **Account Detail** | `accounts/[id]/page.tsx` | Transaction history | None | Small |
| 2 | **Accounts List** | `accounts/page.tsx` | Recent transactions | None | Small |
| 3 | **Sales List** | `sales/page.tsx` | Sales table | status, date, customer, search | Medium |
| 4 | **Purchases List** | `purchases/page.tsx` | Purchases table | status, date, vendor, search | Medium |
| 5 | **Customers List** | `sales/customers/page.tsx` | Customers table | Search only | Small |
| 6 | **Vendors List** | `purchases/vendors/page.tsx` | Vendors table | Search only | Small |
| 7 | **Customer Detail** | `sales/customers/[id]/page.tsx` | Sale history + payment history | None | Medium |
| 8 | **Vendor Detail** | `purchases/vendors/[id]/page.tsx` | Purchase history + payment history | None | Medium |
| 9 | **Inventory** | `inventory/page.tsx` | Category stock table | Category | Small |
| 10 | **Inventory Ledger** | `inventory/ledger/page.tsx` | Stock ledger entries | Subtype | Small |
| 11 | **Workers** | `hr/workers/page.tsx` | Workers table | None | Small |
| 12 | **Consumables** | `inventory/consumables/page.tsx` | Purchases + consumption | None | Medium |

---

## 3. API Convention

Each API route that serves a list endpoint should accept:

| Param | Type | Applied when |
|-------|------|-------------|
| `{field}__like` | string | Column has text filter active |
| `{field}` | string | Column has select filter active |
| `date_from` | ISO date | Date filter "from" is set |
| `date_to` | ISO date | Date filter "to" is set |
| `page` | int | Pagination |
| `limit` | int | Pagination |
| `sort_by` | string | Sort column |
| `sort_dir` | "asc" \| "desc" | Sort direction |

Not all APIs need to support all params immediately — each page's migration includes wiring its API.

---

## 4. DataTable Component Structure

```
src/components/DataTable/
├── index.tsx          ← Main component (default export)
├── types.ts           ← ColumnDef, FilterState, etc.
├── FilterPopover.tsx  ← Per-column filter popover/pill
├── ActiveFilters.tsx  ← Active filter chips bar
└── MobileCard.tsx     ← Mobile card wrapper
```

Or a single file if the component isn't too large.

---

## 5. Migration Steps (per page)

1. Define `columns: ColumnDef<T>[]` array
2. Replace `<table>...</table>` with `<DataTable columns={columns} data={...} ... />`
3. Add `onFilterChange` handler that refetches with params
4. Add `mobileCard` render function (often already exists)
5. Wire API to accept the filter params (if not already supported)
6. Remove old filter state + filter UI (replaced by DataTable's built-in controls)

---

## 6. Edge Cases & Considerations

- **Debounced text search**: Text filters should debounce 300ms
- **URL-synced filters**: Optionally sync filters to URL search params
- **Empty state**: Show `emptyMessage` when data is empty (not loading)
- **Loading state**: Skeleton rows when `loading=true`
- **Error state**: Handled by parent page's existing error handling
- **Column visibility**: Some columns hide on mobile via `hideOnMobile`
- **Initial load**: All filters start empty — shows all data

---

## 7. Risks

| Risk | Mitigation |
|------|-----------|
| Per-column filter popovers are complex UI | Start with 3 filter types only; iterate |
| Mobile card layout hard to genericize | Keep `mobileCard` as render prop — page owns card design |
| Existing table styling differs per page | DataTable enforces consistent design (desired outcome) |
| API routes need individual updates | Each migration includes its API wiring — incremental |

---

## 8. Open Questions

1. **Filter UI style**: Per-column filter icons (click → popover) or a dedicated filter bar at the top?
2. **Mobile**: Keep `mobileCard` as a render prop, or provide a default mobile card layout too?
3. **Priority**: Of the 12 pages listed, which 2-3 matter most to you?
