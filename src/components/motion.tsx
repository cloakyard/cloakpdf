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
 *  - **Tokens that match the CSS.** The easing/duration tokens are lifted from
 *    the existing @keyframes (slide-up-in's `cubic-bezier(0.22,1,0.36,1)` is the
 *    house "calm settle"), so Motion-driven surfaces feel like the same system,
 *    not a bolted-on second animation language.
 *
 * Usage:
 *   import { m, AnimatePresence, variants, calm } from "./motion.tsx";
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
 * Identical curve to index.css's `.animate-slide-up-in`, so Motion reads as the
 * same hand as the CSS animations it sits beside.
 */
export const EASE_CALM = [0.22, 1, 0.36, 1] as const;
/** Symmetric ease for moves that both enter and leave (e.g. crossfades). */
export const EASE_INOUT = [0.4, 0, 0.2, 1] as const;

/** Duration scale (seconds). Deliberately short — calm, not sluggish. */
export const DUR = { fast: 0.16, base: 0.26, slow: 0.4 } as const;

export const calm: Transition = { duration: DUR.base, ease: EASE_CALM };
export const calmFast: Transition = { duration: DUR.fast, ease: EASE_CALM };
export const calmSlow: Transition = { duration: DUR.slow, ease: EASE_CALM };

/**
 * Shared variant vocabulary. Each carries `initial`/`animate`/`exit` so the
 * same object drives both mount and AnimatePresence unmount. Distances are
 * small on purpose (the design system prizes restraint).
 */
export const variants = {
  /** Pure crossfade. */
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: calm },
    exit: { opacity: 0, transition: calmFast },
  },
  /** Fade + gentle rise — the house entrance (matches `.animate-fade-in-up`). */
  fadeUp: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: calm },
    exit: { opacity: 0, y: 6, transition: calmFast },
  },
  /** Fade + subtle scale, no overshoot — for cards/badges popping in. */
  scaleFade: {
    initial: { opacity: 0, scale: 0.97 },
    animate: { opacity: 1, scale: 1, transition: calm },
    exit: { opacity: 0, scale: 0.98, transition: calmFast },
  },
  /** Bottom-sheet / centered modal panel: rises in, settles down on exit. */
  sheet: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: calm },
    exit: { opacity: 0, y: 8, transition: calmFast },
  },
  /** Popover anchored below its trigger (origin top). */
  popover: {
    initial: { opacity: 0, y: -6, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1, transition: calmFast },
    exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12, ease: EASE_CALM } },
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
 * Stagger container + item for list/grid reveals (the home tool cards). The
 * container orchestrates; each child uses `staggerItem` (a fadeUp). Distances
 * stay small so a full grid settling reads as one calm wave, not a cascade.
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.045, delayChildren: 0.02 } },
};
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: calm },
};

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
