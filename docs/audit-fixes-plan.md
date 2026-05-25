# Audit Fixes Plan

Findings from the May 24 codebase audit, organized by priority.

| Priority | Count |
|----------|-------|
| P0 — BROKEN UI | 1 |
| P1 — FUNCTIONAL BUG | 1 |
| P2 — NAMING / CONSISTENCY | 2 |
| P3 — CODE QUALITY | 1 |

---

## P0 — BROKEN UI

### 1. Dashboard Stock Overview shows empty in simple mode

**File:** `src/app/(dashboard)/page.tsx:126`

**Problem:** In the simple-mode branch, `categoryStock` is hardcoded to `[]`. The Stock Overview panel shows "No categories added" even when the inventory pool has stock.

**Fix:** Query `inventoryPool` to populate a single entry representing total pool stock, so the progress bar reflects overall inventory instead of being empty.

```ts
categoryStock = [{ name: "Total Stock", kg: stockKg }];
```

---

## P1 — FUNCTIONAL BUG

### 2. Dashboard detailed-mode recent sales missing fallback for customer_name

**File:** `src/app/(dashboard)/page.tsx:163`

**Problem:** Same pattern as W2 but in the detailed-mode branch — `customer_name: customers.name` without COALESCE. In detailed mode `customer_id` is required so it won't produce null, but it's inconsistent and fragile if the schema ever changes.

**Fix:** Use `COALESCE(customers.name, sales.customer_name)` for consistency with the simple-mode fix.

---

## P2 — NAMING / CONSISTENCY

### 3. Customers list API uses wrong response key `total_purchases`

**File:** `src/app/api/sales/customers/route.ts:61`

**Problem:** Response field says `total_purchases` when it should be `total_sales`. Currently unused by frontend, but confusing for API consumers.

**Fix:** Rename to `total_sales` in the response.

### 4. Detailed mode `customer_name` without COALESCE (same as P1-2)

Duplicate of P1 — same fix, different branch. Combined under P1.

---

## P3 — CODE QUALITY

### 5. Notes enrichment logic duplicated across 6 payment routes

**Files:**
- `src/app/api/simple/purchases/route.ts`
- `src/app/api/simple/purchases/[id]/payments/route.ts`
- `src/app/api/simple/sales/route.ts`
- `src/app/api/simple/sales/[id]/payments/route.ts`
- `src/app/api/purchases/[id]/payments/route.ts`
- `src/app/api/sales/[id]/payments/route.ts`

**Problem:** The same 4-line pattern for building item-name strings and truncating at 3 items is repeated in all 6 files.

**Fix:** Extract to a shared utility in `src/lib/accounts.ts`:

```ts
export function formatPaymentNote(
  entityName: string,
  itemNames: string[],
  prefix: string,
): string {
  const itemsStr =
    itemNames.length <= 3
      ? itemNames.join(", ")
      : itemNames.slice(0, 3).join(", ") + ` & ${itemNames.length - 3} more`;
  return `${prefix} ${entityName} — ${itemsStr}`;
}
```

---

## Already Fixed (not in this plan)

| Item | Status |
|------|--------|
| W1 — Purchase-creation payment missing from ledger + broken enrichment | ✅ Commit `873ce24` |
| W2 — Dashboard simple-mode COALESCE customer_name | ✅ Commit `873ce24` |
