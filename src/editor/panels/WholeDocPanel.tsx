// WholeDocPanel.tsx — Shared right-panel layout for "whole-document" tools that
// have no canvas interaction: a blurb, optional controls, and one Apply button.
// Identical in the desktop right panel and the mobile bottom sheet (it's just a
// column of controls), so these tools are mobile-clean for free. Apply is
// disabled + relabelled while a transform is running so the user can't
// double-fire it.

import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { PrimaryAction } from "./PrimaryAction.tsx";

interface Props {
  /** One-line explanation of what Apply does. */
  blurb: string;
  /** Optional controls (segmented options, etc.) shown above the button. */
  children?: ReactNode;
  /** Label for the primary action. */
  applyLabel: string;
  onApply: () => void;
  /** Extra caveat shown under the button (e.g. "text is rasterised"). */
  note?: string;
  /** Render the action in the destructive (red) treatment. */
  danger?: boolean;
  disabled?: boolean;
}

export function WholeDocPanel({
  blurb,
  children,
  applyLabel,
  onApply,
  note,
  danger,
  disabled,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500 dark:text-dark-text-muted">{blurb}</p>
      {children}
      {/* On mobile this renders nothing and routes to the sheet's global ✓; on
          desktop it's the panel's own Apply button (see PrimaryAction). */}
      <PrimaryAction label={applyLabel} onApply={onApply} disabled={disabled} danger={danger} />
      {note && <p className="text-xs text-slate-500 dark:text-dark-text-muted">{note}</p>}
    </div>
  );
}

/**
 * Compact segmented control shared by the option-bearing whole-doc tools.
 * Selection glides: a measured thumb slides under the active option (matching
 * the editor's page-density toggle) instead of hard-swapping the highlight.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; sub?: string }[];
}) {
  const activeIndex = options.findIndex((o) => o.value === value);
  const listRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const btn = btnRefs.current[activeIndex];
      setThumb(btn ? { left: btn.offsetLeft, width: btn.offsetWidth } : null);
    };
    measure();
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, [activeIndex, options.length]);

  return (
    <div className="rounded-lg border border-slate-200 dark:border-dark-border p-0.5">
      <div ref={listRef} className="relative grid grid-flow-col gap-1">
        {thumb && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-0 h-full rounded-md bg-primary-600 duration-200 ease-out motion-safe:transition-[transform,width]"
            style={{ transform: `translateX(${thumb.left}px)`, width: thumb.width }}
          />
        )}
        {options.map((o, i) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={on}
              className={`relative z-10 flex flex-col items-center justify-center rounded-md px-2 py-1.5 pointer-coarse:min-h-11 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                on
                  ? "text-white"
                  : "text-slate-600 dark:text-dark-text-muted hover:text-slate-800 dark:hover:text-dark-text"
              }`}
            >
              {o.label}
              {o.sub && (
                <span
                  className={`text-xxs ${on ? "text-white/80" : "text-slate-500 dark:text-dark-text-muted"}`}
                >
                  {o.sub}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
