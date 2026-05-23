export type ColumnDef<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  render: (row: T) => React.ReactNode;
  hideOnMobile?: boolean;
  className?: string;
};

export type SortDir = "asc" | "desc";

export type DataTableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onSortChange?: (key: string, dir: SortDir) => void;
  loading?: boolean;
  emptyMessage?: string;
  mobileCard: (row: T) => React.ReactNode;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  sortBy?: string;
  sortDir?: SortDir;
};
