/**
 * Custom datetime input that replaces the native `datetime-local` picker
 * with a compact calendar grid popover matching the app's design system.
 *
 * Accepts/emits values in "YYYY-MM-DDTHH:mm" format (same as datetime-local)
 * so it's a drop-in replacement wherever that format is used.
 *
 * Future dates are not allowed.
 */

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCloseOnModalOpen } from "../utils/modal-events.ts";
import { SegmentedControl } from "./SegmentedControl.tsx";
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
  label: string;
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function DateTimeInput({
  id,
  label,
  disabled = false,
  value,
  onChange,
}: DateTimeInputProps) {
  const [open, setOpen] = useState(false);
  const [narrow, setNarrow] = useState(() => window.matchMedia("(max-width: 360px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 360px)");
    const update = () => setNarrow(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);
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
  const { style: popoverStyle } = useAnchoredPopover(open, containerRef, {
    width: 368,
    height: 580,
    gap: 8,
    margin: narrow ? 0 : 16,
    contentRef: popoverRef,
  });

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

  // Seed and focus before paint so immediate arrow keys belong to the calendar.
  useLayoutEffect(() => {
    if (!open) {
      setFocusedDay(null);
      return;
    }
    const { parsed, viewYear, viewMonth, todayYear, todayMonth, todayDay } = snapRef.current;
    setFocusedDay(
      parsed?.year === viewYear && parsed?.month === viewMonth
        ? parsed.day
        : viewYear === todayYear && viewMonth === todayMonth
          ? todayDay
          : 1,
    );
  }, [open]);

  useLayoutEffect(() => {
    if (!open || focusedDay === null || showYearPicker) return;
    popoverRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focusedDay}"]`)?.focus();
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
      if (e.key === "Escape" && !e.defaultPrevented) {
        e.preventDefault();
        e.stopPropagation();
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

  const canGoPrev = viewYear > todayYear - 30 || (viewYear === todayYear - 30 && viewMonth > 0);
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
        e.stopPropagation();
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

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };
  return (
    <div ref={containerRef}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        aria-label={`${label}: ${displayText || "Not set"}`}
        onClick={() => {
          setOpen((v) => !v);
          setShowYearPicker(false);
        }}
        className="air-field pdf-date-trigger"
      >
        <span>{displayText || "Not set"}</span>
        <CalendarDays size={16} className="shrink-0" aria-hidden="true" />
      </button>
      {open &&
        popoverStyle &&
        createPortal(
          <div
            ref={popoverRef}
            id={popoverId}
            role="dialog"
            aria-label={`${label} date and time`}
            aria-describedby={`${popoverId}-help`}
            style={popoverStyle}
            className="air-popover pdf-date-popover thin-scrollbar"
          >
            <div className="pdf-date-heading">
              <h3>{label}</h3>
              <button
                type="button"
                className="air-icon-button"
                aria-label="Close date picker"
                onClick={close}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <p className="air-help" id={`${popoverId}-help`}>
              Choose a date up to today and a local time.
            </p>
            <div className="pdf-date-navigation">
              <button
                type="button"
                className="air-icon-button"
                onClick={handlePrevMonth}
                disabled={!canGoPrev || showYearPicker}
                aria-label="Previous month"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <span aria-live="polite">{MONTHS[viewMonth]}</span>
              <button
                type="button"
                className="air-button air-button--quiet"
                onClick={() => setShowYearPicker((v) => !v)}
                aria-expanded={showYearPicker}
                aria-label="Select year"
              >
                {viewYear}
                <ChevronDown size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="air-icon-button"
                onClick={handleNextMonth}
                disabled={!canGoNext || showYearPicker}
                aria-label="Next month"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
            {showYearPicker ? (
              <div className="pdf-date-years thin-scrollbar" role="group" aria-label="Year">
                {yearList.map((year) => (
                  <button
                    key={year}
                    ref={year === viewYear ? selectedYearRef : undefined}
                    type="button"
                    className="air-button air-button--quiet"
                    aria-pressed={year === viewYear}
                    onClick={() => handleYearSelect(year)}
                  >
                    {year}
                  </button>
                ))}
              </div>
            ) : (
              <table
                aria-label={`${MONTHS[viewMonth]} ${viewYear}`}
                onKeyDown={handleCalendarKeyDown}
                className="pdf-date-calendar"
              >
                <thead>
                  <tr>
                    {DAYS_SHORT.map((d) => (
                      <th key={d} scope="col">
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell) => {
                        if (cell < 0) return <td key={cell} />;
                        const selected =
                          parsed?.day === cell &&
                          parsed?.month === viewMonth &&
                          parsed?.year === viewYear;
                        const today =
                          cell === todayDay && viewMonth === todayMonth && viewYear === todayYear;
                        return (
                          <td key={cell}>
                            <button
                              type="button"
                              data-day={cell}
                              className="air-button air-button--quiet"
                              onClick={() => handleDayClick(cell)}
                              onFocus={() => setFocusedDay(cell)}
                              disabled={isDateFuture(viewYear, viewMonth, cell)}
                              tabIndex={calendarFocusDay === cell ? 0 : -1}
                              aria-label={`${cell} ${MONTHS[viewMonth]} ${viewYear}`}
                              aria-pressed={selected}
                              aria-current={today ? "date" : undefined}
                            >
                              {cell}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="pdf-date-time">
              <div className="pdf-property-field">
                <label className="air-label" htmlFor={`${popoverId}-hour`}>
                  Hour
                </label>
                <Select
                  id={`${popoverId}-hour`}
                  value={parsed ? String(hour12) : ""}
                  options={HOUR_OPTIONS}
                  onChange={(v) => handleHour12Change(Number(v))}
                  placeholder="—"
                />
              </div>
              <div className="pdf-property-field">
                <label className="air-label" htmlFor={`${popoverId}-minute`}>
                  Minute
                </label>
                <Select
                  id={`${popoverId}-minute`}
                  value={parsed ? String(parsed.minute) : ""}
                  options={MINUTE_OPTIONS}
                  onChange={(v) => handleTimePart("minute", Number(v))}
                  placeholder="—"
                />
              </div>
            </div>
            <SegmentedControl
              ariaLabel="AM or PM"
              value={parsed ? (isPm ? "PM" : "AM") : ""}
              onChange={(v) => {
                if (v === "AM" || v === "PM") handleAmPm(v);
              }}
              options={[
                { value: "AM", label: "AM" },
                { value: "PM", label: "PM" },
              ]}
              fullWidth
            />
            <div className="pdf-date-actions">
              <button
                type="button"
                className="air-button air-button--quiet"
                onClick={() => {
                  onChange("");
                  close();
                }}
              >
                Clear
              </button>
              <button type="button" className="air-button" onClick={setToNow}>
                Now
              </button>
              <button type="button" className="air-button air-button--primary" onClick={close}>
                Done
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
