/**
 * Shared page-stepper for tools that show one page of a PDF in a live
 * preview. Renders the "[‹] {n} / {total} [›]" cluster that lets the
 * user walk through the document without affecting what gets processed.
 *
 * Why this exists: the cluster used to be hand-copied into every tool
 * with a single-page preview, and had already drifted into five
 * different class strings (different focus rings, touch-target sizes,
 * and "{n} / {total}" vs "Page {n} of {total}" labels). This component
 * is the single source of truth so every stepper looks and behaves
 * identically by construction.
 *
 * It is intentionally **controlled and presentation-only**: it owns no
 * page state, renders no preview image, and — critically — has no
 * access to any page-selection Set. `onChange` is wired straight to the
 * tool's `setSelectedPage`. Because the component can only move the
 * preview cursor, paging can never change which pages a tool processes.
 *
 * Renders nothing for single-page (or empty) documents, mirroring the
 * `pageCount > 1` gate every call site used before.
 *
 * Variants (each used by a real tool — not speculative):
 * - `size`: "sm" (compact ~24px, the default, used in preview headers)
 *   vs "touch" (44px WCAG tap targets, for the interactive-canvas tools
 *   Bates Numbering and Redact where paging happens while drawing).
 * - `variant`: "minimal" (the muted corner stepper, default) vs
 *   "bordered" (Compare PDFs' prominent centred results pager). The
 *   bordered variant manages its own geometry, so `size` is ignored.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PagePreviewNavProps {
  /** 0-based index of the currently previewed page. */
  page: number;
  /** Total page count. Renders nothing when `total <= 1`. */
  total: number;
  /**
   * Called with the new 0-based page index, already clamped to
   * `[0, total - 1]`. Wire this straight to your `setSelectedPage`.
   */
  onChange: (next: number) => void;
  /** Tap-target size. Defaults to "sm". Ignored when `variant="bordered"`. */
  size?: "sm" | "touch";
  /** Visual treatment. Defaults to the muted corner "minimal" stepper. */
  variant?: "minimal" | "bordered";
}

// Shared focus + disabled behaviour. One accent (primary-500) per the
// design system — see DESIGN.md.
const FOCUS =
  "disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500";

const MINIMAL_BTN = `rounded text-slate-400 hover:text-slate-600 dark:hover:text-dark-text ${FOCUS}`;
// `sm` stays a compact ~24px stepper on fine pointers but floors to a 44px tap
// target on touch (pointer-coarse), so the muted corner stepper is still
// reliably tappable on a phone without changing the desktop look.
const SM_BTN = `p-1 pointer-coarse:min-w-11 pointer-coarse:min-h-11 pointer-coarse:flex pointer-coarse:items-center pointer-coarse:justify-center ${MINIMAL_BTN}`;
const TOUCH_BTN = `min-w-11 min-h-11 flex items-center justify-center ${MINIMAL_BTN}`;
const BORDERED_BTN = `p-1.5 rounded-lg border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-surface-alt ${FOCUS}`;

export function PagePreviewNav({
  page,
  total,
  onChange,
  size = "sm",
  variant = "minimal",
}: PagePreviewNavProps) {
  if (total <= 1) return null;

  const atStart = page <= 0;
  const atEnd = page >= total - 1;
  const bordered = variant === "bordered";

  const buttonClass = bordered ? BORDERED_BTN : size === "touch" ? TOUCH_BTN : SM_BTN;
  const chevronClass = bordered ? "w-4 h-4 text-slate-600 dark:text-dark-text-muted" : "w-4 h-4";
  const countClass = bordered
    ? "text-sm font-medium text-slate-700 dark:text-dark-text tabular-nums min-w-20 text-center"
    : "text-xs text-slate-500 dark:text-dark-text-muted tabular-nums px-1";

  return (
    <div className={`flex items-center ${bordered ? "gap-2" : "gap-0.5"}`}>
      <button
        type="button"
        aria-label="Previous page"
        disabled={atStart}
        onClick={() => onChange(Math.max(0, page - 1))}
        className={buttonClass}
      >
        <ChevronLeft className={chevronClass} />
      </button>
      <span role="status" aria-live="polite" className={countClass}>
        {page + 1} / {total}
      </span>
      <button
        type="button"
        aria-label="Next page"
        disabled={atEnd}
        onClick={() => onChange(Math.min(total - 1, page + 1))}
        className={buttonClass}
      >
        <ChevronRight className={chevronClass} />
      </button>
    </div>
  );
}
