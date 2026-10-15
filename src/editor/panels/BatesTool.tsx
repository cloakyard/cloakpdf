// Bates settings persist through reflow; each preview owns one PDF revision.
import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ColorPicker, hexToRgb, rgbToHex } from "../../components/ColorPicker.tsx";
import { SegmentedControl } from "../../components/SegmentedControl.tsx";
import type { BatesNumberOptions } from "../../types.ts";
import { addBatesNumbers } from "../../utils/pdf-operations.ts";
import {
  batesNumberText,
  batesNumberRun,
  validateBatesNumbers,
} from "../../utils/pdf/bates-numbering.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { useStageProps } from "../stage.tsx";
import { PositionGrid } from "./controls.tsx";
import { PrecisionField } from "./PrecisionField.tsx";
import { PrimaryAction } from "./PrimaryAction.tsx";

const TOOL = "bates-numbering";
const DEFAULTS: BatesNumberOptions = {
  position: "bottom-right",
  prefix: "",
  suffix: "",
  digits: 6,
  fontSize: 10,
  color: { r: 30, g: 41, b: 59 },
  margin: 36,
  startNumber: 1,
};
const FIELDS = [
  { key: "startNumber", label: "Start at", min: 1, max: 999999999, unit: "", slider: false },
  { key: "fontSize", label: "Size", min: 8, max: 24, unit: "pt", slider: true },
  { key: "margin", label: "Margin", min: 12, max: 72, unit: "pt", slider: true },
] as const;
type NumberKey = (typeof FIELDS)[number]["key"];
const optionsOf = (slice: Record<string, unknown>): BatesNumberOptions =>
  (slice.options as BatesNumberOptions) ?? DEFAULTS;
const valid = (raw: string, f: { min: number; max: number }) =>
  raw.trim() !== "" &&
  Number.isInteger(Number(raw)) &&
  Number(raw) >= f.min &&
  Number(raw) <= f.max;

export function Stage() {
  const { doc, selectedPage } = useEditorRead();
  const slice = useToolSlice(TOOL);
  const o = optionsOf(slice);
  const active = !!doc && slice.sourceBytes === doc.bytes;
  const widthPt = doc?.pages[selectedPage]?.widthPt ?? 0;
  const paintOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      if (!active || widthPt <= 0) return;
      const s = w / widthPt;
      ctx.save();
      ctx.fillStyle = `rgb(${o.color.r},${o.color.g},${o.color.b})`;
      ctx.font = `${o.fontSize * s}px 'Courier New', Courier, monospace`;
      ctx.textBaseline = "alphabetic";
      try {
        const run = batesNumberRun(o, selectedPage + 1, widthPt, h / s);
        ctx.fillText(run.text, run.x * s, run.y * s);
      } catch {
        /* The panel reports invalid layout without painting clipped identifiers. */
      }
      ctx.restore();
    },
    [active, widthPt, o, selectedPage],
  );
  useStageProps({ paintOverlay });
  return null;
}

export function Panel() {
  const { doc, selectedPage, busyLabel } = useEditorRead();
  const { applyTransform, patchToolState } = useEditorActions();
  const slice = useToolSlice(TOOL);
  const o = optionsOf(slice);
  const initialized = !!slice.initialized;
  const bytes = doc?.bytes;
  useEffect(() => {
    if (bytes && !initialized) patchToolState(TOOL, { initialized: true, sourceBytes: bytes });
  }, [bytes, initialized, patchToolState]);
  const active = !!doc && slice.sourceBytes === bytes;
  const busy = busyLabel !== null;
  const [failed, setFailed] = useState(false);
  const applying = useRef(false);
  const numbers = (slice.numbers as Partial<Record<NumberKey, string>>) ?? {};
  const touched = (slice.touched as Partial<Record<NumberKey, boolean>>) ?? {};
  const rawValue = (key: NumberKey) => numbers[key] ?? String(o[key]);
  const invalid = FIELDS.some((f) => !valid(rawValue(f.key), f));
  const set = (patch: Partial<BatesNumberOptions>) => {
    setFailed(false);
    patchToolState(TOOL, { options: { ...o, ...patch } });
  };
  const preview = batesNumberText(o, selectedPage + 1);
  let layoutError = "";
  const page = doc?.pages[selectedPage];
  if (active && page) {
    try {
      validateBatesNumbers(o, doc.pageCount);
      batesNumberRun(o, selectedPage + 1, page.widthPt, page.heightPt);
    } catch (error) {
      layoutError = (error as Error).message;
    }
  }
  const apply = async () => {
    if (!active || invalid || !!layoutError || busy || applying.current) return;
    applying.current = true;
    setFailed(false);
    try {
      await applyTransform(async (d) => ({
        bytes: await addBatesNumbers(docToFile(d), o),
        label: "Bates numbering",
      }));
      patchToolState(TOOL, { sourceBytes: undefined });
    } catch (error) {
      setFailed(true);
      throw error;
    } finally {
      applying.current = false;
    }
  };
  return (
    <div className="pdf-mark-panel pdf-bates-panel">
      <section aria-label="Bates number settings" tabIndex={-1} data-busy-focus-fallback>
        <p>Add a unique, sequential identifier to every page.</p>
        {!active && initialized && (
          <>
            <p role="status" className="air-help">
              No pending Bates numbers. Start another to use these settings. Undo restores the
              previous PDF.
            </p>
            <button
              type="button"
              className="air-button"
              disabled={busy}
              onClick={() => {
                setFailed(false);
                patchToolState(TOOL, { sourceBytes: bytes });
              }}
            >
              Start another Bates numbering
            </button>
          </>
        )}
      </section>
      <fieldset className="pdf-overlay-settings" disabled={busy || !active}>
        <legend className="sr-only">Bates number appearance</legend>
        <section aria-label="Identifier" className="pdf-bates-values">
          {(["prefix", "suffix"] as const).map((key) => (
            <div className="pdf-property-field" key={key}>
              <label className="air-label" htmlFor={`bates-${key}`}>
                {key === "prefix" ? "Prefix" : "Suffix"}
              </label>
              <input
                id={`bates-${key}`}
                name={`bates-${key}`}
                type="text"
                className="air-field"
                autoComplete="off"
                spellCheck={false}
                value={o[key]}
                placeholder={key === "prefix" ? "e.g. CASE-" : "e.g. -A"}
                onChange={(e) => set({ [key]: e.target.value })}
              />
            </div>
          ))}
          <div className="pdf-property-field">
            <span className="air-label">Minimum digits</span>
            <SegmentedControl
              ariaLabel="Minimum digits"
              value={o.digits}
              onChange={(digits) => set({ digits })}
              options={[4, 6, 8].map((digits) => ({ value: digits, label: String(digits) }))}
              fullWidth
            />
            <p className="air-help">Adds leading zeros. Longer numbers stay complete.</p>
          </div>
        </section>
        <PositionGrid value={o.position} onChange={(position) => set({ position })} />
        <ColorPicker
          label="Identifier colour"
          value={rgbToHex(o.color.r, o.color.g, o.color.b)}
          onChange={(hex) => set({ color: hexToRgb(hex) })}
        />
        <section aria-label="Number sequence and layout" className="pdf-bates-values">
          {FIELDS.map((f) => (
            <PrecisionField
              key={f.key}
              id={`bates-${f.key}`}
              label={f.label}
              unit={f.unit}
              min={f.min}
              max={f.max}
              slider={f.slider}
              raw={rawValue(f.key)}
              value={o[f.key]}
              error={
                touched[f.key] && !valid(rawValue(f.key), f)
                  ? `Enter a whole number from ${f.min} to ${f.max}${f.unit ? ` ${f.unit}` : ""}.`
                  : undefined
              }
              onChange={(value) => {
                setFailed(false);
                patchToolState(TOOL, {
                  numbers: { ...numbers, [f.key]: value },
                  ...(valid(value, f) ? { options: { ...o, [f.key]: Number(value) } } : {}),
                });
              }}
              onBlur={() => patchToolState(TOOL, { touched: { ...touched, [f.key]: true } })}
            />
          ))}
        </section>
      </fieldset>
      <section aria-label="Apply Bates numbers">
        <p className="air-help" id="bates-preview">
          {active ? `Preview on this page: ${preview}` : "No pending preview."}
        </p>
        {layoutError && (
          <p role="alert" className="air-help air-help--error">
            {layoutError}
          </p>
        )}
        {failed && (
          <p role="alert" className="air-notice air-notice--error">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>
              Couldn't add Bates numbers. Your PDF and settings are unchanged. Check the message
              above, then try again.
            </span>
          </p>
        )}
        <PrimaryAction
          label="Add Bates numbers"
          disabled={!active || invalid || !!layoutError}
          onApply={apply}
        />
      </section>
    </div>
  );
}
