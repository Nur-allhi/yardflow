# Navigation Animation Plan

## Goal
Add spring-based animations (framer-motion) to all navigation components with a minimal, functional feel. Deliver style.

---

## Pre-Flight (Run Once)

- [x] Understand current navigation structure (3 nav components + layout)
- [x] Confirm no framer-motion installed — only `tailwindcss-animate`
- [x] Read each nav component to know what to animate

---

## Dependency

```bash
npm install framer-motion
```

Restart dev server after install.

---

## Step 1 — Create animation utility

**File:** `src/lib/animation.ts`

Default spring configs and variants so every component pulls from one source.

```ts
import { type Variants } from "framer-motion";

export const springConfig = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

export const springSnap = {
  type: "spring" as const,
  stiffness: 400,
  damping: 40,
  mass: 0.5,
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

export const slideInLeft: Variants = {
  hidden: { x: -16, opacity: 0 },
  visible: { x: 0, opacity: 1 },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.08 },
  },
};

export const navItemVariants: Variants = {
  hidden: { x: -12, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 28 },
  },
};

export const activeIndicatorVariants: Variants = {
  inactive: { scaleX: 0, opacity: 0 },
  active: { scaleX: 1, opacity: 1, transition: springSnap },
};
```

---

## Step 2 — Desktop Sidebar (`src/components/Sidebar.tsx`)

**What changes:**
- Wrap nav container with `motion.div` using `staggerContainer`
- Each nav `Link` → `motion(Link)` with `navItemVariants`
- Add a small active indicator bar (4px left border that springs in)
- `motion.button` for logout with subtle hover/tap

**Minimal — no animation on initial mount for returning users.** Only animate when sidebar first renders. Use `initial={false}` or check a session flag.

---

## Step 3 — Mobile Sidebar (`src/components/MobileSidebar.tsx`)

**What changes:**
- Replace `transform transition-transform duration-300` with `AnimatePresence` + `motion.aside`
- Spring-driven slide from left
- Backdrop uses `motion.div` with `fadeIn` variant
- Nav items stagger in when drawer opens (only on open, not on mount)
- Close button has spring rotation

---

## Step 4 — Mobile Bottom Nav (`src/components/MobileBottomNav.tsx`)

**What changes:**
- Wrap nav in `motion.nav`
- Add spring-animated active indicator (a pill/bg that slides between tabs)
- Each tab: `motion(Link)` with `whileTap={{ scale: 0.92 }}`
- Smooth snap transition when active tab changes
- The indicator should follow the active tab position using `layoutId`

**Key detail:** Use `layoutId="active-tab"` so framer-motion handles the spring slide automatically between tab positions.

---

## Step 5 — Page Transitions

**File:** `src/app/(dashboard)/layout.tsx`

**What changes:**
- Import `AnimatePresence` + `motion.div`
- Wrap `{children}` with `motion.div` inside `AnimatePresence mode="wait"`
- Key the motion div by `pathname` so framer-motion detects route changes
- Fade + slight slide up on page enter, fade out on exit

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    transition={{ duration: 0.15, ease: "easeOut" }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

**Caveat:** `AnimatePresence` must be inside a client component. The layout might be a server component — if so, extract the animated wrapper into a separate `PageTransitionWrapper` client component.

---

## Step 6 — Recipe: Extract PageTransitionWrapper (if needed)

**File:** `src/components/PageTransitionWrapper.tsx`

```tsx
"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

export default function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

Then in layout: `<PageTransitionWrapper>{children}</PageTransitionWrapper>`

---

## Post-Landing Verification

```bash
npx tsc --noEmit
npx eslint .
npx next build
```

- Verify no TypeScript errors
- Verify no lint errors
- Verify build succeeds

---

## Priority Order

| Step | Component | Effort | Risk |
|------|-----------|--------|------|
| 1 | Animation utility | 5 min | None |
| 2 | Desktop Sidebar | 30 min | Low |
| 3 | Mobile Sidebar | 20 min | Low |
| 4 | Mobile Bottom Nav | 30 min | Low |
| 5 | Page Transitions | 30 min | Low |
| 6 | PageTransitionWrapper | 10 min | Low |

**Total: ~2 hours**

---

## Commit Strategy

1. `install:` framer-motion + animation utility
2. `animate:` desktop sidebar nav items with spring stagger
3. `animate:` mobile sidebar drawer with spring slide
4. `animate:` mobile bottom nav with layoutId active indicator
5. `animate:` page transitions between routes
