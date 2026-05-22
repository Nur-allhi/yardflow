# Fix Plan — After UI Polish Test Session

> Generated: 2026-05-22

---

## A — Remove `default_price_per_kg` (14 files)

| File | Change |
|------|--------|
| `src/lib/db/schema.ts` | Remove column → `drizzle-kit generate + migrate` |
| `src/app/api/inventory/subtypes/route.ts` | Remove from Zod + POST handler |
| `src/app/api/inventory/subtypes/[id]/route.ts` | Remove from Zod + GET/PUT |
| `src/app/(dashboard)/inventory/subtypes/page.tsx` | Remove form field + table column + mobile card display |
| `src/app/(dashboard)/inventory/page.tsx` | Remove from query + category map |
| `src/app/(dashboard)/inventory/InventoryClient.tsx` | Remove from interface |
| `src/hooks/useCategories.ts` | Remove from Subtype interface |
| `src/app/(dashboard)/purchases/new/page.tsx` | Remove from Subtype interface |
| `src/app/(dashboard)/sales/new/page.tsx` | Remove from Subtype interface |
| `src/app/(dashboard)/sales/new/quick/page.tsx` | Remove from Subtype interface |
| `scripts/seed.ts` | Remove from seed data |
| `scripts/seed.mjs` | Remove from SQL inserts |
| `CONTEXT.md` | Update column description |

---

## B — Fix green-on-green category chip (1 file)

**File**: `src/app/(dashboard)/inventory/subtypes/page.tsx`
**Line 115**: `text-on-tertiary-container bg-tertiary-container border border-on-tertiary-container`
→ `text-white bg-tertiary-container border border-tertiary-container`

---

## C — Wire sub-type edit functionality (1 file)

**File**: `src/app/(dashboard)/inventory/subtypes/page.tsx`
- Add state: `editingId`, `editName`, `editUnit`
- Add `startEdit(st)` — pre-fills values from subtype
- Add save mutation — `PUT /api/inventory/subtypes/[id]`
- Wire desktop edit button (line 194) + mobile edit button (line 236)
- Inline edit form on row/card (categories pattern)

---

## D — Fix accounts balance not updating (new utility + 12 routes)

### D1 — Create shared utility
**New file**: `src/lib/accounts.ts`
- `recordAccountTransaction(params)` — `db.transaction()` that:
  1. `INSERT INTO account_transactions`
  2. SQL subquery to recalculate `accounts.current_balance`
- Input: `{ organization_id, account_id, type, amount, reference_type, reference_id?, note?, transaction_date }`

### D2 — Migrate all 12 transaction routes

| Route | Status | Action |
|-------|--------|--------|
| `purchases/[id]/payments/route.ts` | Has recalc | Refactor to use utility |
| `sales/[id]/payments/route.ts` | Has recalc | Refactor to use utility |
| `sales/route.ts` | Has recalc | Refactor to use utility |
| `purchases/vendors/[id]/pay-opening-balance/route.ts` | Has recalc | Refactor to use utility |
| `sales/customers/[id]/receive-opening-balance/route.ts` | Has recalc | Refactor to use utility |
| `accounts/deposit/route.ts` | Simple arithmetic | Refactor to use utility |
| `accounts/transfer/route.ts` | Simple arithmetic | Refactor to use utility |
| `purchases/route.ts` | **MISSING recalc** | Add + refactor |
| `inventory/consumables/route.ts` | **MISSING recalc** | Add + refactor |
| `sales/scrap/route.ts` | **MISSING recalc** | Add + refactor |
| `hr/payroll/pay/route.ts` | **MISSING recalc** | Add + refactor |
| `hr/advances/route.ts` | **MISSING recalc** | Add + refactor |

### D3 — Auto-refresh dashboard
- Add `refetchInterval: 30000` to accounts dashboard queries

---

## E — Fix sales summary card overflow (1 file)

**File**: `src/app/(dashboard)/sales/page.tsx`
- Lines 253, 270, 287, 304: `w-[140px] flex-shrink-0` → `w-fit min-w-[120px] flex-shrink-0`
- Add `border` class (not just `md:border`) on all 4 cards
- Line 264: Add `৳` prefix to Total Sales value (match design mockup)

---

## F — Fix scrap page grid layout (1 file)

**File**: `src/app/(dashboard)/inventory/scrap/page.tsx`
- Wrap Add Scrap card (lines 418-457) + Quick Scrap Sale button in a single `lg:col-span-4` container
- Replace "New Scrap Sale" card (lines 459-531) with a simple CTA button:
  - Remove stats summary (Available kg, Est. Price, Total Value)
  - Keep a styled `Link` to `/sales/scrap/new` with text "Sell Scrap"

---

## G — Add missing `tertiary` color to Tailwind config (1 file)

**File**: `tailwind.config.ts`
- Add `"tertiary": "#059669"` to `theme.extend.colors`
- Fixes invisible buttons/badges/text across **~40+ files** in one line

---

## H — Fix HR redirect (1 file)

**File**: `src/app/(dashboard)/hr/page.tsx`
- Line 4: `redirect("hr/workers")` → `redirect("/hr/workers")`
- Relative path resolves to `/hr/hr/workers` (doubled, 404s) — absolute path fixes it

---

## I — Restructure consumables module (5 files)

| Sub-task | File | Change |
|----------|------|--------|
| I1 | `src/app/api/inventory/consumables/route.ts` | Fix "most_used_item" query: count from `consumptionLogs`, not purchases |
| I2 | `src/app/api/inventory/consumables/route.ts` | Fix merge logic: stop merging purchases into single row, always create new entries |
| I3 | `src/app/(dashboard)/inventory/consumables/page.tsx` | Refactor Use form: replace separate `/use` page with bottom sheet/modal |
| I4 | `src/app/(dashboard)/inventory/consumables/page.tsx` | Add consumption history display alongside purchase log |
| I5 | `src/app/(dashboard)/inventory/consumables/page.tsx` | Fix mobile cards: dynamic icons per item, fix subtitle to show "date • qty unit", remove hardcoded "Verified" badge |

---

## Execution Order

```
A → B → C → G → H → E → F → D → I
```

- **A–C**: Subtypes (isolated, can batch)
- **G**: Global color fix (prerequisite for seeing button fixes)
- **H**: HR redirect (trivial, 1 line)
- **E–F**: Sales + Scrap page fixes (independent)
- **D**: Accounts balance (largest scope, shared utility)
- **I**: Consumables (biggest refactor, saved for last)

---

## Error Log (from testing)

See `ERROR.md` for:
1. ⚠ Viewport metadata deprecation (warning, 13+ pages)
2. 🔴 Sales API — `status=all` enum error (500)
3. 🔴 Multiple API endpoints — DB timeout (500, intermittent)
