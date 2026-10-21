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
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export { AnimatePresence, m, useMotionValue, useIsPresent };
export type { Variants };

/** Input modality is shared once, including keyboard dismissal during an entrance. */
const DialogMotionContext = createContext(true);

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
  const keyboard = useContext(DialogMotionContext);
  // A dialog can open before a queued media-query change event arrives.
  // Read the current preference/viewport in each consumer's render.
  const reduced = useMediaSnapshot("(prefers-reduced-motion: reduce)");
  const sheet = useMediaSnapshot("(max-width: 640px)");
  return { immediate: keyboard || reduced, sheet };
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const [keyboard, setKeyboard] = useState(true);
  useEffect(() => {
    const onKey = () => setKeyboard(true);
    const onPointer = () => setKeyboard(false);
    window.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onPointer, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onPointer, true);
    };
  }, []);
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <DialogMotionContext value={keyboard}>{children}</DialogMotionContext>
      </MotionConfig>
    </LazyMotion>
  );
}
