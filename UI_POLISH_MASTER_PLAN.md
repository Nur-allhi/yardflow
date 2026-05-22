# Master UI Polish Plan — YardFlow ERP

> Merged from: Mobile Responsiveness Audit + Navigation Animation Plan
> Total items: **51** · Delivery: ~22 hours

---

## Quick Summary

| Phase | Focus | Items | Effort | Status |
|-------|-------|-------|--------|--------|
| P0 | Critical UX blockers (mobile) | 5 | ~2h | ⏳ |
| P1 | Functional gaps (missing mobile views) | 9 | ~4h | ⏳ |
| P2 | Touch targets & form UX | 11 | ~4h | ⏳ |
| P3 | Animations (framer-motion) | 6 | ~2h | ⏳ |
| P4 | Accessibility & micro-polish | 4 | ~1h | ⏳ |
| P5 | Design alignment (implement mobile mockups) | 16 | ~9h | ⏳ |

All items at the same priority can be parallelized via sub-agents.

---

## Files to Modify (42 files)

### Auth (4 files)
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`

### Navigation Components (6 files)
- `src/components/Sidebar.tsx`
- `src/components/MobileSidebar.tsx`
- `src/components/MobileBottomNav.tsx`
- `src/components/Breadcrumb.tsx`
- `src/components/InventoryNav.tsx`
- `src/components/PageTransitionWrapper.tsx` (new)

### New Utilities (2 files)
- `src/lib/animation.ts` (new)
- `src/components/PageTransitionWrapper.tsx` (new)

### Accounts (4 files)
- `src/app/(dashboard)/accounts/page.tsx`
- `src/app/(dashboard)/accounts/new/page.tsx`
- `src/app/(dashboard)/accounts/deposit/page.tsx`
- `src/app/(dashboard)/accounts/transfer/page.tsx`

### Inventory (6 files)
- `src/app/(dashboard)/inventory/categories/page.tsx`
- `src/app/(dashboard)/inventory/subtypes/page.tsx`
- `src/app/(dashboard)/inventory/ledger/page.tsx`
- `src/app/(dashboard)/inventory/scrap/page.tsx`
- `src/app/(dashboard)/inventory/consumables/page.tsx`
- `src/app/(dashboard)/inventory/consumables/use/page.tsx`
- `src/app/(dashboard)/inventory/page.tsx` (+ `InventoryClient.tsx`)

### Purchases (4 files)
- `src/app/(dashboard)/purchases/page.tsx`
- `src/app/(dashboard)/purchases/new/page.tsx`
- `src/app/(dashboard)/purchases/[id]/page.tsx`
- `src/app/(dashboard)/purchases/vendors/[id]/page.tsx`

### Sales (5 files)
- `src/app/(dashboard)/sales/page.tsx`
- `src/app/(dashboard)/sales/new/page.tsx`
- `src/app/(dashboard)/sales/new/quick/page.tsx`
- `src/app/(dashboard)/sales/[id]/page.tsx`
- `src/app/(dashboard)/sales/customers/[id]/page.tsx`

### HR (4 files)
- `src/app/(dashboard)/hr/workers/page.tsx`
- `src/app/(dashboard)/hr/workers/[id]/page.tsx`
- `src/app/(dashboard)/hr/advances/new/page.tsx`
- `src/app/(dashboard)/hr/payroll/page.tsx`

### Reports (3 files)
- `src/app/(dashboard)/reports/page.tsx`
- `src/app/(dashboard)/reports/generate/page.tsx`
- `src/app/(dashboard)/reports/[id]/page.tsx`

### Settings (2 files)
- `src/app/(dashboard)/settings/page.tsx`
- `src/app/(dashboard)/settings/team/page.tsx`

---

## P0 — CRITICAL UX BLOCKERS (5 items, ~2h)

| # | File(s) | Issue | Fix |
|---|---------|-------|-----|
| 1 | `login/page.tsx` | Mobile header `h-[353px]` consumes 53% of iPhone SE viewport | Reduce to `min-h-[220px]` or `py-xl` with no fixed height |
| 2 | `login/page.tsx` | Password eye icon is ~20×20px — below 44px minimum touch target | Wrap icon in `min-w-[44px] min-h-[44px]` flex container |
| 3 | `login/page.tsx` | Nested `<Link><button>` renders invalid HTML/a11y violation | Convert `<Link>` to styled `<button>` or `<Link>` with button classes |
| 4 | `register/page.tsx` | Fixed bottom CTA hidden behind iOS keyboard (keyboard overlays, doesn't resize) | Switch to `sticky bottom-0` with `scrollIntoView` on focus; add `visualViewport` API listener |
| 5 | `layout.tsx` | No `viewport-fit=cover` — content behind notch/home indicator on notched devices | Add `viewportFit: "cover"` to metadata export |

---

## P1 — FUNCTIONAL GAPS (9 items, ~4h)

### Missing Mobile Card Lists (tables only render on desktop)

| # | File(s) | Missing Mobile View |
|---|---------|---------------------|
| 6 | `accounts/page.tsx` | Recent transactions table has no `md:hidden` card list |
| 7 | `inventory/ledger/page.tsx` | Stock ledger table has no mobile card list |
| 8 | `inventory/consumables/page.tsx` | Consumables log table has no mobile card list |
| 9 | `purchases/vendors/[id]/page.tsx` | Vendor purchase history table has no mobile card list |
| 10 | `sales/customers/[id]/page.tsx` | Customer sale history table has no mobile card list |
| 11 | `reports/page.tsx` | Reports list table has no mobile card list |
| 12 | `reports/[id]/page.tsx` | Report detail sections could be card-based on mobile |
| 13 | `settings/page.tsx` | Info display section is bare on mobile |
| 14 | `settings/team/page.tsx` | Team members table has no mobile card list |

### Hidden Interactive Elements

| # | File(s) | Issue | Fix |
|---|---------|-------|-----|
| 15 | `inventory/categories/page.tsx` | Edit/delete buttons use `opacity-0 group-hover:opacity-100` — invisible on touch devices | Apply `opacity-0 md:group-hover:opacity-100 md:opacity-100` pattern |

### Missing Navigation/FAB

| # | File(s) | Issue | Fix |
|---|---------|-------|-----|
| 16 | `purchases/page.tsx` | No FAB for new purchase on mobile (sales has one) | Add `fixed bottom-6 right-4` FAB matching sales page pattern |
| 17 | `sales/new/quick/page.tsx` | Submit button scrolls away on long forms | Add `sticky bottom-0` submit bar or fixed-bottom CTA |

---

## P2 — TOUCH TARGETS & FORM UX (11 items, ~4h)

### Touch Target Sizing

| # | File(s) | Issue | Target |
|---|---------|-------|--------|
| 18 | `MobileBottomNav.tsx` | `py-1` (~16px) — far below minimum | `min-h-[56px]` with `py-2` |
| 19 | `Breadcrumb.tsx` | All links lack touch padding on mobile | Add `min-h-[44px]` clickable area with flex centering |
| 20 | `InventoryNav.tsx` | Mobile pills `py-1.5` — too small | Increase to `py-2.5 px-4` |
| 21 | **All form inputs** (all form pages) | `h-[42px]` — 2px below 44px minimum recommendation | Increase to `h-[44px]` |
| 22 | **All pagination** (all list pages) | Prev/next buttons may be too small | Add `min-w-[44px] min-h-[44px]` |

### Globals & Meta

| # | File(s) | Issue | Fix |
|---|---------|-------|-----|
| 23 | `globals.css` | No `-webkit-tap-highlight-color` — gray flash on all taps | Add `* { -webkit-tap-highlight-color: transparent }` |
| 24 | `globals.css` | No safe-area-inset CSS variables available | Add `env(safe-area-inset-*)` fallbacks in body padding |

### Mobile Keyboard / Form UX

| # | File(s) | Issue | Fix |
|---|---------|-------|-----|
| 25 | **All form pages** | No `autoComplete` attributes — browser can't autofill on mobile | Add appropriate `autoComplete` to every input (email, name, tel, etc.) |
| 26 | **All form pages** | No `inputMode` — wrong keyboard layout shown | Add `inputMode="decimal"` for numeric, `inputMode="email"` for email, etc. |
| 27 | **All form pages** | No `enterKeyHint` — keyboard shows "return" instead of "next"/"go" | Add `enterKeyHint="next"` on fields, `enterKeyHint="go"` on last field before submit |
| 28 | `inventory/scrap/page.tsx` | Add scrap form not mobile-optimized (side-by-side layout) | Full-width stacked layout on mobile |

---

## P3 — ANIMATIONS (6 items, ~2h + dependency)

**Requires:** `npm install framer-motion`

| # | Step | File(s) | Description | Effort |
|---|------|---------|-------------|--------|
| 29 | 1 | `src/lib/animation.ts` (new) | Spring configs: `springConfig`, `springSnap`, `fadeIn`, `slideInLeft`, `staggerContainer`, `navItemVariants`, `activeIndicatorVariants` | 5 min |
| 30 | 2 | `Sidebar.tsx` | Wrap nav in `motion.div` with `staggerContainer`; each link → `motion(Link)` with `navItemVariants` + active indicator bar | 30 min |
| 31 | 3 | `MobileSidebar.tsx` | Replace CSS transition with `AnimatePresence` + spring slide; backdrop fade; stagger items on open | 20 min |
| 32 | 4 | `MobileBottomNav.tsx` | `layoutId="active-tab"` for spring active indicator; `whileTap={{ scale: 0.92 }}` on tabs | 30 min |
| 33 | 5 | `PageTransitionWrapper.tsx` (new) | `AnimatePresence mode="wait"` + fade/slide-up on route change; keyed by `usePathname()` | 10 min |
| 34 | 6 | `(dashboard)/layout.tsx` | Wrap `{children}` with `<PageTransitionWrapper>` | 5 min |

### Animation Details

**Sidebar**: Spring stagger (stiffness: 300, damping: 28) — 40ms between each nav item. Active indicator: 4px left border that springs in on active.

**Mobile Sidebar**: Spring slide from left (stiffness: 250, damping: 32). Backdrop uses fade. Nav items stagger in when drawer opens.

**Mobile Bottom Nav**: `layoutId="active-tab"` on background pill — framer-motion auto-handles spring sliding between tab positions. `whileTap={{ scale: 0.92 }}` for touch feedback.

**Page Transitions**: 150ms ease-out. Fade (0→1) + slight slide-up (6px→0). On exit: fade (1→0) + slight slide-down (0→-4px).

---

## P4 — ACCESSIBILITY & MICRO-POLISH (4 items, ~1h)

| # | File(s) | Issue | Fix |
|---|---------|-------|-----|
| 35 | `globals.css` | Login `animate-slide-up` has no `prefers-reduced-motion` fallback | Add `@media (prefers-reduced-motion: reduce) { .animate-slide-up { animation: none; } }` |
| 36 | **All mutation buttons** | No visible loading spinner during async operations | Add `<LoadingSpinner>` or animated dots alongside button text during `isPending` |
| 37 | **All error containers** | Errors not announced to screen readers | Add `role="alert"` and `aria-live="polite"` to error message divs |
| 38 | **All interactive elements** | Focus indicators may be missing on some custom buttons | Ensure `focus-visible:ring-2 focus-visible:ring-primary-container` on all interactive elements |

---

## P5 — DESIGN ALIGNMENT (16 screens, ~9h)

> Align pages with existing mobile mockups in `designs/`.

Each screen's `{name}_mobile/` folder contains `code.html` (HTML mockup) and `screen.png` (screenshot reference).

| # | Screen | Design Reference | Page File(s) |
|---|--------|------------------|--------------|
| 39 | Login | `login_mobile/` | `(auth)/login/page.tsx` |
| 40 | Register | `register_mobile/` | `(auth)/register/page.tsx` |
| 41 | Main Dashboard | `main_dashboard_mobile/` | `(dashboard)/page.tsx` |
| 42 | Accounts Overview | `accounts_overview_mobile/` | `accounts/page.tsx` |
| 43 | Stock Overview | `inventory_stock_overview_mobile/` | `inventory/page.tsx`, `InventoryClient.tsx` |
| 44 | Sub-types Mgmt | `inventory_sub_types_management_mobile/` | `inventory/subtypes/page.tsx` |
| 45 | Scrap Pool | `inventory_scrap_pool_mobile/` | `inventory/scrap/page.tsx` |
| 46 | Consumables Log | `consumables_log_mobile/` | `inventory/consumables/page.tsx` |
| 47 | Purchases List | `purchases_list_mobile/` | `purchases/page.tsx` |
| 48 | New Purchase | `new_purchase_entry_mobile/` | `purchases/new/page.tsx` |
| 49 | Purchase Detail | `purchase_detail_mobile/` | `purchases/[id]/page.tsx` |
| 50 | Sales List | `sales_list_mobile/` | `sales/page.tsx` |
| 51 | New Sale Form | `new_sale_form_mobile/` | `sales/new/page.tsx` |
| 52 | Quick Cash Sale | `quick_cash_sale_mobile/` | `sales/new/quick/page.tsx` |
| 53 | Sale Detail | `sale_detail_mobile/` | `sales/[id]/page.tsx` |
| 54 | Customer List | `customer_list_mobile/` | `sales/customers/page.tsx` |
| 55 | Vendor List | `vendor_list_mobile/` | `purchases/vendors/page.tsx` |
| 56 | Workers List | `workers_list_mobile/` | `hr/workers/page.tsx` |
| 57 | Worker Profile | `worker_profile_detail_mobile/` | `hr/workers/[id]/page.tsx` |
| 58 | Monthly Payroll | `monthly_payroll_mobile/` | `hr/payroll/page.tsx` |
| 59 | Reports List | `reports_list_mobile/` | `reports/page.tsx` |
| 60 | Generate Report | `generate_period_report_mobile/` | `reports/generate/page.tsx` |
| 61 | Saved Report | `saved_report_view_mobile/` | `reports/[id]/page.tsx` |
| 62 | Settings | `general_settings_mobile/` | `settings/page.tsx` |
| 63 | Team Management | `team_management_mobile/` | `settings/team/page.tsx` |

---

## Execution Order

```
Phase 0: Pre-flight
  npm install framer-motion
  Create src/lib/animation.ts

Phase 1: P0 (Critical UX blockers)
  Fix login header, eye icon, nested link, register keyboard, viewport-fit

Phase 2: P1 (Functional gaps)
  Add mobile card lists to 9 pages
  Fix hidden edit/delete buttons
  Add missing FAB and sticky submit

Phase 3: P2 (Touch targets & forms)
  Fix nav touch targets, input heights, globals
  Add autoComplete/inputMode/enterKeyHint to all forms

Phase 4: P3 (Animations)
  Desktop sidebar → Mobile sidebar → Bottom nav → Page transitions

Phase 5: P4 (Accessibility)
  Reduced motion, loading spinners, aria attributes, focus rings

Phase 6: P5 (Design alignment)
  Cross-check each page against mobile design mockups
  Visual polish per mockup spec
```

---

## Verification (After Every Phase)

```bash
npx tsc --noEmit        # TypeScript — zero errors
npx eslint .            # Lint — zero errors
npx next build          # Build — must succeed
```

---

## Commit Strategy

| Commit | Phase | Message |
|--------|-------|---------|
| 1 | Pre-flight | `install: framer-motion + animation utility` |
| 2 | P0 | `fix: critical mobile UX blockers (login/register)` |
| 3 | P1 | `fix: add mobile card views to 9 pages + missing nav` |
| 4 | P2 | `fix: touch targets, form UX, globals` |
| 5 | P3 | `animate: sidebar, mobile nav, page transitions` |
| 6 | P4 | `fix: accessibility & micro-polish` |
| 7 | P5 | `design: align mobile views with design mockups (batch 1)` |
| 8+ | P5 | `design: align mobile views with design mockups (batch N)` |

---

*Master UI Polish Plan — v1.0 — 63 items, 5 phases, ~22h total*
