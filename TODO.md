# YardFlow ERP — Development TODO

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
- [x] **Stock Overview**
  - Desktop: 4-col summary stats, text tabs, collapsible category groups with subtype table
  - Mobile: 2x2 bento stats (alert card red), horizontal pill tabs, subtype cards per category
- [x] **Sub-types**
  - Desktop: Two-panel layout (category list + subtype table with hover actions, centered modal, stats row)
  - Mobile: Horizontal category chips, subtype cards, bottom-sheet modal
- [x] **Categories**
  - Desktop & mobile: responsive form + list layout

## ⏳ Phase 6 — Purchases Module
- [ ] **Vendors CRUD** (`/api/purchases/vendors`)
  - [ ] API: `GET/POST/PUT/DELETE /api/purchases/vendors`
  - [ ] Page: Vendor list + add/edit form
  - [ ] Balance tracking (opening_balance + purchase dues)
- [ ] **Purchase Entry** (`POST /api/purchases`)
  - [ ] API: Create purchase with line items (purchase_items), update stock_ledger, recalculate WAC
  - [ ] Must use `db.transaction()` — stock + ledger + account + purchase in one atomic write
  - [ ] Page: Purchase form with line item rows (subtype picker, qty, price)
- [ ] **Purchase Payments** (`POST /api/purchases/:id/payments`)
  - [ ] API: Record payment, update purchase `paid_amount`/`status`, deduct from account
  - [ ] Page: Payment form attached to purchase detail
- [ ] **Purchase List** (`GET /api/purchases`)
  - [ ] Page: Filterable, sortable list with status badges

## ⏳ Phase 7 — Sales Module
- [ ] **Customers CRUD** (`/api/sales/customers`)
  - [ ] API: `GET/POST/PUT/DELETE /api/sales/customers`
  - [ ] Page: Customer list + add/edit form
- [ ] **Quick Cash Sale** — single-step, no customer, immediate payment
- [ ] **Regular Sale** (`POST /api/sales`)
  - [ ] API: Create sale with line items, deduct from stock_ledger, update scrap pool (for fabricated sales)
  - [ ] Must use `db.transaction()`
  - [ ] Page: Sale form with customer picker, line items, payment section
- [ ] **Sale Payments** (`POST /api/sales/:id/payments`)
  - [ ] API: Record payment, update sale `paid_amount`/`status`, add to account
- [ ] **Sale List** (`GET /api/sales`)
  - [ ] Page: Filterable list with sale type, status, amounts

## ⏳ Phase 8 — HR / Payroll Module
- [ ] **Workers CRUD** (`/api/hr/workers`)
  - [ ] API + page
- [ ] **Salary Advances** (`POST /api/hr/advances`)
  - [ ] Track per-worker per-month advances
  - [ ] Deduct from account
- [ ] **Salary Payments** (`POST /api/hr/salaries`)
  - [ ] Calculate `net_payable = base_salary - total_advances`
  - [ ] Handle negative net_payable (warnings, not crash)
  - [ ] Mark period as paid

## ⏳ Phase 9 — Accounts Module
- [ ] **Accounts CRUD** (cash/bank accounts)
- [ ] **Account Transactions** view
- [ ] **Account Transfers** between accounts

## ⏳ Phase 10 — Reports Module
- [ ] **Period-end reconciliation** (burnout calculation, scrap accounting)
- [ ] **P&L report**: income - purchase cost - consumables - salary - other expenses
- [ ] **Stock valuation report** (by category, by subtype)
- [ ] **Dues report** (customer + vendor aging)

## 🧪 Quality Gates (run after every feature)
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npx eslint src/` — zero errors in `src/`
- [ ] `npx next build` — must succeed
- [ ] Manual walkthrough: create → read → update → pay/delete workflow
- [ ] Multi-tenant: every query filters by `organization_id`
- [ ] Soft delete: every SELECT filters `deleted_at IS NULL`
- [ ] Transactions: every multi-table write uses `db.transaction()`
