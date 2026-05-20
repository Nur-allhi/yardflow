# Error Log

## FIXED - 2026-05-20

### Bug 1: Workers page crash — `formatMoney(undefined)`
- **Root cause**: API returns `monthly_payroll` but page expected `total_monthly_payroll` (field name mismatch). Also `formatMoney(n)` crashed when `n` was undefined.
- **Fix**: Updated Summary interface to match API field names. Added `(n ?? 0)` fallback in `formatMoney` across all HR pages.

### Bug 2: Inventory page 500 — hardcoded `localhost:3000` in server component fetch
- **Root cause**: Server component used `process.env.NEXT_PUBLIC_URL || "http://localhost:3000"` to fetch stock data. Failed on any other port.
- **Fix**: Replaced HTTP fetch with direct DB queries (proper Next.js server component pattern).

### Bug 3: HR page 404 at /hr
- **Root cause**: No `page.tsx` at `/hr` — sidebar linked to `/hr` but only sub-routes existed.
- **Fix**: Created `src/app/(dashboard)/hr/page.tsx` with `redirect("/hr/workers")`.

### Bug 4: Sales API 500 Error on GET /api/sales
- **Root cause 1**: Raw SQL field `total_kg` in subquery missing `.as('alias')`
- **Root cause 2**: `Date` object passed into `sql` template literal
- **Root cause 3**: GET handler lacked try-catch
- **Fix**: Added `.as('total_kg')`, converted Date to ISO string, added try-catch wrapper.

---

## Test Results (2026-05-20)

### All API endpoints — 200 OK (20/20)
- Auth: login, logout
- Inventory: categories, subtypes, stock, ledger, scrap, consumables
- HR: workers, advances, payroll
- Sales: list, customers
- Purchases: list, vendors
- Accounts: list, transactions
- Reports: list, generate (POST 201)
- Settings: org, team

### All pages — 200 OK (21/21)
- Dashboard, Inventory + 5 sub-pages, Purchases + vendors, Sales + customers, HR (redirect) + workers + payroll + advances, Accounts + transfer, Reports + generate, Settings + team
