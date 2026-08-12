/**
 * Shared colour picker with preset swatches and a custom colour popover.
 *
 * Displays 4 preset colour circles followed by a "custom" button that opens
 * an inline popover containing a saturation/brightness gradient area, a hue
 * slider, and a hex input. The popover is dismissed by clicking outside or
 * pressing Escape.
 *
 * The component is fully controlled via `value` (hex string) and `onChange`.
 */

import { useState, useRef, useEffect, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { colorPresets } from "../config/theme.ts";
import { useCloseOnModalOpen } from "../utils/modal-events.ts";
import { useAnchoredPopover } from "./useAnchoredPopover.ts";

/* ------------------------------------------------------------------ */
/*  Colour-space helpers                                               */
/* ------------------------------------------------------------------ */

function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  const r = Math.round(f(5) * 255);
  const g = Math.round(f(3) * 255);
  const b = Math.round(f(1) * 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  Preset colours — centralised in theme.ts                           */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [animatePopover, setAnimatePopover] = useState(true);
  useCloseOnModalOpen(setOpen);
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const svAreaRef = useRef<HTMLDivElement>(null);
  const saturationInputRef = useRef<HTMLInputElement>(null);
  // Portal the popover to <body> so the editor's overflow-clipped panels / mobile
  // sheet can't clip it; anchor it to the swatch row.
  const { style: popoverStyle, above: popoverAbove } = useAnchoredPopover(open, rootRef, {
    width: 256,
    height: 280,
  });

  // Hex compared case-insensitively: presets are stored uppercase (theme.ts)
  // but values round-trip through rgbToHex / manual entry as lowercase, so a
  // strict === would never flag a preset as selected.
  const eqHex = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  const isPreset = colorPresets.some((p) => eqHex(p.hex, value));

  // Internal HSV state for the popover – synced from value when opening
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const [hexInput, setHexInput] = useState(value);
  const [hexTouched, setHexTouched] = useState(false);

  // Sync internal state when popover opens
  const toggleOpen = useCallback(
    (animated: boolean) => {
      setAnimatePopover(animated);
      setOpen((prev) => {
        if (!prev) {
          const converted = hexToHsv(value);
          setHsv(converted);
          setHexInput(value);
          setHexTouched(false);
        }
        return !prev;
      });
    },
    [value],
  );

  // Close on click-outside or Escape
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Node;
      // The popover is portaled out of rootRef now, so a click inside it would
      // read as "outside" — keep it open for clicks in either the row or popover.
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !popoverStyle) return;
    const frame = requestAnimationFrame(() => saturationInputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open, popoverStyle]);

  /* ---- Saturation/Brightness drag ---- */
  const draggingSV = useRef(false);

  const updateSV = useCallback(
    (clientX: number, clientY: number) => {
      const rect = svAreaRef.current?.getBoundingClientRect();
      if (!rect) return;
      const s = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const v = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
      const next = { ...hsv, s, v };
      setHsv(next);
      const hex = hsvToHex(next.h, next.s, next.v);
      setHexInput(hex);
      onChange(hex);
    },
    [hsv, onChange],
  );

  const handleSVPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      draggingSV.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      updateSV(e.clientX, e.clientY);
    },
    [updateSV],
  );

  const handleSVPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingSV.current) return;
      updateSV(e.clientX, e.clientY);
    },
    [updateSV],
  );

  const handleSVPointerUp = useCallback(() => {
    draggingSV.current = false;
  }, []);

  const handleSaturationChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = { ...hsv, s: Number(e.target.value) / 100 };
      setHsv(next);
      const hex = hsvToHex(next.h, next.s, next.v);
      setHexInput(hex);
      onChange(hex);
    },
    [hsv, onChange],
  );

  const handleBrightnessChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = { ...hsv, v: Number(e.target.value) / 100 };
      setHsv(next);
      const hex = hsvToHex(next.h, next.s, next.v);
      setHexInput(hex);
      onChange(hex);
    },
    [hsv, onChange],
  );

  /* ---- Hue slider ---- */
  const handleHueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const h = Number(e.target.value);
      const next = { ...hsv, h };
      setHsv(next);
      const hex = hsvToHex(next.h, next.s, next.v);
      setHexInput(hex);
      onChange(hex);
    },
    [hsv, onChange],
  );

  /* ---- Hex input ---- */
  const handleHexInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setHexInput(raw);
      if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
        setHsv(hexToHsv(raw));
        onChange(raw.toLowerCase());
      }
    },
    [onChange],
  );

  const hueColor = hsvToHex(hsv.h, 1, 1);
  const hexValid = /^#[0-9a-fA-F]{6}$/.test(hexInput);
  const showHexError = hexTouched && !hexValid;

  return (
    <div className="relative" ref={rootRef}>
      <div className="flex items-center gap-2.5">
        <span className="text-xs text-slate-500 dark:text-dark-text-muted shrink-0">Color:</span>

        {colorPresets.map((p) => (
          <button
            key={p.hex}
            type="button"
            aria-label={`${p.label} color${eqHex(value, p.hex) ? " (selected)" : ""}`}
            onClick={() => {
              onChange(p.hex);
              setOpen(false);
            }}
            className="relative -m-2 flex min-h-11 min-w-11 items-center justify-center rounded-full touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            <span
              className={`block w-6 h-6 sm:w-5 sm:h-5 rounded-full border-2 ${
                eqHex(value, p.hex)
                  ? "border-primary-500"
                  : "border-slate-300 dark:border-dark-border"
              }`}
              style={{ backgroundColor: p.hex }}
              aria-hidden="true"
            />
          </button>
        ))}

        {/* Custom colour trigger */}
        <button
          ref={triggerRef}
          type="button"
          aria-label={`Custom color${!isPreset ? ` (${value})` : ""}${open ? " — picker open" : ""}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? popoverId : undefined}
          onClick={(event) => toggleOpen(event.detail > 0)}
          className="relative -m-2 flex min-h-11 min-w-11 items-center justify-center rounded-full touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          <span
            className={`flex items-center justify-center w-6 h-6 sm:w-5 sm:h-5 rounded-full border-2 ${
              open || !isPreset ? "border-primary-500" : "border-slate-300 dark:border-dark-border"
            }`}
            style={{
              background: !isPreset
                ? value
                : "conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
            }}
            aria-hidden="true"
          >
            {isPreset && (
              <span className="text-white text-xxs font-bold drop-shadow-sm leading-none">+</span>
            )}
          </span>
        </button>
      </div>

      {/* ---- Popover (portaled to <body>, fixed-anchored) ---- */}
      {open &&
        popoverStyle &&
        createPortal(
          <div
            ref={menuRef}
            id={popoverId}
            role="dialog"
            aria-label="Custom color picker"
            style={popoverStyle}
            data-side={popoverAbove ? "above" : "below"}
            data-motion={animatePopover ? "surface" : "instant"}
            className="cloak-popover cloak-popover-motion thin-scrollbar z-[var(--z-popover)] max-h-[min(22rem,calc(100svh-1rem))] w-64 space-y-3 overflow-y-auto overscroll-contain p-3"
          >
            {/* Saturation / Brightness area */}
            <div
              ref={svAreaRef}
              role="group"
              aria-label="Saturation and brightness picker"
              className="relative h-40 w-full cursor-crosshair touch-none select-none rounded-lg focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 sm:h-36"
              style={{
                background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})`,
              }}
              onPointerDown={handleSVPointerDown}
              onPointerMove={handleSVPointerMove}
              onPointerUp={handleSVPointerUp}
              onPointerCancel={handleSVPointerUp}
            >
              <input
                ref={saturationInputRef}
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(hsv.s * 100)}
                onChange={handleSaturationChange}
                aria-label="Saturation"
                aria-valuetext={`${Math.round(hsv.s * 100)}%`}
                className="sr-only"
              />
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(hsv.v * 100)}
                onChange={handleBrightnessChange}
                aria-label="Brightness"
                aria-valuetext={`${Math.round(hsv.v * 100)}%`}
                className="sr-only"
              />
              {/* Indicator */}
              <div
                className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${hsv.s * 100}%`,
                  top: `${(1 - hsv.v) * 100}%`,
                  backgroundColor: value,
                }}
              />
            </div>

            {/* Hue slider */}
            <input
              type="range"
              aria-label="Hue"
              min={0}
              max={360}
              value={Math.round(hsv.h)}
              onChange={handleHueChange}
              className="w-full h-3 rounded-full appearance-none cursor-pointer touch-manipulation pointer-coarse:h-11 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-300 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-300 [&::-moz-range-thumb]:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              style={{
                background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "100% 0.75rem",
              }}
            />

            {/* Hex input + preview */}
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-md border border-slate-200 dark:border-dark-border shrink-0"
                style={{ backgroundColor: value }}
                aria-hidden="true"
              />
              <input
                type="text"
                aria-label="Hex color value"
                name="hex-color"
                autoComplete="off"
                value={hexInput}
                onChange={handleHexInput}
                onBlur={() => setHexTouched(true)}
                maxLength={7}
                spellCheck={false}
                inputMode="text"
                aria-invalid={showHexError}
                aria-describedby={`${popoverId}-hex-help`}
                className={`flex-1 min-w-0 px-2 py-1.5 text-sm sm:text-card-desc font-mono border dark:bg-dark-surface-alt dark:text-dark-text rounded-md focus-visible:outline-none focus-visible:ring-1 pointer-coarse:min-h-11 ${
                  showHexError
                    ? "border-red-500 focus-visible:ring-red-500 dark:border-red-400"
                    : "border-slate-300 focus-visible:ring-primary-500 dark:border-dark-border"
                }`}
              />
            </div>
            <p
              id={`${popoverId}-hex-help`}
              className={`min-h-[1lh] text-xxs leading-tight ${
                showHexError
                  ? "text-red-600 dark:text-red-400"
                  : "text-slate-500 dark:text-dark-text-muted"
              }`}
              aria-live="polite"
            >
              {showHexError ? "Use 6 hexadecimal digits, such as #2563EB." : "6-digit hex value"}
            </p>
          </div>,
          document.body,
        )}
    </div>
  );
}
