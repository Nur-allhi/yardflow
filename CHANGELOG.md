# Changelog

All notable changes to YardFlow ERP are documented here.

---

## [1.0.0] — 2026-05-23

### UI Polish & Bug Fixes — Phase 3 (Final)

#### Fixed
- **Sales API 500 error**: Added `status !== "all"` guard before enum cast — fixes crash when "All" filter is selected
- **DB timeouts (intermittent)**: Added `organization_id` + join column indexes on all 23 tables (migration `0006`)
- **Dashboard AggregateError**: Eliminated N+1 category stock queries — single `GROUP BY` replaces per-category queries
- **Viewport deprecation warning**: Moved `viewport` to separate export in root layout — silences Next.js 15 warning across 13+ pages
- **HR redirect 404**: `redirect("hr/workers")` → `redirect("/hr/workers")` — relative path was doubling to `/hr/hr/workers`
- **Sales summary card overflow**: `w-[140px]` → `w-fit min-w-[120px]`, full-time border, `৳` prefix
- **Scrap page grid**: Wrapped Add Scrap + Sell Scrap in single `lg:col-span-4` container; removed confusing stats summary from CTA
- **Category chip contrast**: Changed `text-on-tertiary-container` → `text-white` to fix green-on-green invisibility

#### Changed
- **Account transaction system**: Created shared `recordAccountTransaction()` utility with atomic `db.transaction()` — migrated all 12 transaction routes to use it
- **Account transaction enrichment**: Added `enrichTransactions()` — batch-resolves reference names through purchase/sale/salary chains showing human-readable descriptions ("Payment to Shabnam Steel") with clickable links
- **Account detail page**: Fixed broken reference links; replaced "Reference"+"Note" columns with single clickable "Description" column
- **Accounts list**: Replaced cryptic `#PUR-xxxx` codes with enriched descriptions; replaced dead "View All" span with transaction count
- **Consumables module**:
  - Fixed `most_used_item` query — counts from `consumptionLogs` instead of purchases
  - Removed merge logic — new purchases always create separate entries
  - Added Use consumable modal (desktop) + bottom sheet (mobile)
  - Added consumption history alongside purchase log
  - Fixed mobile cards with dynamic icons, proper date/qty subtitles
- **Sales/purchases card alignment**: Unified card layout (stacked, not icon+row); unified `formatMoney` to `tk` suffix; "Today" → "This Month"
- **Pay/Receive Payment links**: Customers → `/sales/customers/{id}`; Vendors → `/purchases/vendors/{id}` (inline payment modals)
- **Sub-type edit**: Wired inline edit with state + `PUT` mutation on desktop rows and mobile cards
- **Removed `default_price_per_kg`**: Cleaned from schema, APIs, UI, hooks, seed data, and docs (14 files) — migration `0005`

#### Added
- **Route transition loading**: Shimmer skeleton at `(dashboard)/loading.tsx`
- **PageTransitionWrapper**: Framer-motion fade/slide-up on route transitions
- **MobileSidebar whileTap**: Instant `scale: 0.97` press feedback
- **Auto-refresh dashboard**: `refetchInterval: 30000` on accounts queries
- **`tertiary` color**: `#059669` in Tailwind config — fixes invisible buttons/badges across ~40 files

---

## [1.0.0-beta.2] — 2026-05-18

### Design Alignment — P5 Complete

#### Changed
- **25 mobile views aligned with design mockups**: Login, Register, Dashboard, Accounts, Stock, Sub-types, Scrap, Consumables, Purchases list/new/detail, Sales list/new/quick/detail, Customers, Vendors, Workers list/profile, Payroll, Reports list/generate/saved, Settings, Team
- Remaining P1/P2 gaps: ledger mobile cards, form UX attributes, `h-[44px]` inputs

---

## [1.0.0-beta.1] — 2026-05-16

### Mobile Responsiveness + Animations + Accessibility — P0-P4

#### Added
- **Framer-motion animations**: Sidebar stagger, mobile sidebar spring slide, bottom nav `layoutId` active indicator, page transitions
- **Global command palette**: `Cmd+K` / `Ctrl+K` quick search across modules
- **Shared Breadcrumb component**: Consistent navigation breadcrumbs on purchases and sales pages
- **Loading spinners**: On all mutation buttons during async operations
- **`aria-live="polite"`** on error containers for screen reader announcements
- **`focus-visible:ring`** on all interactive elements

#### Changed
- **Mobile bottom nav**: Increased to `min-h-[56px]` with proper touch padding
- **Breadcrumb links**: Added `min-h-[44px]` touch targets on mobile
- **Inventory nav pills**: `py-1.5` → `py-2.5 px-4`
- **All form inputs**: `h-[42px]` → `h-[44px]` (Apple HIG minimum)
- **All pagination**: Added `min-w-[44px] min-h-[44px]` on prev/next buttons
- **Login page**: Reduced `h-[353px]` → `min-h-[220px]` (was 53% of iPhone SE viewport)
- **Password eye icon**: Wrapped in `min-w-[44px] min-h-[44px]` touch target
- **Nested `<Link><button>`**: Converted to proper single-element pattern (a11y fix)
- **Register CTA**: Switched from `fixed bottom-0` to `sticky bottom-0` with keyboard-aware positioning

#### Fixed
- Missing `viewport-fit=cover` for notched devices
- Hidden edit/delete buttons on inventory categories (opacity-0 on touch devices)
- Missing FAB on purchases mobile view
- Sticky submit on quick cash sale form
- `-webkit-tap-highlight-color` gray flash on all taps
- Added `safe-area-inset-*` CSS env variable fallbacks
- `prefers-reduced-motion` fallback for animations
- Login animate-slide-up accessibility

---

## [1.0.0-alpha.2] — 2026-05-12

### Module Completion — Sales, Reports, HR, Settings

#### Added
- **Sales module**: Fabricated, raw pass-through, and scrap sale types; quick cash sale; installment payments; customer management with opening balance
- **Reports module**: Period P&L generation with burnout calculation; PDF export via jsPDF; immutable report snapshots
- **HR module**: Worker profiles with individual salaries; salary advances; monthly payroll with over-advance carry-forward
- **Settings module**: Organization profile editing; team management with role assignment

#### Changed
- All modules — replaced hardcoded hex colors with Tailwind design tokens
- All modules — unified `formatMoney` to `tk` suffix (Bengali lakh format)
- Reports — fixed `formatMoney` in PDF generation

---

## [1.0.0-alpha.1] — 2026-05-08

### Foundation + Inventory + Purchases + Accounts

#### Added
- **Project scaffold**: Next.js 15 App Router, TypeScript, Tailwind CSS, Drizzle ORM, PostgreSQL
- **Auth system**: Custom bcryptjs + JWT authentication; organization registration; role-based access (owner/manager/worker); session cookies
- **Design system**: Tailwind config with full design tokens; font setup (Plus Jakarta Sans, DM Sans, Fira Code); globals.css with custom properties
- **Animation utility**: Spring configs, variants, and stagger presets for framer-motion
- **Inventory module**: Material categories and sub-types; stock ledger with in/out tracking; WAC (Weighted Average Cost) recalculation; scrap pool; consumables log
- **Purchases module**: Vendor management; purchase entry with line items; other expenses; installment payments; auto stock/WAC updates
- **Accounts module**: Cash and bank account management; deposits and transfers; auto-calculated balances; transaction history
- **Dashboard**: KPI widgets; account balances; outstanding dues; pending salaries; low stock alerts; income/expense chart
- **Caching layer**: TanStack React Query integration; shared hooks for accounts, customers, vendors, workers, subtypes; mutation invalidation
- **ESLint**: Flat config with ignores for generated files
- **Environment setup**: `.env.example` template with documentation
- **Session log**: Comprehensive development tracking

---

## Initial Development — 2026-05-01 to 2026-05-08

- Project initialization
- Database schema design (22 tables, 15 enums)
- Module-by-module implementation (Auth → Accounts → Inventory → Purchases → Sales → HR → Reports → Settings)
- Mobile responsiveness audit and fixes
- Accessibility improvements
- Design token alignment (border-radius, shadows, fonts)
- Manual testing across 34 pages and 42 API endpoints
