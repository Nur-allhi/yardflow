# Fixes Implementation Plan

> Based on testing findings from `Finding_after_testing.md`
> Priority: P0 (crash) → P1 (bug) → P2 (missing feature) → P3 (polish)

---

## P0 — CRASHES (Fix immediately)

| # | Finding | Action | Files | Status |
|---|---------|--------|-------|--------|
| 1 | **Consumable page error** (Error 1) | Debug and fix consumables page/API | `inventory/consumables/page.tsx`, `api/inventory/consumables/route.ts` | ✅ |
| 2 | **Sales: Quick sale shows [object Object]** (Error 2) | Fix form submission — wrong object serialization | `sales/new/quick/page.tsx` | ✅ |
| 3 | **HR: Add worker error** (Error 3) | Debug and fix worker creation API | `api/hr/workers/route.ts` | ✅ |
| 4 | **HR: Worker detail page crash** (Error 4) | Debug and fix worker detail page | `hr/workers/[id]/page.tsx`, `api/hr/workers/[id]/route.ts` | ✅ |
| 5 | **HR: Record advance error** (Error 5) | Debug and fix advance creation | `api/hr/advances/route.ts`, `hr/advances/new/page.tsx` | ✅ |
| 6 | **HR: Payroll page crash** (Error 6) | Debug and fix payroll page | `hr/payroll/page.tsx`, `api/hr/payroll/route.ts` | ✅ |

---

## P1 — FUNCTIONALITY BUGS

| # | Finding | Action | Files |
|---|---------|--------|-------|
| 7 | **Account balances not updating on pay/receive** | Debug transaction logic for balance updates | `api/accounts/route.ts`, `api/purchases/[id]/payments/route.ts`, `api/sales/[id]/payments/route.ts` |
| 8 | **Dashboard blank — no data shown** | Debug dashboard KPI widgets | `(dashboard)/page.tsx` |
| 9 | **Vendor opening balance not affecting Accounts Payable** | Add opening balance to vendor due calculation | `api/purchases/vendors/route.ts`, `api/purchases/route.ts` |
| 10 | **Customer opening balance not affecting Accounts Receivable** | Add opening balance to customer due calculation | `api/sales/customers/route.ts`, `api/sales/route.ts` |
| 11 | **Customer opening balance not showing in customer list** | Include opening balance in customer list response | `api/sales/customers/route.ts` |
| 12 | **Vendor page action buttons not working** | Wire up edit/delete buttons | `purchases/vendors/page.tsx` |
| 13 | **Customer page action buttons not working** | Wire up edit/delete buttons | `sales/customers/page.tsx` |

---

## P2 — MISSING UI & NAVIGATION

| # | Finding | Action | Files |
|---|---------|--------|-------|
| 14 | **No logout button** | Add logout to dashboard sidebar | `components/Sidebar.tsx`, `components/MobileSidebar.tsx` |
| 15 | **No nav to `/accounts/transfer`** | Add transfer link to accounts page | `accounts/page.tsx` |
| 16 | **No nav to `/purchases/vendors`** | Add vendors link to purchases page | `purchases/page.tsx` |
| 17 | **No nav to `/sales/customers`** | Add customers link to sales page | `sales/page.tsx` |
| 18 | **No nav to `/sales/scrap/new`** | Add scrap sale link to sales + scrap pages | `sales/page.tsx`, `inventory/scrap/page.tsx` |
| 19 | **No nav to `/settings/team`** | Add team link to settings page | `settings/page.tsx` |
| 20 | **No way to add money to cash/bank (owner deposit)** | Add deposit form to accounts | `accounts/page.tsx`, `api/accounts/route.ts` |
| 21 | **No category edit option** | Add edit button/modal to categories | `inventory/categories/page.tsx` |
| 22 | **No manual "Add Scrap" option** | Add add-scrap form to scrap pool page | `inventory/scrap/page.tsx`, `api/inventory/scrap/route.ts` |
| 23 | **No physical inventory adjustment system** | Create stock adjustment API + UI | `api/inventory/stock/route.ts`, `inventory/ledger/page.tsx` |

---

## P3 — UI POLISH

| # | Finding | Action |
|---|---------|--------|
| 24 | **No loading spinners anywhere** | Add spinner/skeleton to all data-fetching pages |
| 25 | **No animations** | Add subtle transitions (fade in, slide up) |
| 26 | **Dropdowns look outdated** | Style select elements consistently |
| 27 | **Dropdowns need loading spinner while fetching** | Add loading state to dropdowns with API data |
| 28 | **Calendar/date inputs need modern look** | Style date inputs consistently with dropdowns |
| 29 | **Subtype page button placement wrong** | Redesign subtype page layout |
| 30 | **Sub-navigation shown twice on consumables page** | Remove duplicate InventoryNav |
| 31 | **Total purchase number in wrong currency format** | Fix formatMoney usage on purchase list |
| 32 | **Bar (|) showing in front of currency values** | Fix table cell rendering for currency columns |
| 33 | **Other expenses field has extra 0** | Fix input default value in report generate |
| 34 | **PDF currency format broken** | Remove `.toLocaleString()` from PDF generation |
| 35 | **Customer dropdown overlapping with label** | Fix CSS/z-index on sale form |
| 36 | **Purchase form needs "other expenses" fields** | Add truck/labour/food fields to purchase form |

---

**Total: 36 items** · P0: 6 · P1: 7 · P2: 10 · P3: 13
