# Data Export, Import & Erase — Implementation Plan

## Goal
Add a Data Management section under Organization Settings for exporting (JSON + CSV), importing (JSON), and erasing organization data.

---

## Settings Nav
Add **Data Management** tab to the pill nav across all 3 existing settings pages (`/settings`, `/settings/team`, `/settings/logs`), linking to `/settings/data`.

---

## 1. Data Export — `GET /api/settings/data/export`

### JSON Export (default)
- Queries all 20+ tables in parent→child FK-safe order
- Returns `Content-Type: application/json` + `Content-Disposition: attachment; filename="yardflow-export-{orgName}-{date}.json"`

Response shape:
```json
{
  "exported_at": "2026-05-23T...",
  "version": "1.0.0",
  "organization": { ... },
  "accounts": [...], "accountTransactions": [...],
  "materialCategories": [...], "materialSubtypes": [...],
  "stockLedger": [...], "scrapPool": [...],
  "consumablesLog": [...], "consumptionLogs": [...],
  "vendors": [...], "purchases": [...], "purchaseItems": [...],
  "purchasePayments": [...], "purchaseOtherExpenses": [...],
  "customers": [...], "sales": [...], "saleItems": [...], "salePayments": [...],
  "workers": [...], "salaryAdvances": [...], "salaryPayments": [...],
  "periodReports": [...]
}
```

### CSV Export — `?format=csv&table=accounts`
- Query params: `format=csv`, `table=<entity_name>` or `table=all`
- Single table: returns `Content-Type: text/csv`, headers match DB column names
- Table=all: returns `.zip` containing one CSV file per entity

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
- Returns `{ imported: { accounts: 2, sales: 5, ... }, errors: ["row X skipped: missing category"] }`

### UI
- File upload area (drag-and-drop + click)
- Preview: file name, entity counts parsed
- "Start Import" button with confirmation
- Result summary after import

---

## 3. Data Erase — Two Levels

Both require:
1. **Password re-auth** — user enters password, server verifies with bcrypt before proceeding
2. **Typed confirmation** — user types `ERASE` or `DELETE ORGANIZATION`

| Action | Deletes | API | Confirmation text |
|--------|---------|-----|-------------------|
| **Erase All Data** | All transactional data (accounts, inventory, purchases, sales, HR, reports, activity logs, sessions) — keeps org profile + users | `DELETE /api/settings/data` | Type `ERASE` |
| **Delete Organization** | Everything — org + users + all data | `DELETE /api/settings/organization` | Type `DELETE ORGANIZATION` |

- Both handlers verify password from request body against the stored hash
- Deletion order: child→parent FK-safe (reverse of export), wrapped in `db.transaction()`
- `DELETE /api/settings/organization` also clears JWT cookie (redirect to `/login`)

### UI (on `/settings/data` page)
- Two danger zone cards with red borders
- Each: description, password input, confirmation text input, destructive button

---

## Table dependency order

### Export / Import order (parent→child):
1. organization
2. users, accounts, materialCategories
3. materialSubtypes, vendors, customers, workers
4. purchases, sales, consumablesLog, salaryAdvances
5. purchaseItems, purchasePayments, purchaseOtherExpenses, saleItems, salePayments, stockLedger, scrapPool, consumptionLogs, salaryPayments
6. accountTransactions, periodReports, activityLogs

### Erase / Delete order (child→parent):
Reverse of above.

---

## Files to create/modify

| File | Action |
|------|--------|
| `src/app/api/settings/data/export/route.ts` | NEW — JSON + CSV export |
| `src/app/api/settings/data/import/route.ts` | NEW — JSON import |
| `src/app/api/settings/data/route.ts` | NEW — DELETE erase transactional data |
| `src/app/api/settings/organization/route.ts` | NEW — DELETE entire org |
| `src/app/(dashboard)/settings/data/page.tsx` | NEW — Data Management page |
| `src/app/(dashboard)/settings/page.tsx` | Add "Data Management" pill nav link |
| `src/app/(dashboard)/settings/team/page.tsx` | Same nav update |
| `src/app/(dashboard)/settings/logs/page.tsx` | Same nav update |

---

## Implementation order

1. Data Management nav tab (pill link on all 3 settings pages)
2. Data Management page shell (3 sections: Export, Import, Danger Zone)
3. Export API (JSON + CSV per table)
4. Wire Export UI buttons
5. Import API (parse, re-UUID, validate, transaction)
6. Wire Import UI (file upload, preview, confirm)
7. Erase API (`DELETE /api/settings/data`)
8. Delete Org API (`DELETE /api/settings/organization`)
9. Wire Erase/Delete UI (password modal + confirmation input)
10. Verify: tsc --noEmit, eslint ., next build
