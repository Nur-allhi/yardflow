# Data Export, Import & Erase — Implementation Plan

## Goal
Add a **Data Management** section under Organization Settings for exporting (JSON + CSV), importing (JSON), and erasing organization data.

---

## Current State (2026-05-25)

- Settings has 3 pages: `/settings` (General), `/settings/team` (Team Members), `/settings/logs` (Activity Logs)
- Pill navigation across all 3: `General | Team Members | Activity Logs`
- `/settings` page has a **mobile-only** "Delete Organization" danger zone (unfinished — no API, no password confirmation, desktop version missing)
- **No data management code exists** — no `data/` or `organization/` API routes, no data page

---

## Settings Nav

Add **Data Management** tab (4th pill) to all 3 existing settings pages (`/settings`, `/settings/team`, `/settings/logs`), linking to `/settings/data`.

Current nav pattern (from each page):
```tsx
<div className="flex gap-2 mb-6 overflow-x-auto pb-2">
  <Link href="/settings">General</Link>
  <Link href="/settings/team">Team Members</Link>
  <Link href="/settings/logs">Activity Logs</Link>
</div>
```

After:
```tsx
<div className="flex gap-2 mb-6 overflow-x-auto pb-2">
  <Link href="/settings">General</Link>
  <Link href="/settings/team">Team Members</Link>
  <Link href="/settings/logs">Activity Logs</Link>
  <Link href="/settings/data">Data Management</Link>
</div>
```

Each link uses `rounded-full pill` classes with `bg-primary text-on-primary` for active page.

---

## Updated Table Inventory

All tables that exist in the schema as of 2026-05-25, grouped by module:

### Auth & Org
| Table | Notes |
|-------|-------|
| `organizations` | 1 row per export — exported as metadata, not as array |
| `users` | Includes password hashes — **exclude from export** or hash-strip |
| `sessions` | Ephemeral — **skip** in export |

### Bank & Cash
| Table | Notes |
|-------|-------|
| `accounts` | FK → org |
| `account_transactions` | FK → account |

### Inventory (Detailed Mode)
| Table | Notes |
|-------|-------|
| `material_categories` | FK → org |
| `material_subtypes` | FK → category |
| `stock_ledger` | FK → subtype, references purchase/sale |
| `scrap_pool` | FK → org |
| `consumables_log` | FK → account |
| `consumption_logs` | FK → consumable |

### Vendors & Purchases (Detailed)
| Table | Notes |
|-------|-------|
| `vendors` | FK → org |
| `purchases` | FK → vendor |
| `purchase_items` | FK → purchase, subtype |
| `purchase_payments` | FK → purchase, account |
| `purchase_other_expenses` | FK → purchase, account |

### Customers & Sales (Detailed)
| Table | Notes |
|-------|-------|
| `customers` | FK → org |
| `sales` | FK → customer (nullable) |
| `sale_items` | FK → sale, subtype (nullable) |
| `sale_payments` | FK → sale, account |

### HR & Payroll
| Table | Notes |
|-------|-------|
| `workers` | FK → org, user (nullable) |
| `salary_advances` | FK → worker, account |
| `salary_payments` | FK → worker, account |

### Reports
| Table | Notes |
|-------|-------|
| `period_reports` | FK → org |

### Activity Logs
| Table | Notes |
|-------|-------|
| `activity_logs` | FK → org, user |

### Simple Inventory Mode
| Table | Notes |
|-------|-------|
| `inventory_pool` | PK = org_id (1 row per org) |
| `inventory_movements` | FK → org |
| `simple_purchases` | FK → vendor |
| `simple_purchase_items` | FK → purchase |
| `simple_purchase_payments` | FK → purchase, account |
| `simple_purchase_other_expenses` | FK → purchase, account |
| `simple_sales` | FK → customer (nullable) |
| `simple_sale_items` | FK → sale |
| `simple_sale_payments` | FK → sale, account |

---

## 1. Data Export — `GET /api/settings/data/export`

### JSON Export (default)
- Queries all tables in parent→child FK-safe order
- **Skips**: `sessions` (ephemeral), strips `password_hash` from `users`
- Returns `Content-Type: application/json`
- Content-Disposition: `attachment; filename="yardflow-export-{orgName}-{date}.json"`

Response shape:
```json
{
  "exported_at": "2026-05-25T...",
  "version": "1.0.0",
  "organization": { "name": "...", "address": "...", ... },

  "accounts": [...], "accountTransactions": [...],

  "materialCategories": [...], "materialSubtypes": [...],
  "stockLedger": [...], "scrapPool": [...],
  "consumablesLog": [...], "consumptionLogs": [...],

  "vendors": [...],
  "purchases": [...], "purchaseItems": [...],
  "purchasePayments": [...], "purchaseOtherExpenses": [...],

  "customers": [...],
  "sales": [...], "saleItems": [...], "salePayments": [...],

  "workers": [...], "salaryAdvances": [...], "salaryPayments": [...],

  "periodReports": [...],

  "activityLogs": [...],

  "inventoryPool": [...], "inventoryMovements": [...],
  "simplePurchases": [...], "simplePurchaseItems": [...],
  "simplePurchasePayments": [...], "simplePurchaseOtherExpenses": [...],
  "simpleSales": [...], "simpleSaleItems": [...], "simpleSalePayments": [...]
}
```

### CSV Export — `?format=csv&table=accounts`
- Query params: `format=csv`, `table=<entity_name>` or `table=all`
- Single table: returns `Content-Type: text/csv`, headers match DB column names
- `table=all`: returns `.zip` containing one CSV file per entity
- Skip `users` (password hash concern), `sessions` (ephemeral)

### UI
Two sections on `/settings/data`:
- **Export All Data (JSON)** — single "Download" button
- **Export as CSV** — dropdown or list of entity names, each downloads individually, plus "Download All CSV (ZIP)"

---

## 2. Data Import — `POST /api/settings/data/import`

- Accepts JSON file matching export format via `multipart/form-data`
- Server validates each entity group with Zod
- Generates **new UUIDs** for all imported records (never overwrites existing)
- **Merges** into existing data — adds to it, never deletes
- Imports in parent→child FK-safe order inside a **single `db.transaction()`**
- Skips records with unresolvable FK references; collects errors per entity
- Returns: `{ imported: { accounts: 2, sales: 5, ... }, errors: ["row X skipped: missing category"] }`
- **Does not import**: `users` (password hashes are sensitive), `sessions` (ephemeral)
- **Rewrites**: `organization` metadata skipped (only the org name/address from export metadata is shown as preview, not imported)

### UI
- File upload area (drag-and-drop + click)
- Preview: file name, entity counts parsed
- "Start Import" button with confirmation
- Result summary after import

---

## 3. Data Erase — Two Levels

Both require:
1. **Password re-auth** — user enters current password, server verifies with bcrypt before proceeding
2. **Typed confirmation** — user types `ERASE` or `DELETE ORGANIZATION`

| Action | Deletes | API | Confirmation text |
|--------|---------|-----|-------------------|
| **Erase All Data** | All transactional data (accounts, inventory, purchases, sales, HR, reports, activity logs, sessions) — keeps org profile + users | `DELETE /api/settings/data` | Type `ERASE` |
| **Delete Organization** | Everything — org + users + all data | `DELETE /api/settings/organization` | Type `DELETE ORGANIZATION` |

- Both handlers verify password from request body against the stored hash
- Deletion order: child→parent FK-safe (reverse of export), wrapped in `db.transaction()`
- `DELETE /api/settings/organization` also clears JWT cookie and redirects to `/login`

### Scope of "Erase All Data"

| Kept | Deleted |
|------|---------|
| `organizations` row | `accounts`, `account_transactions` |
| `users` rows | `material_categories`, `material_subtypes` |
| — | `stock_ledger`, `scrap_pool` |
| — | `consumables_log`, `consumption_logs` |
| — | `vendors`, `purchases`, `purchase_items`, `purchase_payments`, `purchase_other_expenses` |
| — | `customers`, `sales`, `sale_items`, `sale_payments` |
| — | `workers`, `salary_advances`, `salary_payments` |
| — | `period_reports`, `activity_logs` |
| — | `sessions` |
| — | `inventory_pool`, `inventory_movements` |
| — | `simple_purchases`, `simple_purchase_items`, `simple_purchase_payments`, `simple_purchase_other_expenses` |
| — | `simple_sales`, `simple_sale_items`, `simple_sale_payments` |

### UI (on `/settings/data` page)
- Two danger zone cards with red borders
- Each: description, password input, confirmation text input, destructive button
- Replace the existing mobile-only "Delete Organization" button on `/settings` with a link to `/settings/data` danger zone
- Desktop should also show the danger zone (currently mobile-only)

---

## Table dependency order

### Export / Import order (parent→child):

**Detailed mode tables:**
1. `organization` (metadata only)
2. `accounts`, `materialCategories`
3. `materialSubtypes`, `vendors`, `customers`, `workers`
4. `purchases`, `sales`, `consumablesLog`, `salaryAdvances`
5. `purchaseItems`, `purchasePayments`, `purchaseOtherExpenses`, `saleItems`, `salePayments`, `stockLedger`, `scrapPool`, `consumptionLogs`, `salaryPayments`
6. `accountTransactions`, `periodReports`, `activityLogs`

**Simple mode tables (interleaved after their parents):**
- `inventoryPool` — after org (only 1 row, no FK dependencies)
- `simplePurchases` — alongside `purchases` (depends on `vendors`)
- `simplePurchaseItems`, `simplePurchasePayments`, `simplePurchaseOtherExpenses` — alongside their detailed counterparts
- `simpleSales` — alongside `sales` (depends on `customers`)
- `simpleSaleItems`, `simpleSalePayments` — alongside their detailed counterparts
- `inventoryMovements` — alongside `stockLedger` (no FK to other imported tables)

### Erase / Delete order (child→parent):
Reverse of above. Always delete simple-mode tables first, then detailed-mode tables.

---

## Files to create/modify

| File | Action |
|------|--------|
| `src/app/api/settings/data/export/route.ts` | NEW — JSON + CSV export |
| `src/app/api/settings/data/import/route.ts` | NEW — JSON import |
| `src/app/api/settings/data/route.ts` | NEW — DELETE erase transactional data |
| `src/app/api/settings/organization/route.ts` | NEW — DELETE entire org |
| `src/app/(dashboard)/settings/data/page.tsx` | NEW — Data Management page (3 sections: Export, Import, Danger Zone) |
| `src/app/(dashboard)/settings/page.tsx` | Edit nav pills: add Data Management link; move danger zone to data page |
| `src/app/(dashboard)/settings/team/page.tsx` | Edit nav pills: add Data Management link |
| `src/app/(dashboard)/settings/logs/page.tsx` | Edit nav pills: add Data Management link |

---

## Implementation order

1. Data Management nav tab (pill link on all 3 existing settings pages)
2. Data Management page shell (3 sections: Export, Import, Danger Zone)
3. Export API (JSON + CSV per table)
4. Wire Export UI buttons
5. Import API (parse, re-UUID, validate, transaction)
6. Wire Import UI (file upload, preview, confirm)
7. Erase API (`DELETE /api/settings/data`)
8. Delete Org API (`DELETE /api/settings/organization`)
9. Wire Erase/Delete UI (password modal + confirmation input)
10. Remove unfinished "Delete Organization" button from `/settings` page (replace with link to `/settings/data`)
11. Verify: `npx tsc --noEmit`, `npx eslint .`, `npx next build`
