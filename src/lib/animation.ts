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
