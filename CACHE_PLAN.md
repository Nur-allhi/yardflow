# Caching & Data Fetching Layer — Implementation Plan

## 1. Problem

Every page uses raw `fetch()` inside `useEffect` with manual `useState` for loading/error/data. There is zero client-side caching: navigating away and back re-fetches everything, even if data hasn't changed. Duplicate API calls (e.g., `/api/accounts` on 6+ pages) fire independently.

**Current pattern (repeated ~30 times):**
```tsx
const [data, setData] = useState<…>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const loadData = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch("/api/something");
    if (!res.ok) throw new Error("…");
    setData(await res.json());
  } catch (e) { setError(…); }
  finally { setLoading(false); }
}, […]);

useEffect(() => { loadData(); }, [loadData]);
```

## 2. Proposed Solution: TanStack React Query v5

| Requirement | How RQ solves it |
|---|---|
| Cache between navigations | `staleTime` + `gcTime` — cached data shows instantly, background refetch happens silently |
| Request deduplication | Two components calling `useQuery({ queryKey: ['accounts'] })` share one request |
| Loading/error/data boilerplate | `useQuery` returns `{ data, isLoading, error }` — no manual `useState` |
| Mutations (POST/PUT/DELETE) | `useMutation` with `onSuccess` → `queryClient.invalidateQueries()` |
| Background refresh | `refetchInterval` or `staleTime` + focus refetching |
| Paginated lists | `useQuery` with filter params in queryKey — re-fetches when filters change |
| DevTools | Built-in ReactQueryDevTools for debugging |

## 3. Installation

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

No other dependencies needed.

## 4. Architecture Overview

```
pages/components
    │
    ▼
useQuery(queryKey, fetcher, options)  ← TanStack Query
    │
    ▼
fetcher fn → fetch() → API Route → DB
    │
    ▼
queryClient cache (staleTime=5min, gcTime=30min)
    │
    ▼
    1. Hit cache → instant render (even if stale)
    2. If stale → background refetch → update UI
    3. If gc expired → show loading skeleton → fetch
```

## 5. Provider Setup (1 file, ~10 lines)

Add `QueryClientProvider` to the dashboard layout. This takes **~10 minutes** and is the only structural change needed.

**`src/app/(dashboard)/layout.tsx`** — wrap children:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 min — data considered fresh
      gcTime: 30 * 60 * 1000,      // 30 min — keep in cache after unmount
      retry: 1,
      refetchOnWindowFocus: false,  // disable for now (can enable later)
    },
  },
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      …existing layout…
    </QueryClientProvider>
  );
}
```

## 6. Migration Strategy

### 6.1 Global Shared Data Hooks (DRY)

Create custom hooks for the most-requested endpoints to eliminate duplication:

**`src/hooks/useAccounts.ts`**
```tsx
import { useQuery } from "@tanstack/react-query";

async function fetchAccounts() {
  const res = await fetch("/api/accounts");
  if (!res.ok) throw new Error("Failed to load accounts");
  return res.json();
}

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });
}
```

Create similar hooks for: `useCategories`, `useSubtypes(categoryId?)`, `useVendors`, `useCustomers`, `useConsumables(page?)`, etc.

**Total hooks needed: ~12**

### 6.2 Pattern: List Page (e.g., Sales → `sales/page.tsx`)

**Before (68 lines of boilerplate):**
```tsx
export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  // …filters, buildUrl, loadData, useEffect…
}
```

**After (~15 lines):**
```tsx
export default function SalesPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({…});

  const queryString = new URLSearchParams({ …filters, page: String(page), limit: "15" }).toString();

  const { data, isLoading, error } = useQuery({
    queryKey: ["sales", queryString],
    queryFn: async () => {
      const [salesRes, custRes] = await Promise.all([
        fetch(`/api/sales?${queryString}`),
        fetch("/api/sales/customers"),
      ]);
      if (!salesRes.ok) throw new Error("Failed to load sales");
      return {
        sales: (await salesRes.json()).sales ?? [],
        summary: (await salesRes.json()).summary ?? null,
        totalCount: (await salesRes.json()).total_count ?? 0,
        customers: custRes.ok ? await custRes.json() : [],
      };
    },
  });

  // Filter changes → queryKey changes → automatic refetch, no manual loadData()
  // isLoading/error replace manual loading/error states
  // data is cached — back-navigation is instant
}
```

### 6.3 Pattern: Form Page (Dropdown Data)

**Before:**
```tsx
useEffect(() => {
  fetch("/api/accounts").then(r => r.json()).then(setAccounts);
  fetch("/api/inventory/categories").then(r => r.json()).then(setCategories);
}, []);
```

**After:**
```tsx
const { data: accounts } = useAccounts();
const { data: categories } = useCategories();
// Cached globally — switching forms doesn't refetch
// `accounts` is undefined while loading, array when ready
```

### 6.4 Pattern: Mutations (POST/PUT/DELETE)

**Before (no cache invalidation):**
```tsx
const res = await fetch("/api/sales", { method: "POST", body: JSON.stringify(data) });
router.push("/sales"); // → re-fetches everything from scratch
```

**After (targeted cache invalidation):**
```tsx
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: (data) => fetch("/api/sales", { method: "POST", body: JSON.stringify(data) }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["sales"] });     // refresh list
    queryClient.invalidateQueries({ queryKey: ["accounts"] });  // refresh balances
    router.push("/sales");
  },
});
```

### 6.5 Pattern: Detail Page (`[id]`)

**Before:**
```tsx
useEffect(() => {
  fetch(`/api/sales/${id}`).then(r => r.json()).then(setSale);
}, [id]);
```

**After:**
```tsx
const { data: sale, isLoading } = useQuery({
  queryKey: ["sale", id],
  queryFn: async () => {
    const res = await fetch(`/api/sales/${id}`);
    if (!res.ok) throw new Error("Failed to load sale");
    return res.json();
  },
  enabled: !!id,
});
```

## 7. File-by-File Migration Order

| Phase | Files | Est. Time | Impact |
|---|---|---|---|
| **0. Setup** | `layout.tsx` + `src/hooks/useAccounts.ts` + `src/hooks/useCategories.ts` | 30 min | Foundation |
| **1. Shared hooks** | `useSubtypes`, `useVendors`, `useCustomers`, `useConsumables`, `useWorkers` | 1 hr | DRY shared data |
| **2. List pages** | `sales/page`, `purchases/page`, `inventory/consumables/page`, `inventory/ledger/page`, `inventory/scrap/page`, `accounts/page`, `hr/workers/page`, `hr/payroll/page`, `reports/page` | 3 hr | Biggest UX win |
| **3. Detail pages** | `sales/[id]`, `purchases/[id]`, `accounts/[id]`, `hr/workers/[id]`, `reports/[id]`, `sales/customers/[id]`, `purchases/vendors/[id]` | 2 hr | Instant back-nav |
| **4. Form pages** | `sales/new`, `sales/new/quick`, `purchases/new`, `sales/scrap/new`, `accounts/new`, `accounts/deposit`, `accounts/transfer`, `hr/workers/new`, `hr/advances/new`, `settings/team`, `settings/page`, `inventory/consumables/use` | 2 hr | Dropdown data cached |
| **5. Mutations** | All POST/PUT/DELETE handlers → `useMutation` + `invalidateQueries` | 2 hr | Targeted refresh |
| **Total** | **~30 files** | **~10.5 hr** | |

## 8. Caching Strategy

| Data Type | staleTime | gcTime | Refetch Behavior |
|---|---|---|---|
| **Dropdown lists** (accounts, categories, subtypes, vendors, customers) | 10 min | 30 min | Only on explicit invalidation after mutation |
| **List pages** (sales, purchases, inventory, etc.) | 3 min | 15 min | Background refresh when user returns |
| **Detail pages** (`[id]`) | 2 min | 15 min | Background refresh on navigation |
| **Dashboard KPIs** (summary, balances) | 30 sec | 5 min | More frequent since they show "current" |

## 9. Edge Cases & Error Handling

| Case | Handling |
|---|---|
| **401 / session expired** | Create a fetch wrapper that catches 401 and redirects to login |
| **Optimistic updates** | Payments/creates can use `onMutate` for instant UI |
| **Pagination** | Include page in queryKey — each page cached separately |
| **Search / filters** | Include search string in queryKey — previous filters remain cached |
| **Concurrent mutations** | Use `useMutation` with `mutationKey` to prevent double-submit |

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Large refactor** → regression | Do it file-by-file, verify after each file |
| **staleTime too long** → user sees old data | Start conservative (3–5 min), adjust based on feedback |
| **Memory from cached data** | `gcTime: 30 min` is fine for this data size (< 1 MB total) |
| **Learning curve for team** | Pattern is simple and consistent — all hooks look the same |

## 11. Rollout

1. **Setup provider + 2 shared hooks** → verify no regression
2. **Convert 1 list page (sales)** → test full workflow
3. **Convert remaining list pages** → batch by module
4. **Convert detail + form pages** → batch by module
5. **Add mutation invalidation** → final pass

After completion: delete all manual `useState` loading/error patterns. The codebase shrinks by **~40% per page** (avg 30 lines of boilerplate removed per file).
