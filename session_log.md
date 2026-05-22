
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
