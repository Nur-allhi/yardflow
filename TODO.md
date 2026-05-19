# YardFlow ERP — Development TODO

> Last updated: 2026-05-19  
> See `REPORT.md` for full per-module completion analysis.

---

## ✅ Phase 1 — Foundation
- [x] Project setup: Next.js, TypeScript, Tailwind, Drizzle ORM, postgres driver
- [x] Full database schema (22 tables, 15 enums, generated columns, relations, types)
- [x] Migration generated & applied to Supabase
- [x] RLS policies deployed to all tables
- [x] Design system tokens in tailwind.config.ts
- [x] Custom utility: `hide-scrollbar` in globals.css
- [x] Fonts: Plus Jakarta Sans, DM Sans, Fira Code, Material Symbols

## ✅ Phase 2 — Auth
- [x] Register API (`POST /api/auth/register`) — creates org + user in transaction, sets session
- [x] Login API (`POST /api/auth/login`) — bcrypt verify, sets JWT httpOnly cookie (7-day)
- [x] Logout API (`POST /api/auth/logout`)
- [x] Session helper: `createSession`, `getSession`, `clearSession` (jose JWT)
- [x] Route protection via `getSession()` check in layouts
- [x] Middleware injects `x-org-id` / `x-user-id` / `x-user-role` headers
- [x] Login page (desktop split layout + mobile slide-up card)
- [x] Register page (desktop centered card + mobile sticky header/footer)

## ✅ Phase 3 — Dashboard Layout
- [x] Fixed 240px dark navy sidebar with nav items + active state
- [x] Sticky top nav bar with user avatar
- [x] Mobile bottom nav bar (Home / Stock / Sales / HR / Buy)
- [x] Responsive wrapper: sidebar on `md:`, bottom nav on `<md:`

## ✅ Phase 4 — Dashboard Page
- [x] Desktop: Quick action buttons, 4-col KPI cards, Recent Sales panel, Stock Overview panel
- [x] Desktop: Account Balances / Pending Dues / Pending Salaries row
- [x] Mobile: Quick Entry 2x2 grid, 2x2 KPI, Financial Overview bento card
- [x] Mobile: Recent Sales card list, Stock Trend chart placeholder

## ✅ Phase 5 — Inventory Module
### API Routes
- [x] `GET/POST /api/inventory/categories`
- [x] `GET/POST /api/inventory/subtypes` (with `?category_id=` filter, stock/WAC enrichment)
- [x] `GET /api/inventory/stock` (full overview: categories + subtypes + scrap pool)

### Calculations
- [x] `calculateWAC(orgId, subtypeId)` — Weighted Average Cost per kg
- [x] `getStockQuantity(orgId, subtypeId)` — current stock from stock_ledger

### Pages
- [x] Stock Overview (desktop + mobile)
- [x] Sub-types (desktop 2-panel + mobile cards)
- [x] Categories (responsive form + list)

## ✅ Phase 6 — Purchases Module
### API Routes
- [x] `GET/POST /api/purchases/vendors` — list with totals + create
- [x] `GET/PUT/DELETE /api/purchases/vendors/[id]` — single vendor CRUD
- [x] `GET/POST /api/purchases` — list with filters + summary stats; create with transaction
- [x] `GET /api/purchases/[id]` — detail with vendor, items, payments
- [x] `POST /api/purchases/[id]/payments` — record payment (transaction)

### Pages
- [x] `/purchases/vendors` — Vendor list with summary cards, inline add/edit modal
- [x] `/purchases` — Purchase list with filter bar, status chips, table/cards, pagination
- [x] `/purchases/new` — Purchase entry with vendor picker, dynamic line items, order summary
- [x] `/purchases/[id]` — Purchase detail with items table, payment ledger, payment modal

## ✅ Phase 7 — Sales Module
### API Routes
- [x] `GET/POST /api/sales/customers` — list with totals + create
- [x] `GET/PUT/DELETE /api/sales/customers/[id]` — single customer CRUD
- [x] `GET/POST /api/sales` — list with filters + summary stats; create with transaction
- [x] `GET /api/sales/[id]` — detail with customer, items, payments
- [x] `POST /api/sales/[id]/payments` — record payment (transaction)
- [x] `POST /api/sales/scrap` — scrap sale with scrap pool deduction (transaction)

### Pages
- [x] `/sales/customers` — Customer list with summary cards, inline add/edit modal
- [x] `/sales` — Sales list with filter bar, type/status chips, table/cards, pagination
- [x] `/sales/new` — Full recorded sale (customer picker, sale types, dynamic items, payment)
- [x] `/sales/new/quick` — Quick cash sale (no customer, items + immediate payment)
- [x] `/sales/[id]` — Sale detail with items table, payment ledger, payment modal
- [x] `/sales/scrap/new` — Scrap sale form

## ✅ Phase 8 — HR / Payroll Module
### API Routes
- [x] `GET/POST /api/hr/workers` — list with monthly advance totals + create
- [x] `GET/PUT/DELETE /api/hr/workers/[id]` — single worker CRUD with advance history
- [x] `GET/POST /api/hr/advances` — list with filters; create with account debit (transaction)
- [x] `GET /api/hr/payroll` — monthly payroll view (base, advances, net_payable)
- [x] `POST /api/hr/payroll/pay` — pay salary with account debit (transaction)

### Pages
- [x] `/hr/workers` — Worker list with stats cards, search, table, mobile cards
- [x] `/hr/workers/new` — Add worker form
- [x] `/hr/workers/[id]` — Worker profile with advance history
- [x] `/hr/advances/new` — Record salary advance
- [x] `/hr/payroll` — Monthly payroll with stats, table, pay modal

## ✅ Phase 9 — Accounts Module
### API Routes
- [x] `GET/POST /api/accounts` — list + create
- [x] `GET/PUT/DELETE /api/accounts/[id]` — single account CRUD
- [x] `GET /api/accounts/transactions` — recent transactions overview
- [x] `POST /api/accounts/transfer` — transfer between accounts (transaction)

### Pages
- [x] `/accounts` — Account list with balances, recent transactions, transfer card
- [x] `/accounts/new` — Add account (cash/bank with conditional fields)
- [x] `/accounts/[id]` — Account detail with transaction history
- [x] `/accounts/transfer` — Transfer form with balance display

## ✅ Phase 10 — Reports Module
### API Routes
- [x] `GET/POST /api/reports` — list saved reports + generate (validates, calculates, saves)
- [x] `GET /api/reports/[id]` — single report detail

### Calculations
- [x] `calculatePeriodProfit()` in `profit.ts` — full P&L with burnout, WAC, profit per kg
- [x] `burnout.ts` — re-exports calculatePeriodProfit

### Pages
- [x] `/reports` — Reports list (table, mobile cards)
- [x] `/reports/generate` — Generate report (monthly/yearly/custom)
- [x] `/reports/[id]` — Full report view (volume + financial analysis, print button)

## 🔴 Phase 11 — Remaining Work (Gaps)

### Inventory — Missing Pages & Routes
- [ ] `GET/PUT/DELETE /api/inventory/categories/[id]` — update/delete single category
- [ ] `GET/PUT/DELETE /api/inventory/subtypes/[id]` — update/delete single subtype
- [ ] `GET/POST /api/inventory/consumables` — consumables log CRUD API
- [ ] `GET /api/inventory/ledger` — stock movement history API
- [ ] `GET /api/inventory/scrap` — scrap pool movement history API
- [ ] `/inventory/ledger` page — full stock movement history
- [ ] `/inventory/scrap` page — scrap pool current total + movement history
- [ ] `/inventory/consumables` page — log daily consumable purchases
- [ ] Zod schemas for categories, subtypes, consumables

### Purchases — Missing CRUD
- [ ] `PUT/DELETE /api/purchases/[id]` — edit/void a purchase
- [ ] Zod schemas for purchase update

### Sales — Missing CRUD
- [ ] `PUT/DELETE /api/sales/[id]` — edit/void a sale
- [ ] Zod schemas for sale update

### HR — Missing Routes & Schemas
- [ ] `GET/PUT/DELETE /api/hr/advances/[id]` — single advance view/edit/void
- [ ] Zod schemas for workers, advances, salary payments
- [ ] Negative net_payable warning in UI

### Reports — Missing Features
- [ ] `src/lib/pdf/reports.ts` — PDF export (jsPDF + autotable)
- [ ] Zod schema for report generation input
- [ ] `total_other_expenses` editable field in generate form

### Auth / Org — Missing Pages
- [ ] `/settings` page — organization profile
- [ ] `/settings/team` page — invite team members, assign roles, deactivate users
- [ ] `src/lib/auth/middleware.ts` — role-based route protection file
- [ ] Worker login (link worker profile to user account)

### Seed & Test
- [ ] Run seed script with full sample data (categories, subtypes, vendors, customers, workers, accounts)
- [ ] Walk through every module end-to-end: create → read → update → pay
- [ ] Verify multi-tenant isolation (register two orgs, confirm no data leak)

### Deployment
- [ ] Deploy to Vercel
- [ ] Configure Supabase production
- [ ] Set environment variables in Vercel
- [ ] HTTPS active
- [ ] Test with real data

## 🧪 Quality Gates (run after every feature)
- [x] `npx tsc --noEmit` — zero errors (last run: passed)
- [x] `npx eslint src/` — zero errors in `src/` (last run: passed)
- [x] `npx next build` — must succeed (last run: passed)
- [ ] Manual walkthrough: create → read → update → pay/delete workflow
- [x] Multi-tenant: every query filters by `organization_id`
- [x] Soft delete: every SELECT filters `deleted_at IS NULL`
- [x] Transactions: every multi-table write uses `db.transaction()`
