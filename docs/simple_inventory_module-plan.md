# Simplified Inventory Module — Implementation Plan

## Overview
A parallel inventory system that coexists with the existing detailed (category/sub-type) mode. Each org chooses their mode via an `inventory_mode` setting on the org profile.

| Mode | Routes & Pages |
|------|---------------|
| `detailed` (default) | Current `/inventory`, `/purchases`, `/sales` |
| `simple` | New `/inventory-simple`, `/purchases-simple`, `/sales-simple` |

---

## Core Concept

Instead of categories → sub-types with per-sub-type WAC and stock tracking, inventory is a **single pool** measured in kg. Weighted Average Cost is computed globally.

On purchase (in transaction):
```
pool.total_value  += SUM(item.qty * item.price)
pool.total_kg     += SUM(item.qty)
pool.avg_price     = total_value / total_kg    (auto-generated column)
```

On sale (in transaction):
```
COGS             = item.qty * pool.avg_price
pool.total_value -= COGS
pool.total_kg    -= item.qty
```

Scrap and consumables reuse existing tables (they don't depend on categories/sub-types).

---

## Schema Changes

### 1. `organizations` table — add column
```
inventory_mode: text("inventory_mode").default("detailed").notNull()
```

### 2. New tables

```
inventory_pool (single row per org, auto-created on first purchase)
├── organization_id     uuid PK/FK → organizations
├── total_quantity_kg   decimal(15,3) default 0
├── total_value         decimal(15,2) default 0
└── avg_price_per_kg    (generated: total_value / total_quantity_kg)

inventory_movements
├── id                  uuid PK
├── organization_id     uuid FK → organizations
├── movement_type       "in" | "out"
├── quantity_kg         decimal(12,3)
├── price_per_kg        decimal(10,2)      — for "in" movements; for "out" uses avg_price
├── total_value         decimal(15,2)
├── reference_type      "purchase" | "sale" | "adjustment"
├── reference_id        uuid
├── description         text
├── movement_date       timestamp with tz
├── note                text

simple_purchases
├── id                  uuid PK
├── organization_id     uuid FK
├── vendor_id           uuid FK → vendors
├── purchase_date       timestamp with tz
├── total_amount        decimal(15,2)
├── paid_amount         decimal(15,2) default 0
├── due_amount          (generated: total_amount - paid_amount)
├── status              "paid" | "partial" | "due"
├── note                text
├── deleted_at          timestamp

simple_purchase_items
├── id                  uuid PK
├── organization_id     uuid FK
├── purchase_id         uuid FK
├── description         text                ← plain text, no subtype reference
├── quantity_kg         decimal(12,3)
├── price_per_kg        decimal(10,2)
├── total_amount        (generated: quantity_kg * price_per_kg)

simple_purchase_payments
├── id                  uuid PK
├── organization_id     uuid FK
├── purchase_id         uuid FK
├── amount              decimal(15,2)
├── account_id          uuid FK → accounts
├── payment_date        timestamp with tz
├── note                text
├── deleted_at          timestamp

simple_sales
├── id                  uuid PK
├── organization_id     uuid FK
├── customer_id         uuid FK → customers (nullable for quick cash)
├── customer_name       text (for quick cash)
├── sale_type           "fabricated" | "raw_passthrough"
├── is_quick_cash_sale  boolean default false
├── sale_date           timestamp with tz
├── total_amount        decimal(15,2)
├── paid_amount         decimal(15,2) default 0
├── due_amount          (generated)
├── status              "paid" | "partial" | "due"
├── note                text
├── deleted_at          timestamp

simple_sale_items
├── id                  uuid PK
├── organization_id     uuid FK
├── sale_id             uuid FK
├── description         text
├── quantity_kg         decimal(12,3)
├── price_per_kg        decimal(10,2)
├── total_amount        (generated)

simple_sale_payments
├── id                  uuid PK
├── organization_id     uuid FK
├── sale_id             uuid FK
├── amount              decimal(15,2)
├── account_id          uuid FK → accounts
├── payment_date        timestamp with tz
├── note                text
├── deleted_at          timestamp
```

---

## API Routes (prefixed `/api/simple/`)

| Route | Method(s) | Purpose |
|-------|-----------|---------|
| `/api/simple/pool` | GET | Current pool state (total kg, avg price, total value) |
| `/api/simple/movements` | GET | Movement history (paginated, filterable) |
| `/api/simple/adjust` | POST | Stock adjustment (+/- kg, reason) |
| `/api/simple/purchases` | GET, POST | List + create purchases |
| `/api/simple/purchases/[id]` | GET, PUT, DELETE | Single purchase CRUD |
| `/api/simple/purchases/[id]/payments` | POST | Record payment |
| `/api/simple/sales` | GET, POST | List + create sales |
| `/api/simple/sales/[id]` | GET, PUT, DELETE | Single sale CRUD |
| `/api/simple/sales/[id]/payments` | POST | Record payment |

---

## Pages

### Inventory Simple
| Route | Page | Content |
|-------|------|---------|
| `/inventory-simple` | Overview | Pool KPI card (total kg, avg price, total value) + recent movements |
| `/inventory-simple/ledger` | Ledger | Full movement history (paginated, filter by date/type) |
| `/inventory-simple/scrap` | Scrap | Reuses existing scrap_pool table — same as current scrap page |
| `/inventory-simple/consumables` | Consumables | Reuses existing consumables tables — same as current consumables page |

### Purchases Simple
| Route | Page | Content |
|-------|------|---------|
| `/purchases-simple` | List | Summary cards + table/cards with filters |
| `/purchases-simple/new` | New Purchase | Vendor selector + dynamic line items (description, kg, price) |
| `/purchases-simple/[id]` | Detail | Items table, payments, record payment modal |

### Sales Simple
| Route | Page | Content |
|-------|------|---------|
| `/sales-simple` | List | Summary cards + table/cards with filters |
| `/sales-simple/new` | New Sale | Customer selector + dynamic line items |
| `/sales-simple/new/quick` | Quick Cash | No customer, single line, immediate payment |
| `/sales-simple/[id]` | Detail | Items table, payments, record payment modal |

---

## Navigation (conditional by `inventory_mode`)

```
Sidebar / MobileBottomNav:

if mode === "detailed":
  Inventory → /inventory
  Purchases → /purchases
  Sales     → /sales

if mode === "simple":
  Inventory → /inventory-simple
  Purchases → /purchases-simple
  Sales     → /sales-simple
```

Inventory-simple sub-nav (Overview / Ledger / Scrap / Consumables) — same pattern as current InventoryNav.

---

## Reports Update

`src/lib/calculations/profit.ts` — branch on org's `inventory_mode`:
- `detailed`: queries existing purchase_items / sale_items (with subtype joins)
- `simple`: queries simple_purchase_items / simple_sale_items (no subtype joins, uses description)

---

## Files to Create

### API Routes (9 files)
```
src/app/api/simple/pool/route.ts
src/app/api/simple/movements/route.ts
src/app/api/simple/adjust/route.ts
src/app/api/simple/purchases/route.ts
src/app/api/simple/purchases/[id]/route.ts
src/app/api/simple/purchases/[id]/payments/route.ts
src/app/api/simple/sales/route.ts
src/app/api/simple/sales/[id]/route.ts
src/app/api/simple/sales/[id]/payments/route.ts
```

### Pages (10 files)
```
src/app/(dashboard)/inventory-simple/page.tsx               (Overview)
src/app/(dashboard)/inventory-simple/ledger/page.tsx
src/app/(dashboard)/inventory-simple/scrap/page.tsx
src/app/(dashboard)/inventory-simple/consumables/page.tsx
src/app/(dashboard)/purchases-simple/page.tsx
src/app/(dashboard)/purchases-simple/new/page.tsx
src/app/(dashboard)/purchases-simple/[id]/page.tsx
src/app/(dashboard)/sales-simple/page.tsx
src/app/(dashboard)/sales-simple/new/page.tsx
src/app/(dashboard)/sales-simple/new/quick/page.tsx
src/app/(dashboard)/sales-simple/[id]/page.tsx
```

### Nav Component
```
src/components/InventorySimpleNav.tsx      (Overview / Ledger / Scrap / Consumables sub-nav)
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/db/schema.ts` | Add `inventory_mode` column + 7 new tables + relations |
| `src/lib/calculations/profit.ts` | Branch logic for simple mode |
| `src/app/api/settings/route.ts` | Expose `inventory_mode` in GET/PUT |
| `src/components/Sidebar.tsx` | Conditional nav links based on mode |
| `src/components/MobileSidebar.tsx` | Same |
| `src/components/MobileBottomNav.tsx` | Same |

---

## Implementation Order

1. Schema: `inventory_mode` column + migration
2. Schema: 7 new tables + relations + migration
3. Pool API + movements API + adjust API
4. Simple purchases API (CRUD + payments)
5. Simple sales API (CRUD + payments)
6. Inventory-simple pages (Overview, Ledger, Scrap, Consumables)
7. Purchases-simple pages (list, new, detail)
8. Sales-simple pages (list, new, quick, detail)
9. Navigation: conditional Sidebar / MobileSidebar / MobileBottomNav
10. Reports: update profit calculation for simple mode

---

## Quality Gates
- `npx tsc --noEmit` — zero errors
- `npx eslint .` — zero errors
- `npx next build` — succeeds
- After each step, commit with descriptive message
