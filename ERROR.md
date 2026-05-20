## FIXED - 2026-05-20

### Bug: HR page 404 at /hr

**Root cause**: No `page.tsx` at `/hr` — sidebar linked to `/hr` but only sub-routes (`/hr/workers`, `/hr/payroll`, etc.) existed.

**Fix**: Created `src/app/(dashboard)/hr/page.tsx` with `redirect("/hr/workers")`.

---

### Bug: Sales API 500 Error on GET /api/sales
