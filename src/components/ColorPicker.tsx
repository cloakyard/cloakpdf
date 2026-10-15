/** Air colour controls. Presets and direct hex entry share a non-modal, anchored
 * picker; the gradient and three labelled axes preserve author colours. */

import { Check, Plus, X } from "lucide-react";
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
  label?: string;
  onChange: (hex: string) => void;
}

export function ColorPicker({ value, onChange, label = "Color" }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  useCloseOnModalOpen(setOpen);
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const svAreaRef = useRef<HTMLDivElement>(null);
  const saturationInputRef = useRef<HTMLInputElement>(null);
  // Portal the popover to <body> so the editor's overflow-clipped panels / mobile
  // sheet can't clip it; anchor it to the swatch row.
  const { style: popoverStyle } = useAnchoredPopover(open, rootRef, {
    width: 320,
    height: 490,
    gap: 8,
    margin: 16,
    contentRef: menuRef,
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
  const toggleOpen = useCallback(() => {
    setOpen((prev) => {
      if (!prev) {
        const converted = hexToHsv(value);
        setHsv(converted);
        setHexInput(value);
        setHexTouched(false);
      }
      return !prev;
    });
  }, [value]);

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
        e.stopPropagation();
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
    const frame = requestAnimationFrame(() => {
      if (matchMedia("(pointer: coarse)").matches) menuRef.current?.focus();
      else saturationInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open, !!popoverStyle]);

  /* ---- Saturation/Brightness drag ---- */
  const draggingSV = useRef(false);
  const dragStart = useRef(value);

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
      dragStart.current = value;
      draggingSV.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      updateSV(e.clientX, e.clientY);
    },
    [updateSV, value],
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
    <div className="pdf-color" ref={rootRef} role="group" aria-labelledby={`${popoverId}-label`}>
      <p className="air-label" id={`${popoverId}-label`}>
        {label}
      </p>
      <div className="pdf-color__swatches">
        {colorPresets.map((preset) => (
          <button
            key={preset.hex}
            type="button"
            aria-label={`${preset.label} color${eqHex(value, preset.hex) ? " (selected)" : ""}`}
            aria-pressed={eqHex(value, preset.hex)}
            className="air-icon-button pdf-color__swatch"
            onClick={() => {
              onChange(preset.hex);
              setOpen(false);
            }}
          >
            <span style={{ background: preset.hex }} aria-hidden="true">
              {eqHex(value, preset.hex) && <Check size={14} color="white" />}
            </span>
          </button>
        ))}
        <button
          ref={triggerRef}
          type="button"
          className="air-icon-button pdf-color__swatch"
          aria-label={`Custom color${!isPreset ? ` (${value})` : ""}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? popoverId : undefined}
          onClick={toggleOpen}
        >
          <span
            style={{
              background: !isPreset
                ? value
                : "conic-gradient(#f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
            }}
            aria-hidden="true"
          >
            {isPreset ? <Plus size={14} color="white" /> : <Check size={14} color="white" />}
          </span>
        </button>
      </div>
      {open &&
        popoverStyle &&
        createPortal(
          <div
            ref={menuRef}
            id={popoverId}
            role="dialog"
            tabIndex={-1}
            aria-label="Custom color picker"
            aria-describedby={`${popoverId}-title`}
            style={popoverStyle}
            className="air-popover pdf-color__popover thin-scrollbar"
          >
            <div className="pdf-color__heading">
              <h3 id={`${popoverId}-title`}>{label}</h3>
              <button
                type="button"
                className="air-icon-button"
                aria-label="Close color picker"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div
              ref={svAreaRef}
              role="group"
              aria-label="Saturation and brightness picker"
              className="pdf-color__plane"
              style={{
                background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})`,
              }}
              onPointerDown={handleSVPointerDown}
              onPointerMove={handleSVPointerMove}
              onPointerUp={handleSVPointerUp}
              onPointerCancel={() => {
                if (!draggingSV.current) return;
                draggingSV.current = false;
                setHsv(hexToHsv(dragStart.current));
                setHexInput(dragStart.current);
                onChange(dragStart.current);
              }}
            >
              <span
                className="pdf-color__point"
                style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: value }}
                aria-hidden="true"
              />
            </div>
            <label className="pdf-color__axis">
              <span>
                Saturation <output>{Math.round(hsv.s * 100)}%</output>
              </span>
              <input
                ref={saturationInputRef}
                type="range"
                min={0}
                max={100}
                step={1}
                aria-label="Saturation"
                aria-valuetext={`${Math.round(hsv.s * 100)}%`}
                value={Math.round(hsv.s * 100)}
                onChange={handleSaturationChange}
              />
            </label>
            <label className="pdf-color__axis">
              <span>
                Brightness <output>{Math.round(hsv.v * 100)}%</output>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                aria-label="Brightness"
                aria-valuetext={`${Math.round(hsv.v * 100)}%`}
                value={Math.round(hsv.v * 100)}
                onChange={handleBrightnessChange}
              />
            </label>
            <label className="pdf-color__axis">
              <span>
                Hue <output>{Math.round(hsv.h)}°</output>
              </span>
              <input
                type="range"
                min={0}
                max={360}
                aria-label="Hue"
                aria-valuetext={`${Math.round(hsv.h)} degrees`}
                value={Math.round(hsv.h)}
                onChange={handleHueChange}
              />
            </label>
            <label className="air-label" htmlFor={`${popoverId}-hex`}>
              Hex color value
            </label>
            <input
              id={`${popoverId}-hex`}
              type="text"
              name="hex-color"
              autoComplete="off"
              value={hexInput}
              onChange={handleHexInput}
              onBlur={() => setHexTouched(true)}
              maxLength={7}
              spellCheck={false}
              aria-invalid={showHexError}
              aria-describedby={`${popoverId}-hex-help`}
              className="air-field"
            />
            <p
              id={`${popoverId}-hex-help`}
              className={showHexError ? "air-help air-help--error" : "air-help"}
              aria-live="polite"
            >
              {showHexError
                ? "Use 6 hexadecimal digits, such as #2563EB."
                : "Changes apply as you choose a colour."}
            </p>
          </div>,
          document.body,
        )}
    </div>
  );
}
