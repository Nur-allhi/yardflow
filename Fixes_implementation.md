# Fixes Implementation Plan

> Merged from `Findings_v3.md`
> Priority: P0 (crash) → P1 (bug) → P2 (missing feature) → P3 (polish)

---

## P0 — CRASHES (Fix immediately)

| # | Finding | Action | Files | Status |
|---|---------|--------|-------|--------|
| 1 | **Consumables GET 500 error** | Fix `GET /api/inventory/consumables?page=1&limit=20` returning 500 — apply missing migration `0002_dizzy_epoch` | `api/inventory/consumables/route.ts`, migration `0002` | ✅ |

---

## P1 — FUNCTIONALITY BUGS

| # | Finding | Action | Files | Status |
|---|---------|--------|-------|--------|
| 2 | **"truck_fare" column does not exist on payment** | Apply missing migration `0001_illegal_dust` adding truck_fare/labour_cost/food_cost to purchases table | migration `0001` | ✅ |
| 3 | **Sales total showing with wrong currency format** | `total_sales` is a COUNT (not money) — display as plain number, not with ৳ | `sales/page.tsx` | ✅ |

---

## P2 — MISSING UI & NAVIGATION

| # | Finding | Action | Files | Status |
|---|---------|--------|-------|--------|
| 4 | **Vendors with old payable not in Due list** | When `status=due`, also query vendors with `opening_balance > 0` and merge as synthetic entries | `api/purchases/route.ts`, `purchases/page.tsx` | ✅ |
| 5 | **Vendor profile page with payment support** | Create vendor detail page + API; link from vendors list; Record Payment modal selects due purchase | `purchases/vendors/[id]/page.tsx`, `api/purchases/vendors/[id]/route.ts`, `purchases/vendors/page.tsx` | ✅ |
| 6 | **Customer profile page with receive support** | Create customer detail page + API; link from customers list; Record Receive modal selects due sale | `sales/customers/[id]/page.tsx`, `api/sales/customers/[id]/route.ts`, `sales/customers/page.tsx` | ✅ |
| 7 | **Purchase form: dynamic other expenses with account debit** | Replace fixed truck/labour/food fields with dynamic add/remove rows; each row has description, amount, account_id, "add to vendor total" toggle; expenses either debit from account or add to total_amount | `purchases/new/page.tsx`, `api/purchases/route.ts`, `lib/db/schema.ts`, `lib/validations/schemas.ts` | ✅ |

---

## P3 — UI POLISH

| # | Finding | Action | Status |
|---|---------|--------|--------|
| — | *No new P3 items* | — | — |

---

**Total: 7 items** · P0: 1 ✅ · P1: 2 ✅ · P2: 4 ✅ · P3: 0
