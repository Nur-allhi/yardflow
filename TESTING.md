# YardFlow ERP — V1 Testing Checklist

> Use this checklist to confirm every module works correctly before deployment.
> Page paths in **bold**. API paths in `code`.

---

## 1. Auth & Multi-Tenancy

**Pages:** `/login`, `/register`, `/settings/team`  
**APIs:** `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`

- [ ] Visit `/register` — register a new business (name, email, password) → auto-login
- [ ] Dashboard shows empty state (no data yet)
- [ ] Logout → `/login` — login with same credentials → back to dashboard
- [ ] Go to `/settings/team` — invite a team member (email + role: manager)
- [ ] Logout → Login as the invited team member → sees dashboard with their role
- [ ] Register a second business in incognito → see completely isolated data (empty)

---

## 2. Inventory

**Pages:** `/inventory`, `/inventory/categories`, `/inventory/subtypes`, `/inventory/ledger`, `/inventory/scrap`, `/inventory/consumables`  
**APIs:** `GET /api/inventory/categories`, `POST /api/inventory/categories`, `GET /api/inventory/categories/[id]`
`GET /api/inventory/subtypes`, `POST /api/inventory/subtypes`, `GET /api/inventory/subtypes/[id]`
`GET /api/inventory/stock`, `GET /api/inventory/ledger`, `GET /api/inventory/scrap`

- [ ] Visit `/inventory` — shows 0 kg for all, empty state
- [ ] Visit `/inventory/categories` — add a category (e.g. "Iron Plates")
- [ ] Visit `/inventory/subtypes` — add sub-types (e.g. "5-8mm", price 110; "9-11mm", price 95)
- [ ] Visit `/inventory/ledger` — empty (no movements yet)
- [ ] Visit `/inventory/scrap` — scrap pool is 0 kg
- [ ] Visit `/inventory/consumables` — add a consumable (e.g. "Welding Rod", 10 pcs, 500 tk)

---

## 3. Accounts

**Pages:** `/accounts`, `/accounts/new`, `/accounts/[id]`, `/accounts/transfer`  
**APIs:** `GET /api/accounts`, `POST /api/accounts`, `GET /api/accounts/[id]`
`GET /api/accounts/transactions`, `POST /api/accounts/transfer`

- [ ] Visit `/accounts` — empty list
- [ ] Visit `/accounts/new` — add "Cash" account (type: cash)
- [ ] Visit `/accounts/new` — add "Dutch Bangla Bank" account (type: bank, bank name, account number)
- [ ] Visit `/accounts` — shows both accounts with 0.00 balance
- [ ] Visit `/accounts/transfer` — transfer 5,000 from Cash to Bank → balances update
- [ ] Visit `/accounts/[id]` (Cash) — see transaction history with the transfer

---

## 4. Purchases

**Pages:** `/purchases`, `/purchases/new`, `/purchases/[id]`, `/purchases/vendors`  
**APIs:** `GET /api/purchases`, `POST /api/purchases`, `GET /api/purchases/[id]`
`POST /api/purchases/[id]/payments`, `GET /api/purchases/vendors`, `POST /api/purchases/vendors`, `GET /api/purchases/vendors/[id]`

- [ ] Visit `/purchases` — empty list
- [ ] Visit `/purchases/vendors` — add a vendor (e.g. "Bashundhara Steel", shipyard)
- [ ] Visit `/purchases/new` — record a purchase: select vendor, add line item (5-8mm, 500 kg @ 110), pay 30,000 partial
- [ ] Visit `/inventory` → stock shows 500 kg for 5-8mm
- [ ] Visit `/accounts` → Cash balance decreased by 30,000
- [ ] Visit `/purchases` → list shows purchase with "Partial" status, due amount
- [ ] Visit `/purchases/[id]` — see items + payment history
- [ ] Click "Add Payment" on purchase detail → pay remaining 25,000 → status changes to "Paid"
- [ ] Visit `/purchases/vendors` — vendor balance shows correct

---

## 5. Sales

**Pages:** `/sales`, `/sales/new`, `/sales/new/quick`, `/sales/[id]`, `/sales/customers`, `/sales/scrap/new`  
**APIs:** `GET /api/sales`, `POST /api/sales`, `GET /api/sales/[id]`
`POST /api/sales/[id]/payments`, `GET /api/sales/customers`, `POST /api/sales/customers`
`POST /api/sales/scrap`

- [ ] Visit `/sales` — empty list
- [ ] Visit `/sales/customers` — add a customer (e.g. "Akbar Traders")
- [ ] Visit `/sales/new` — make a **fabricated sale**: select customer, add item (5-8mm, 200 kg @ 130), receive 20,000 partial
- [ ] Visit `/inventory` → stock decreased to 300 kg for 5-8mm
- [ ] Visit `/accounts` → Cash balance increased by 20,000
- [ ] Visit `/sales` → list shows sale with "Partial" status
- [ ] Visit `/sales/[id]` — see items + payment received
- [ ] Click "Add Payment" → record another 6,000 → due reduces → status changes to "Paid"
- [ ] Visit `/sales/new/quick` — quick cash sale: select subtype, kg, price/kg, account → auto-paid
- [ ] Visit `/sales/scrap/new` — scrap sale: enter kg (e.g. 50), price (50/kg), account → scrap pool decreases
- [ ] Visit `/inventory/scrap` — verify scrap pool decreased

---

## 6. HR

**Pages:** `/hr/workers`, `/hr/workers/new`, `/hr/workers/[id]`, `/hr/advances/new`, `/hr/payroll`  
**APIs:** `GET /api/hr/workers`, `POST /api/hr/workers`, `GET /api/hr/workers/[id]`
`POST /api/hr/advances`, `GET /api/hr/advances/[id]`, `GET /api/hr/payroll`
`POST /api/hr/payroll/pay`

- [ ] Visit `/hr/workers` — empty list
- [ ] Visit `/hr/workers/new` — add worker "Rahim" with salary 15,000, designation "Welder"
- [ ] Visit `/hr/workers` — shows Rahim, active, 15,000 salary
- [ ] Visit `/hr/workers/[id]` — profile with empty advance history
- [ ] Visit `/hr/advances/new` — record advance: Rahim, 5,000, cash account
- [ ] Visit `/hr/workers/[id]` — advance history shows 5,000
- [ ] Visit `/hr/payroll` — shows Rahim: base=15,000, advances=5,000, net=10,000, Pending
- [ ] Click "Pay" → enter amount 10,000 → confirm → status changes to Paid
- [ ] Record another advance (say 8,000) → visit `/hr/payroll` → net_payable = -3,000
- [ ] Verify "Over-advanced" badge appears and Pay button is disabled
- [ ] Verify `/accounts` → balances adjusted for advances and payroll payments

---

## 7. Reports

**Pages:** `/reports`, `/reports/generate`, `/reports/[id]`  
**APIs:** `GET /api/reports`, `POST /api/reports`, `GET /api/reports/[id]`

- [ ] Visit `/reports` — empty list
- [ ] Visit `/reports/generate` → select "This Month" → generate
- [ ] Report shows: Volume Analysis (purchased, sold, scrap, stock, burnout), Income (fabricated, raw, scrap), Costs (purchases, consumables, salary), Net Profit/Loss
- [ ] Visit `/reports/[id]` — full breakdown with all sections
- [ ] Click "Download PDF" → PDF downloads with correct formatting (table, title, dates)

---

## 8. Dashboard

**Pages:** `/`  

- [ ] All KPI widgets display real data (stock kg, today's sales, month income/expense)
- [ ] Account balances section shows all accounts with correct totals
- [ ] Outstanding dues: customers owe us vs. we owe vendors
- [ ] Pending salaries section shows unpaid workers
- [ ] Quick action buttons work (New Sale, New Purchase, Record Advance, Generate Report)

---

## 9. Settings

**Pages:** `/settings`, `/settings/team`  
**APIs:** `GET /api/settings`, `PUT /api/settings`, `GET /api/settings/team`, `POST /api/settings/team`, `PUT /api/settings/team/[id]`

- [ ] Visit `/settings` — org profile form pre-filled with your company info
- [ ] Edit name/address/phone → save → page refreshes with new data
- [ ] Visit `/settings/team` — shows you as owner
- [ ] Invite a team member → they appear in the list
- [ ] Deactivate a team member → status changes

---

## Quick Smoke Test (All API Endpoints)

```bash
# Auth
curl http://localhost:3000/api/auth/login           # POST - login

# Accounts
curl http://localhost:3000/api/accounts                # GET - list accounts
curl http://localhost:3000/api/accounts/transactions   # GET - all transactions
curl http://localhost:3000/api/accounts/transfer       # POST - transfer

# Inventory
curl http://localhost:3000/api/inventory/stock         # GET - current stock
curl http://localhost:3000/api/inventory/categories    # GET - categories
curl http://localhost:3000/api/inventory/subtypes      # GET - subtypes
curl http://localhost:3000/api/inventory/ledger        # GET - stock movements
curl http://localhost:3000/api/inventory/scrap         # GET - scrap pool
curl http://localhost:3000/api/inventory/consumables   # GET - consumables log

# Purchases
curl http://localhost:3000/api/purchases               # GET - purchase list
curl http://localhost:3000/api/purchases/vendors       # GET - vendor list

# Sales
curl http://localhost:3000/api/sales                   # GET - sale list
curl http://localhost:3000/api/sales/customers         # GET - customer list

# HR
curl http://localhost:3000/api/hr/workers              # GET - workers
curl http://localhost:3000/api/hr/advances             # GET - advances
curl http://localhost:3000/api/hr/payroll              # GET - payroll

# Reports
curl http://localhost:3000/api/reports                 # GET - report list

# Settings
curl http://localhost:3000/api/settings                # GET - org profile
curl http://localhost:3000/api/settings/team           # GET - team list
```

All endpoints should return 200. All pages should load without console errors.

---

**34 page routes · 34 API routes · 9 modules**
