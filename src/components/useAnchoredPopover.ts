/**
 * useAnchoredPopover — position a body-portaled popover as `position: fixed`,
 * anchored to a trigger element's rect.
 *
 * Why: the editor's mobile bottom sheet and the properties panel are
 * `overflow-hidden` / `overflow-y-auto`, which CLIPS an absolutely-positioned
 * popover (a colour picker, a date calendar) rendered inside them. A fixed,
 * body-portaled layer escapes every ancestor clip; this hook computes its
 * coordinates from the trigger, flips it above when there isn't room below, and
 * clamps it to the viewport — re-anchoring on scroll/resize so it tracks the
 * trigger. Same idiom as the Select component's inline `place()`.
 *
 * The caller renders the popover via `createPortal(..., document.body)` with
 * `style={style}` and gates on `style` being non-null.
 */

import { type CSSProperties, type RefObject, useCallback, useLayoutEffect, useState } from "react";

interface Opts {
  /** Popover width in px (used to clamp the left edge within the viewport). */
  width: number;
  /** Approximate popover height in px (used to decide whether to flip above). */
  height: number;
  /** Gap between the trigger and the popover. */
  gap?: number;
  /** Minimum margin from the viewport edges. */
  margin?: number;
}

export function useAnchoredPopover(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  { width, height, gap = 4, margin = 8 }: Opts,
): { style: CSSProperties | null; above: boolean } {
  const [style, setStyle] = useState<CSSProperties | null>(null);
  const [above, setAbove] = useState(false);

  const place = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const viewport = window.visualViewport;
    const viewportTop = viewport?.offsetTop ?? 0;
    const viewportLeft = viewport?.offsetLeft ?? 0;
    const vh = viewport?.height ?? window.innerHeight;
    const vw = viewport?.width ?? document.documentElement.clientWidth;
    const viewportBottom = viewportTop + vh;
    const viewportRight = viewportLeft + vw;
    const spaceBelow = viewportBottom - r.bottom - margin;
    const spaceAbove = r.top - viewportTop - margin;
    const flip = spaceBelow < height && spaceAbove > spaceBelow;
    const left = Math.max(viewportLeft + margin, Math.min(r.left, viewportRight - width - margin));
    const top = flip
      ? Math.max(viewportTop + margin, r.top - height - gap)
      : Math.max(
          viewportTop + margin,
          Math.min(r.bottom + gap, viewportBottom - Math.min(height, vh - margin * 2) - margin),
        );
    setAbove(flip);
    setStyle({
      position: "fixed",
      left,
      top,
      width,
    });
  }, [anchorRef, width, height, gap, margin]);

  // Position before paint when opening; keep anchored on scroll/resize. A
  // capture-phase scroll listener catches scrolls in any ancestor (the bottom
  // sheet, the properties panel) since the popover lives outside them in a portal.
  useLayoutEffect(() => {
    if (!open) return;
    place();
    let raf = 0;
    const onMove = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(place);
    };
    window.addEventListener("scroll", onMove, { capture: true, passive: true });
    window.addEventListener("resize", onMove);
    window.visualViewport?.addEventListener("resize", onMove);
    window.visualViewport?.addEventListener("scroll", onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onMove, { capture: true });
      window.removeEventListener("resize", onMove);
      window.visualViewport?.removeEventListener("resize", onMove);
      window.visualViewport?.removeEventListener("scroll", onMove);
    };
  }, [open, place]);

  return { style, above };
}
