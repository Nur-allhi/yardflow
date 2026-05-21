# Fixes Implementation Plan

> Merged from `Findings_v3.md`
> Priority: P0 (crash) → P1 (bug) → P2 (missing feature) → P3 (polish)

---

## P0 — CRASHES (Fix immediately)

| # | Finding | Action | Files | Status |
|---|---------|--------|-------|--------|
| 1 | **Consumables GET 500 error** | Fix `GET /api/inventory/consumables?page=1&limit=20` returning 500 — apply missing migration | `api/inventory/consumables/route.ts`, migration | ✅ |

---

## P1 — FUNCTIONALITY BUGS

| # | Finding | Action | Files | Status |
|---|---------|--------|-------|--------|
| 2 | **"truck_fare" column does not exist on payment** | Debug purchase payment API — likely references wrong column or table | `api/purchases/[id]/payments/route.ts` | ❌ |
| 3 | **Sales total showing with wrong currency format** | Fix KPI card to show plain number, not currency format | `sales/page.tsx` | ❌ |

---

## P2 — MISSING UI & NAVIGATION

| # | Finding | Action | Files | Status |
|---|---------|--------|-------|--------|
| 4 | **Vendors with old payable not in Due list** | Ensure vendors with opening balance but no recent purchases appear in Due filter | `api/purchases/route.ts`, `purchases/vendors/page.tsx` | ❌ |
| 5 | **Vendor profile page with payment support** | Create vendor detail page; add "Add Payment" button that records payment against vendor | `purchases/vendors/[id]/page.tsx`, `api/purchases/vendors/[id]/route.ts` | ❌ |
| 6 | **Customer profile page with receive support** | Create customer detail page; add "Receive Payment" button | `sales/customers/[id]/page.tsx`, `api/sales/customers/[id]/route.ts` | ❌ |
| 7 | **Purchase form: dynamic other expenses with account debit** | Replace fixed truck/labour/food fields with dynamic add/remove rows; each row has description, amount, account_id dropdown; expenses either debit from account or add to vendor total | `purchases/new/page.tsx`, `api/purchases/route.ts`, `lib/db/schema.ts` | ❌ |

---

## P3 — UI POLISH

| # | Finding | Action | Status |
|---|---------|--------|--------|
| — | *No new P3 items* | — | — |

---

**Total: 7 items** · P0: 1 ✅ · P1: 2 ❌ · P2: 4 ❌ · P3: 0
