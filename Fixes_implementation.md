# Fixes Implementation Plan

> Merged from `Findings_v2.md` and `ERROR_FROM_FINDINGS_v2.md`
> Priority: P0 (crash) → P1 (bug) → P2 (missing feature) → P3 (polish)

---

## P0 — CRASHES (Fix immediately)

| # | Finding | Action | Files | Status |
|---|---------|--------|-------|--------|
| 1 | **HR: Nested `<a>` tag** (Error NO: 1) | Fix nested `<Link>` in workers page mobile cards; audit ALL pages for same pattern | `hr/workers/page.tsx` + global audit | ❌ |
| 2 | **HR: Payroll [Object object] on Confirm Payment** | Debug `api/hr/payroll/pay` — 400 error, wrong object serialization | `hr/payroll/page.tsx`, `api/hr/payroll/pay/route.ts` | ❌ |
| 3 | **Consumables: fields inactive after 1 character** | Fix form re-render causing inputs to lose focus/state | `inventory/consumables/page.tsx` | ❌ |

---

## P1 — FUNCTIONALITY BUGS

| # | Finding | Action | Files | Status |
|---|---------|--------|-------|--------|
| 4 | **Account balances not updating after pay/receive** | Debug transaction → balance update logic | `api/accounts/route.ts`, payment routes | ❌ |
| 5 | **Dashboard widgets update inaccurate** | Debug KPI aggregation queries | `(dashboard)/page.tsx` | ❌ |
| 6 | **HR: THIS MONTH ADVANCES not showing** | Fix advance → current-month filter query | `api/hr/advances/route.ts`, workers detail page | ❌ |
| 7 | **HR: Advance history Account column blank** | Fix advance transaction account_id population | `api/hr/advances/route.ts` | ❌ |
| 8 | **Vendor opening balance not flowing to dashboard** | Include opening balance in vendor due across pages | `api/purchases/vendors/route.ts`, `api/purchases/route.ts` | ❌ |
| 9 | **Customer opening balance not flowing to dashboard** | Include opening balance in customer due across pages | `api/sales/customers/route.ts`, `api/sales/route.ts` | ❌ |
| 10 | **Vendor pay button redirects to purchases dashboard** | Fix redirect target URL | `purchases/vendors/page.tsx` | ❌ |
| 11 | **Customer pay button redirects to purchases dashboard** | Fix redirect target URL | `sales/customers/page.tsx` | ❌ |
| 12 | **Vendors page action buttons redirect to sales** | Fix button href targets | `purchases/vendors/page.tsx` | ❌ |
| 13 | **Customers page action buttons redirect to sales** | Fix button href targets | `sales/customers/page.tsx` | ❌ |

---

## P2 — MISSING UI & NAVIGATION

| # | Finding | Action | Files | Status |
|---|---------|--------|-------|--------|
| 14 | **Accounts: Two forms always showing** | Hide deposit/transfer forms under buttons; place buttons top of page | `accounts/page.tsx` | ❌ |
| 15 | **Accounts: Form buttons → separate pages** | Create separate pages for deposit and transfer | `accounts/deposit/page.tsx`, `accounts/transfer/page.tsx` | ❌ |
| 16 | **Consumables: Stock-on-hand tracking** | Add quantity/balance column to consumables model | `api/inventory/consumables/route.ts`, schema | ❌ |
| 17 | **Consumables: Record consumption/usage** | Add consumption log form and API | `inventory/consumables/use/page.tsx`, API route | ❌ |
| 18 | **Consumables: Deduct from running balance** | Auto-deduct on consumption; prevent negative balance | API + DB logic | ❌ |
| 19 | **Consumables: Upgrade to inventory management** | Category, reorder level, unit tracking | Schema, pages | ❌ |

---

## P3 — UI POLISH

| # | Finding | Action | Files | Status |
|---|---------|--------|-------|--------|
| 20 | **Duplicate inventory nav still present** | Remove duplicate `InventoryNav` component | `inventory/consumables/page.tsx` | ❌ |
| 21 | **Bar (\|) showing in front of sales card numbers** | Fix KPI card value rendering | `sales/page.tsx` (cards section) | ❌ |
| 22 | **Sales page second row items overlapping** | Fix CSS grid/flex layout on sale form | `sales/new/page.tsx` | ❌ |
| 23 | **Purchase form "other expenses" fields** | Verify/re-add truck/labour/food fields | `purchases/new/page.tsx` | ❌ |
| — | *P3 items 24–28 from old plan (spinners, animations, dropdowns, date inputs)* | ⏭️ Deferred — design system scope | — | ⏭️ |

---

**Total: 23 items** · P0: 3 ❌ · P1: 10 ❌ · P2: 6 ❌ · P3: 4 ❌ + 5 ⏭️
