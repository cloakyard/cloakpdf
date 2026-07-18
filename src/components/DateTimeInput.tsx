/**
 * Custom datetime input that replaces the native `datetime-local` picker
 * with a compact calendar grid popover matching the app's design system.
 *
 * Accepts/emits values in "YYYY-MM-DDTHH:mm" format (same as datetime-local)
 * so it's a drop-in replacement wherever that format is used.
 *
 * Future dates are not allowed.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useCloseOnModalOpen } from "../utils/modal-events.ts";
import { Select } from "./Select.tsx";
import { useAnchoredPopover } from "./useAnchoredPopover.ts";

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => ({
  value: String(i),
  label: i.toString().padStart(2, "0"),
}));

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function parseValue(value: string) {
  if (!value || value.length < 16) return null;
  const year = parseInt(value.slice(0, 4), 10);
  const month = parseInt(value.slice(5, 7), 10) - 1;
  const day = parseInt(value.slice(8, 10), 10);
  const hour = parseInt(value.slice(11, 13), 10);
  const minute = parseInt(value.slice(14, 16), 10);
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  )
    return null;
  return { year, month, day, hour, minute };
}

function buildValue(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${year}-${pad(month + 1)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

function formatDisplay(value: string): string {
  const p = parseValue(value);
  if (!p) return "";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(p.year, p.month, p.day, p.hour, p.minute));
}

interface DateTimeInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}

export function DateTimeInput({ id, value, onChange }: DateTimeInputProps) {
  const [open, setOpen] = useState(false);
  useCloseOnModalOpen(setOpen);
  const popoverId = useId();
  const [showYearPicker, setShowYearPicker] = useState(false);
  // Keyboard-nav roving focus within the calendar grid
  const [focusedDay, setFocusedDay] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const selectedYearRef = useRef<HTMLButtonElement>(null);

  // Portal the calendar to <body> (fixed, anchored to the field) so the editor's
  // overflow-clipped panels / mobile sheet can't clip it.
  const { style: popoverStyle, above: popoverAbove } = useAnchoredPopover(open, containerRef, {
    width: 288,
    height: 480,
  });
  const popoverTop = popoverStyle?.top;
  const visualBottom =
    (window.visualViewport?.offsetTop ?? 0) + (window.visualViewport?.height ?? window.innerHeight);
  const popoverMaxHeight =
    typeof popoverTop === "number"
      ? Math.max(160, visualBottom - popoverTop - 8)
      : "calc(100svh - 1rem)";

  const parsed = useMemo(() => parseValue(value), [value]);

  // Computed fresh each render — avoids stale "today" if the component lives across midnight
  const _now = new Date();
  const todayYear = _now.getFullYear();
  const todayMonth = _now.getMonth();
  const todayDay = _now.getDate();

  // Calendar view state
  const [viewYear, setViewYear] = useState(parsed?.year ?? todayYear);
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? todayMonth);

  // Ref snapshot of current state — lets the open-seed effect read fresh values
  // without listing them as deps (it must only run when `open` toggles)
  const snapRef = useRef({ parsed, viewYear, viewMonth, todayYear, todayMonth, todayDay });
  snapRef.current = { parsed, viewYear, viewMonth, todayYear, todayMonth, todayDay };

  // Sync view when value changes externally
  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [parsed]);

  // Auto-scroll year picker so the selected year is centred on open
  useEffect(() => {
    if (showYearPicker && selectedYearRef.current) {
      selectedYearRef.current.scrollIntoView({ block: "center", behavior: "instant" });
      selectedYearRef.current.focus();
    }
  }, [showYearPicker]);

  // When the popover opens, seed the roving focus to the selected/today day.
  // Uses snapRef so this effect legitimately only needs to re-run when `open` changes.
  useEffect(() => {
    if (!open) {
      setFocusedDay(null);
      return;
    }
    const raf = requestAnimationFrame(() => {
      const { parsed, viewYear, viewMonth, todayYear, todayMonth, todayDay } = snapRef.current;
      const target =
        parsed?.year === viewYear && parsed?.month === viewMonth
          ? parsed.day
          : viewYear === todayYear && viewMonth === todayMonth
            ? todayDay
            : 1;
      setFocusedDay(target);
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  // Imperatively focus the roving-focus day button after state updates.
  // viewMonth/viewYear are intentionally omitted: focusedDay always changes
  // alongside them (via handleCalendarKeyDown), so it's a sufficient trigger.
  useEffect(() => {
    if (!open || focusedDay === null || showYearPicker) return;
    const btn = popoverRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focusedDay}"]`);
    btn?.focus();
  }, [focusedDay, open, showYearPicker]);

  // Keep the roving-focus day valid when moving between months with different
  // lengths (or into the current month, where future days are unavailable).
  useEffect(() => {
    if (!open || showYearPicker) return;
    const lastDay = getDaysInMonth(viewYear, viewMonth);
    const lastSelectableDay =
      viewYear === todayYear && viewMonth === todayMonth ? Math.min(lastDay, todayDay) : lastDay;
    setFocusedDay((day) => (day === null ? day : Math.min(Math.max(day, 1), lastSelectableDay)));
  }, [open, showYearPicker, viewYear, viewMonth, todayYear, todayMonth, todayDay]);

  // Close on outside click / Escape; return focus to trigger on close
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const t = e.target as Node;
      // The calendar popover is portaled to <body> (outside containerRef), as are
      // the hour/minute Selects' option lists — a click in either must NOT count
      // as "outside" or it would close the calendar mid-pick.
      if (t instanceof Element && t.closest('[role="listbox"]')) return;
      if (popoverRef.current?.contains(t)) return;
      if (containerRef.current && !containerRef.current.contains(t)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function handleFocusIn(e: FocusEvent) {
      const target = e.target as Node;
      if (target instanceof Element && target.closest('[role="listbox"]')) return;
      if (popoverRef.current?.contains(target) || containerRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [open]);

  const isDateFuture = useCallback(
    (year: number, month: number, day: number) => {
      if (year > todayYear) return true;
      if (year < todayYear) return false;
      if (month > todayMonth) return true;
      if (month < todayMonth) return false;
      return day > todayDay;
    },
    [todayYear, todayMonth, todayDay],
  );

  const canGoPrev = viewYear > todayYear - 30;
  const canGoNext = useMemo(() => {
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    return nextYear < todayYear || (nextYear === todayYear && nextMonth <= todayMonth);
  }, [viewMonth, viewYear, todayYear, todayMonth]);

  const handlePrevMonth = useCallback(() => {
    if (!canGoPrev) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [canGoPrev, viewMonth]);

  const handleNextMonth = useCallback(() => {
    if (!canGoNext) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [canGoNext, viewMonth]);

  const handleYearSelect = useCallback(
    (year: number) => {
      setViewYear(year);
      if (year === todayYear && viewMonth > todayMonth) {
        setViewMonth(todayMonth);
      }
      setShowYearPicker(false);
    },
    [todayYear, todayMonth, viewMonth],
  );

  const handleDayClick = useCallback(
    (day: number) => {
      if (isDateFuture(viewYear, viewMonth, day)) return;
      const now = new Date();
      const base = parsed ?? { hour: now.getHours(), minute: now.getMinutes() };
      onChange(buildValue(viewYear, viewMonth, day, base.hour, base.minute));
    },
    [viewYear, viewMonth, parsed, onChange, isDateFuture],
  );

  const handleTimePart = useCallback(
    (part: "hour" | "minute", val: number) => {
      const now = new Date();
      const base = parsed ?? {
        year: now.getFullYear(),
        month: now.getMonth(),
        day: now.getDate(),
        hour: 0,
        minute: 0,
      };
      const updated = { ...base, [part]: val };
      onChange(buildValue(updated.year, updated.month, updated.day, updated.hour, updated.minute));
    },
    [parsed, onChange],
  );

  const handleAmPm = useCallback(
    (ampm: "AM" | "PM") => {
      if (!parsed) {
        handleTimePart("hour", ampm === "PM" ? 12 : 0);
        return;
      }
      const isCurrentlyPm = parsed.hour >= 12;
      if (ampm === "PM" && !isCurrentlyPm) {
        handleTimePart("hour", parsed.hour + 12);
      } else if (ampm === "AM" && isCurrentlyPm) {
        handleTimePart("hour", parsed.hour - 12);
      }
    },
    [parsed, handleTimePart],
  );

  const handleHour12Change = useCallback(
    (h12: number) => {
      const isPm = parsed ? parsed.hour >= 12 : false;
      const h24 = isPm ? (h12 === 12 ? 12 : h12 + 12) : h12 === 12 ? 0 : h12;
      handleTimePart("hour", h24);
    },
    [parsed, handleTimePart],
  );

  const setToNow = useCallback(() => {
    const now = new Date();
    onChange(
      buildValue(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        now.getMinutes(),
      ),
    );
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setShowYearPicker(false);
  }, [onChange]);

  // Arrow-key navigation within the calendar grid (roving tabindex pattern)
  const handleCalendarKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (focusedDay === null) return;
      const delta: Partial<Record<string, number>> = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -7,
        ArrowDown: 7,
      };
      const d = delta[e.key];
      if (d !== undefined) {
        e.preventDefault();
        // new Date handles day-of-month overflow/underflow across months automatically
        const next = new Date(viewYear, viewMonth, focusedDay + d);
        if (isDateFuture(next.getFullYear(), next.getMonth(), next.getDate())) return;
        if (next.getFullYear() < todayYear - 30) return;
        setViewYear(next.getFullYear());
        setViewMonth(next.getMonth());
        setFocusedDay(next.getDate());
      }
    },
    [focusedDay, viewYear, viewMonth, isDateFuture, todayYear],
  );

  const hour12 = parsed ? parsed.hour % 12 || 12 : 12;
  const isPm = parsed ? parsed.hour >= 12 : false;
  const displayText = formatDisplay(value);

  // Build flat cell list: negative = empty spacer, positive = day number
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const lastSelectableDay =
    viewYear === todayYear && viewMonth === todayMonth
      ? Math.min(daysInMonth, todayDay)
      : daysInMonth;
  const fallbackFocusDay =
    parsed?.year === viewYear && parsed?.month === viewMonth
      ? Math.min(Math.max(parsed.day, 1), lastSelectableDay)
      : viewYear === todayYear && viewMonth === todayMonth
        ? todayDay
        : 1;
  const calendarFocusDay =
    focusedDay === null ? fallbackFocusDay : Math.min(Math.max(focusedDay, 1), lastSelectableDay);
  const firstDayOfWeek = getFirstDayOfWeek(viewYear, viewMonth);
  const cells: number[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(-(i + 1));
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Chunk into rows of 7 for the <table> structure, padding the last row
  const rows: number[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    const row = cells.slice(i, i + 7);
    while (row.length < 7) row.push(-(100 + i + row.length));
    rows.push(row);
  }

  // Year range for the year picker
  const yearList = Array.from({ length: 31 }, (_, i) => todayYear - 30 + i).reverse();

  const popoverAnimClass = popoverAbove ? "animate-popover-in-above" : "animate-popover-in";

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popoverId}
        aria-label={displayText ? `Date and time: ${displayText}` : "Select date and time"}
        onClick={() => {
          setOpen((v) => !v);
          setShowYearPicker(false);
        }}
        className="flex w-full items-center justify-between gap-2 rounded-[var(--radius-input)] border border-[var(--color-rule)] bg-[var(--color-surface)] px-3 py-2 text-left text-sm transition-[transform,opacity,color,background-color,border-color,box-shadow] pointer-coarse:min-h-11 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <span
          className={
            displayText
              ? "text-slate-800 dark:text-dark-text"
              : "text-slate-500 dark:text-slate-400"
          }
        >
          {displayText || "Not set"}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-[var(--color-ink-3)]" aria-hidden="true" />
      </button>

      {/* Popover panel — portaled to <body>, fixed-anchored to the field */}
      {open &&
        popoverStyle &&
        createPortal(
          <div
            ref={popoverRef}
            id={popoverId}
            role="dialog"
            // No aria-modal: this is a non-modal anchored popover (no backdrop,
            // no scroll lock, closes on outside click — Escape handled above).
            // aria-modal="true" promised a focus trap this disclosure pattern
            // deliberately doesn't have, so it's dropped to resolve the ARIA
            // contradiction rather than trap focus in a scrim-less surface.
            aria-label="Date and time picker"
            style={{ ...popoverStyle, maxHeight: popoverMaxHeight }}
            className={`${popoverAnimClass} cloak-popover thin-scrollbar z-[var(--z-popover)] max-h-[calc(100svh-1rem)] w-72 space-y-2 overflow-y-auto overscroll-contain p-3`}
          >
            {/* Month/year navigation header */}
            <div className="flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={!canGoPrev || showYearPicker}
                aria-label="Previous month"
                className={`cloak-focus rounded-md p-1 transition-[color,background-color,transform] active:translate-y-px pointer-coarse:min-h-11 pointer-coarse:min-w-11 ${
                  canGoPrev && !showYearPicker
                    ? "hover:bg-slate-100 dark:hover:bg-dark-surface-alt text-slate-500 dark:text-dark-text-muted"
                    : "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                }`}
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              <div className="flex items-center gap-1 flex-1 justify-center">
                <span className="text-xs font-semibold text-slate-700 dark:text-dark-text select-none">
                  {MONTHS[viewMonth].slice(0, 3)}
                </span>
                {/* Clickable year — toggles the year picker */}
                <button
                  type="button"
                  onClick={() => setShowYearPicker((v) => !v)}
                  aria-expanded={showYearPicker}
                  aria-label="Select year"
                  className={`cloak-focus flex items-center gap-0.5 rounded px-1 py-0.5 text-xs font-semibold transition-colors select-none pointer-coarse:min-h-11 ${
                    showYearPicker
                      ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                      : "text-slate-700 dark:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-surface-alt"
                  }`}
                >
                  {viewYear}
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${showYearPicker ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                disabled={!canGoNext || showYearPicker}
                aria-label="Next month"
                className={`cloak-focus rounded-md p-1 transition-[color,background-color,transform] active:translate-y-px pointer-coarse:min-h-11 pointer-coarse:min-w-11 ${
                  canGoNext && !showYearPicker
                    ? "hover:bg-slate-100 dark:hover:bg-dark-surface-alt text-slate-500 dark:text-dark-text-muted"
                    : "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                }`}
              >
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            {/* Year picker grid */}
            {showYearPicker ? (
              <div className="animate-fade-in grid grid-cols-4 gap-1 max-h-44 overflow-y-auto thin-scrollbar py-0.5">
                {yearList.map((year) => (
                  <button
                    key={year}
                    ref={year === viewYear ? selectedYearRef : undefined}
                    type="button"
                    onClick={() => handleYearSelect(year)}
                    className={`cloak-focus rounded-md py-1.5 text-xs font-medium transition-colors pointer-coarse:min-h-11 ${
                      year === viewYear
                        ? "bg-primary-600 text-white"
                        : year === todayYear
                          ? "border border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                          : "text-slate-700 dark:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-surface-alt"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            ) : (
              /* Calendar grid — use a real <table> so ARIA grid/columnheader/gridcell
               roles are correctly implied by native HTML semantics */
              <table
                aria-label={`${MONTHS[viewMonth]} ${viewYear}`}
                onKeyDown={handleCalendarKeyDown}
                className="w-full table-fixed animate-fade-in"
              >
                <thead>
                  <tr>
                    {DAYS_SHORT.map((d) => (
                      <th
                        key={d}
                        scope="col"
                        className="text-center text-xxs font-medium text-slate-400 dark:text-slate-500 pb-0.5 select-none"
                      >
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell) => {
                        if (cell < 0) {
                          return <td key={cell} />;
                        }
                        const day = cell;
                        const isFuture = isDateFuture(viewYear, viewMonth, day);
                        const isSelected =
                          parsed?.day === day &&
                          parsed?.month === viewMonth &&
                          parsed?.year === viewYear;
                        const isToday =
                          day === todayDay && viewMonth === todayMonth && viewYear === todayYear;
                        // Roving tabindex: only the focused day (or fallback to selected/today) is tabbable
                        const isFocusTarget = calendarFocusDay === day;

                        return (
                          <td key={day}>
                            <button
                              type="button"
                              data-day={day}
                              onClick={() => handleDayClick(day)}
                              onFocus={() => setFocusedDay(day)}
                              disabled={isFuture}
                              tabIndex={isFocusTarget ? 0 : -1}
                              aria-label={`${day} ${MONTHS[viewMonth]} ${viewYear}${isSelected ? ", selected" : ""}${isToday ? ", today" : ""}`}
                              aria-pressed={isSelected}
                              className={`
                              cloak-focus h-8 w-full flex items-center justify-center rounded-md text-xs transition-[color,background-color,transform] select-none active:translate-y-px pointer-coarse:h-11
                              ${
                                isSelected
                                  ? "bg-primary-600 text-white font-semibold"
                                  : isFuture
                                    ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                    : isToday
                                      ? "border border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-medium"
                                      : "text-slate-700 dark:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-surface-alt"
                              }
                            `}
                            >
                              {day}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Time row */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-dark-border flex-wrap">
              <span className="text-xxs font-medium text-slate-500 dark:text-dark-text-muted">
                Time
              </span>

              <div className="w-14">
                <Select
                  value={parsed ? String(hour12) : ""}
                  options={HOUR_OPTIONS}
                  onChange={(v) => handleHour12Change(parseInt(v, 10))}
                  ariaLabel="Hour"
                  placeholder="—"
                  size="sm"
                  className="pointer-coarse:min-h-11"
                />
              </div>

              <span className="text-slate-400 font-medium text-xs select-none" aria-hidden="true">
                :
              </span>

              <div className="w-16">
                <Select
                  value={parsed ? String(parsed.minute) : ""}
                  options={MINUTE_OPTIONS}
                  onChange={(v) => handleTimePart("minute", parseInt(v, 10))}
                  ariaLabel="Minute"
                  placeholder="—"
                  size="sm"
                  className="pointer-coarse:min-h-11"
                />
              </div>

              {/* AM/PM toggle — <fieldset> gives implicit role="group" */}
              <fieldset className="flex m-0 p-0 rounded-md border border-slate-200 dark:border-dark-border overflow-hidden text-xs">
                <legend className="sr-only">AM or PM</legend>
                {(["AM", "PM"] as const).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => handleAmPm(period)}
                    aria-pressed={parsed ? (period === "PM") === isPm : false}
                    className={`cloak-focus px-2 py-1 transition-colors pointer-coarse:min-h-11 ${
                      parsed && (period === "PM") === isPm
                        ? "bg-primary-600 text-white font-medium"
                        : "bg-white dark:bg-dark-bg text-slate-600 dark:text-dark-text-muted hover:bg-slate-50 dark:hover:bg-dark-surface-alt"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </fieldset>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-dark-border">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className="cloak-focus inline-flex items-center rounded-sm px-1 text-xs text-slate-500 transition-colors hover:text-red-500 pointer-coarse:min-h-11 dark:text-dark-text-muted dark:hover:text-red-400"
              >
                Clear
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={setToNow}
                  className="cloak-focus inline-flex items-center rounded-sm px-1 text-xs text-primary-600 transition-colors hover:text-primary-700 pointer-coarse:min-h-11 dark:text-primary-400"
                >
                  Now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className="cloak-focus min-h-8 rounded-md bg-primary-600 px-3 py-1 font-mono text-xxs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-primary-700 pointer-coarse:min-h-11"
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
