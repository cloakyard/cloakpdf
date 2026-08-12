// controls.tsx — Small shared form controls for the option-bearing overlay
// tools (page numbers, header/footer, bates, watermark). Designed to read well
// in the narrow right panel AND the mobile bottom sheet: large tap targets,
// one accent, no cramped rows.

import type { LucideIcon } from "lucide-react";
import { type FocusEvent as ReactFocusEvent, useCallback, useId, useRef } from "react";
import { ColorPicker, hexToRgb, rgbToHex } from "../../components/ColorPicker.tsx";
import { STAMP_TOKENS } from "../../utils/pdf-operations.ts";

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Colour control — the shared app ColorPicker (preset swatches Black · Grey ·
 *  Blue · Red, then a manual picker) bridged to the {r,g,b} the writers want.
 *  One colour UI across every tool, per the design system. */
export function ColorRow({ value, onChange }: { value: Rgb; onChange: (c: Rgb) => void }) {
  return (
    <ColorPicker
      value={rgbToHex(value.r, value.g, value.b)}
      onChange={(hex) => onChange(hexToRgb(hex))}
    />
  );
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
    <Labeled label="Position">
      <div className="editor-control-grid grid grid-cols-3 gap-1 rounded-md border border-slate-200 p-1 dark:border-dark-border">
        {POSITIONS.map((pos) => {
          const on = value === (pos as string);
          return (
            <button
              key={pos}
              type="button"
              onClick={() => onChange(pos as T)}
              aria-label={pos.replace("-", " ")}
              aria-pressed={on}
              className={`flex h-8 items-center justify-center rounded-sm pointer-coarse:min-h-11 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                on
                  ? "bg-primary-600"
                  : "bg-white hover:bg-slate-100 active:bg-slate-200/70 dark:bg-dark-bg dark:hover:bg-dark-surface-alt"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${on ? "bg-white" : "bg-slate-400 dark:bg-dark-text-muted"}`}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </Labeled>
  );
}

export function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="editor-control-label mb-1 flex items-center justify-between font-mono text-xs font-medium text-slate-500 dark:text-dark-text-muted">
        <span>{label}</span>
        <span className="font-mono tabular-nums text-slate-700 dark:text-dark-text">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="editor-control-range w-full accent-primary-600"
      />
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
}) {
  const id = useId();
  const fieldName = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  return (
    <label htmlFor={id} className="block">
      <span className="editor-control-label mb-1.5 flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-[0.1em] text-slate-400 dark:text-dark-text-muted">
        {Icon && (
          <Icon
            className="h-3.5 w-3.5 shrink-0 text-primary-500 dark:text-primary-400"
            aria-hidden="true"
          />
        )}
        {label}
      </span>
      <input
        id={id}
        name={fieldName}
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        className="editor-control-input w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 pointer-coarse:min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text"
      />
    </label>
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

/**
 * Tap-to-insert dynamic-field tokens for free-text stamp slots (header/footer,
 * watermark). `useTokenInsert` tracks the last-focused text field inside the
 * spread `containerProps` wrapper and `insert()` splices a token at its caret —
 * working for any controlled input/textarea without prop-drilling, by writing
 * through the native value setter and dispatching a real `input` event (so the
 * field's React `onChange` fires and state stays the single source of truth).
 */
export function useTokenInsert(): {
  containerProps: { onFocusCapture: (e: ReactFocusEvent) => void };
  insert: (token: string) => void;
} {
  const activeRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const onFocusCapture = useCallback((e: ReactFocusEvent) => {
    const t = e.target;
    if (t instanceof HTMLTextAreaElement || (t instanceof HTMLInputElement && t.type === "text")) {
      activeRef.current = t;
    }
  }, []);

  const insert = useCallback((token: string) => {
    const el = activeRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    const next = el.value.slice(0, start) + token + el.value.slice(end);
    const proto =
      el instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    // Write through the native value setter (with explicit `this`), then drive
    // React's onChange via a real input event so component state matches the DOM.
    Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, next);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    const caret = start + token.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  }, []);

  return { containerProps: { onFocusCapture }, insert };
}

/** A wrapped row of token chips. Pairs with {@link useTokenInsert}; chips keep
 *  the field's focus + caret (mousedown preventDefault) so insert lands in place. */
export function TokenBar({ onInsert }: { onInsert: (token: string) => void }) {
  return (
    <Labeled label="Insert field">
      <div className="flex flex-wrap gap-1.5">
        {STAMP_TOKENS.map((t) => (
          <button
            key={t.token}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onInsert(t.token)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs font-medium text-slate-600 hover:bg-primary-50 hover:text-primary-700 active:bg-primary-100 pointer-coarse:min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-muted dark:hover:bg-dark-surface-alt"
          >
            {t.label}
          </button>
        ))}
      </div>
    </Labeled>
  );
}

/** A labelled binary setting: text on the left, an on/off {@link Switch} on the
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

/** Accessible on/off pill switch — the editor's nicer alternative to a bare
 *  checkbox for a binary mode (matches the Export modal's switch). */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="editor-control-switch relative flex h-6 w-11 shrink-0 items-center justify-center rounded-lg active:translate-y-px pointer-coarse:-m-2.5 pointer-coarse:h-11 pointer-coarse:w-16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <SwitchTrack checked={checked} />
    </button>
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
