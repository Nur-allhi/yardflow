# YardFlow ERP

> **Digitize your workshop. Know your numbers. Grow your business.**

A multi-tenant SaaS ERP built for iron and workshop businesses in Bangladesh. Replaces paper-ledger systems with end-to-end digital workflows — from purchasing raw iron from shipyards, tracking stock by material sub-type, managing three sale types (fabricated, raw pass-through, scrap), handling worker advances and payroll, to generating period-end profit/loss reports with PDF export.

Built with Next.js 15 (App Router), TypeScript, PostgreSQL (Supabase), Drizzle ORM, and Tailwind CSS.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + Radix UI primitives |
| **ORM** | Drizzle ORM |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Custom — bcryptjs + JWT (jose), HTTP-only cookies |
| **Forms** | React Hook Form + Zod |
| **State** | TanStack React Query |
| **Charts** | Recharts |
| **PDF** | jsPDF + jspdf-autotable |
| **Animation** | Framer Motion |
| **Icons** | Lucide React |

---

## Features

### Auth & Organization
- Business registration with org + owner user creation
- Email/password login with bcrypt hashing
- JWT session cookies (7-day, httpOnly, sameSite)
- Role-based access: owner → manager → worker
- Team management with role assignment

### Inventory Management
- Material categories and sub-types with weight-based tracking
- Stock ledger — every in/out movement recorded
- **WAC (Weighted Average Cost)** — auto-recalculates on every purchase
- Scrap pool — shared accumulation with periodic sale
- Consumables log — track welding rods, grinding paper, etc.
- Consumption tracking from consumable stock

### Purchase Module
- Vendor management with type (shipyard, consumable, other) and opening balance
- Purchase entry with line items (sub-type, kg, price/kg)
- Other expenses per purchase (truck fare, labour, food)
- Installment payments with auto account debit
- Status tracking: paid / partial / due

### Sales Module
- **Three sale types**: Fabricated (processed), Raw pass-through (unprocessed), Scrap
- Quick cash sale — minimal fields, auto-paid
- Full recorded sale with customer profile and credit support
- Customer management with opening balance
- Installment payment tracking

### HR & Payroll
- Worker profiles with individual salary (no flat rate)
- Salary advances per month/year
- Monthly payroll: `net_payable = salary - advances`
- Over-advance handling with carry-forward
- Payment status: pending / partial / paid

### Accounts
- Cash and bank account management
- Auto-calculated balances from transaction history
- Transfers and deposits between accounts
- Enriched transaction history with clickable reference links

### Period Profit/Loss Report
- Monthly, yearly, or custom date range
- Volume analysis: purchased, sold, scrap, burnout
- Financial analysis: income, costs, net profit, profit per kg
- Burnout formula at period end (not per order)
- PDF export via jsPDF
- Immutable report snapshots

### Dashboard
- KPI widgets: total stock, today's sales, monthly income vs expense
- Account balance overview with grand total
- Outstanding dues (AR vs AP)
- Pending salary alerts
- Low stock warnings
- Monthly income/expense bar chart

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                      # Login, Register
│   ├── (dashboard)/                 # All protected pages
│   │   ├── accounts/                # Accounts, deposits, transfers
│   │   ├── inventory/               # Stock, categories, subtypes, ledger, scrap, consumables
│   │   ├── purchases/               # Purchases, vendors
│   │   ├── sales/                   # Sales, customers, scrap sales
│   │   ├── hr/                      # Workers, advances, payroll
│   │   ├── reports/                 # P&L reports
│   │   └── settings/                # Org profile, team
│   └── api/                         # 43 REST API endpoints
├── components/                      # Sidebar, nav, DataTable, UI primitives
├── hooks/                           # useAccounts, useCustomers, useVendors, etc.
├── lib/
│   ├── db/                          # Schema, connection, migrations
│   ├── auth/                        # Session, middleware
│   ├── calculations/                # WAC, profit, burnout
│   ├── pdf/                         # Report PDF generation
│   └── validations/                 # Zod schemas
└── types/                           # Common TypeScript types
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase recommended)

### Setup

```bash
# Clone and install
git clone <repo-url>
cd yardflow
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and JWT_SECRET

# Run migrations
npx drizzle-kit migrate

# Start dev server
npm run dev

# (optional) Seed demo data
npx tsx scripts/seed.ts
```

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | 32-byte base64-encoded key for session signing |

---

## NPM Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |
| `npm run db:generate` | Generate database migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Launch Drizzle Studio |

---

## Key Design Decisions

- **Multi-tenancy**: Every query filters by `organization_id` from server-side session — never from client input. Supabase RLS is secondary defense.
- **Soft delete**: All tables have `deleted_at` — data is never physically removed.
- **WAC costing**: Stock valued by Weighted Average Cost, recalculated on each purchase.
- **Burnout & scrap**: Calculated at period-end only — never per order.
- **Transactions**: Any multi-table write uses `db.transaction()` — all-or-nothing.
- **Account balance**: Computed from transaction history via SQL aggregates — never stored directly.
- **Reports**: Immutable snapshots generated from transaction data — read-only after creation.

---

## Database

**22 tables** across 9 modules:

| Module | Tables |
|---|---|
| Auth & Org | organizations, users, sessions |
| Accounts | accounts, account_transactions |
| Inventory | material_categories, material_subtypes, stock_ledger, scrap_pool, consumables_log, consumption_logs |
| Vendors & Purchases | vendors, purchases, purchase_items, purchase_payments, purchase_other_expenses |
| Customers & Sales | customers, sales, sale_items, sale_payments |
| HR | workers, salary_advances, salary_payments |
| Reports | period_reports |

---

## Conventions

- **Money**: `1,25,000 tk` (Bengali lakh format)
- **Weight**: `1,250.500 kg` (3 decimal places)
- **Status badges**: green = paid/profit · amber = partial/pending · red = due/loss · gray = inactive
- **Page states**: Every page handles loading, empty, and error states
