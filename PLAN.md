# YardFlow ERP — Remaining Implementation Plan

> Last updated: 2026-05-20
> Phase 11 gaps from `TODO.md` + V1 polish items

---

## Progress Overview

| Batch | Module | Sessions | Est. Effort | Priority |
|-------|--------|----------|-------------|----------|
| 1 | Reports — PDF + other expenses | 2 | Medium | High |
| 2 | HR — Zod schemas + negative net_payable | 1 | Low | Medium |
| 3 | Settings — Org profile + Team + Role middleware | 2 | Medium | Medium |
| 4 | Seed + E2E walkthrough | 1 | Medium | High |
| 5 | Deploy to Vercel + Supabase | 1 | Low | High |

**Total remaining:** ~7 sessions

---

## Batch 1 — Reports: PDF Export + Other Expenses

### Goal
Make the period report production-ready: allow the owner to input other expenses, view them in the calculation, and download a printable PDF for the accountant.

### Tasks
- [x] **1.1** Add `total_other_expenses` to generate form
- [x] **1.2** Wire `total_other_expenses` through profit calculation
- [x] **1.3** Add Zod schema for report generation
- [x] **1.4** Create PDF export library
- [x] **1.5** Wire PDF download button on report detail page

### Files affected
- `src/app/(dashboard)/reports/generate/page.tsx`
- `src/app/(dashboard)/reports/[id]/page.tsx`
- `src/app/api/reports/route.ts`
- `src/lib/calculations/profit.ts`
- `src/lib/validations/schemas.ts` (new schemas)
- `src/lib/pdf/reports.ts` (new file)

---

## Batch 2 — HR: Zod Schemas + Negative net_payable

### Goal
Complete HR input validation and handle the edge case where advances exceed base salary.

### Tasks

**2.1 Add Zod schemas for HR module**
- `workerSchema` — name, phone, designation, monthly_salary, join_date
- `advanceSchema` — worker_id, amount, account_id, advance_date, month, year, note
- `salaryPaymentSchema` — worker_id, month, year, paid_amount, account_id, payment_date
- Export types from each schema
- Refactor `src/app/api/hr/advances/route.ts` to use shared `advanceSchema` instead of inline

**2.2 Negative net_payable UI warning**
- In `hr/payroll/page.tsx`, detect rows where `net_payable < 0`
- Show amber warning badge: "Over-advanced — carry forward"
- Add subtitle note: "Advances exceed base salary. Net payable is negative and will carry to next month."
- Use the existing status badge color convention (amber = warning)

### Files affected
- `src/lib/validations/schemas.ts` (new schemas)
- `src/app/api/hr/advances/route.ts` (refactor)
- `src/app/(dashboard)/hr/payroll/page.tsx`

---

## Batch 3 — Settings: Org Profile + Team Management

### Goal
Allow the owner to manage their organization profile and invite/manage team members (managers, workers). Add role-based route protection.

### Tasks

**3.1 Create `/settings` page**
- New route: `src/app/(dashboard)/settings/page.tsx`
- Organization profile form: name, address, phone, email
- Read current org data on load, PUT to save changes
- New API: `src/app/api/settings/route.ts` — GET/PUT for organization

**3.2 Create `/settings/team` page**
- New route: `src/app/(dashboard)/settings/team/page.tsx`
- User list table: name, email, role, status (active/deactivated), actions
- Invite form: email + role select (owner/manager/worker)
- Deactivate toggle per user
- New API: `src/app/api/settings/team/route.ts` — GET list, POST invite
- New API: `src/app/api/settings/team/[id]/route.ts` — PUT deactivate, DELETE

**3.3 Role-based middleware**
- New file: `src/lib/auth/middleware.ts`
- Export `requireRole(...roles: string[])` — checks session role header against allowed roles, returns 403
- Can be called in API routes and page loaders

**3.4 Worker login (optional, low priority)**
- Allow linking a worker profile to a user account via `workers.user_id`
- Worker can log in with limited view (own salary/advance info only)
- Role-based middleware restricts access

### Files affected
- `src/app/(dashboard)/settings/page.tsx` (new)
- `src/app/(dashboard)/settings/team/page.tsx` (new)
- `src/app/api/settings/route.ts` (new)
- `src/app/api/settings/team/route.ts` (new)
- `src/app/api/settings/team/[id]/route.ts` (new)
- `src/lib/auth/middleware.ts` (new)

---

## Batch 4 — Seed + End-to-End Testing

### Goal
Verify every module works end-to-end with realistic sample data before deployment.

### Tasks

**4.1 Verify & run seed script**
- Review and fix `scripts/seed.ts` or `scripts/seed.mjs`
- Ensure it creates: 3 categories, 10+ subtypes, 5 vendors, 5 customers, 8 workers, 3 accounts
- Run seed and confirm no errors

**4.2 Walkthrough every module**
For each module, perform the full cycle:
- **Purchases:** Create purchase → view detail → record payment → edit → void
- **Sales:** Quick cash sale → recorded sale → scrap sale → record payment → edit → void
- **HR:** Create worker → record advance → view payroll → pay salary
- **Accounts:** View balances → create account → transfer → view transaction history
- **Reports:** Generate monthly report → verify numbers → download PDF
- **Inventory:** View stock → check ledger → view scrap pool → log consumable
- **Dashboard:** Verify KPIs match module totals

**4.3 Multi-tenant isolation test**
- Register Org A, create data
- Register Org B, verify Org A's data is invisible

---

## Batch 5 — Deploy to Production

### Goal
Make the app accessible via public URL with production database.

### Tasks

**5.1 Deploy to Vercel**
- Run `vercel --prod`
- Connect git repo for automatic deploys

**5.2 Configure Supabase production**
- Create Supabase production project
- Run migrations on production DB
- Apply RLS policies
- Verify connection string

**5.3 Environment variables**
- `DATABASE_URL` — Supabase connection string
- `JWT_SECRET` — Random secure string for cookie signing
- `NEXT_PUBLIC_APP_URL` — Production URL
- All set in Vercel project settings

**5.4 Verify deployment**
- HTTPS active
- Registration works
- Login works
- All modules functional
- Mobile responsive

---

## Definition of Done

All 5 batches are complete when:
- [x] PDF reports generate and download correctly
- [x] Other expenses field works in report generation
- [ ] HR has proper Zod validation on all inputs
- [ ] Negative net_payable shows warning in UI
- [ ] Settings page shows org profile and allows edits
- [ ] Settings/team page lists users and allows invite/deactivate
- [ ] Role-based middleware protects sensitive routes
- [ ] Seed data loads without errors
- [ ] End-to-end walkthrough passes for all 7 modules
- [ ] Multi-tenant isolation confirmed
- [ ] App deployed on Vercel with HTTPS
- [ ] Supabase production database configured
