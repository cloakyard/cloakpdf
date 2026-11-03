import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPresenceMotion, type PresenceKind } from "./presence.mjs";

/** Keep the real surface mounted through exit, with no timer or per-frame React work. */
export function useAirPresence<T extends HTMLElement = HTMLDivElement>(
  open: boolean,
  kind: PresenceKind = "dialog",
  options: { ref?: RefObject<T | null>; ready?: boolean } = {},
) {
  const ownRef = useRef<T>(null);
  const ref = options.ref ?? ownRef;
  const ready = options.ready ?? true;
  const [mounted, setMounted] = useState(open);
  const motion = useRef<ReturnType<typeof createPresenceMotion> | null>(null);
  if (open && !mounted) setMounted(true);
  useLayoutEffect(() => {
    if (!mounted || !ready || !ref.current) return;
    const controller = createPresenceMotion(ref.current, kind, () => setMounted(false));
    motion.current = controller;
    return () => {
      controller.destroy();
      motion.current = null;
    };
  }, [mounted, kind, ref, ready]);
  useLayoutEffect(() => {
    motion.current?.update(open);
  }, [open, mounted, kind, ready]);
  return { ref, mounted, closing: !open && mounted };
}
