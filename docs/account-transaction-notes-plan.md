# Account Transaction Notes — Enrichment Plan

## Problem
Account transactions show generic notes like `"Payment for purchase #ABCD"` —
users can't tell what items were involved or who the transaction was with
without clicking through.

## Approach
No schema changes. Enrich the `note` parameter at all `recordAccountTransaction`
call sites to include entity name + item descriptions.

## Note format

**Purchase payment:**
`"Payment to {vendorName} — {item1}, {item2}, {item3}"`

**Sale receipt:**
`"Receipt from {customerName} — {item1}, {item2}, {item3}"`

**Item truncation:** If >3 items, show first 3 + `" & N more"`.

## Files to change

| # | File | Current note | New note |
|---|------|-------------|----------|
| 1 | `api/simple/purchases/route.ts` (upfront payment) | `"Payment for purchase #..."` | `"Payment to {vendor} — {items}"` |
| 2 | `api/simple/purchases/[id]/payments/route.ts` | `note || "Payment for purchase #..."` | `"Payment to {vendor} — {items}"` |
| 3 | `api/simple/sales/route.ts` (upfront payment) | `parsed.data.note || null` | `"Receipt from {customer} — {items}"` |
| 4 | `api/simple/sales/[id]/payments/route.ts` | `parsed.data.note || null` | `"Receipt from {customer} — {items}"` |
| 5 | `api/purchases/[id]/payments/route.ts` | `note || "Payment for purchase #..."` | `"Payment to {vendor} — {items}"` |
| 6 | `api/sales/[id]/payments/route.ts` | `note || "Receipt from {customer} — {items}"` | same pattern |

**Already OK:** Other expenses, deposits, transfers, salaries, advances.

## No changes needed
- Schema (`account_transactions` table) — reuse existing `note` column
- `lib/accounts.ts` — enrichment, recordAccountTransaction
- UI (accounts pages) — already renders `note`
