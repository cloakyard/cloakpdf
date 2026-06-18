// PrimaryAction.tsx — A tool's single "commit this tool's work" button.
//
// Desktop: renders an inline Apply button in the right panel (each tool still
// owns its own primary CTA, since the desktop shell has no global Apply).
//
// Mobile: renders NOTHING and instead hands the action to the bottom sheet's
// global ✓ (Done) button via registerPendingApply — so a phone never shows two
// Apply buttons (the redundant per-tool one). The ✓ flushes whatever is
// registered, then closes the tool; when nothing is registered (no work, or a
// tool that has no single "apply") the ✓ just closes.
//
// Only tools with ONE redundant "apply this tool's work" CTA use this. Tools
// with several distinct actions keep their own buttons and do NOT use it:
// OCR (Extract / Make searchable), Attachments (add / remove), Redact & Erase
// (marks persist and burn at export — the ✓ closes, keeping them).

import { useEffect, useRef } from "react";
import { useEditorActions, useEditorRead } from "../EditorContext.tsx";

interface Props {
  /** Button label (desktop). Auto-swaps to "Working…" while a transform runs. */
  label: string;
  /** Commit the tool's work. May return a promise. */
  onApply: () => void | Promise<void>;
  /** Tool-specific disabled condition. Busy is handled internally. */
  disabled?: boolean;
  /** Destructive (red) treatment, e.g. Scrub. */
  danger?: boolean;
  /** Extra classes for the desktop button (e.g. `flex-1` to share a row). */
  className?: string;
}

export function PrimaryAction({
  label,
  onApply,
  disabled = false,
  danger = false,
  className = "",
}: Props) {
  const { layout, busyLabel } = useEditorRead();
  const { registerPendingApply } = useEditorActions();
  const isMobile = layout === "mobile";
  const busy = busyLabel !== null;
  const ready = !disabled && !busy;

  // Latch the latest onApply so the registration effect doesn't re-run on every
  // render when a caller passes an inline arrow — re-registering identity-only
  // changes would thrash the pendingApply version (and could loop).
  const onApplyRef = useRef(onApply);
  onApplyRef.current = onApply;

  // On mobile, route the action to the sheet's global ✓. Always register while
  // mounted (carrying `ready`) so the ✓ can grey out when the apply isn't
  // actionable — matching this button's disabled state on desktop — instead of
  // looking tappable but silently closing. Cleared on unmount.
  useEffect(() => {
    if (!isMobile) return;
    registerPendingApply({ run: () => onApplyRef.current(), ready });
    return () => registerPendingApply(null);
  }, [isMobile, ready, registerPendingApply]);

  if (isMobile) return null;

  return (
    <button
      type="button"
      onClick={onApply}
      disabled={!ready}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        danger
          ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500"
          : "bg-primary-600 hover:bg-primary-700 focus-visible:ring-primary-500"
      } ${className}`}
    >
      {busy ? "Working…" : label}
    </button>
  );
}
