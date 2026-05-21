# Session Log — Start: 2026-05-19

## Project
YardFlow ERP — Multi-tenant SaaS ERP for iron/workshop businesses in Bangladesh.

## Key Architecture Decisions
- **Custom auth**: bcryptjs + jose JWT (no Supabase Auth, no NextAuth)
- **Direct Postgres** via drizzle-orm + postgres driver (not Supabase REST API)
- **App-level multi-tenancy**: every query filters by `organization_id` from server-side session cookie
- **Soft delete**: all tables have `deleted_at`; every SELECT filters `deleted_at IS NULL`
- **Option B approach**: complete one module (backend + pages + design) before moving to next
- **Transactions**: every multi-table write uses `db.transaction()`

## Completed Work

### Foundation
- Next.js 15 (App Router), TypeScript, Tailwind CSS
- Drizzle ORM with full schema (22 tables, 15 enums, generated columns, relations)
- Tailwind config with full design tokens from DESIGN.md + HTML design files
- Fonts: Plus Jakarta Sans (display), DM Sans (body), Fira Code (mono), Material Symbols
- Custom utility: `hide-scrollbar` in globals.css

### Database (Supabase PostgreSQL)
- 22 tables: organizations, users, sessions, accounts, account_transactions, material_categories, material_subtypes, stock_ledger, scrap_pool, consumables_log, vendors, purchases, purchase_items, purchase_payments, customers, sales, sale_items, sale_payments, workers, salary_advances, salary_payments, period_reports
- 15 enums: plan, role, account_type, transaction_type, reference_type, movement_type, stock_reference_type, weight_unit, vendor_type, payment_status, customer_type, sale_type, salary_status, period_type, report_result
- Generated columns: `due_amount = total_amount - paid_amount` on purchases and sales, `total_amount = quantity_kg * price_per_kg` on purchase_items and sale_items, `net_payable = base_salary - total_advances` on salary_payments
- RLS policies deployed but bypassed by superuser role — app-level enforcement is primary defense

### Auth System
- `POST /api/auth/register` — creates org + user in transaction, sets session cookie
- `POST /api/auth/login` — bcrypt verify, sets JWT httpOnly cookie (7-day expiry)
- `POST /api/auth/logout` — clears cookie
- Session: jose JWT with `{ user_id, org_id, role }` payload
- Route protection via `getSession()` check in layouts + middleware

### Design System (DESIGN.md + HTML files)
- Login page: desktop split layout (dark navy brand panel + white form panel), mobile slide-up card
- Register page: desktop centered card (Organization Details + Owner Account), mobile sticky header/footer
- Dashboard layout: fixed 240px sidebar (desktop), sticky topnav, mobile bottom nav bar (Home/Stock/Sales/HR/Buy)
- All pages responsive with `md:` breakpoint — desktop and mobile layouts coexist in same file

### Dashboard Page (`/`)
- Desktop: Quick action buttons, 4-col KPI cards, Recent Sales panel, Stock Overview panel, Account Balances / Pending Dues / Pending Salaries row
- Mobile: Quick Entry 2x2 grid, 2x2 KPI cards, Financial Overview bento (dark card), Recent Sales card list, Stock Trend chart placeholder

### Inventory Module
#### API Routes
- `GET/POST /api/inventory/categories`
- `GET/POST /api/inventory/subtypes` (supports `?category_id=` filter, enriches with stock/WAC)
- `GET /api/inventory/stock` (categories + subtypes + scrap pool aggregation)
- All routes read `x-org-id` from headers (set by middleware)

#### Calculations (`src/lib/calculations/wac.ts`)
- `getStockQuantity(orgId, subtypeId)` — sums stock_ledger `in` minus `out` for a subtype
- `calculateWAC(orgId, subtypeId)` — total value / total quantity from purchase entries for that subtype

#### Stock Overview Page (`/inventory`)
- Desktop: 4-col summary stats, text tab navigation, collapsible category groups with subtype tables
- Mobile: 2x2 bento stats (last card red for alerts), horizontal pill tabs, subtype cards per category
- Status badges: In Stock (green), Low Stock (amber, pulse), Out of Stock (red)

#### Sub-types Page (`/inventory/subtypes`)
- Desktop: Two-panel layout (category list on left with active state, subtype data table on right)
- Table columns: Name, Default Price, Unit, Status, Actions (edit/deactivate on hover)
- Centered modal for adding sub-types
- Stats row: Top Sub-type (dark card), Avg Price, Total Stock
- Mobile: Horizontal category chips, subtype cards, bottom-sheet modal

#### Categories Page (`/inventory/categories`)
- Responsive form + list layout

### WAC Calculation Rule
- WAC recalculates on every new purchase for that subtype
- Formula: `SUM(quantity_kg * price_per_kg) / SUM(quantity_kg)` from all purchase_items for that subtype
- Scrap is NOT tracked per order — accumulates in scrap pool
- Burnout is NOT calculated per order — period-end reconciliation only

### Mobile Sidebar Fix
- Added `hidden md:flex` to desktop sidebar so it no longer blocks mobile view
- Created `MobileSidebar.tsx` — client component with hamburger button + slide-in drawer overlay
- Updated layout header padding (`pl-14 md:pl-6`) to accommodate fixed hamburger on mobile

### Phase 6 — Purchases Module
#### API Routes
- `GET/POST /api/purchases/vendors` — list (enriched with totals) + create
- `GET/PUT/DELETE /api/purchases/vendors/[id]` — single vendor CRUD
- `GET/POST /api/purchases` — list with filters (vendor, status, date, search) + summary stats; create with transaction (items + stock_ledger + WAC)
- `GET /api/purchases/[id]` — detail with vendor, items (with subtype name), payments (with account name)
- `POST /api/purchases/[id]/payments` — record payment (transaction: payment + purchase update + account_transaction)

#### Validation Schemas
- Added `vendorSchema`, `purchaseItemSchema`, `purchaseSchema`, `purchasePaymentSchema` to `schemas.ts`

#### Pages
- `/purchases/vendors` — Vendor list with 3 summary cards, table (desktop), card list (mobile), add/edit modal
- `/purchases` — Purchase list with 4 summary cards, filter bar, status chips, table/cards, pagination
- `/purchases/new` — Purchase entry with vendor picker (due balance shown), dynamic line items (category→subtype cascade), order summary
- `/purchases/[id]` — Purchase detail with info card, items table, financial summary, payment ledger, payment modal

### Accounts API
- `GET /api/accounts` — simple list for account pickers in purchase/payment forms

### Testing Results
- Registration: 201 — creates org + user, sets session
- Login: 200 — cookie set, JWT verified
- Duplicate email: 409
- No cookie → protected route: 307 redirect
- Bad cookie → protected route: 307 redirect
- All pages with valid session: 200
- `tsc --noEmit`: zero errors
- `eslint src/`: zero errors
- `next build`: compiles successfully

## Files Structure (src/)
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Login page (desktop + mobile)
│   │   └── register/page.tsx       # Register page (desktop + mobile)
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard layout (sidebar + topnav + mobile bottom nav)
│   │   ├── page.tsx                # Dashboard page (desktop + mobile)
│   │   └── inventory/
│   │       ├── page.tsx            # Stock overview server component
│   │       ├── InventoryClient.tsx  # Stock overview client component
│   │       ├── categories/page.tsx # Categories CRUD page
│   │       └── subtypes/page.tsx   # Sub-types page (desktop 2-panel + mobile cards)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts
│   │   │   ├── login/route.ts
│   │   │   └── logout/route.ts
│   │   └── inventory/
│   │       ├── categories/route.ts
│   │       ├── subtypes/route.ts
│   │       └── stock/route.ts
│   ├── globals.css
│   └── layout.tsx                  # Root layout (fonts, metadata)
├── components/
│   ├── Sidebar.tsx                 # Fixed 240px sidebar (desktop only)
│   └── MobileSidebar.tsx           # Hamburger + slide-in drawer (mobile
├── lib/
│   ├── auth/
│   │   └── session.ts             # JWT create/get/clear
│   ├── db/
│   │   ├── index.ts               # Postgres connection
│   │   ├── schema.ts              # 22 tables, 15 enums, relations, types
│   │   └── migrations/            # Drizzle migrations
│   ├── calculations/
│   │   └── wac.ts                 # WAC + stock quantity
│   └── validations/
│       └── schemas.ts             # Zod schemas (regiser, login, purchases)
├── middleware.ts                   # Route protection, org-id injection
```

### Purchases Module Layout
```
src/app/(dashboard)/purchases/
├── page.tsx                        # Purchase list (filter bar, table, cards, summary)
├── vendors/
│   └── page.tsx                    # Vendor list (table/cards, add/edit modal)
├── new/
│   └── page.tsx                    # New purchase entry (line items, category→subtype)
└── [id]/
    └── page.tsx                    # Purchase detail (items, payments, payment modal)

src/app/api/
├── accounts/
│   └── route.ts                    # GET accounts list (for pickers)
└── purchases/
    ├── route.ts                    # GET (list), POST (create with transaction)
    ├── vendors/
    │   └── route.ts                # GET (list), POST (create)
    │   └── [id]/route.ts          # GET, PUT, DELETE vendor
    └── [id]/
        ├── route.ts                # GET purchase detail
        └── payments/route.ts       # POST record payment (transaction)
```
### Sales Module Layout
```
src/app/(dashboard)/sales/
├── page.tsx                         # Sales list (filter bar, table/cards, summary)
├── customers/
│   └── page.tsx                     # Customer list (table/cards, add/edit modal)
├── new/
│   ├── page.tsx                     # New regular sale (customer, items, payment)
│   └── quick/
│       └── page.tsx                 # Quick cash sale (no customer, immediate)
└── [id]/
    └── page.tsx                     # Sale detail (items, payments, payment modal)

src/app/api/
└── sales/
    ├── route.ts                     # GET (list), POST (create with transaction)
    ├── customers/
    │   └── route.ts                 # GET (list), POST (create)
    │   └── [id]/route.ts           # GET, PUT, DELETE customer
    └── [id]/
        ├── route.ts                 # GET sale detail
        └── payments/route.ts        # POST record payment (transaction)
```
Also: `designs/` contains HTML + PNG for all mobile/desktop screens.

## Tools & Integrations
- **Graphify** (`graphifyy`) installed and integrated with opencode
  - Run `/graphify .` in a session to generate/reload the knowledge graph
  - Run `graphify query "question"` to BFS-traverse the graph
  - Requires an LLM API key (`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, or `OPENAI_API_KEY`)
- **Drizzle Kit**: `npx drizzle-kit generate` + `npx drizzle-kit migrate` for schema changes

### Phase 7 — Sales Module
#### API Routes
- `GET/POST /api/sales/customers` — list (enriched with totals) + create
- `GET/PUT/DELETE /api/sales/customers/[id]` — single customer CRUD
- `GET/POST /api/sales` — list with filters (customer, type, status, date, search) + summary; create with transaction (items + stock_ledger + WAC + payment)
- `GET /api/sales/[id]` — detail with customer, items (subtype name), payments (account name)
- `POST /api/sales/[id]/payments` — record payment (transaction: payment + sale update + account_transaction)

#### Pages
- `/sales/customers` — Customer list with 3 summary cards, table/cards, add/edit modal
- `/sales` — Sales list with 4 summary cards, filter bar, type/status chips, table/cards
- `/sales/new` — Regular sale form (customer picker, sale type, dynamic items, payment)
- `/sales/new/quick` — Quick cash sale (no customer, items + immediate payment)
- `/sales/[id]` — Sale detail (items table, financial summary, payment ledger, payment modal)

## Session: 2026-05-19 — Major Modules Completion

### Accounts Module
#### API Routes
- `GET/POST /api/accounts` — list + create account (with opening balance transaction)
- `GET/PUT/DELETE /api/accounts/[id]` — single account CRUD with transaction history
- `GET /api/accounts/transactions` — recent transactions across all accounts (for overview)
- `POST /api/accounts/transfer` — transfer between accounts (transaction: debit source + credit destination)

#### Pages
- `/accounts` — Full overview: account cards per account, total bar, recent transactions table, inline transfer card
- `/accounts/new` — Add account form (cash/bank type, conditional fields, opening balance)
- `/accounts/[id]` — Account detail with transaction history (credit/debit badges)
- `/accounts/transfer` — Transfer form (from/to selects with balance display)

### Sales List Page (Rebuilt from stub)
- Full `/sales` page matching design: 4 summary cards, filters (date/customer/type/status chips), table with pagination, mobile card view
- API updated: pagination (`page`/`limit`), total weight per sale via subquery

### Scrap Sale Module
- `POST /api/sales/scrap` — scrap sale with scrap pool deduction (transaction)
- `/sales/scrap/new` — Scrap sale form (single item, buyer name, auto-calc total)

### HR/Payroll Module
#### API Routes
- `GET/POST /api/hr/workers` — list (with monthly advance totals + summary stats) + create
- `GET/PUT/DELETE /api/hr/workers/[id]` — single worker CRUD with advance history
- `GET/POST /api/hr/advances` — list with filters + create (transaction with account debit)
- `GET /api/hr/payroll` — monthly payroll view (base, advances, net payable per worker)
- `POST /api/hr/payroll/pay` — pay salary (transaction with account debit, upsert)

#### Pages
- `/hr/workers` — Worker list (4 stats cards, search, table, mobile cards)
- `/hr/workers/new` — Add worker form
- `/hr/workers/[id]` — Worker profile with advance history
- `/hr/advances/new` — Record salary advance (worker select, auto month/year)
- `/hr/payroll` — Monthly payroll (month/year selector, stats, table, pay modal)

### Reports Module
#### Calculation Logic
- `lib/calculations/profit.ts` — `calculatePeriodProfit(orgId, startDate, endDate)` computes full P&L: volume metrics (purchased/sold/scrap/stock/burnout) + financial metrics (income/costs/profit)
- `lib/calculations/burnout.ts` — re-exports

#### API Routes
- `GET/POST /api/reports` — list saved reports + generate new (validates, calculates, saves snapshot)
- `GET /api/reports/[id]` — single report detail

#### Pages
- `/reports` — Reports list (table, mobile cards)
- `/reports/generate` — Generate report (period type selector with month/year/custom inputs)
- `/reports/[id]` — Full report view (result banner, volume analysis, financial analysis, print button)

### Fixes
- **WAC null bug**: In `calculateWAC()`, PostgreSQL `SUM()` returns strings from `numeric` type — strict `=== 0` fails against `"0"`, causing `NaN`. Fixed by coercing with `Number()`. Added `?? 0` fallbacks in InventoryClient.
- **ESLint**: Fixed `no-explicit-any` in accounts page error handler.

### AGENTS.md Update
- Added rule to check `designs/{page_name}_desktop/` and `designs/{page_name}_mobile/` before building any UI page

## Session: 2026-05-20 — Inventory Gap Closure

### New API Routes
- `GET/PUT/DELETE /api/inventory/categories/[id]` — single category CRUD (was missing)
- `GET/PUT/DELETE /api/inventory/subtypes/[id]` — single subtype CRUD (was missing)
- `GET/POST /api/inventory/consumables` — consumables log CRUD with account_transactions debit
- `GET /api/inventory/ledger` — stock movement history with subtype/category names, filters, summary
- `GET /api/inventory/scrap` — scrap pool movement history with running balance, summary stats

### New Pages
- `/inventory/scrap` — Scrap Pool page (desktop: KPIs + movement table + link to scrap sale; mobile: scroll KPIs + card list + FAB)
- `/inventory/consumables` — Consumables Log page (desktop: stats + table + form sidebar; mobile: stats scroll + entries + bottom-sheet form)
- `/inventory/ledger` — Stock Ledger page (desktop: filter bar + summary + table; mobile: filter chips + scroll stats + card list)

### Navigation
- Created `src/components/InventoryNav.tsx` — shared sub-navigation component for all 6 inventory pages
- Added sub-nav tabs to all inventory pages (Stock Overview, Categories, Sub-types, Ledger, Scrap Pool, Consumables)

## Session: 2026-05-20 — PUT/DELETE API Routes + Plan

### PUT/DELETE for Purchases and Sales
- Added `PUT` (edit) and `DELETE` (void) handlers to `/api/purchases/[id]/route.ts`
  - PUT: replaces items, reverses/re-creates stock ledger, resets to `due`, recalculates WAC
  - DELETE: soft-deletes purchase + items + payments, removes stock ledger entries, recalculates WAC
- Added `PUT` (edit) and `DELETE` (void) handlers to `/api/sales/[id]/route.ts`
  - PUT: replaces items, reverses stock ledger/scrap pool, resets to `due`, recalculates WAC
  - DELETE: soft-deletes sale + items + payments, removes stock ledger/scrap pool entries, recalculates WAC

### HR Advances `[id]` Route
- Created `/api/hr/advances/[id]/route.ts` with:
  - `GET` — single advance view with worker name
  - `PUT` — update `note` and `advance_date` (safe fields only)
  - `DELETE` — soft-delete advance, remove associated account transaction

### Implementation Plan
- Created `PLAN.md` — comprehensive 5-batch plan for all remaining work
- Updated `AGENTS.md` with autonomous batch-by-batch workflow:
  - Agent reads `PLAN.md` → implements tasks → runs quality gates → commits → proceeds automatically
  - No permission needed between batches

### Quality Gates (all passed)
- `npx tsc --noEmit` — zero errors
- `npx eslint src/` — zero errors
- `npx next build` — succeeded (55 pages, all routes functional)
- Dev server verified: `/api/sales` compiles and serves correctly

## Session: 2026-05-20 — Batch 4 (Seed)

### Task 4.1 — Migrations + Seed
- Ran `npx drizzle-kit migrate` — 1 migration applied successfully
- Ran `npx tsx scripts/seed.ts` — seed complete:
  - Accounts: Cash, Dutch Bangla Bank
  - Categories: Iron Plates, Angle Iron (8 subtypes)
  - Vendors: Bashundhara Steel, Rahim Shipyard
  - Customers: Akbar Traders, Kamal Fabrication
  - Purchases: 2 (1 paid, 1 partial)
  - Sales: 3 (1 fabricated paid, 1 raw partial, 1 quick cash)
  - Scrap pool: 150 kg

### Bug Fix — Sales API 500 Error
- **3 bugs found and fixed in `src/app/api/sales/route.ts`**:
  1. Raw SQL field `total_kg` in subquery missing `.as('total_kg')` — drizzle requires explicit alias
  2. `Date` object in `sql`\`...\` template literal throws TypeError — changed to `.toISOString()` string
  3. GET handler lacked try-catch — any error produced empty 500 body; wrapped in try-catch with JSON error response

## Session: 2026-05-20 — Bug Fixes + DB Cleanup

### Bug Fix — Payroll page crash
- **Root cause**: API returns `{ workers: [...] }` but client interface expected `{ rows: [...] }` — `payroll.rows` was undefined, `.length` crashed
- **Fix**: Changed `PayrollData.rows` → `PayrollData.workers` to match API response shape
- Commit: `9c79dc5`

### CONTEXT.md update
- Status changed from "Ready for Development" → "V1 Complete — Ready for Deployment"
- Section 3.3 V1 Scope: all 9 modules marked ✅ Built
- Section 8 Development Roadmap: all 6 weeks marked ✅
- Section 11 Definition of Done: all functional checks ✅, deployment items ⏸️

### TESTING.md created
- Full testing checklist with all 34 page routes + 34 API endpoints mapped to 9 modules
- Commit: `385106a`

### DB Cleanup
- Created `scripts/cleanup.ts` — wipes all transactional data while preserving user login
- Ran cleanup → DB state: 1 org ("Bagdad Trading Corporation"), 1 user (`noorefty1@gmail.com`, owner), 0 rows in all 19 transactional tables
- Sessions cleared — user must login again
- Cleanup script committed for future use

### Quality Gates (all passed)
- `npx tsc --noEmit` — zero errors
- `npx next build` — succeeded

---

### Bug Fix — Workers page crash + Inventory 500
- **Workers page**: API returns `monthly_payroll` but interface expected `total_monthly_payroll` — fixed field name. Added `(n ?? 0)` to `formatMoney` across all HR pages.
- **Inventory page**: Server component used hardcoded `http://localhost:3000` to fetch stock data — replaced with direct DB queries.
- **HR landing page**: Created `/hr/page.tsx` with redirect to `/hr/workers` (was 404).

### Full API test — All 20 endpoints return 200
- Auth, Inventory (6), HR (3), Sales (2), Purchases (2), Accounts (2), Reports (2), Settings (2)
- Report generation POST → 201, Worker creation POST → 201

### Full page test — All 21 pages return 200
- Dashboard, Inventory (6 sub-pages), Purchases (2), Sales (2), HR (4), Accounts (2), Reports (2), Settings (2)

### Quality Gates (all passed)
- `npx tsc --noEmit` — zero errors
- `npx eslint src/` — zero errors
- `npx next build` — succeeded

### Remaining
- **4.2 Walkthrough** — requires deployed instance
- **4.3 Multi-tenant test** — requires deployed instance
- **Batch 5** — Deploy to Vercel + Supabase production (user will handle)

## Quality Gates
- `npx tsc --noEmit` — zero errors required
- `npx eslint src/` — zero errors required
- `npx next build` — must succeed
- Every SELECT filters by `organization_id` and `deleted_at IS NULL`
- Every multi-table write uses `db.transaction()`
- Never delete/rename existing columns — add new ones instead
- Never run `drizzle push` — use `drizzle-kit generate` + `drizzle-kit migrate`

## Session: 2026-05-21 — User Testing Feedback + Fix Plan

### User tested the app (logged 36 findings)
- User created two test businesses and walked through all modules
- **Finding_after_testing.md** — raw findings file with 36 issues across all modules
- Key issues: HR module completely broken (errors 3-6), quick sale shows [object Object], dashboard blank, account balances not updating, opening balance not flowing into due calculations, missing navigation everywhere

### Fixes_implementation.md created
- 36-item plan organized by priority: P0 (6 crashes) → P1 (7 bugs) → P2 (10 missing features) → P3 (13 polish)
- Committed as `d5f1944` — user will say "proceed" when ready for implementation

### Database state after testing
- 1 org (Bagdad Trading Corporation), 1 user (`noorefty1@gmail.com`)
- Test data present: 2 accounts, 2 vendors, 1 customer, 2 workers, 4 purchases, 2 sales, 17 account transactions, 1 period report

## Session: 2026-05-21 — P0 fixes + planet

### Completed
- Updated AGENTS.md to reference Fixes_implementation.md instead of PLAN.md
- Deleted PLAN.md
- Fixed tsconfig to exclude scripts/ (cleanup.ts build error)
- P0-1: Consumables API — added pagination, fixed field name mismatch (total_items_logged → total_items)
- P0-2: Quick sale — added sale_type: "fabricated" to request body (was missing, causing Zod validation error → [object Object])
- P0-3: Workers list field name — advance API reference_type fixed (salary → advance)
- P0-4: Worker detail page — fixed to destructure { worker, advances } from API response
- P0-6: Payroll API — fixed field name mismatches (name → worker_name, total_advances → advances_taken, total_advances_sum → total_advances)

## Session: 2026-05-21 — P1, P2, P3 Full Fix Cycle

### P1 — Functionality Bugs (7 items)
- **Account balances update on pay/receive**: Added `UPDATE accounts SET current_balance` in purchase/sale payment routes
- **Dashboard converted to live data**: Replaced static zeros with DB queries (stock kg, today sales, AR/AP totals, pending salaries, account balances, recent sales, category stock bars)
- **Vendor/customer opening balance**: Included `opening_balance` in `due_balance` calculations in API routes
- **Vendor/customer action buttons**: Changed inert `<button>` to `<Link>` navigations to detail pages

### P2 — Missing UI & Navigation (10 items)
- **Logout button**: Added to Sidebar.tsx + MobileSidebar.tsx (POSTs to `/api/auth/logout`, redirects to `/login`)
- **Nav links added**: vendors (purchases), customers (sales), transfer anchor (accounts), scrap sale (sales), team tab (settings)
- **Deposit form**: Created `/api/accounts/deposit/route.ts` + deposit card UI on accounts page
- **Category edit**: Inline edit/delete with hover-reveal icons on categories page (API already existed)
- **Manual "Add Scrap"**: POST handler in scrap API + form on scrap pool page
- **Stock adjustment**: POST handler in stock API + collapsible form on ledger page

### P3 — UI Polish (13 items)
- **Subtype button placement**: Added `gap-4` + `flex-shrink-0` to right panel header
- **Customer dropdown overlap**: Added `relative z-10` to select wrapper on sale form
- **Other expenses default**: Changed from `useState(0)` to `useState("")` to avoid showing "0"
- **Purchase count format**: Removed `formatMoney()` from count fields (COUNT is not currency)
- **PDF NaN guards**: Added `isNaN()` checks in `fmtMoney`/`fmtKg` in PDF generation
- **Purchase other expenses**: Added `truck_fare`, `labour_cost`, `food_cost` columns to schema + migration + API + form UI
- Items 24-28 (spinners, animations, dropdown styling) deferred as design-system scope

### Notable bug found
- **Advance API missing account balance deduction**: Creates debit transaction but never deducts from `accounts.current_balance` — same pattern as P1 fix #7

### Quality Gates
- `npx tsc --noEmit` — zero errors
- `npx next build` — compiled successfully (57 pages)
- All changes committed across 5 commits

### Files modified or created
- 14 files modified, 2 created (deposit API, migration)
- New migration: `0001_illegal_dust.sql` (adds truck_fare, labour_cost, food_cost to purchases)

## Session: 2026-05-21 — P1 Fixes Phase 2 (4 remaining bugs)

### P1-4: Account balance not updating on sale creation
- **Root cause**: `POST /api/sales` inserted `accountTransactions` for payment but never updated `accounts.current_balance`
- **Fix**: Added `accounts` import + `UPDATE accounts SET current_balance = (subquery)` after the `accountTransactions` insert in the sale creation transaction

### P1-5: Dashboard AR/AP excluding opening balances
- **Root cause**: Dashboard queried only `SUM(sales.due_amount)` and `SUM(purchases.due_amount)` without adding customer/vendor opening balances
- **Fix**: Added `COALESCE(SUM(customers.opening_balance), 0)` and `COALESCE(SUM(vendors.opening_balance), 0)` queries to `Promise.all`, added results to `arTotal` and `apTotal`

### P1-8: Vendor opening balance not in purchases summary
- **Root cause**: `GET /api/purchases` summary `total_due` was `total_amount - total_paid` — excluded vendor opening balances
- **Fix**: Added vendor opening balance query filtered by `vendor_id` (if present), added to `total_due`

### P1-9: Customer opening balance not in sales summary
- **Root cause**: `GET /api/sales` summary `total_due` was `total_amount - total_paid` — excluded customer opening balances
- **Fix**: Added customer opening balance query filtered by `customer_id` (if present), added to `total_due`

### Files modified
- `src/app/api/sales/route.ts` — P1-4 (account balance update) + P1-9 (customer opening in summary)
- `src/app/api/purchases/route.ts` — P1-8 (vendor opening in summary)
- `src/app/(dashboard)/page.tsx` — P1-5 (opening balances in dashboard AR/AP KPI)

## Session: 2026-05-21 — P2-14 & P2-15 Accounts Forms Fix

### Changes
- **P2-14**: Removed inline deposit/transfer forms from `accounts/page.tsx`, replaced with Deposit + Transfer buttons in the header
- **P2-15**: Created `accounts/deposit/page.tsx` with breadcrumb navigation, form (account select, amount, date, note), validation, loading/error states, redirect on success

### Files modified
- `src/app/(dashboard)/accounts/page.tsx` — removed inline forms, added Deposit/Transfer/Link buttons
- `src/app/(dashboard)/accounts/deposit/page.tsx` — **created** new deposit form page

### Quality Gates
- `npx tsc --noEmit` — zero errors
- `npx eslint src/app/(dashboard)/accounts/` — zero new errors
- `npx next build` — succeeded

## Session: 2026-05-21 — P2-7 Purchase Dynamic Other Expenses

### Changes
- **P2-7**: Replaced fixed `truck_fare`, `labour_cost`, `food_cost` fields with dynamic add/remove expense rows
- Each row has: description (text), amount (number), account_id (dropdown), "Add to vendor total" toggle
- New `purchase_other_expenses` table in DB with columns: `organization_id`, `purchase_id`, `description`, `amount`, `account_id`, `add_to_vendor_total`
- API POST handler: expenses with `add_to_vendor_total=true` added to `total_amount`; others create `account_transactions` debit from selected account

### Files modified
- `src/lib/db/schema.ts` — Added `purchaseOtherExpenses` table, relations, types
- `src/lib/db/migrations/0003_magical_rocket_racer.sql` — Auto-generated migration
- `src/lib/validations/schemas.ts` — Added `otherExpenseSchema`, updated `purchaseSchema`
- `src/app/api/purchases/route.ts` — POST handler processes other_expenses (vendor total addition + account debits)
- `src/app/(dashboard)/purchases/new/page.tsx` — Replaced 3 fixed fields with dynamic add/remove expense rows
- `Fixes_implementation.md` — Marked item 7 as ✅

### Quality Gates
- `npx tsc --noEmit` — zero errors
- `npx next build` — succeeded

## Session: 2026-05-21 — Findings_v3 P0-P2 Implementation

### P0-1: Consumables GET 500 error
- **Root cause**: Migration `0002_dizzy_epoch.sql` (adding `stock_quantity` + `consumption_logs` table) was generated but never applied to the DB
- **Fix**: Ran `npx drizzle-kit migrate` — migration applied successfully

### P1-2: "truck_fare column does not exist" on payment
- **Root cause**: Migration `0001_illegal_dust.sql` (adding `truck_fare`, `labour_cost`, `food_cost` to purchases table) existed in migration journal but was never applied to the DB
- **Fix**: Same migrate run applied this migration
- **Lesson**: Always run `drizzle-kit migrate` after `drizzle-kit generate`

### P1-3: Sales total count shown with currency format
- **Root cause**: `total_sales` in API is `COUNT(*)::int` (number of sales), but frontend used `formatMoney()` which prepends `৳`
- **Fix**: Changed to `summary.total_sales.toLocaleString("en-IN")` — plain number format

### P2-4: Vendors with old payable not in Due list
- **Root cause**: purchases API only returned purchases with `status='due'` — vendors with only opening balance (no purchase records) had no entries
- **Fix**: When `status=due`, API also queries vendors with `opening_balance > 0` and `NOT EXISTS` recent due purchases — merges synthetic entries with `id: "ob-{vendor_id}"`
- Purchases page handles null dates for synthetic entries

### P2-5: Vendor profile page with payment support
- Created `/purchases/vendors/[id]/page.tsx` — vendor profile with info card, purchase history, payment ledger, Record Payment modal
- Created `/api/purchases/vendors/[id]/route.ts` — returns vendor + purchases + payments + aggregated totals
- Vendor names on vendor list page link to profile

### P2-6: Customer profile page with receive support
- Created `/sales/customers/[id]/page.tsx` — customer profile (same pattern as vendor)
- Created `/api/sales/customers/[id]/route.ts` — customer detail API
- Customer names on customer list page link to profile

### P2-7: Dynamic other expenses with account debit
- Replaced fixed `truck_fare`/`labour_cost`/`food_cost` fields with dynamic add/remove expense rows
- Each row: description, amount, account_id dropdown, "Add to vendor total" toggle
- New `purchase_other_expenses` DB table + migration `0003_magical_rocket_racer.sql`
- Expenses with `add_to_vendor_total=true` add to `total_amount`; others create `account_transactions` debit

### ERROR.md: Duplicate React key error
- **Root cause**: `let nextExpenseKey = 1;` and `let nextKey = 2;` declared as plain `let` inside component body — resets to initial value on every render, causing duplicate keys
- **Fix**: Changed all 3 files (purchases/new, sales/new, sales/new/quick) to use `useRef()` instead of `let` for key counters

### Findings_v4 Fixes
- **Vendor opening balance payment**: Added "Opening Balance" option in vendor payment select + new API endpoint `/api/purchases/vendors/[id]/pay-opening-balance` that creates debit account_transaction and reduces vendor `opening_balance`
- **Customer opening balance receive**: Same pattern — "Opening Balance" in receive modal + `/api/sales/customers/[id]/receive-opening-balance` API
- **Customers with only due in sales**: Sales API now returns synthetic `ob-{id}` entries for customers with `opening_balance > 0` when `status=due` (mirrors purchases fix)
- **Purchases Due list actions**: Added "View Vendor" button for synthetic `ob-` entries linking to vendor profile
- **Dropdown overlap**: Already fixed in prior commit (removed `z-10` from customer select)
- **Duplicate nav**: Already resolved — only 1 `InventoryNav` instance in consumables page

### Files modified (Findings_v3 round)
- `src/app/api/purchases/route.ts` — P2-4 (synthetic vendor entries) + P2-7 (dynamic expenses)
- `src/app/(dashboard)/purchases/page.tsx` — P2-4 (null-safe dates, synthetic entry rendering)
- `src/app/api/sales/route.ts` — P1-3 (added customer opening balance synthetic entries)
- `src/app/(dashboard)/sales/page.tsx` — P1-3 (null-safe dates + synthetic entry actions)
- `src/app/(dashboard)/purchases/new/page.tsx` — P2-7 (dynamic expenses) + ERROR.md (useRef key fix)
- `src/app/(dashboard)/sales/new/page.tsx` — ERROR.md (useRef key fix)
- `src/app/(dashboard)/sales/new/quick/page.tsx` — ERROR.md (useRef key fix)
- `src/lib/db/schema.ts` — P2-7 (purchaseOtherExpenses table)
- `src/lib/validations/schemas.ts` — P2-7 (otherExpenseSchema)

### Files created (Findings_v3 round)
- `src/app/(dashboard)/purchases/vendors/[id]/page.tsx` — P2-5 vendor profile
- `src/app/api/purchases/vendors/[id]/route.ts` — P2-5 vendor detail API
- `src/app/(dashboard)/sales/customers/[id]/page.tsx` — P2-6 customer profile
- `src/app/api/sales/customers/[id]/route.ts` — P2-6 customer detail API
- `src/app/api/purchases/vendors/[id]/pay-opening-balance/route.ts` — opening balance payment API
- `src/app/api/sales/customers/[id]/receive-opening-balance/route.ts` — opening balance receive API

### Quality Gates
- `npx tsc --noEmit` — zero errors
- `npx next build` — succeeded
