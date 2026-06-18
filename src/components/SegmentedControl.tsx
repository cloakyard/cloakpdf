/**
 * Generic segmented (radio-style) toggle control.
 *
 * Two visual sizes:
 *  - "md"  full-width form control (page size, output format, modes)
 *  - "sm"  compact inline pill row (sort, view toggles)
 *
 * Pass `fullWidth` for the wide layout where each option fills the row.
 * Without it the control is `inline-flex` and sizes to its options — used
 * for header-area toggles like ComparePdf's "Side by Side / Diff Overlay".
 *
 * Selection glides: a single thumb sits behind the options and slides to the
 * active one (the same motion as the editor's page-density toggle) rather than
 * hard-swapping a per-button highlight. The thumb is *measured* from the active
 * button's box, so it lands correctly under variable-width labels (inline mode)
 * as well as equal `flex-1` segments (`fullWidth`).
 */

import { type ComponentType, type ReactNode, useLayoutEffect, useRef, useState } from "react";

export interface SegmentedOption<T extends string | number | boolean> {
  value: T;
  label: ReactNode;
  /** Optional leading icon (lucide). Renders at 14×14 in sm, 14×14 in md. */
  icon?: ComponentType<{ className?: string }>;
}

interface SegmentedControlProps<T extends string | number | boolean> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  /** Visual size. Defaults to "md". */
  size?: "sm" | "md";
  /** Stretch the control to fill its container; each option becomes flex-1. */
  fullWidth?: boolean;
  /** Accessible name for the group; rendered as a <fieldset> legend if provided. */
  ariaLabel?: string;
}

const SIZE = {
  sm: {
    pad: "rounded-lg p-0.5",
    gap: "gap-0.5",
    // pointer-coarse:min-h-11 floors the tap target to 44px on touch devices
    // (the Sort toggle is reordered by finger on mobile) while leaving the
    // pixel-tuned desktop resting visual identical — the variant is inert on
    // fine pointers and the h-full thumb grows to match automatically.
    button: "px-2.5 py-1 text-xs rounded-md pointer-coarse:min-h-11",
    thumb: "rounded-md",
    icon: "w-3.5 h-3.5",
  },
  md: {
    pad: "rounded-xl p-1",
    gap: "gap-0.5",
    button: "rounded-lg py-1.5 px-3 text-sm",
    thumb: "rounded-lg",
    icon: "w-3.5 h-3.5",
  },
} as const;

export function SegmentedControl<T extends string | number | boolean>({
  value,
  onChange,
  options,
  size = "md",
  fullWidth = false,
  ariaLabel,
}: SegmentedControlProps<T>) {
  const s = SIZE[size];
  const activeIndex = options.findIndex((opt) => opt.value === value);

  // Sliding thumb geometry, measured from the active button so it tracks any
  // label width. `null` until the first layout pass (and whenever no option is
  // active), which simply hides the thumb.
  const listRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const btn = btnRefs.current[activeIndex];
      setThumb(btn ? { left: btn.offsetLeft, width: btn.offsetWidth } : null);
    };
    measure();
    // Re-measure when the track resizes — `fullWidth` segments follow the
    // container, and font loading can shift inline widths after first paint.
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, [activeIndex, options.length, size, fullWidth]);

  const trackClasses = `inline-flex items-center ${s.pad} bg-slate-100 dark:bg-dark-bg border border-slate-200 dark:border-dark-border ${
    fullWidth ? "w-full" : ""
  }`;

  return (
    <div role="group" aria-label={ariaLabel} className={trackClasses}>
      {/* Relative list: the thumb and the buttons share one coordinate space so
          the measured offsets line up exactly (no border/padding in between). */}
      <div
        ref={listRef}
        className={`relative flex items-center ${s.gap} ${fullWidth ? "w-full" : ""}`}
      >
        {thumb && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute top-0 h-full ${s.thumb} bg-primary-600 duration-200 ease-out motion-safe:transition-[transform,width]`}
            style={{ transform: `translateX(${thumb.left}px)`, width: thumb.width }}
          />
        )}
        {options.map((opt, i) => {
          const active = opt.value === value;
          const Icon = opt.icon;
          const buttonClasses = `relative z-10 inline-flex items-center justify-center gap-1.5 ${s.button} transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-dark-bg ${
            fullWidth ? "flex-1" : ""
          } ${
            active
              ? "font-semibold text-white"
              : "font-medium text-slate-500 dark:text-dark-text-muted hover:text-slate-700 dark:hover:text-dark-text"
          }`;
          return (
            <button
              key={String(opt.value)}
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.value)}
              className={buttonClasses}
            >
              {Icon && <Icon className={s.icon} />}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
