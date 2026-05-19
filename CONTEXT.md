# CONTEXT.md — YardFlow ERP

> This file contains the full project context for the AI agent.
> Read this file completely before working on any feature.
> For agent behavior rules → see `AGENTS.md`

| Field | Value |
|---|---|
| Version | 1.0 |
| Type | Multi-tenant SaaS ERP |
| Industry | Iron & YardFlow Workshops |
| Market | Bangladesh |
| Agent Rules | See `AGENTS.md` |
| Status | Ready for Development |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Business Model](#2-business-model)
3. [Product Strategy](#3-product-strategy)
4. [Tech Stack](#4-tech-stack)
5. [Database Schema](#5-database-schema)
6. [Module Specifications](#6-module-specifications)
7. [Business Rules for AI Agents](#7-business-rules-for-ai-agents)
8. [Development Roadmap](#8-development-roadmap)
9. [Folder Structure](#9-folder-structure)
10. [OpenCode Prompt Guide](#10-opencode-prompt-guide)
11. [Definition of Done — V1](#11-definition-of-done--v1)

---

## 1. Project Overview

This is a **multi-tenant SaaS ERP application** built for iron and YardFlow businesses in Bangladesh. Multiple businesses can sign up and use the same application with completely isolated data from each other.

### Goal

- Build a production-ready V1
- Give free access to 1–2 real YardFlow businesses (beta)
- Collect feedback, iterate
- Launch paid monthly subscription
- Use as portfolio proof

### What the App Replaces

Currently, business owners manage everything on **paper**:
- Stock ledger (how much iron is in the workshop)
- Purchase records (what was bought, from whom, at what price)
- Sales records (what was sold, to whom, for how much)
- Worker salary and advance tracking
- Monthly profit/loss calculation

This app digitizes all of that into one system.

---

## 2. Business Model

### 2.1 How the Business Works

```
Shipyard (source of raw materials)
        |
        v
Owner purchases raw iron materials
(various types, thicknesses, prices)
        |
        v
Raw materials arrive at Depo/Workshop
(added to stock ledger)
        |
        v
Workers process raw iron
into finished iron products
(cut, weld, grind per customer spec)
        |
        v
Finished products sold to customers
(priced by weight: tk per kg)
        |
        v
Scrap iron accumulated from processing
(sold in bulk periodically at ~roughly50tk/kg)
```

### 2.2 Key People (Roles)

| Role | Count | Description |
|---|---|---|
| Owner | 1 | Full access. Makes purchases, oversees everything |
| Manager | 2 | Operational access. Day-to-day management |
| Worker | 8+ | Limited access. Own salary/advance info only |
| Customer | Many | External. Buy finished iron products |
| Vendor | Many | External. Supply raw iron from shipyard |

### 2.3 Iron Material Types

Raw iron is purchased in **categories** with multiple **sub-types** (thickness/specification). Each sub-type has its own price that fluctuates with the market.

**Example: Iron Plates (Category A)**

| Sub-type | Thickness | Approx. Purchase Price |
|---|---|---|
| Plates 5–8mm | Thin | 110 tk/kg |
| Plates 9–11mm | Medium-thin | 95 tk/kg |
| Plates 12–13mm | Medium | 92 tk/kg |
| Plates 14–20mm | Medium-thick | 87 tk/kg |
| Plates 25mm | Thick | 90 tk/kg |
| Plates 50mm | Very thick | 95 tk/kg |

**Other categories:**
- **Angle Iron (Type B)** — various sizes, own prices
- **Girder (Type C)** — various sizes, own prices
- **Other types** — added as needed

> **Key rule:** Same category, different sub-types = different prices. Everything is iron, but priced differently by size/thickness.

### 2.4 Three Types of Sales

The business has three distinct ways of selling:

#### Type 1 — Fabricated Sale
- Customer orders specific size/spec of iron
- Raw material is processed (cut, welded, grind) by workers
- Finished product delivered to customer
- **Has scrap + burnout** (calculated at period end)
- Most common sale type

#### Type 2 — Raw Pass-through Sale
- Raw material purchased from shipyard
- Sold directly to customer **without any processing**
- Usually sold at a better price than purchase price
- **No scrap. No burnout. Full weight.**
- Fast turnaround, no workshop labor needed

#### Type 3 — Scrap Sale
- Accumulated scrap iron from all processing over time
- Sold in bulk to scrap dealers
- **All types combined** — same scrap rate regardless of original type
- Price: ~50 tk/kg (fluctuates)
- Calculated and sold **periodically**, not per order

### 2.5 Sales Recording Options

For **every sale**, the user can choose:

| Option | When Used | Customer Record |
|---|---|---|
| Quick Cash Sale | Unknown customer, small amount, immediate cash | NOT required. Just amount + item + kg |
| Recorded Sale | Known customer, large amount, or credit/due | Required. Full customer profile tracked |

> **Rule:** Even quick cash sales are **recorded in finance**. The difference is only whether a customer name/profile is saved.

### 2.6 Due / Credit System

Both purchases and sales can be done on **credit (due)**:

**Buying on Due (Accounts Payable):**
```
Purchase 1,00,000 tk worth of iron
Pay now: 50,000 tk
Due: 50,000 tk → tracked per vendor
Pay later → due reduces to 0
```

**Selling on Due (Accounts Receivable):**
```
Sell 80,000 tk worth of iron
Receive now: 30,000 tk
Due: 50,000 tk → tracked per customer
Customer pays later → single or installments
```

> **Payments can come in installments.** Multiple partial payments are tracked individually until the full amount is cleared.

### 2.7 Wastage & Material Yield System

Processing iron generates three types of output:

```
1000 kg Raw Iron Input
        |
        |---> 900 kg  Finished Product  (sold to customer)
        |---> 50 kg   Scrap             (accumulated, sold later)
        |---> 50 kg   Burnout/Loss      (gone — fire, cutting waste, etc.)
```

#### Important Rules on Wastage

1. **Burnout is NOT tracked per order.** It cannot be measured after every job.
2. **Scrap is NOT tracked per order.** It accumulates over time in a scrap pool.
3. Both are calculated **at period end** (monthly or yearly reconciliation).
4. **Typical burnout ratio: 3–5%** of total input.

#### How Burnout is Calculated (Period End)

```
Total Raw Iron Purchased (period)       = X kg
Minus: Finished Product Sold            = A kg
Minus: Raw Iron Sold (pass-through)     = B kg
Minus: Scrap Sold                       = C kg
Minus: Current Stock in Workshop        = D kg
─────────────────────────────────────────────
Burnout (the gap)                       = X - A - B - C - D kg
Burnout %                               = (Burnout / X) × 100
```

> The app shows this gap automatically. The owner recognizes it as burnout.

### 2.8 Profit Calculation Method

The business uses a **period-based average method** — NOT per-order profit tracking.

```
Period = 1 month OR 1 year (user selects)

INCOME SIDE:
  Total Fabricated Sales Revenue        = ___tk
  Total Raw Pass-through Sales          = ___tk
  Total Scrap Sales Revenue             = ___tk
  ─────────────────────────────────────
  TOTAL INCOME                          = ___tk

COST SIDE:
  Total Raw Material Purchase Cost      = ___tk
  Total Consumables Cost                = ___tk
    (welding rods, grinding paper, etc.)
  Total Worker Salaries Paid            = ___tk
  Total Other Expenses                  = ___tk
  Estimated Burnout Loss                = ___tk
  ─────────────────────────────────────
  TOTAL COST                            = ___tk

RESULT:
  Net Profit / Loss         = Total Income - Total Cost
  Net Profit Per KG         = Net Profit / Total KG Sold
  Status                    = PROFIT ✅ or LOSS ❌
```

**Example:**
- Average purchase price: 80 tk/kg
- Average sell price: 95 tk/kg
- Gross margin: 15 tk/kg
- After subtracting consumables, salaries, burnout: **4–5 tk/kg net profit**
- If result is negative: **loss**

### 2.9 Stock Valuation (WAC Method)

Since same iron type is bought at different prices at different times, the app uses **Weighted Average Cost (WAC)**:

```
Example — Iron Plates 5-8mm:

  Purchase 1: 500 kg @ 110 tk = 55,000 tk
  Purchase 2: 300 kg @ 105 tk = 31,500 tk
  ─────────────────────────────────────────
  Total: 800 kg, 86,500 tk
  WAC = 86,500 / 800 = 108.13 tk/kg

  When 400 kg sold:
  Cost of Goods Sold = 400 × 108.13 = 43,252 tk
  Remaining Stock    = 400 kg @ 108.13 tk/kg
```

WAC recalculates automatically on every new purchase entry.

### 2.10 HR & Payroll System

```
Each worker has INDIVIDUAL salary amount (not flat rate per designation):

  Worker: Rahim     → 15,000 tk/month
  Worker: Karim     → 12,000 tk/month
  Manager: Salim    → 25,000 tk/month

Salary Advance (partial payment before month end):
  Worker takes advance on 10th: 5,000 tk
  Worker takes advance on 20th: 3,000 tk
  Total advances: 8,000 tk

At month end:
  Base Salary       = 15,000 tk
  Total Advances    = 8,000 tk
  Net Payable       = 7,000 tk
  Final payment     = 7,000 tk
  Status            = Fully Paid ✅
```

Multiple advances per month are all tracked and auto-deducted.

### 2.11 Bank & Cash Account System

Every financial transaction is tagged to a specific account:

```
Account Types:
  Cash (physical cash in hand)
  Bank Account A (e.g., Dutch Bangla Bank)
  Bank Account B (e.g., bKash Business)
  (owner adds as many accounts as needed)

Every payment IN or OUT must specify:
  Which account received/paid it?

Dashboard shows:
  Balance per account
  Total balance across all accounts
```

---

## 3. Product Strategy

### 3.1 SaaS Multi-Tenancy

```
Business A signs up → gets unique organization_id (UUID)
Business B signs up → gets different organization_id

Every database table includes organization_id
Every query filters by organization_id automatically
Business A CANNOT see Business B data — enforced at DB level
```

### 3.2 Go-To-Market Plan

```
Phase A — Build V1 (Now)
  Complete, polished, production-ready app

Phase B — Beta Launch
  Give free access to 1–2 real YardFlow businesses
  Observe how they use it, what confuses them

Phase C — Iterate
  Fix real problems, add missing features based on feedback

Phase D — Paid Launch
  Monthly subscription pricing
  Offer continued free tier or trial for new signups

Phase E — Scale
  More businesses, grow MRR
  Full portfolio proof with real users
```

### 3.3 V1 Scope (Build Now)

| Module | Status | Priority |
|---|---|---|
| Auth & Organization (Multi-tenant) | 🔨 Build | P1 |
| Bank & Cash Account Management | 🔨 Build | P1 |
| Inventory (Categories, Sub-types, Stock) | 🔨 Build | P1 |
| Purchase Module + Due Management | 🔨 Build | P1 |
| Sales Module (3 types) + Due Management | 🔨 Build | P1 |
| HR & Payroll + Salary Advance | 🔨 Build | P1 |
| Finance Ledger (auto-linked to all modules) | 🔨 Build | P1 |
| Period Profit/Loss Report | 🔨 Build | P1 |
| Dashboard | 🔨 Build | P1 |

### 3.4 V2 Scope (After Beta Feedback)

| Feature | Reason Deferred |
|---|---|
| Order Management (complex custom orders) | Not critical for basic daily operations |
| Worker Attendance Tracking | Paper works fine for now |
| Subscription Billing System | Not needed until paying customers |
| Bangla Language Support | English acceptable for beta users |
| Advanced Charts & Analytics | Basic reports sufficient for V1 |
| Mobile App | Web is enough for V1 |

---

## 4. Tech Stack

### 4.1 Core Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR, API routes, file-based routing — full-stack in one repo |
| Language | TypeScript | Type safety, fewer runtime bugs, excellent AI agent support |
| Styling | Tailwind CSS | Rapid UI development, utility-first |
| Components | Radix UI | Accessible, unstyled primitives |
| ORM | Drizzle ORM | Type-safe SQL, built-in migration system, lightweight |
| Database | PostgreSQL via Supabase | Managed, scalable, RLS for multi-tenancy, free tier for beta |
| Auth | Custom (bcryptjs + jose) | Cookie-based sessions, full control, no third-party dependency |
| PDF Export | jsPDF + autotable | Invoices, salary slips, period reports |
| Charts | Recharts | Dashboard KPI visualizations |
| Forms | React Hook Form + Zod | Form validation + type-safe API contracts |
| Deployment | Vercel + Supabase | Free tier, instant deploy, auto-scaling |

### 4.2 What NOT to Use

| Technology | Reason |
|---|---|
| Firebase | Not needed. Supabase handles everything better |
| Dexie.js / IndexedDB | Over-engineering for V1. No offline mode needed |
| SQLite (dual-DB setup) | Unnecessary complexity. Single Supabase DB is enough |
| NextAuth | Custom auth gives more control and is simpler for this use case |

### 4.3 Supabase RLS (Row Level Security)

Supabase enforces multi-tenancy at the database level:

```sql
-- Example RLS policy on any table
CREATE POLICY "org_isolation" ON purchases
  FOR ALL
  USING (organization_id = auth.jwt() ->> 'org_id');
```

This means even if code has a bug, the database itself prevents cross-organization data leaks.

---

## 5. Database Schema

> **All tables include these base columns:**
> - `id` — UUID, primary key, auto-generated
> - `organization_id` — UUID, foreign key to organizations, NOT NULL
> - `created_at` — timestamp with timezone, default now()
> - `updated_at` — timestamp with timezone, auto-updated
> - `deleted_at` — timestamp with timezone, nullable (soft delete)

---

### 5.1 Organizations & Auth

#### `organizations`
```
id                  UUID PK
name                TEXT NOT NULL         -- Business name
address             TEXT
phone               TEXT
email               TEXT
plan                ENUM (free, paid)     -- Subscription plan
created_at          TIMESTAMPTZ
```

#### `users`
```
id                  UUID PK
organization_id     UUID FK → organizations
name                TEXT NOT NULL
email               TEXT UNIQUE NOT NULL
password_hash       TEXT NOT NULL         -- bcrypt hashed
role                ENUM (owner, manager, worker)
is_active           BOOLEAN DEFAULT true
created_at          TIMESTAMPTZ
```

#### `sessions`
```
id                  UUID PK
user_id             UUID FK → users
token               TEXT UNIQUE NOT NULL  -- signed JWT
expires_at          TIMESTAMPTZ NOT NULL
created_at          TIMESTAMPTZ
```

---

### 5.2 Bank & Cash Accounts

#### `accounts`
```
id                  UUID PK
organization_id     UUID FK
name                TEXT NOT NULL         -- e.g. "Cash", "Dutch Bangla Bank"
type                ENUM (cash, bank)
bank_name           TEXT                  -- null if type = cash
account_number      TEXT                  -- null if type = cash
current_balance     DECIMAL(15,2) DEFAULT 0
is_active           BOOLEAN DEFAULT true
```

#### `account_transactions`
```
id                  UUID PK
organization_id     UUID FK
account_id          UUID FK → accounts
type                ENUM (credit, debit)
amount              DECIMAL(15,2) NOT NULL
reference_type      ENUM (purchase_payment, sale_payment, salary, advance, transfer, other)
reference_id        UUID                  -- ID of the related record
note                TEXT
transaction_date    DATE NOT NULL
```

---

### 5.3 Inventory

#### `material_categories`
```
id                  UUID PK
organization_id     UUID FK
name                TEXT NOT NULL         -- "Iron Plates", "Angle Iron", "Girder"
description         TEXT
is_active           BOOLEAN DEFAULT true
```

#### `material_subtypes`
```
id                  UUID PK
organization_id     UUID FK
category_id         UUID FK → material_categories
name                TEXT NOT NULL         -- "5-8mm", "9-11mm", "25mm"
default_price_per_kg DECIMAL(10,2)        -- Reference price, not enforced
unit                ENUM (kg, ton) DEFAULT kg
is_active           BOOLEAN DEFAULT true
```

#### `stock_ledger`
```
id                  UUID PK
organization_id     UUID FK
subtype_id          UUID FK → material_subtypes
movement_type       ENUM (in, out)
quantity_kg         DECIMAL(12,3) NOT NULL
price_per_kg        DECIMAL(10,2)         -- Price at time of movement
total_value         DECIMAL(15,2)         -- quantity × price
reference_type      ENUM (purchase, sale_fabricated, sale_raw, adjustment)
reference_id        UUID                  -- FK to purchase or sale
movement_date       DATE NOT NULL
note                TEXT
```

#### `scrap_pool`
```
id                  UUID PK
organization_id     UUID FK
movement_type       ENUM (in, out)
quantity_kg         DECIMAL(12,3) NOT NULL
-- "in" = scrap added (from period reconciliation)
-- "out" = scrap sold (linked to scrap sale)
reference_id        UUID
movement_date       DATE NOT NULL
note                TEXT
```

#### `consumables_log`
```
id                  UUID PK
organization_id     UUID FK
item_name           TEXT NOT NULL         -- "Welding Rod", "Grinding Paper", "Cutting Paper"
quantity            DECIMAL(10,3)
unit                TEXT                  -- "pcs", "box", "kg", "roll"
unit_price          DECIMAL(10,2)
total_price         DECIMAL(12,2) NOT NULL
vendor_name         TEXT
account_id          UUID FK → accounts    -- Which account paid
purchase_date       DATE NOT NULL
note                TEXT
```

---

### 5.4 Vendors & Purchases

#### `vendors`
```
id                  UUID PK
organization_id     UUID FK
name                TEXT NOT NULL
phone               TEXT
address             TEXT
type                ENUM (shipyard, consumable, other)
opening_balance     DECIMAL(15,2) DEFAULT 0  -- Pre-existing due before app
is_active           BOOLEAN DEFAULT true
```

#### `purchases`
```
id                  UUID PK
organization_id     UUID FK
vendor_id           UUID FK → vendors
purchase_date       DATE NOT NULL
total_amount        DECIMAL(15,2) NOT NULL
paid_amount         DECIMAL(15,2) DEFAULT 0
due_amount          DECIMAL(15,2) GENERATED ALWAYS AS (total_amount - paid_amount)
status              ENUM (paid, partial, due) DEFAULT due
note                TEXT
```

#### `purchase_items`
```
id                  UUID PK
organization_id     UUID FK
purchase_id         UUID FK → purchases
subtype_id          UUID FK → material_subtypes
quantity_kg         DECIMAL(12,3) NOT NULL
price_per_kg        DECIMAL(10,2) NOT NULL
total_amount        DECIMAL(15,2) GENERATED ALWAYS AS (quantity_kg × price_per_kg)
```

#### `purchase_payments`
```
id                  UUID PK
organization_id     UUID FK
purchase_id         UUID FK → purchases
amount              DECIMAL(15,2) NOT NULL
account_id          UUID FK → accounts
payment_date        DATE NOT NULL
note                TEXT
```

---

### 5.5 Customers & Sales

#### `customers`
```
id                  UUID PK
organization_id     UUID FK
name                TEXT NOT NULL
phone               TEXT
address             TEXT
type                ENUM (regular, walk_in) DEFAULT regular
opening_balance     DECIMAL(15,2) DEFAULT 0  -- Pre-existing due before app
is_active           BOOLEAN DEFAULT true
```

#### `sales`
```
id                  UUID PK
organization_id     UUID FK
customer_id         UUID FK → customers     -- NULLABLE for quick cash sales
sale_type           ENUM (fabricated, raw_passthrough, scrap)
is_quick_cash_sale  BOOLEAN DEFAULT false   -- true = no customer record
sale_date           DATE NOT NULL
total_amount        DECIMAL(15,2) NOT NULL
paid_amount         DECIMAL(15,2) DEFAULT 0
due_amount          DECIMAL(15,2) GENERATED ALWAYS AS (total_amount - paid_amount)
status              ENUM (paid, partial, due) DEFAULT due
note                TEXT
```

#### `sale_items`
```
id                  UUID PK
organization_id     UUID FK
sale_id             UUID FK → sales
subtype_id          UUID FK → material_subtypes  -- NULLABLE for scrap sales
quantity_kg         DECIMAL(12,3) NOT NULL
price_per_kg        DECIMAL(10,2) NOT NULL
total_amount        DECIMAL(15,2) GENERATED ALWAYS AS (quantity_kg × price_per_kg)
```

#### `sale_payments`
```
id                  UUID PK
organization_id     UUID FK
sale_id             UUID FK → sales
amount              DECIMAL(15,2) NOT NULL
account_id          UUID FK → accounts
payment_date        DATE NOT NULL
note                TEXT
```

---

### 5.6 HR & Payroll

#### `workers`
```
id                  UUID PK
organization_id     UUID FK
user_id             UUID FK → users         -- NULLABLE (not all workers have login)
name                TEXT NOT NULL
phone               TEXT
designation         TEXT                    -- "Manager", "Welder", "Helper", etc.
monthly_salary      DECIMAL(10,2) NOT NULL  -- INDIVIDUAL amount per worker
join_date           DATE
is_active           BOOLEAN DEFAULT true
```

#### `salary_advances`
```
id                  UUID PK
organization_id     UUID FK
worker_id           UUID FK → workers
amount              DECIMAL(10,2) NOT NULL
account_id          UUID FK → accounts      -- Which account paid the advance
advance_date        DATE NOT NULL
month               INTEGER NOT NULL        -- 1–12
year                INTEGER NOT NULL
note                TEXT
```

#### `salary_payments`
```
id                  UUID PK
organization_id     UUID FK
worker_id           UUID FK → workers
month               INTEGER NOT NULL
year                INTEGER NOT NULL
base_salary         DECIMAL(10,2) NOT NULL  -- Snapshot of monthly_salary at time of payment
total_advances      DECIMAL(10,2) DEFAULT 0 -- Sum of all advances for this month
net_payable         DECIMAL(10,2) GENERATED ALWAYS AS (base_salary - total_advances)
paid_amount         DECIMAL(10,2) DEFAULT 0
account_id          UUID FK → accounts
payment_date        DATE
status              ENUM (pending, partial, paid) DEFAULT pending
```

---

### 5.7 Period Reports

#### `period_reports`
```
id                      UUID PK
organization_id         UUID FK
period_type             ENUM (monthly, yearly, custom)
start_date              DATE NOT NULL
end_date                DATE NOT NULL

-- Volume metrics
total_purchased_kg      DECIMAL(15,3)
total_sold_fabricated_kg DECIMAL(15,3)
total_sold_raw_kg       DECIMAL(15,3)
total_scrap_sold_kg     DECIMAL(15,3)
current_stock_kg        DECIMAL(15,3)
burnout_kg              DECIMAL(15,3)   -- Calculated: purchased - sold - scrap - stock
burnout_percent         DECIMAL(5,2)

-- Financial metrics
total_income            DECIMAL(15,2)
total_purchase_cost     DECIMAL(15,2)
total_consumables_cost  DECIMAL(15,2)
total_salary_cost       DECIMAL(15,2)
total_other_expenses    DECIMAL(15,2)
total_cost              DECIMAL(15,2)
net_profit              DECIMAL(15,2)
profit_per_kg           DECIMAL(10,2)
result                  ENUM (profit, loss)

generated_at            TIMESTAMPTZ DEFAULT now()
```

---

## 6. Module Specifications

### Module 1 — Auth & Organization

**Purpose:** Every business registers separately. Data is isolated by organization.

**Screens:**
1. `/register` — Business registration (company name, address, phone, owner details)
2. `/login` — Owner/staff login (email + password)
3. `/settings/team` — Invite team members, assign roles, deactivate users

**Logic:**
- On registration: create `organization` record + `user` record with role = owner
- Login: verify password hash, create signed session cookie with `user_id` + `org_id`
- All subsequent requests: read `org_id` from session cookie — **never trust client-provided org_id**
- Role middleware: owner > manager > worker (each role has defined permissions per route)

---

### Module 2 — Bank & Cash Accounts

**Purpose:** Track money across multiple accounts. Every transaction is tagged to an account.

**Screens:**
1. `/accounts` — List all accounts with current balance
2. `/accounts/new` — Add new account (cash or bank)
3. `/accounts/[id]` — Transaction history for a specific account
4. `/accounts/transfer` — Transfer money between accounts

**Logic:**
- `current_balance` updates on every `account_transactions` insert
- Transfer = one debit + one credit, both same amount, different accounts
- Dashboard pulls balance from all active accounts and sums them

---

### Module 3 — Inventory

**Purpose:** Track raw iron stock levels per material sub-type. Know exactly how much of each type is in the workshop.

**Screens:**
1. `/inventory/categories` — Manage material categories (Iron Plates, Angle, Girder)
2. `/inventory/subtypes` — Manage sub-types per category (5-8mm, 9-11mm, etc.) with default price
3. `/inventory/stock` — Current stock summary (kg per sub-type, WAC, total value)
4. `/inventory/ledger` — Full movement history (all ins and outs with dates and references)
5. `/inventory/scrap` — Scrap pool current total (kg) + movement history
6. `/inventory/consumables` — Log daily consumable purchases (welding rods, etc.)

**Logic:**
- Stock level = sum of all `in` movements - sum of all `out` movements for each subtype
- WAC recalculates on every new purchase (new purchase items trigger WAC update for that subtype)
- Low stock alert threshold configurable per sub-type
- Scrap pool increases from period reconciliation entries, decreases on scrap sales

---

### Module 4 — Purchase Module

**Purpose:** Record all raw material purchases from shipyard vendors. Track what is owed to vendors.

**Screens:**
1. `/purchases/vendors` — Vendor list (name, total due balance per vendor)
2. `/purchases/vendors/new` — Add vendor
3. `/purchases/new` — New purchase entry (select vendor, add line items: subtype + kg + price/kg)
4. `/purchases` — Purchase list (date, vendor, total, paid, due, status)
5. `/purchases/[id]` — Purchase detail (items + full payment history)
6. `/purchases/[id]/pay` — Record payment (amount, account, date, note)

**Logic:**
- On purchase save: create `purchase` + `purchase_items` + update `stock_ledger` (in) + update WAC
- On payment save: create `purchase_payment` + update `purchases.paid_amount` + update `account_transactions` (debit)
- `status` auto-updates: `due_amount = 0` → status = `paid`; `0 < due_amount < total` → `partial`
- Multiple payments allowed until fully paid

---

### Module 5 — Sales Module

**Purpose:** Record all product sales. Track what customers owe. Support three sale types and two recording modes.

**Screens:**
1. `/sales/customers` — Customer list (name, total due balance)
2. `/sales/customers/new` — Add customer
3. `/sales/new/quick` — Quick cash sale form (minimal: item, kg, price, account) — no customer record
4. `/sales/new` — Full recorded sale (customer, sale type, line items, initial payment)
5. `/sales` — Sales list (date, customer or "Cash Sale", type, total, due, status)
6. `/sales/[id]` — Sale detail (items + payment history)
7. `/sales/[id]/pay` — Record installment payment
8. `/sales/scrap/new` — Scrap bulk sale (kg sold, price/kg, buyer name optional, account)

**Logic:**
- Quick cash sale: `customer_id = null`, `is_quick_cash_sale = true`, status auto = `paid`
- On fabricated/raw sale: deduct from `stock_ledger` (out movement) for each subtype sold
- On scrap sale: deduct from `scrap_pool` (out movement)
- On payment: update `sales.paid_amount` + create `account_transactions` (credit)
- Installment: each payment recorded separately, due reduces with each payment

---

### Module 6 — HR & Payroll

**Purpose:** Manage workers, track salary advances, run monthly payroll.

**Screens:**
1. `/hr/workers` — Worker list (name, designation, monthly salary, status)
2. `/hr/workers/new` — Add worker (individual salary amount, not designation-based)
3. `/hr/workers/[id]` — Worker profile (advance history, salary history, total earned)
4. `/hr/advances/new` — Record salary advance (worker, amount, account, date)
5. `/hr/payroll` — Monthly payroll view (all workers, base salary, advances, net payable)
6. `/hr/payroll/pay/[worker_id]` — Pay final salary (remaining amount, account, date)

**Logic:**
- Advance can be recorded anytime: creates `salary_advances` + debits account
- Monthly payroll calculation: `net_payable = base_salary - SUM(advances WHERE month=X AND year=Y)`
- If advances exceed salary: `net_payable` is negative → carry to next month (note in UI)
- Salary payment: creates `salary_payments` record + debits account
- Status: pending → partial → paid based on how much of net_payable is covered

---

### Module 7 — Period Profit/Loss Report

**Purpose:** The most important feature. Shows if the business made money or lost money in a given period.

**Screens:**
1. `/reports` — Report list (past generated reports)
2. `/reports/generate` — Select period (This Month / This Year / Custom Date Range) → calculate
3. `/reports/[id]` — Full report view with all breakdowns + PDF export button

**Report Sections:**

```
VOLUME ANALYSIS:
  Total raw iron purchased (kg)
  Breakdown per material category (kg)
  Total sold as finished product (kg)
  Total sold as raw pass-through (kg)
  Total scrap sold (kg)
  Current stock remaining (kg)
  Burnout calculated (kg) + percentage

FINANCIAL ANALYSIS:
  INCOME:
    Fabricated sales revenue (tk)
    Raw pass-through sales revenue (tk)
    Scrap sales revenue (tk)
    Total income (tk)

  COST:
    Raw material purchase cost (tk)
    Consumables cost (tk)
    Salary cost (tk)
    Other expenses (tk)
    Estimated burnout loss (tk)
    Total cost (tk)

  RESULT:
    Net profit / loss (tk)
    Net profit per kg (tk/kg)
    Status: PROFIT ✅ or LOSS ❌
```

**Logic:**
- Burnout = total_purchased_kg - total_sold_fabricated_kg - total_sold_raw_kg - total_scrap_sold_kg - current_stock_kg
- Burnout loss value = burnout_kg × average_purchase_price_per_kg (WAC for the period)
- Report is saved to `period_reports` table after generation
- PDF export uses jsPDF + autotable

---

### Module 8 — Dashboard

**Purpose:** First screen after login. Owner sees the full business status in 10 seconds.

**Widgets:**
1. **Total Stock** — Total kg in workshop (per material category breakdown)
2. **Today's Sales** — Revenue from today's sales
3. **This Month: Income vs Expense** — Simple comparison bar
4. **Account Balances** — Cash + each bank account balance + grand total
5. **Outstanding Dues:**
   - Customers owe us (AR): total due from all customers
   - We owe vendors (AP): total due to all vendors
6. **Pending Salaries** — Workers not yet paid this month
7. **Low Stock Alerts** — Sub-types below threshold
8. **Quick Actions** — Buttons: New Sale | New Purchase | Record Advance | Generate Report

---

## 7. Business Rules for AI Agents

> **Read this section carefully before building any module. These rules are non-negotiable.**

### 7.1 Multi-Tenancy Rules

```
RULE: Every single database query MUST filter by organization_id.
RULE: organization_id comes from server-side session — NEVER trust client-sent org_id.
RULE: Supabase RLS provides second layer — configure RLS on every table.
RULE: Admin dashboard (for you as the SaaS owner) is a separate protected route.
```

### 7.2 Stock Rules

```
RULE: Stock is tracked per material_subtype (not per category).
RULE: WAC recalculates on every new purchase_items insert for that subtype.
RULE: Scrap is ONE shared pool — all subtypes contribute to same scrap_pool.
RULE: Burnout is NEVER entered manually — it is derived from reconciliation gap.
RULE: Raw pass-through sales deduct from main stock (not scrap pool, no burnout).
RULE: Fabricated sales deduct from main stock — scrap + burnout tracked at period end only.
```

### 7.3 Payment Rules

```
RULE: Every sale and purchase starts with a status (paid/partial/due).
RULE: Payments are recorded one at a time — each payment is its own record.
RULE: After each payment: recalculate paid_amount, recalculate due_amount, update status.
RULE: status = 'paid' ONLY when due_amount = 0.
RULE: Every payment must reference an account_id — no payment without account.
RULE: Quick cash sales: customer_id is NULL, is_quick_cash_sale = true, status = paid.
```

### 7.4 Account Balance Rules

```
RULE: Account balance = SUM(credit transactions) - SUM(debit transactions).
RULE: Every financial event updates account balance atomically (use DB transaction).
RULE: Sale payment received = CREDIT to account.
RULE: Purchase payment made = DEBIT from account.
RULE: Salary/advance payment = DEBIT from account.
RULE: Transfer between accounts = DEBIT source + CREDIT destination, same amount.
RULE: Never allow account balance to go below zero without explicit overdraft flag.
```

### 7.5 Salary Rules

```
RULE: Each worker has their OWN monthly_salary amount — no designation-based flat rate.
RULE: Multiple advances per month are all recorded in salary_advances.
RULE: net_payable = base_salary - SUM(advances for that month+year).
RULE: If net_payable < 0 (over-advanced), note it and carry forward to next month.
RULE: salary_payments.base_salary = snapshot of workers.monthly_salary at payment time.
RULE: All salary/advance payments debit from specified account.
```

### 7.6 Report Rules

```
RULE: Period report generates from existing transaction data — not from manual entry.
RULE: Burnout formula: purchased_kg - sold_fabricated_kg - sold_raw_kg - scrap_sold_kg - current_stock_kg
RULE: WAC for period = total purchase cost / total purchased kg for that period.
RULE: Burnout loss value = burnout_kg × period_WAC.
RULE: Report is READ ONLY after generation — save as snapshot in period_reports table.
RULE: PDF export must be clear and printable — owner takes it to accountant.
```

---

## 8. Development Roadmap

### Overview: 6 Weeks to V1

| Week | Module | Key Deliverables |
|---|---|---|
| Week 1 | Foundation | Project setup, DB schema, Drizzle migrations, Auth system, Organization registration, Role-based middleware |
| Week 2 | Inventory | Material categories + sub-types, Stock ledger, WAC calculation, Scrap pool, Consumables log, Stock summary page |
| Week 3 | Purchase + Bank | Vendor management, Purchase entry + line items, Due tracking, Installment payments, Bank/Cash accounts, Account transaction log |
| Week 4 | Sales | Customer management, Quick cash sale, Full recorded sale (3 types), Scrap sale, Due tracking, Installment payments |
| Week 5 | HR + Reports | Worker profiles, Salary advance recording, Monthly payroll, Period P&L report, Burnout calculation, PDF export |
| Week 6 | Dashboard + Polish | All KPI widgets, Low stock alerts, UI polish, Bug fixes, End-to-end testing, Deploy to Vercel + Supabase |

### Week 1 — Foundation (Detailed)

```
Day 1–2: Project Setup
  - Initialize Next.js 15 with TypeScript
  - Configure Tailwind CSS + Radix UI
  - Set up Supabase project (PostgreSQL)
  - Configure Drizzle ORM + drizzle-kit
  - Set up environment variables

Day 3–4: Database Schema
  - Write all table definitions in schema.ts
  - Run drizzle-kit generate → create migration files
  - Run drizzle-kit migrate → apply to Supabase
  - Configure RLS policies on all tables

Day 5–7: Auth System
  - Registration page + API route
  - Login page + API route (bcrypt verify + jose cookie)
  - Session middleware (reads org_id from cookie)
  - Role-based route protection middleware
  - Basic dashboard layout with nav
```

### Week 2 — Inventory (Detailed)

```
Day 1: Material Categories CRUD
Day 2: Material Sub-types CRUD + default price
Day 3: Stock ledger API (in/out movements)
Day 4: WAC calculation function + Stock summary page
Day 5: Scrap pool tracking
Day 6: Consumables log
Day 7: Low stock alert logic + testing
```

### Week 3 — Purchase + Bank (Detailed)

```
Day 1–2: Account management (add cash/bank accounts, balance display)
Day 3: Vendor management CRUD
Day 4: Purchase entry form (vendor + line items)
Day 5: Purchase list + detail page
Day 6: Payment recording (installments) + account balance update
Day 7: Due tracking + vendor balance summary
```

### Week 4 — Sales (Detailed)

```
Day 1: Customer management CRUD
Day 2: Quick cash sale form
Day 3: Full recorded sale form (fabricated + raw pass-through)
Day 4: Scrap sale form + scrap pool deduction
Day 5: Sales list + detail page
Day 6: Payment recording (installments) + account balance update
Day 7: Customer due balance summary + testing
```

### Week 5 — HR + Reports (Detailed)

```
Day 1: Worker profiles CRUD (individual salary amount)
Day 2: Salary advance form + account debit
Day 3: Monthly payroll view + net payable calculation
Day 4: Salary payment recording
Day 5: Period report generation (all calculations)
Day 6: PDF export (jsPDF + autotable)
Day 7: Report history + testing
```

### Week 6 — Dashboard + Deploy (Detailed)

```
Day 1: Dashboard KPI widgets
Day 2: Low stock alerts + due alerts
Day 3: Quick action buttons
Day 4: UI polish (consistent design, mobile-friendly)
Day 5: End-to-end testing (full business workflow)
Day 6: Bug fixes
Day 7: Deploy to Vercel + configure Supabase production
```

---

## 9. Folder Structure

```
/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                  ← Sidebar nav + session check
│   │   │   ├── page.tsx                    ← Dashboard (KPIs)
│   │   │   ├── accounts/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── inventory/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── categories/page.tsx
│   │   │   │   ├── subtypes/page.tsx
│   │   │   │   ├── scrap/page.tsx
│   │   │   │   └── consumables/page.tsx
│   │   │   ├── purchases/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── vendors/page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── sales/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── customers/page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   ├── new/quick/page.tsx
│   │   │   │   ├── scrap/new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── hr/
│   │   │   │   ├── workers/page.tsx
│   │   │   │   ├── workers/[id]/page.tsx
│   │   │   │   ├── advances/new/page.tsx
│   │   │   │   └── payroll/page.tsx
│   │   │   ├── reports/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── generate/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   └── settings/
│   │   │       ├── page.tsx
│   │   │       └── team/page.tsx
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── logout/route.ts
│   │       │   └── register/route.ts
│   │       ├── accounts/route.ts
│   │       ├── inventory/
│   │       │   ├── categories/route.ts
│   │       │   ├── subtypes/route.ts
│   │       │   ├── stock/route.ts
│   │       │   └── scrap/route.ts
│   │       ├── purchases/route.ts
│   │       ├── purchases/[id]/payments/route.ts
│   │       ├── sales/route.ts
│   │       ├── sales/[id]/payments/route.ts
│   │       ├── hr/workers/route.ts
│   │       ├── hr/advances/route.ts
│   │       ├── hr/payroll/route.ts
│   │       └── reports/route.ts
│   ├── components/
│   │   ├── ui/                             ← Shared Radix UI components
│   │   ├── forms/                          ← Form components per module
│   │   ├── tables/                         ← Data table components
│   │   └── dashboard/                      ← Dashboard widget components
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts                   ← ALL Drizzle table definitions
│   │   │   ├── index.ts                    ← DB connection (Supabase)
│   │   │   └── migrations/                 ← Auto-generated by drizzle-kit
│   │   ├── auth/
│   │   │   ├── session.ts                  ← Cookie read/write helpers
│   │   │   └── middleware.ts               ← Role-based route protection
│   │   ├── calculations/
│   │   │   ├── wac.ts                      ← Weighted Average Cost logic
│   │   │   ├── profit.ts                   ← Period P&L calculation
│   │   │   └── burnout.ts                  ← Burnout gap calculation
│   │   ├── pdf/
│   │   │   └── reports.ts                  ← jsPDF report generation
│   │   └── validations/
│   │       └── schemas.ts                  ← Zod validation schemas
│   └── types/
│       └── index.ts                        ← TypeScript interfaces
├── drizzle.config.ts                       ← Drizzle ORM config
├── middleware.ts                           ← Next.js route middleware
├── .env.local                              ← Environment variables
└── CONTEXT.md                              ← This file (project context for AI agents)
```

---

## 10. OpenCode Prompt Guide

### How to Start Every Session

Paste this at the beginning of every OpenCode session:

```
I am building a multi-tenant SaaS ERP for YardFlow businesses in Bangladesh.

Tech stack:
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + Radix UI
- Drizzle ORM
- PostgreSQL via Supabase
- Custom auth: bcryptjs + jose (signed session cookies)

Multi-tenancy: Every table has organization_id. Session cookie contains user_id + org_id.
All queries MUST filter by organization_id from session — never trust client-provided org_id.

All tables have: id (UUID PK), organization_id (UUID FK), created_at, updated_at, deleted_at (soft delete).

I am now working on: [MODULE NAME]

Business rules for this module: [paste relevant section from Section 6 or 7 of CONTEXT.md]
```

### Module-Specific Prompts

#### Building a Schema
```
Build the Drizzle ORM schema for [table name].
Columns: [list columns from Section 5 of CONTEXT.md]
Include all base columns (id, organization_id, created_at, updated_at, deleted_at).
Use PostgreSQL types. Export the table and its TypeScript type.
```

#### Building an API Route
```
Build a Next.js 15 App Router API route for [endpoint].
Method: [GET/POST/PUT/DELETE]
Input validation: Zod schema
Auth: Read org_id from session cookie using lib/auth/session.ts
Query: Drizzle ORM, filter all queries by organization_id
Return: JSON response with proper error handling
```

#### Building a UI Page
```
Build a Next.js 15 page for [screen name].
Use Tailwind CSS for styling.
Use Radix UI for [Dialog/Select/Table/etc].
Form: React Hook Form + Zod validation
API calls: fetch to /api/[endpoint]
Follow existing page structure in (dashboard)/layout.tsx
```

#### Building a Calculation Function
```
Build a TypeScript function for [WAC / burnout / period profit].
Business logic: [paste exact rule from Section 7 of CONTEXT.md]
Input: [describe inputs]
Output: [describe expected return]
Use Drizzle ORM for any database queries.
```

---

## 11. Definition of Done — V1

V1 is complete and ready for beta users when ALL of the following are true:

### Functional Checklist

- [ ] **Auth works** — Business registers, owner logs in, roles enforced per route
- [ ] **Inventory works** — Add iron types/sub-types, stock updates on purchase and sale, WAC calculated
- [ ] **Purchases work** — Add vendor, record purchase, due tracked, installment payments work
- [ ] **Sales work** — Quick cash sale, recorded sale, scrap sale, installments, due tracked
- [ ] **HR works** — Add workers with individual salary, record advances, monthly payroll calculates correctly
- [ ] **Accounts work** — All payments tagged to account, balances accurate, transfer works
- [ ] **Reports work** — Period P&L generates with correct burnout, PDF exports cleanly
- [ ] **Dashboard works** — All KPIs show correctly, low stock alerts trigger

### Technical Checklist

- [ ] **Multi-tenant** — Two test businesses registered, each sees ONLY their own data
- [ ] **RLS configured** — Supabase Row Level Security enabled on all tables
- [ ] **No N+1 queries** — All list pages use efficient joined queries
- [ ] **Input validation** — All API routes validate input with Zod
- [ ] **Error handling** — All API routes return proper error responses
- [ ] **Mobile-friendly** — App usable on phone screen (owners check on mobile)

### Deployment Checklist

- [ ] **Deployed to Vercel** — Accessible via public URL
- [ ] **Supabase production** — Not using local/dev database
- [ ] **Environment variables** — All secrets in Vercel env, not in code
- [ ] **HTTPS** — SSL certificate active
- [ ] **Test with real data** — At least one full month of test data entered and reports generated

---

## Appendix: Key Formulas Reference

```
WAC (Weighted Average Cost):
  WAC = Total Purchase Value / Total Quantity
  WAC = (existing_stock_value + new_purchase_value) / (existing_stock_kg + new_purchase_kg)

Burnout:
  burnout_kg = purchased_kg - sold_fabricated_kg - sold_raw_kg - scrap_sold_kg - current_stock_kg
  burnout_pct = (burnout_kg / purchased_kg) × 100

Net Payable Salary:
  net_payable = base_salary - SUM(advances for month+year)

Due Amount:
  due_amount = total_amount - paid_amount

Period Net Profit:
  net_profit = total_income - total_cost
  profit_per_kg = net_profit / total_sold_kg

Account Balance:
  balance = SUM(credit transactions) - SUM(debit transactions)
```

---

*YardFlow ERP — CONTEXT.md — v1.0 — Ready for Development*
*For agent behavior rules, coding standards, and task workflow → read `AGENTS.md`*
