import type { Variants } from "motion/react";

export const spring = {
  snappy: { type: "spring", stiffness: 360, damping: 30 },
} as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function stagger(delay = 0.08): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: delay } },
  };
}

export const hoverLift = {
  whileHover: { y: -3 },
  whileTap: { scale: 0.985 },
};

export const viewportOnce = { once: true, amount: 0.2 } as const;