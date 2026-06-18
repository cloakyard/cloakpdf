/**
 * useSpotlightGlow — cursor/touch-tracking radial glow used by ToolCard and
 * FileDropZone. Spread `handlers` onto the target
 * element and render an absolutely-positioned div with `glowStyle` inside
 * it for the painted gradient.
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface SpotlightGlowOptions {
  /** Radial gradient color (e.g. "rgba(37,99,235,0.16)"). */
  color: string;
  /** Radial gradient radius in px. Defaults to 320. */
  radius?: number;
}

export function useSpotlightGlow<E extends HTMLElement = HTMLButtonElement>({
  color,
  radius = 320,
}: SpotlightGlowOptions) {
  const ref = useRef<E>(null);
  const [glowStyle, setGlowStyle] = useState<React.CSSProperties>({ opacity: 0 });

  // rAF-coalesce pointer moves: pointer events fire far more often than the
  // display refreshes, so we stash the latest coordinates and flush at most
  // one setState per frame.
  const pendingPos = useRef<{ x: number; y: number } | null>(null);
  const rafId = useRef<number | null>(null);

  const flushGlow = useCallback(() => {
    rafId.current = null;
    const pos = pendingPos.current;
    const el = ref.current;
    if (!pos || !el) return;
    const rect = el.getBoundingClientRect();
    setGlowStyle({
      opacity: 1,
      background: `radial-gradient(${radius}px circle at ${pos.x - rect.left}px ${pos.y - rect.top}px, ${color}, transparent 70%)`,
    });
  }, [color, radius]);

  const setGlowAt = useCallback(
    (clientX: number, clientY: number) => {
      pendingPos.current = { x: clientX, y: clientY };
      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(flushGlow);
      }
    },
    [flushGlow],
  );

  const clearGlow = useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    pendingPos.current = null;
    setGlowStyle({ opacity: 0 });
  }, []);

  // Cancel any pending frame on unmount.
  useEffect(
    () => () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    },
    [],
  );

  const handlers = {
    onMouseMove: (e: React.MouseEvent<E>) => setGlowAt(e.clientX, e.clientY),
    onMouseLeave: clearGlow,
    onTouchStart: (e: React.TouchEvent<E>) => {
      const t = e.touches[0];
      setGlowAt(t.clientX, t.clientY);
    },
    onTouchMove: (e: React.TouchEvent<E>) => {
      const t = e.touches[0];
      setGlowAt(t.clientX, t.clientY);
    },
    onTouchEnd: clearGlow,
    onTouchCancel: clearGlow,
  };

  return { ref, glowStyle, handlers };
}
