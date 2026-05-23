# Error Log — UI Polish Test Session

## 1. [WARNING] Unsupported `viewport` in metadata export
- **File**: Every layout/page that has `metadata` with `viewport`
- **Root Layout**: `src/app/layout.tsx`
- **Other pages**: `/login`, `/register`, `/settings`, `/settings/team`, `/accounts`, `/accounts/new`, `/purchases`, `/purchases/vendors`, `/sales`, `/sales/customers`, `/inventory`
- **Issue**: Next.js 15 deprecated `viewport` inside `metadata` export. Must use separate `viewport` export.
- **Log**: `⚠ Unsupported metadata viewport is configured in metadata export in /login. Please move it to viewport export instead.`
- **Severity**: Warning (will become error in future Next.js versions)
- **Status**: FIXED — moved `viewport` from `metadata` export to separate `viewport` export in `src/app/layout.tsx`

## 2. [BUG 500] Sales API — invalid enum value `"all"`
- **File**: `src/app/api/sales/route.ts`
- **Issue**: Frontend sends `?status=all` as filter, but PostgreSQL enum `payment_status` has no value `'all'`. Causes `22P02` invalid input value error.
- **Log**:
  ```
  Error fetching sales: [Error [PostgresError]: invalid input value for enum payment_status: "all"] {
    code: '22P02',
    routine: 'enum_in'
  }
  GET /api/sales?status=all&page=1&limit=15 500
  ```
- **Repro**: Click "All" filter tab on Sales list page
- **Severity**: HIGH — breaks the sales list filter
- **Status**: FIXED — added `status !== "all"` guard before pushing to filter conditions in `src/app/api/sales/route.ts:46`

## 4. [FIXED] Inconsistent `formatMoney` between sales and purchases pages
- **Files**: `src/app/(dashboard)/sales/page.tsx` and `src/app/(dashboard)/purchases/page.tsx`
- **Issue**: Sales defined `formatMoney` as `n.toLocaleString("en-IN") + " tk"` (e.g. "1,23,456 tk"), while Purchases defined it as `"৳" + n.toLocaleString("en-IN")` (e.g. "৳1,23,456"). The two pages showed different currency formats on their summary cards.
- **Fix**: Unified both to `"1,23,456 tk"` (tk suffix) to match CONTEXT.md convention.

## 3. [BUG 500] Multiple API endpoints — DB timeout
- **Endpoints affected**:
  - `GET /api/accounts` (10s+ response → 500)
  - `GET /api/purchases/vendors` (10s+ → 500)
  - `GET /api/purchases?page=1&limit=10` (10s+ → 500)
  - `GET /api/sales/customers` (10s+ → 500)
  - `GET /api/sales/customers/{id}` (10s+ → 500)
  - `GET /api/sales?page=1&limit=15` (10s+ → 500)
- **Issue**: Consistent 10+ second response times followed by 500. Likely DB query timeout or connection pool exhaustion. Only occurs on some requests while others complete instantly.
- **Severity**: HIGH — intermittent but breaks core features randomly
- **Observed during 2026-05-23 testing**: `AggregateError: ETIMEDOUT` on `GET /api/accounts/{id}` — confirmed still active
- **Status**: MITIGATED — added database indexes on `organization_id` and join columns across all 23 tables (`migration 0006`) to speed up multi-tenant queries and reduce connection hold time
