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
 *  - **One restrained curve.** Every variant uses the same calm settle, so
 *    Motion-driven surfaces feel like one system rather than a bolted-on
 *    animation language.
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
} from "motion/react";
import type { ReactNode } from "react";

export { AnimatePresence, m };
export type { Variants };

/**
 * Calm easing — easeOutExpo-ish. Quick start, long gentle settle, no overshoot.
 */
const EASE_CALM = [0.22, 1, 0.36, 1] as const;

/** Duration scale (seconds). Deliberately short — calm, not sluggish. */
const DUR = { fast: 0.16, base: 0.26, slow: 0.4 } as const;

const calm: Transition = { duration: DUR.base, ease: EASE_CALM };
export const calmFast: Transition = { duration: DUR.fast, ease: EASE_CALM };
const calmSlow: Transition = { duration: DUR.slow, ease: EASE_CALM };

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
  /** Fade + gentle rise — the house entrance. */
  fadeUp: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: calm },
    exit: { opacity: 0, y: 6, transition: calmFast },
  },
  /** One-time section reveal. Use on structural blocks, not every row. */
  reveal: {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0, transition: calmSlow },
    exit: { opacity: 0, y: 8, transition: calmFast },
  },
  /** A compact child reveal for a small, deliberate stagger. */
  revealItem: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: calm },
    exit: { opacity: 0, y: 4, transition: calmFast },
  },
  /** Coordinates a few sibling reveals without adding its own transform. */
  stagger: {
    initial: {},
    animate: {
      transition: { staggerChildren: 0.055, delayChildren: 0.04 },
    },
    exit: {
      transition: { staggerChildren: 0.03, staggerDirection: -1 },
    },
  },
  /** Bottom-sheet / centered modal panel: rises in, settles down on exit. */
  sheet: {
    initial: { y: 16 },
    animate: { y: 0, transition: calm },
    exit: { y: 8, transition: calmFast },
  },
  /** Command index: a shorter top-edge settle, with solid paper throughout. */
  command: {
    initial: { y: -6 },
    animate: { y: 0, transition: calmFast },
    exit: { y: -4, transition: calmFast },
  },
  /** Full-view (route) transition between home / tool / privacy. */
  view: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: calm },
    exit: { opacity: 0, y: -6, transition: calmFast },
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
