# Professional Versioning — Implementation Plan

## Goal
Display app version + commit hash in the sidebar, auto-updated on every build with zero manual editing.

---

## 1. Source of truth

`package.json` `version` field — standard semver (`"version": "1.0.0"`).  
Bumped via `npm version patch|minor|major` which also creates a git tag.

---

## 2. Build-time script — `scripts/generate-version.mjs`

Reads `package.json` version + git commit hash, writes `src/lib/version.ts`:

```typescript
// Auto-generated — do not edit
export const APP_VERSION = "1.0.0";
export const COMMIT_HASH = "a1b2c3d";
export const BUILD_TIME = "2026-05-23T16:00:00Z";
```

---

## 3. `package.json` scripts

```json
"scripts": {
  "prebuild": "node scripts/generate-version.mjs",
  "predev": "node scripts/generate-version.mjs",
  "version:patch": "npm version patch",
  "version:minor": "npm version minor",
  "version:major": "npm version major",
}
```

`prebuild` / `predev` run automatically before `next build` / `next dev`.

---

## 4. `.gitignore`

Add `src/lib/version.ts` — the file is auto-generated, not committed.

---

## 5. `Sidebar.tsx`

Replace hardcoded `v1.0.0`:

```tsx
import { APP_VERSION, COMMIT_HASH } from "@/lib/version";

// Display in the sidebar lower portion:
// v1.0.0 (a1b2c3d)
```

---

## 6. Release workflow

```bash
git checkout main
npm version patch            # bumps to 1.0.1, creates tag v1.0.1
git push --tags origin main  # CI triggers build
# Build runs: prebuild → generates version.ts with 1.0.1 + commit hash
```

---

## Files to modify/create

| File | Action |
|------|--------|
| `scripts/generate-version.mjs` | NEW |
| `src/lib/version.ts` | NEW (auto-generated, gitignored) |
| `package.json` | Add scripts |
| `.gitignore` | Add `src/lib/version.ts` |
| `src/components/Sidebar.tsx` | Import from `@/lib/version` |

---

## Acceptance criteria

- [ ] `npm run dev` generates `src/lib/version.ts` with correct version + commit
- [ ] `npm run build` generates it before building
- [ ] Sidebar shows `v1.0.0 (a1b2c3d)` 
- [ ] After `npm version patch`, next build shows `v1.0.1`
- [ ] `tsc --noEmit` + `eslint .` + `next build` all pass
