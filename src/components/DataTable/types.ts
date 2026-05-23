export type FilterType = "text" | "date-range" | "select";

export type FilterOption = { label: string; value: string };

export type ColumnDef<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: FilterType;
  filterOptions?: FilterOption[];
  filterParam?: string;
  render: (row: T) => React.ReactNode;
  hideOnMobile?: boolean;
  className?: string;
};

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

export type SortDir = "asc" | "desc";

export type DataTableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onFilterChange: (params: URLSearchParams) => void;
  onSortChange?: (key: string, dir: SortDir) => void;
  loading?: boolean;
  emptyMessage?: string;
  mobileCard: (row: T) => React.ReactNode;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  sortBy?: string;
  sortDir?: SortDir;
  activeFilters?: ActiveFilter[];
};
