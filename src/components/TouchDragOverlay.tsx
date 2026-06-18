/**
 * TouchDragOverlay — floating preview that follows the finger during touch drag.
 *
 * On desktop, the HTML5 Drag API provides a built-in ghost image. On mobile,
 * touch events have no equivalent, so this component renders a small
 * semi-transparent thumbnail at the current touch position via a portal.
 */

import { createPortal } from "react-dom";

interface TouchDragOverlayProps {
  /** Current touch coordinates (null when not dragging via touch). */
  touchPos: { x: number; y: number } | null;
  children: React.ReactNode;
}

export function TouchDragOverlay({ touchPos, children }: TouchDragOverlayProps) {
  if (!touchPos) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        // Move via a compositor-only transform instead of left/top so each
        // finger move doesn't dirty layout. translate3d positions the box at the
        // finger, then translate(-50%, -60%) offsets by the element's own size —
        // visually identical to the old left/top + percentage-translate.
        left: 0,
        top: 0,
        transform: `translate3d(${touchPos.x}px, ${touchPos.y}px, 0) translate(-50%, -60%)`,
        pointerEvents: "none",
        zIndex: 9999,
      }}
      className="opacity-80 scale-90 shadow-xl rounded-lg"
    >
      {children}
    </div>,
    document.body,
  );
}
