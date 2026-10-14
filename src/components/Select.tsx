/**
 * Air select-only combobox: one field contour, inset icon, and custom menu rows.
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

import { Check, ChevronDown } from "lucide-react";
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
import { useCloseOnModalOpen } from "../utils/modal-events.ts";

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
  useCloseOnModalOpen(setOpen);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const [menuAbove, setMenuAbove] = useState(false);
  const [animateMenu, setAnimateMenu] = useState(true);

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
    const viewport = window.visualViewport;
    const viewportTop = viewport?.offsetTop ?? 0;
    const viewportLeft = viewport?.offsetLeft ?? 0;
    const vh = viewport?.height ?? window.innerHeight;
    const vw = viewport?.width ?? document.documentElement.clientWidth;
    const viewportBottom = viewportTop + vh;
    const viewportRight = viewportLeft + vw;
    const margin = 16;
    const gap = 4;
    const spaceBelow = viewportBottom - r.bottom - margin - gap;
    const spaceAbove = r.top - viewportTop - margin - gap;
    const below = spaceBelow >= spaceAbove || spaceBelow >= 240;
    const maxHeight = Math.max(0, Math.floor(Math.min(280, below ? spaceBelow : spaceAbove)));
    const width = Math.min(r.width, vw - margin * 2);
    const left = Math.max(viewportLeft + margin, Math.min(r.left, viewportRight - width - margin));
    setMenuStyle({
      position: "fixed",
      left,
      width,
      maxHeight,
      top: below ? r.bottom + gap : undefined,
      bottom: below ? undefined : window.innerHeight - r.top + gap,
    });
    setMenuAbove(!below);
  }, []);

  const close = useCallback((refocus = true) => {
    setOpen(false);
    setActiveIndex(-1);
    if (refocus) triggerRef.current?.focus();
  }, []);

  const openMenu = useCallback(
    (active: number, animated: boolean) => {
      if (disabled || firstEnabled < 0) return;
      // Safari does not focus buttons on pointer click. A select-only combobox
      // keeps keyboard ownership on its trigger while the listbox is open.
      triggerRef.current?.focus({ preventScroll: true });
      place();
      setAnimateMenu(animated);
      setActiveIndex(active);
      setOpen(true);
    },
    [disabled, firstEnabled, place],
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
    window.visualViewport?.addEventListener("scroll", onMove);
    // Editor reflow can finish after the window resize event. Track the actual
    // control size as well so the portal stays attached through that second layout.
    const observer = new ResizeObserver(onMove);
    if (triggerRef.current) observer.observe(triggerRef.current);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("scroll", onMove, { capture: true });
      window.removeEventListener("resize", onMove);
      window.visualViewport?.removeEventListener("resize", onMove);
      window.visualViewport?.removeEventListener("scroll", onMove);
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
          else openMenu(i, false);
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
          openMenu(selectedIndex >= 0 ? selectedIndex : firstEnabled, false);
        } else if (key === "ArrowUp") {
          consume();
          openMenu(selectedIndex >= 0 ? selectedIndex : lastEnabled, false);
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
        disabled={disabled || firstEnabled < 0}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? optId(activeIndex) : undefined}
        aria-label={ariaLabel}
        onClick={(event) =>
          open
            ? close()
            : openMenu(selectedIndex >= 0 ? selectedIndex : firstEnabled, event.detail > 0)
        }
        onKeyDown={onKeyDown}
        data-size={size}
        className={`air-field air-select-trigger pdf-select ${className}`}
      >
        <span
          className={`min-w-0 truncate text-left ${selected ? "" : "text-[var(--air-ink-muted)]"}`}
        >
          {selected ? selected.label : (placeholder ?? "")}
        </span>
        <span className="air-select-icon" aria-hidden="true">
          <ChevronDown className={`cloak-disclosure-icon ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open &&
        menuStyle &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabel ? undefined : id}
            style={menuStyle}
            data-side={menuAbove ? "above" : "below"}
            data-motion={animateMenu ? "surface" : "instant"}
            className="air-menu air-select-popup pdf-select-popup cloak-popover-motion thin-scrollbar"
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
                  data-highlighted={isActive || undefined}
                  data-selected={isSel || undefined}
                  data-disabled={o.disabled || undefined}
                  className="air-menu-item"
                >
                  <span className="min-w-0 truncate">{o.label}</span>
                  {isSel && <Check className="air-menu-check" aria-hidden="true" />}
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </>
  );
}
