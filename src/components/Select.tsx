/**
 * Select — the app's custom dropdown, replacing the native `<select>`.
 *
 * Why this exists: a native `<select>` on mobile pops the OS picker (a full
 * grey iOS/Android wheel that ignores the app's design language), and on the
 * desktop it can't be styled past the trigger. This component renders an
 * app-styled trigger + a listbox popover that matches the rest of the system
 * (slate-200 border, one Ocean-Blue accent, rounded-xl shadowed popover — the
 * same idiom as ColorPicker / DateTimeInput).
 *
 * The list is PORTALED to <body> with `position: fixed`, anchored to the
 * trigger's rect. That's deliberate: the editor's mobile bottom sheet and the
 * properties panel are `overflow-hidden`/`overflow-y-auto`, which would clip an
 * absolutely-positioned popover. A fixed, body-portaled layer escapes every
 * ancestor clip and re-anchors on scroll/resize so it tracks the trigger.
 *
 * A11y: the ARIA "select-only combobox" pattern — a `role="combobox"` button
 * with `aria-activedescendant` into a `role="listbox"`. Focus never leaves the
 * trigger, so there's no focus-juggling; full keyboard support (arrows, Home/
 * End, type-ahead, Enter/Escape) lives on the button.
 */

import { ChevronDown } from "lucide-react";
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export interface SelectOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Plain-text used for type-ahead and the trigger display when `label` is a
   *  node. Defaults to `label` if it's a string, else the value. */
  searchText?: string;
  disabled?: boolean;
}

interface SelectProps<T extends string> {
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Accessible name — required when there's no associated visible <label>. */
  ariaLabel?: string;
  /** id for the trigger (so a <label htmlFor> can point at it). */
  id?: string;
  /** Shown when `value` matches no option (e.g. an empty-string prompt). */
  placeholder?: string;
  /** Visual density. "md" matches panel inputs; "sm" matches compact rows. */
  size?: "sm" | "md";
  /** Extra classes for the trigger (e.g. width). */
  className?: string;
}

const TRIGGER_BASE =
  "inline-flex w-full items-center justify-between gap-1.5 rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-800 dark:text-dark-text transition-[transform,opacity,color,background-color,border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50";

const TRIGGER_SIZE = {
  sm: "rounded-md px-2 py-1 text-xs",
  md: "px-2.5 py-1.5 text-sm",
} as const;

const OPTION_SIZE = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3 py-2 text-sm",
} as const;

const optText = <T extends string>(o: SelectOption<T>): string =>
  o.searchText ?? (typeof o.label === "string" ? o.label : String(o.value));

export function Select<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel,
  id,
  placeholder,
  size = "md",
  className = "",
}: SelectProps<T>) {
  const reactId = useId();
  const listId = `${reactId}-listbox`;
  const optId = (i: number) => `${reactId}-opt-${i}`;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeBuf = useRef<{ text: string; at: number }>({ text: "", at: 0 });

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const firstEnabled = options.findIndex((o) => !o.disabled);
  const lastEnabled = (() => {
    for (let i = options.length - 1; i >= 0; i--) if (!options[i].disabled) return i;
    return -1;
  })();
  const nextEnabled = (from: number, dir: 1 | -1) => {
    for (let i = from + dir; i >= 0 && i < options.length; i += dir) {
      if (!options[i].disabled) return i;
    }
    return from >= 0 && !options[from]?.disabled ? from : dir === 1 ? firstEnabled : lastEnabled;
  };

  // Anchor the fixed-position menu to the trigger; re-run on scroll/resize so it
  // tracks. Flips above the trigger when there's more room there (mobile sheet).
  const place = useCallback(() => {
    const btn = triggerRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = document.documentElement.clientWidth;
    const margin = 8;
    const gap = 4;
    const spaceBelow = vh - r.bottom - margin;
    const spaceAbove = r.top - margin;
    const below = spaceBelow >= spaceAbove || spaceBelow >= 240;
    const maxHeight = Math.max(120, Math.floor(Math.min(280, below ? spaceBelow : spaceAbove)));
    const left = Math.max(margin, Math.min(r.left, vw - r.width - margin));
    setMenuStyle({
      position: "fixed",
      left,
      width: r.width,
      maxHeight,
      ...(below ? { top: r.bottom + gap } : { bottom: vh - r.top + gap }),
    });
  }, []);

  const close = useCallback((refocus = true) => {
    setOpen(false);
    setActiveIndex(-1);
    if (refocus) triggerRef.current?.focus();
  }, []);

  const openMenu = useCallback(
    (active: number) => {
      if (disabled) return;
      place();
      setActiveIndex(active);
      setOpen(true);
    },
    [disabled, place],
  );

  const choose = useCallback(
    (i: number) => {
      const o = options[i];
      if (!o || o.disabled) return;
      onChange(o.value);
      close();
    },
    [options, onChange, close],
  );

  // Position before paint when opening; keep anchored on scroll/resize. A
  // capture-phase scroll listener catches scrolls in any ancestor (the bottom
  // sheet, the properties panel) since the menu lives outside them in a portal.
  useLayoutEffect(() => {
    if (!open) return;
    place();
    let raf = 0;
    const onMove = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(place);
    };
    window.addEventListener("scroll", onMove, { capture: true, passive: true });
    window.addEventListener("resize", onMove);
    window.visualViewport?.addEventListener("resize", onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onMove, { capture: true });
      window.removeEventListener("resize", onMove);
      window.visualViewport?.removeEventListener("resize", onMove);
    };
  }, [open, place]);

  // Close on outside pointerdown.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || listRef.current?.contains(t)) return;
      close(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [open, close]);

  // Keep the active option scrolled into view as it changes.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current
      ?.querySelector<HTMLElement>(`#${CSS.escape(optId(activeIndex))}`)
      ?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeIndex]);

  const typeAhead = useCallback(
    (ch: string) => {
      const now = performance.now();
      const buf = typeBuf.current;
      buf.text = now - buf.at > 600 ? ch : buf.text + ch;
      buf.at = now;
      const q = buf.text.toLowerCase();
      const start = Math.max(0, activeIndex);
      // Search from the current item forward, wrapping, so repeated letters cycle.
      for (let k = 1; k <= options.length; k++) {
        const i = (start + k) % options.length;
        const o = options[i];
        if (!o.disabled && optText(o).toLowerCase().startsWith(q)) {
          if (open) setActiveIndex(i);
          else openMenu(i);
          return;
        }
      }
    },
    [activeIndex, options, open, openMenu],
  );

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      const key = e.key;
      const printable = key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey;
      // When focused, the combobox OWNS the keys it acts on — stop them bubbling
      // to app-level handlers (e.g. the annotate canvas's global arrow-key nudge
      // / Delete listener) so navigating the dropdown can't also move a mark.
      const consume = () => {
        e.preventDefault();
        e.stopPropagation();
      };
      if (!open) {
        if (key === "ArrowDown" || key === "Enter" || key === " ") {
          consume();
          openMenu(selectedIndex >= 0 ? selectedIndex : firstEnabled);
        } else if (key === "ArrowUp") {
          consume();
          openMenu(selectedIndex >= 0 ? selectedIndex : lastEnabled);
        } else if (printable) {
          consume();
          typeAhead(key);
        }
        return;
      }
      switch (key) {
        case "ArrowDown":
          consume();
          setActiveIndex((i) => nextEnabled(i, 1));
          break;
        case "ArrowUp":
          consume();
          setActiveIndex((i) => nextEnabled(i, -1));
          break;
        case "Home":
          consume();
          setActiveIndex(firstEnabled);
          break;
        case "End":
          consume();
          setActiveIndex(lastEnabled);
          break;
        case "Enter":
        case " ":
          consume();
          if (activeIndex >= 0) choose(activeIndex);
          break;
        case "Escape":
          consume();
          close();
          break;
        case "Tab":
          // Don't preventDefault — let focus move — but close and keep the key
          // from reaching app-level listeners.
          e.stopPropagation();
          close(false);
          break;
        default:
          if (printable) {
            consume();
            typeAhead(key);
          }
      }
    },
    [
      disabled,
      open,
      selectedIndex,
      firstEnabled,
      lastEnabled,
      activeIndex,
      openMenu,
      choose,
      close,
      typeAhead,
      nextEnabled,
    ],
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? optId(activeIndex) : undefined}
        aria-label={ariaLabel}
        onClick={() =>
          open ? close() : openMenu(selectedIndex >= 0 ? selectedIndex : firstEnabled)
        }
        onKeyDown={onKeyDown}
        className={`${TRIGGER_BASE} ${TRIGGER_SIZE[size]} ${className}`}
      >
        <span
          className={`min-w-0 truncate text-left ${selected ? "" : "text-slate-400 dark:text-dark-text-muted"}`}
        >
          {selected ? selected.label : (placeholder ?? "")}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open &&
        menuStyle &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            style={menuStyle}
            className="thin-scrollbar z-[900] overflow-y-auto overscroll-contain rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface p-1 shadow-xl"
          >
            {options.map((o, i) => {
              const isSel = o.value === value;
              const isActive = i === activeIndex;
              return (
                <li
                  key={o.value}
                  id={optId(i)}
                  role="option"
                  aria-selected={isSel}
                  aria-disabled={o.disabled || undefined}
                  onPointerEnter={() => !o.disabled && setActiveIndex(i)}
                  onClick={() => choose(i)}
                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg ${OPTION_SIZE[size]} ${
                    o.disabled
                      ? "cursor-not-allowed text-slate-300 dark:text-dark-text-muted/50"
                      : isActive
                        ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200"
                        : "text-slate-700 dark:text-dark-text"
                  }`}
                >
                  <span className="min-w-0 truncate">{o.label}</span>
                  {isSel && (
                    <span className="text-primary-600 dark:text-primary-300" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </>
  );
}
