// OrientationLock.tsx — Phone-only portrait enforcement.
//
// On phones (small viewport AND coarse pointer) the PDF tools don't
// have enough horizontal real estate to lay out the page thumbnails,
// drawer, and controls in landscape — the bottom toolbar gets crammed
// and previews become letterboxed. Tablets and desktops have plenty of
// width either way, so they keep their existing layout regardless of
// orientation.
//
// Two enforcement layers:
//   1. `screen.orientation.lock("portrait")` — works in installed PWA
//      mode (manifest display: standalone) on Android Chrome. Best-
//      effort; iOS Safari and most desktop browsers reject it. We
//      attempt anyway — if it succeeds, the overlay never appears.
//   2. A full-screen rotate-device overlay shown when JS lock fails
//      *and* the device is currently in landscape. Fallback that
//      always works — no special permissions required.
//
// Detection uses both viewport size (≤ 760 px short edge) AND coarse
// pointer so a desktop window resized to phone width doesn't trigger
// the overlay.

import { Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "../utils/useFocusTrap.ts";

// `ScreenOrientation.lock` is non-standard on some platforms (iOS Safari
// just doesn't expose it) and TypeScript's lib.dom types vary by version.
// Resolve at call time via a structural cast so we don't fight either
// the runtime or the type checker.
type LockableOrientation = {
  lock?: (type: "portrait" | "landscape" | "any" | "natural") => Promise<void>;
};

function isPhoneLandscape(): boolean {
  if (typeof window === "undefined") return false;
  // Phone heuristic: smallest dimension ≤ 760 px AND coarse-pointer
  // primary input. Avoids triggering on:
  //   • Desktop browsers resized narrow (no coarse pointer).
  //   • Tablets in landscape (short edge typically ≥ 800 px).
  const shortEdge = Math.min(window.innerWidth, window.innerHeight);
  if (shortEdge > 760) return false;
  const coarse =
    typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  if (!coarse) return false;
  return window.innerWidth > window.innerHeight;
}

export function OrientationLock() {
  const [showOverlay, setShowOverlay] = useState(() => isPhoneLandscape());
  const overlayRef = useRef<HTMLDivElement>(null);
  useFocusTrap(overlayRef, showOverlay);

  useEffect(() => {
    // Best-effort native lock for installed PWAs. Wrapped in try/catch
    // because most browsers reject it outside fullscreen — the failure
    // path is exactly the overlay we render below.
    const orientation = window.screen?.orientation as LockableOrientation | undefined;
    if (orientation?.lock) {
      const shortEdge = Math.min(window.innerWidth, window.innerHeight);
      const coarse =
        typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
      if (shortEdge <= 760 && coarse) {
        orientation.lock("portrait").catch(() => {
          // Expected on iOS Safari, desktop browsers, and PWAs not in
          // fullscreen — fall back to the visual overlay.
        });
      }
    }

    const update = () => setShowOverlay(isPhoneLandscape());
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  if (!showOverlay) return null;

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="orientation-lock-title"
      aria-describedby="orientation-lock-copy"
      tabIndex={-1}
      data-cloak-modal-root="true"
      // Top-level overlay — must outrank every modal and toast in the
      // app so the user never sees a half-rotated UI.
      className="fixed inset-0 z-[var(--z-system-overlay)] flex flex-col items-center justify-center bg-[var(--color-paper)] px-8 text-center text-[var(--color-ink)] overscroll-contain"
    >
      <div className="w-full max-w-sm border-y border-[var(--color-rule-strong)] py-7">
        <p className="cloak-dialog__eyebrow mb-5 text-primary-600">Viewport / portrait required</p>
        <Smartphone
          className="animate-rotate-hint mx-auto h-12 w-12 text-primary-600"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <div className="mt-5 flex flex-col gap-2">
          <h2 id="orientation-lock-title" className="text-[17px] font-semibold tracking-tight">
            Rotate your phone
          </h2>
          <p
            id="orientation-lock-copy"
            className="mx-auto max-w-xs text-[13.5px] leading-relaxed text-[var(--color-ink-2)]"
          >
            CloakPDF is designed for portrait mode on phones — there is more room for page
            thumbnails and tools that way. Turn your device upright to keep editing.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
