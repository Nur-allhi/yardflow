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
- `npx next build` — succeeded

## Remaining Work (per PLAN.md)

| Batch | Module | Tasks |
|-------|--------|-------|
| 1 | Reports | PDF export, other expenses field, Zod schema |
| 2 | HR | Zod schemas, negative net_payable warning |
| 3 | Settings | Org profile, Team page, Role middleware |
| 4 | Seed + E2E | Seed data, walkthrough, multi-tenant test |
| 5 | Deploy | Vercel + Supabase production |

## Session: 2026-05-20 — Batch 1 Tasks 1.1-1.3 (Other Expenses)

### Task 1.1 — Other Expenses field in generate form
- Added `totalOtherExpenses` state (default 0) to `reports/generate/page.tsx`
- Added number input "Other Expenses (tk)" with hint text between conditional selectors and summary div
- Included `total_other_expenses` in POST body

### Task 1.2 — Wire through profit calculation
- Added `totalOtherExpenses: number = 0` 4th parameter to `calculatePeriodProfit()`
- Replaced hardcoded `const total_other_expenses = 0` with `const total_other_expenses = totalOtherExpenses`

### Task 1.3 — Zod schema + API route update
- Added `generateReportSchema` and `GenerateReportInput` type to `schemas.ts`
- Replaced inline schema in `/api/reports/route.ts` with import from schemas
- Passed `parsed.data.total_other_expenses` to `calculatePeriodProfit()`
- Fixed pre-existing ESLint `no-explicit-any` in `pdf/reports.ts` (2 occurrences) using `JsPdfWithTable` type

### Quality Gates (all passed)
- `npx tsc --noEmit` — zero errors
- `npx eslint src/` — zero errors (fixed pre-existing issues)
- `npx next build` — succeeded

## Quality Gates
- `npx tsc --noEmit` — zero errors required
- `npx eslint src/` — zero errors required
- `npx next build` — must succeed
- Every SELECT filters by `organization_id` and `deleted_at IS NULL`
- Every multi-table write uses `db.transaction()`
- Never delete/rename existing columns — add new ones instead
- Never run `drizzle push` — use `drizzle-kit generate` + `drizzle-kit migrate`
