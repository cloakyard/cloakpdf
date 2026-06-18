/**
 * useSortableDrag — shared hook for page-reordering drag interactions.
 *
 * Supports both the HTML5 drag API (desktop) and touch events (mobile).
 *
 * Components must:
 *  1. Spread `getItemProps(slot)` onto every draggable item — this wires up
 *     both the HTML5 drag API and touch handlers in one call.
 *  2. Add `data-drop-slot={slot}` to every drop-zone div so touch tracking
 *     can identify the target slot via `document.elementFromPoint`.
 *     (If using `SortableGrid`, drop-zones are handled automatically.)
 *
 * Touch behaviour:
 *  - Drag activates after an 8 px movement threshold so short taps still
 *    fire onClick (important for DuplicatePage).
 *  - Once active, `touchmove` calls `preventDefault()` to stop the page
 *    from scrolling — this requires the listener to be non-passive, which
 *    is why it is registered on `document` rather than via JSX props.
 */

import { useState, useEffect, useRef, useCallback } from "react";

export function useSortableDrag(onMove: (fromIndex: number, toSlot: number) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  /** Current touch position — non-null only during an active touch drag. */
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);
  /**
   * Polite-live announcement of the last keyboard reorder, e.g.
   * "Page 3 moved to position 5 of 10." Render it in a visually-hidden
   * `aria-live="polite"` node so screen-reader users hear the result of an
   * arrow-key move (drag-and-drop alone has no keyboard path — WCAG 2.1.1).
   */
  const [liveMessage, setLiveMessage] = useState("");

  // Refs so the document-level listeners don't need to be re-registered
  const touchStartSlot = useRef<number | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDragActive = useRef(false);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  /** Touch handlers for a single draggable item (used internally by getItemProps). */
  const getTouchHandlers = useCallback(
    (slot: number) => ({
      onTouchStart(e: React.TouchEvent) {
        touchStartSlot.current = slot;
        touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        isDragActive.current = false;
      },
      // Prevent Android Chrome long-press context menu ("Open in new tab" etc.).
      onContextMenu(e: React.MouseEvent) {
        e.preventDefault();
      },
      // Prevent iOS long-press callout / page preview from hijacking drag.
      style: {
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        touchAction: "none",
      } as React.CSSProperties,
    }),
    [],
  );

  /**
   * All props needed to make an element draggable (HTML5 + touch).
   * Spread the result onto the draggable element:  `{...getItemProps(slot)}`
   */
  const getItemProps = useCallback(
    (slot: number) => ({
      draggable: true as const,
      onDragStart(e: React.DragEvent) {
        e.dataTransfer.effectAllowed = "move";
        setDragIndex(slot);
      },
      onDragEnd() {
        setDragIndex(null);
        setDragOverSlot(null);
      },
      ...getTouchHandlers(slot),
    }),
    [getTouchHandlers],
  );

  /**
   * Keyboard reorder props for a draggable item — the accessible counterpart
   * to the pointer drag. Spread onto a self-contained item card (or a dedicated
   * grip button when the item nests its own interactive controls):
   *   {...getKeyboardProps(slot, total, `Page ${n}`)}
   *
   * Arrow Left/Up move the item one slot earlier, Arrow Right/Down one slot
   * later, Home to the start, End to the end — each via the same `onMove(from,
   * toSlot)` contract the pointer path uses. The new position is announced via
   * `liveMessage`. `label` names the item (its identity, not its position).
   */
  const getKeyboardProps = useCallback(
    (slot: number, total: number, label: string) => ({
      tabIndex: 0,
      role: "button" as const,
      "aria-label": `${label}. Position ${slot + 1} of ${total}. Use arrow keys to move.`,
      onKeyDown(e: React.KeyboardEvent) {
        let toSlot: number | null = null;
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          if (slot > 0) toSlot = slot - 1;
        } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          if (slot < total - 1) toSlot = slot + 2;
        } else if (e.key === "Home") {
          if (slot > 0) toSlot = 0;
        } else if (e.key === "End") {
          if (slot < total - 1) toSlot = total;
        } else {
          return;
        }
        e.preventDefault();
        if (toSlot === null) return;
        onMoveRef.current(slot, toSlot);
        // Convert the insertion slot to the resulting 1-based position.
        const newPos = toSlot === 0 ? 1 : toSlot > slot ? toSlot : toSlot + 1;
        setLiveMessage(`${label} moved to position ${newPos} of ${total}.`);
      },
    }),
    [],
  );

  useEffect(() => {
    // Coalesce per-touchmove work into one animation frame: a raw touch stream
    // fires ~120Hz, and each event did a synchronous layout-reading
    // elementFromPoint hit-test PLUS two state setters (→ two SortableGrid
    // re-renders). Buffer the latest finger position and flush at most once per
    // frame. preventDefault stays synchronous in handleTouchMove so page scroll
    // is still suppressed mid-drag.
    let latestTouch: { x: number; y: number } | null = null;
    let rafId: number | null = null;

    const flush = () => {
      rafId = null;
      const p = latestTouch;
      if (!p || touchStartSlot.current === null) return;
      setTouchPos(p);
      const el = document.elementFromPoint(p.x, p.y);
      const zone = el?.closest("[data-drop-slot]") as HTMLElement | null;
      if (zone) {
        const slot = parseInt(zone.dataset.dropSlot!, 10);
        const from = touchStartSlot.current;
        const isAdjacent = slot === from || slot === from + 1;
        setDragOverSlot(isAdjacent ? null : slot);
      } else {
        setDragOverSlot(null);
      }
    };

    const cancelFrame = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      latestTouch = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartSlot.current === null || touchStartPos.current === null) return;

      const touch = e.touches[0];

      // Activate drag only after the finger has moved at least 8 px.
      if (!isDragActive.current) {
        const dx = touch.clientX - touchStartPos.current.x;
        const dy = touch.clientY - touchStartPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) < 8) return;
        isDragActive.current = true;
        setDragIndex(touchStartSlot.current);
      }

      // Prevent page scroll while reordering.
      e.preventDefault();

      // Defer the hit-test + state writes to the next frame (see above).
      latestTouch = { x: touch.clientX, y: touch.clientY };
      if (rafId === null) rafId = requestAnimationFrame(flush);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Drop a pending frame first so it can't re-set touchPos/dragOverSlot after
      // the end-reset below and flash a stale overlay. handleTouchEnd recomputes
      // the drop from changedTouches, so it never reads touchmove's state.
      cancelFrame();
      if (isDragActive.current && touchStartSlot.current !== null) {
        const touch = e.changedTouches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const zone = el?.closest("[data-drop-slot]") as HTMLElement | null;
        if (zone) {
          const slot = parseInt(zone.dataset.dropSlot!, 10);
          const from = touchStartSlot.current;
          const isAdjacent = slot === from || slot === from + 1;
          if (!isAdjacent) {
            onMoveRef.current(from, slot);
          }
        }
      }
      isDragActive.current = false;
      touchStartSlot.current = null;
      touchStartPos.current = null;
      setDragIndex(null);
      setDragOverSlot(null);
      setTouchPos(null);
    };

    const handleTouchCancel = () => {
      cancelFrame();
      isDragActive.current = false;
      touchStartSlot.current = null;
      touchStartPos.current = null;
      setDragIndex(null);
      setDragOverSlot(null);
      setTouchPos(null);
    };

    // Non-passive so we can call preventDefault() during active drag.
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("touchcancel", handleTouchCancel);

    return () => {
      cancelFrame();
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, []); // all mutable state accessed via refs — no deps needed

  return {
    dragIndex,
    dragOverSlot,
    touchPos,
    liveMessage,
    setDragIndex,
    setDragOverSlot,
    getItemProps,
    getKeyboardProps,
    getTouchHandlers,
  };
}

/** Convenience type for passing the full drag bag to SortableGrid. */
export type SortableDrag = ReturnType<typeof useSortableDrag>;
