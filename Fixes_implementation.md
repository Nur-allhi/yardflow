# Navigation Improvement Plan

> Priority: P0 (foundation) → P1 (quick wins) → P2 (mobile nav) → P3 (flagship)
> Decision log: `AGENTS.md` under "Progress"

---

## P0 — FOUNDATION (Shared components first)

| # | Task | Action | Files | Status |
|---|------|--------|-------|--------|
| 1 | **Shared Breadcrumb component** | Create reusable `<Breadcrumb items={...} />` component with consistent styling (secondary links, primary-container current, chevron_right separator). Replace all 15 manual implementations AND add breadcrumbs to 6 detail pages that have none. | `src/components/Breadcrumb.tsx` (new), all `(dashboard)/*/page.tsx` | ✅ |
| 2 | **Clickable entity links on detail pages** | Make vendor name → vendor profile on purchase detail; customer name → customer profile on sale detail; worker advance/payment links; related transaction refs on account detail. | `purchases/[id]/page.tsx`, `sales/[id]/page.tsx`, `hr/workers/[id]/page.tsx`, `accounts/[id]/page.tsx` | ✅ |

---

## P1 — QUICK WINS (Detail page breadcrumbs + entity links)

| # | Task | Action | Files | Status |
|---|------|--------|-------|--------|
| 3 | **Add breadcrumbs to detail pages** | Integrate shared Breadcrumb on: purchase detail, sale detail, vendor profile, customer profile, worker profile, account detail. Each shows full trail (e.g. Dashboard > Purchases > Purchase #ABC1). | `purchases/[id]/page.tsx`, `sales/[id]/page.tsx`, `purchases/vendors/[id]/page.tsx`, `sales/customers/[id]/page.tsx`, `hr/workers/[id]/page.tsx`, `accounts/[id]/page.tsx` | ✅ |
| 4 | **Refactor all list pages** | Replace manual breadcrumb HTML on all 15 list pages with the shared `<Breadcrumb />` component. | All `(dashboard)/*/page.tsx` | ✅ |

---

## P2 — MOBILE NAV (Scrollable bottom navbar)

| # | Task | Action | Files | Status |
|---|------|--------|-------|--------|
| 5 | **Scrollable mobile bottom navbar** | Expand current 5-icon fixed bottom nav to include ALL modules. Use `overflow-x-auto snap-x` for horizontal scroll. Chips: icon + label. Active chip highlighted. Include: Home, Inventory, Purchases, Sales, HR, Accounts, Reports, Settings. | `src/components/MobileBottomNav.tsx` (new), `src/app/(dashboard)/layout.tsx` | ✅ |

---

## P3 — FLAGSHIP (Global command palette)

| # | Task | Action | Files | Status |
|---|------|--------|-------|--------|
| 6 | **Global command palette (Cmd+K)** | Create modal component triggered by `Cmd+K`/`Ctrl+K`. Groups: Navigation (all routes), Recent (last 5 entities via localStorage), Quick Actions (New Sale, New Purchase, etc.), Entities (vendor/customer/worker search via API). Use `cmdk` library. Add to dashboard layout. | `src/components/CommandPalette.tsx` (new), `src/app/(dashboard)/layout.tsx`, `src/app/api/command-palette/route.ts` (new) | ✅ |

---

## Execution Order

| Step | Item | Why this order |
|------|------|----------------|
| 1 | Breadcrumb component | Foundation — other steps depend on it |
| 2 | Add breadcrumbs + entity links | High impact, relies on step 1 |
| 3 | Refactor list pages | Mechanical replacement, uses step 1 |
| 4 | Mobile bottom nav | Independent layout change |
| 5 | Command palette | Largest feature, saved for last |

---

**Total: 6 items** · P0: 2 ✅ · P1: 2 ✅ · P2: 1 ✅ · P3: 1 ✅
