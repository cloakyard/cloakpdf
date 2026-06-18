// controls.tsx — Small shared form controls for the option-bearing overlay
// tools (page numbers, header/footer, bates, watermark). Designed to read well
// in the narrow right panel AND the mobile bottom sheet: large tap targets,
// one accent, no cramped rows.

import type { LucideIcon } from "lucide-react";
import { ColorPicker, hexToRgb, rgbToHex } from "../../components/ColorPicker.tsx";
import { Select } from "../../components/Select.tsx";

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
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-200 dark:border-dark-border p-1">
        {POSITIONS.map((pos) => {
          const on = value === (pos as string);
          return (
            <button
              key={pos}
              type="button"
              onClick={() => onChange(pos as T)}
              aria-label={pos.replace("-", " ")}
              aria-pressed={on}
              className={`flex h-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                on
                  ? "bg-primary-600"
                  : "bg-slate-100 dark:bg-dark-bg hover:bg-slate-200 dark:hover:bg-dark-surface-alt"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${on ? "bg-white" : "bg-slate-400 dark:bg-dark-text-muted"}`}
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
      <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-dark-text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-slate-700 dark:text-dark-text">
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
        className="w-full accent-primary-600"
      />
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
}) {
  return (
    <Labeled label={label} icon={icon}>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface px-2.5 py-1.5 text-sm text-slate-800 dark:text-dark-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      />
    </Labeled>
  );
}

/** App dropdown styled to match the panel's inputs (the custom {@link Select},
 *  not a native control). Generic over the option value so callers keep their
 *  string-literal unions. */
export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  icon,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  icon?: LucideIcon;
}) {
  return (
    <Labeled label={label} icon={icon}>
      <Select value={value} options={options} onChange={onChange} ariaLabel={label} />
    </Labeled>
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
            ? "mb-1.5 flex items-center gap-1.5 wrap-break-word text-xs font-medium text-slate-500 dark:text-dark-text-muted"
            : "mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-slate-400 dark:text-dark-text-muted"
        }
      >
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-primary-500 dark:text-primary-400" />}
        {label}
      </p>
      {children}
    </div>
  );
}

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
    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-dark-text-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus-visible:ring-primary-500"
      />
      {label}
    </label>
  );
}
