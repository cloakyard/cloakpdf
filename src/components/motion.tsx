/** Lazy motion and shared reduced-motion preferences for Air dialogs. */
import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  MotionConfig,
  type Variants,
  useMotionValue,
  useIsPresent,
} from "motion/react";
import { useMemo, useSyncExternalStore, type ReactNode } from "react";

export { AnimatePresence, m, useMotionValue, useIsPresent };
export type { Variants };

import { motionMilliseconds } from "../../docs/air/motion.mjs";

function useMediaSnapshot(query: string) {
  const store = useMemo(() => {
    const media = matchMedia(query);
    return {
      read: () => media.matches,
      subscribe: (notify: () => void) => {
        media.addEventListener("change", notify);
        return () => media.removeEventListener("change", notify);
      },
    };
  }, [query]);
  return useSyncExternalStore(store.subscribe, store.read);
}

export function useDialogMotion() {
  // A dialog can open before a queued media-query change event arrives.
  // Read the current preference/viewport in each consumer's render.
  const reduced = useMediaSnapshot("(prefers-reduced-motion: reduce)");
  const sheet = useMediaSnapshot("(max-width: 640px)");
  const style = getComputedStyle(document.documentElement);
  return {
    immediate: reduced,
    sheet,
    entry: motionMilliseconds(style.getPropertyValue("--air-motion-dialog")) / 1000,
    exit: motionMilliseconds(style.getPropertyValue("--air-motion-exit")) / 1000,
  };
}

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
