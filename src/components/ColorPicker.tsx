/** Air colour controls. A hue/saturation wheel, brightness and exact hex entry
 * share one non-modal popover across every PDF tool. */

import { Check, Plus, X } from "lucide-react";
import { useState, useRef, useEffect, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { hexToHsv, hsvToHex, wheelPosition, wheelValue } from "../../docs/air/colour.mjs";
import { colorPresets } from "../config/theme.ts";
import { useCloseOnModalOpen } from "../utils/modal-events.ts";
import { useAnchoredPopover } from "./useAnchoredPopover.ts";

/* ------------------------------------------------------------------ */
/*  Colour-space helpers                                               */
/* ------------------------------------------------------------------ */

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
  const wheelRef = useRef<HTMLDivElement>(null);
  const brightnessInputRef = useRef<HTMLInputElement>(null);
  // Portal the popover to <body> so the editor's overflow-clipped panels / mobile
  // sheet can't clip it; anchor it to the swatch row.
  const { style: popoverStyle } = useAnchoredPopover(open, rootRef, {
    width: 320,
    height: 520,
    gap: 8,
    margin: 16,
    contentRef: menuRef,
  });

  // Hex compared case-insensitively: presets are stored uppercase (theme.ts)
  // but values round-trip through rgbToHex / manual entry as lowercase, so a
  // strict === would never flag a preset as selected.
  const eqHex = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  const isPreset = colorPresets.some((p) => eqHex(p.hex, value));

  // Local HSV preserves meaningful hue even when the visible colour is grey or black.
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const [hexInput, setHexInput] = useState(value);
  const [hexTouched, setHexTouched] = useState(false);

  const gesture = useRef<{ pointerId: number; hsv: typeof hsv; hex: string } | null>(null);

  // Preserve hue/saturation through black and grey while reflecting external Undo.
  const lastValue = useRef(value);
  useEffect(() => {
    if (lastValue.current.toLowerCase() === value.toLowerCase()) return;
    lastValue.current = value;
    gesture.current = null;
    const next = hexToHsv(value);
    setHsv(next);
    setHexInput(value);
    setHexTouched(false);
  }, [value]);

  const toggleOpen = () => {
    if (!open) {
      setHexInput(value);
      setHexTouched(false);
    }
    setOpen(!open);
  };

  const choose = (next: typeof hsv) => {
    const hex = hsvToHex(next.h, next.s, next.v);
    lastValue.current = hex;
    setHsv(next);
    setHexInput(hex);
    setHexTouched(false);
    onChange(hex);
  };

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
      else brightnessInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open, !!popoverStyle]);

  const updateWheel = (clientX: number, clientY: number) => {
    const rect = wheelRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = wheelValue(
      (clientX - rect.left - rect.width / 2) / (rect.width / 2),
      (clientY - rect.top - rect.height / 2) / (rect.height / 2),
      hsv.h,
    );
    // A deliberate wheel choice must be visible even when starting from black.
    choose({ ...next, v: hsv.v || 1 });
  };
  const cancelGesture = () => {
    const start = gesture.current;
    if (!start) return;
    gesture.current = null;
    lastValue.current = start.hex;
    setHsv(start.hsv);
    setHexInput(start.hex);
    onChange(start.hex);
  };

  /* ---- Hex input ---- */
  const handleHexInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setHexInput(raw);
      if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
        lastValue.current = raw;
        setHsv(hexToHsv(raw));
        onChange(raw.toLowerCase());
      }
    },
    [onChange],
  );

  const point = wheelPosition(hsv.h, hsv.s);
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
              setHsv(hexToHsv(preset.hex));
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
              ref={wheelRef}
              role="group"
              aria-label="Colour wheel"
              aria-describedby={`${popoverId}-wheel-help`}
              className="air-colour-wheel"
              onPointerDown={(event) => {
                if (!event.isPrimary || event.button !== 0 || gesture.current) return;
                event.preventDefault();
                // Pointer selection keeps focus in the popover, without opening a keyboard.
                menuRef.current?.focus({ preventScroll: true });
                gesture.current = { pointerId: event.pointerId, hsv, hex: value };
                event.currentTarget.setPointerCapture(event.pointerId);
                updateWheel(event.clientX, event.clientY);
              }}
              onPointerMove={(event) => {
                if (gesture.current?.pointerId === event.pointerId)
                  updateWheel(event.clientX, event.clientY);
              }}
              onPointerUp={(event) => {
                if (gesture.current?.pointerId === event.pointerId) gesture.current = null;
              }}
              onPointerCancel={(event) => {
                if (gesture.current?.pointerId === event.pointerId) cancelGesture();
              }}
              onLostPointerCapture={(event) => {
                if (gesture.current?.pointerId === event.pointerId) cancelGesture();
              }}
            >
              <span
                className="air-colour-wheel__point"
                style={{ left: `${point.x}%`, top: `${point.y}%`, background: value }}
                aria-hidden="true"
              />
            </div>
            <p className="air-help" id={`${popoverId}-wheel-help`}>
              Choose a hue. Move inward for a softer colour.
            </p>
            <label className="pdf-color__axis">
              <span>
                Brightness <output>{Math.round(hsv.v * 100)}%</output>
              </span>
              <input
                ref={brightnessInputRef}
                type="range"
                min={0}
                max={100}
                step={1}
                aria-label="Brightness"
                aria-valuetext={`${Math.round(hsv.v * 100)}%`}
                value={Math.round(hsv.v * 100)}
                onChange={(e) => choose({ ...hsv, v: Number(e.target.value) / 100 })}
                className="air-colour-brightness"
                style={{
                  backgroundImage: `linear-gradient(to right, #000, ${hsvToHex(hsv.h, hsv.s, 1)})`,
                }}
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
            <details className="pdf-color__precise">
              <summary>Fine tune hue &amp; saturation</summary>
              <label className="pdf-color__axis">
                <span>
                  Hue <output>{Math.round(hsv.h)}°</output>
                </span>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  aria-label="Hue"
                  aria-valuetext={`${Math.round(hsv.h)} degrees`}
                  value={Math.round(hsv.h)}
                  onChange={(e) => choose({ ...hsv, h: Number(e.target.value) })}
                />
              </label>
              <label className="pdf-color__axis">
                <span>
                  Saturation <output>{Math.round(hsv.s * 100)}%</output>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  aria-label="Saturation"
                  aria-valuetext={`${Math.round(hsv.s * 100)}%`}
                  value={Math.round(hsv.s * 100)}
                  onChange={(e) => choose({ ...hsv, s: Number(e.target.value) / 100 })}
                />
              </label>
            </details>
          </div>,
          document.body,
        )}
    </div>
  );
}
