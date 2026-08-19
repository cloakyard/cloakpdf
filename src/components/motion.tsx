/**
 * Motion foundation — the single import surface for all animation in the app.
 *
 * Everything funnels through here so motion stays *consistent, lazy, and calm*:
 *
 *  - **Lazy + small.** We mount one `<LazyMotion features={domAnimation}>` at
 *    the root and use the lightweight `m` component everywhere (re-exported
 *    below). `strict` makes the heavy `motion.*` component throw, so nobody can
 *    accidentally pull the full bundle into a leaf file. domAnimation covers
 *    enter/exit (AnimatePresence), variants, gestures and transforms — the
 *    whole calm vocabulary. (Swap to `domMax` only if we add layout/drag.)
 *
 *  - **Reduced-motion by default.** `MotionConfig reducedMotion="user"` makes
 *    Motion auto-collapse transform/scale to opacity-only (or nothing) for
 *    users who ask for less motion — no per-component gating needed. This
 *    mirrors the `motion-safe:` discipline already in index.css.
 *
 *  - **One restrained curve.** The values mirror `tokens.css`; Motion-driven
 *    surfaces and CSS-driven controls therefore share one language.
 *
 * Usage:
 *   import { m, AnimatePresence, variants } from "./motion.tsx";
 *   <m.div variants={variants.fadeUp} initial="initial" animate="animate" exit="exit" />
 */

import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  MotionConfig,
  type Transition,
  type Variants,
  useMotionValue,
} from "motion/react";
import type { ReactNode } from "react";

export { AnimatePresence, m, useMotionValue };
export type { Variants };

/**
 * Calm easing — identical to `--ease-out` in tokens.css.
 */
const EASE_CALM = [0.16, 1, 0.3, 1] as const;

/** Duration scale (seconds). Mirrors the shared CSS motion tokens. */
const DUR = { instant: 0.1, fast: 0.16, normal: 0.2, surface: 0.26 } as const;

const instant: Transition = { duration: 0 };
const calmFast: Transition = { duration: DUR.fast, ease: EASE_CALM };
const calmNormal: Transition = { duration: DUR.normal, ease: EASE_CALM };
const calmSurface: Transition = { duration: DUR.surface, ease: EASE_CALM };
const calmExit: Transition = { duration: DUR.instant, ease: EASE_CALM };

/**
 * Shared variant vocabulary. Each carries `initial`/`animate`/`exit` so the
 * same object drives both mount and AnimatePresence unmount. Distances are
 * small on purpose (the design system prizes restraint).
 */
export const variants = {
  /** Structural modal root: keeps children mounted for their own exit motion. */
  modalRoot: {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 1, transition: calmFast },
  },
  /** Fade + small rise — used by occasional floating notices. */
  fadeUp: {
    initial: { opacity: 0, transform: "translateY(8px)" },
    animate: { opacity: 1, transform: "translateY(0)", transition: calmNormal },
    exit: { opacity: 0, transform: "translateY(4px)", transition: calmFast },
  },
  /** One-time section reveal. Use on structural blocks, not every row. */
  reveal: {
    initial: { opacity: 0, transform: "translateY(6px)" },
    animate: { opacity: 1, transform: "translateY(0)", transition: calmSurface },
    exit: { opacity: 0, transform: "translateY(4px)", transition: calmFast },
  },
  /** A compact child reveal for a small, deliberate stagger. */
  revealItem: {
    initial: { opacity: 0, transform: "translateY(4px)" },
    animate: { opacity: 1, transform: "translateY(0)", transition: calmNormal },
    exit: { opacity: 0, transform: "translateY(2px)", transition: calmExit },
  },
  /** Coordinates a few sibling reveals without adding its own transform. */
  stagger: {
    initial: {},
    animate: {
      transition: { staggerChildren: 0.05, delayChildren: 0.03 },
    },
    exit: {
      transition: { staggerChildren: 0.03, staggerDirection: -1 },
    },
  },
  /** Bottom-sheet / centered modal panel: no scale, so mobile edges stay anchored. */
  sheet: {
    initial: { opacity: 0, transform: "translateY(8px)" },
    animate: { opacity: 1, transform: "translateY(0)", transition: calmNormal },
    exit: { opacity: 0, transform: "translateY(4px)", transition: calmFast },
  },
  /** Keyboard-first surfaces must open and close immediately. */
  instant: {
    initial: { opacity: 1, transform: "none" },
    animate: { opacity: 1, transform: "none", transition: instant },
    exit: { opacity: 1, transform: "none", transition: instant },
  },
  /** Full-view (route) transition between home / tool / privacy. */
  view: {
    initial: { opacity: 0, transform: "translateY(4px)" },
    animate: { opacity: 1, transform: "translateY(0)", transition: calmFast },
    exit: { opacity: 0, transform: "translateY(-2px)", transition: calmExit },
  },
  /** Dimmed scrim behind a modal. */
  scrim: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: calmFast },
    exit: { opacity: 0, transition: calmFast },
  },
} satisfies Record<string, Variants>;

/**
 * Root motion provider. Wrap the whole app once. Keeps the feature bundle
 * lazy (`m` + domAnimation) and applies the reduced-motion policy globally.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
