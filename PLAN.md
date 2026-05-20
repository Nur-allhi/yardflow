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

- [x] **2.1 Add Zod schemas for HR module**
- [x] **2.2 Negative net_payable UI warning**
  - Desktop table: amber `#EAB308` text + "Over-advanced" badge + subtitle note
  - Mobile cards: amber text + "Over-advanced — carry forward" badge
  - Pay modal: warning banner + disabled "Confirm Payment" button
  - Default pay amount clamped to `Math.max(0, ...)` for over-advanced workers

### Files affected
- `src/lib/validations/schemas.ts` (new schemas)
- `src/app/api/hr/advances/route.ts` (refactor)
- `src/app/(dashboard)/hr/payroll/page.tsx`

---

## Batch 3 — Settings: Org Profile + Team Management

### Goal
Allow the owner to manage their organization profile and invite/manage team members (managers, workers). Add role-based route protection.

### Tasks

**3.1 Create `/settings` page** ✅
- New route: `src/app/(dashboard)/settings/page.tsx`
- Organization profile form: name, address, phone, email
- Read current org data on load, PUT to save changes
- New API: `src/app/api/settings/route.ts` — GET/PUT for organization

**3.2 Create `/settings/team` page** ✅
- New route: `src/app/(dashboard)/settings/team/page.tsx`
- User list table: name, email, role, status (active/deactivated), actions
- Invite form: email + role select (owner/manager/worker)
- Deactivate toggle per user
- New API: `src/app/api/settings/team/route.ts` — GET list, POST invite
- New API: `src/app/api/settings/team/[id]/route.ts` — PUT deactivate, DELETE

**3.3 Role-based middleware** ✅
- New file: `src/lib/auth/middleware.ts`
- Export `requireRole(...roles: string[])` — checks session role header against allowed roles, returns 403
- Can be called in API routes and page loaders

**3.4 Worker login (optional, low priority)** — deferred

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

**4.1 Run seed script against live DB** ✅ (migrations + seed executed)
- Review and fix `scripts/seed.ts` or `scripts/seed.mjs` (fixed unused imports in seed.ts)
- Script creates: 2 categories, 8 subtypes, 2 vendors, 2 customers, 2 accounts, 2 purchases, 3 sales
- **Needs:** Database access (Supabase) to execute

**4.2 Walkthrough every module** ⏸️ (requires deployed instance)
- Manual testing on deployed instance

**4.3 Multi-tenant isolation test** ⏸️ (requires deployed instance)
- Manual testing on deployed instance

---

## Batch 5 — Deploy to Production

### Goal
Make the app accessible via public URL with production database.

### Tasks

**5.1 Deploy to Vercel** ⏸️ (requires `vercel` CLI + user access)
- Run `vercel --prod`

**5.2 Configure Supabase production** ⏸️ (requires Supabase access)
- Create Supabase production project
- Run migrations on production DB
- Apply RLS policies

**5.3 Environment variables** ✅ (already configured)
- `DATABASE_URL` — set in `.env.local`
- `JWT_SECRET` — set in `.env.local`
- `NEXT_PUBLIC_APP_URL` — needs production URL

**5.4 Verify deployment** ⏸️ (post-deploy)

---

## Definition of Done

All 5 batches are complete when:
- [x] PDF reports generate and download correctly
- [x] Other expenses field works in report generation
- [x] HR has proper Zod validation on all inputs
- [x] Negative net_payable shows warning in UI
- [x] Settings page shows org profile and allows edits
- [x] Settings/team page lists users and allows invite/deactivate
- [x] Role-based middleware protects sensitive routes
- [x] Seed data loads without errors
- [ ] End-to-end walkthrough passes for all 7 modules
- [ ] Multi-tenant isolation confirmed
- [ ] App deployed on Vercel with HTTPS
- [ ] Supabase production database configured
