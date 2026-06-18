import { type RefObject, useEffect } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Trap Tab focus within `ref` while `active`, and restore focus to the
 * element that was focused before the dialog opened once it closes.
 *
 * Pairs with the scroll-lock + Escape effect each modal already runs — this
 * hook owns only the Tab-containment + focus-restore halves, which were the
 * accessibility gap (modals declared `aria-modal` but Tab escaped to the
 * background and focus was never returned to the trigger). Plain DOM, no
 * dependency, matching the codebase's hand-rolled-hook convention.
 *
 * `ref` must point at the element carrying `role="dialog"` (the outer wrapper,
 * NOT the inner card) so the close button and backdrop are inside the cycle.
 * The `[tabindex="-1"]` backdrop button is correctly excluded by the selector.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !ref.current) return;
      const nodes = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const activeEl = document.activeElement;
      if (e.shiftKey && activeEl === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      previouslyFocused?.focus?.();
    };
  }, [ref, active]);
}
