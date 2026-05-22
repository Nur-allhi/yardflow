
## 2026-05-22: Touch target & form UX improvements

### Changed files:
- `src/components/MobileBottomNav.tsx` - `py-1` → `min-h-[56px] py-2`
- `src/components/Breadcrumb.tsx` - Added `min-h-[44px] flex items-center` to Link
- `src/components/InventoryNav.tsx` - Mobile pills: `py-1.5` → `py-2.5 px-4`
- 13 form pages: `h-[42px]` → `h-[44px]` + autoComplete/inputMode/enterKeyHint

### Verification:
- `npx tsc --noEmit` ✅ zero errors
- `npx next build` ✅ succeeds
- ESLint: pre-existing errors in `.next/` only, not from our changes

### Commit: `00f8817`

## 2026-05-22: Accessibility & micro-polish

### Changes:
1. **Loading spinners on mutation buttons** – 12 form pages: accounts/new, deposit, transfer; purchases/new; sales/new, quick, scrap; hr/workers/new, advances/new, payroll; reports/generate; settings/team — replaced `"Saving..."` text with CSS spinner `w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin`
2. **`aria-live` on error containers** – Added `role="alert" aria-live="polite"` to error divs in 15 files (login desktop+mobile, register desktop+mobile, all form pages)
3. **`focus-visible` rings** – Added `focus-visible:ring-2 focus-visible:ring-primary-container focus-visible:ring-offset-2` to login/register submit buttons, purchases FABs, MobileBottomNav links, and Sidebar nav links/logout

### Verification:
- `npx tsc --noEmit` ✅ zero errors
- `npx next build` ✅ succeeds
- ESLint: pre-existing errors only (`.next/`, `@ts-ignore` in generated routes)

### Commit: `29b1b85`
