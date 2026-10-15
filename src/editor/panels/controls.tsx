// controls.tsx — Small shared form controls for the option-bearing overlay
// tools (page numbers, Bates and other overlay panels). Designed to read well
// in the narrow right panel AND the mobile bottom sheet: large tap targets,
// one accent, no cramped rows.

import type { LucideIcon } from "lucide-react";

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

// 3 columns × 2 rows — the cells map spatially to the page corners, so the
// layout itself communicates the position.
const POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const;

export function PositionGrid<T extends string>({
  value,
  onChange,
}: {
  value: T;
  onChange: (p: T) => void;
}) {
  return (
    <div className="pdf-property-field">
      <span className="air-label">Position</span>
      <div className="pdf-position-grid" role="group" aria-label="Position">
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            type="button"
            className="air-icon-button"
            onClick={() => onChange(pos as T)}
            aria-label={pos.replace("-", " ")}
            title={pos.replace("-", " ")}
            aria-pressed={value === pos}
          >
            <svg width="22" height="28" viewBox="0 0 22 28" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="20" height="26" stroke="currentColor" opacity="0.45" />
              <path
                d={`M${pos.endsWith("left") ? 4 : pos.endsWith("right") ? 12 : 8} ${pos.startsWith("top") ? 6 : 22}h6`}
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Labeled({
  label,
  children,
  normalCase = false,
  icon: Icon,
}: {
  label: string;
  children: React.ReactNode;
  /** Render the label verbatim (no uppercase / wide tracking). Use when the
   *  label is user data — e.g. a PDF form field name like `Date_of_Birth` —
   *  where forcing UPPERCASE would misrepresent it. */
  normalCase?: boolean;
  /** Optional leading icon, shown before the label text. */
  icon?: LucideIcon;
}) {
  return (
    <div>
      <p
        className={
          normalCase
            ? "editor-control-label mb-1.5 flex items-center gap-1.5 wrap-break-word text-xs font-medium text-slate-500 dark:text-dark-text-muted"
            : "editor-control-label mb-1.5 flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-[0.1em] text-slate-400 dark:text-dark-text-muted"
        }
      >
        {Icon && (
          <Icon
            className="h-3.5 w-3.5 shrink-0 text-primary-500 dark:text-primary-400"
            aria-hidden="true"
          />
        )}
        {label}
      </p>
      {children}
    </div>
  );
}

/** A labelled binary setting: text on the left, an on/off switch on the
 *  right. Renders the same pill switch everywhere (the look the design system
 *  standardised on), so every settings toggle across the editor reads alike. */
export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="editor-control-toggle flex min-h-6 w-full items-center justify-between gap-3 rounded-md text-left text-sm text-slate-600 active:translate-y-px pointer-coarse:min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-dark-text-muted"
    >
      <span className="min-w-0">{label}</span>
      <SwitchTrack checked={checked} />
    </button>
  );
}

function SwitchTrack({ checked }: { checked: boolean }) {
  return (
    <span
      className={`cloak-switch-track relative h-6 w-11 shrink-0 rounded-full ${
        checked ? "bg-primary-600" : "bg-slate-300 dark:bg-dark-border"
      }`}
      aria-hidden="true"
    >
      <span
        className={`cloak-switch-thumb absolute left-0.5 top-0.5 h-5 w-5 rounded-full border border-slate-200 bg-white ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </span>
  );
}

/** A checkerboard CSS background so a transparent image reads as "no background"
 *  in a preview swatch (instead of an opaque white card that misrepresents it). */
export const TRANSPARENCY_CHECKER: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg,#e2e8f0 25%,transparent 25%),linear-gradient(-45deg,#e2e8f0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e2e8f0 75%),linear-gradient(-45deg,transparent 75%,#e2e8f0 75%)",
  backgroundSize: "12px 12px",
  backgroundPosition: "0 0,0 6px,6px -6px,-6px 0",
  backgroundColor: "#f8fafc",
};
