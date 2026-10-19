/** Lazy motion and shared input/reduced-motion preferences for Air dialogs. */
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
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export { AnimatePresence, m, useMotionValue, useIsPresent };
export type { Variants };

/** Input modality is shared once, including keyboard dismissal during an entrance. */
const DialogMotionContext = createContext({ immediate: true, sheet: false });
export function useDialogMotion() {
  return useContext(DialogMotionContext);
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const [keyboard, setKeyboard] = useState(true);
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [sheet, setSheet] = useState(() => matchMedia("(max-width: 640px)").matches);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = matchMedia("(max-width: 640px)");
    const onKey = () => setKeyboard(true);
    const onPointer = () => setKeyboard(false);
    const onReduced = () => setReduced(preference.matches);
    const onNarrow = () => setSheet(narrow.matches);
    window.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onPointer, true);
    preference.addEventListener("change", onReduced);
    narrow.addEventListener("change", onNarrow);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onPointer, true);
      preference.removeEventListener("change", onReduced);
      narrow.removeEventListener("change", onNarrow);
    };
  }, []);
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <DialogMotionContext value={{ immediate: keyboard || reduced, sheet }}>
          {children}
        </DialogMotionContext>
      </MotionConfig>
    </LazyMotion>
  );
}
