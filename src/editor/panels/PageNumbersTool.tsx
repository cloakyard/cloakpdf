// Page-number settings persist through reflow; each preview owns one PDF revision.
import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ColorPicker, hexToRgb, rgbToHex } from "../../components/ColorPicker.tsx";
import { Select } from "../../components/Select.tsx";
import type { PageNumberFormat, PageNumberOptions } from "../../types.ts";
import { addPageNumbers } from "../../utils/pdf-operations.ts";
import { pageNumberText } from "../../utils/pdf/page-numbering.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { useStageProps } from "../stage.tsx";
import { PositionGrid } from "./controls.tsx";
import { PrecisionField } from "./PrecisionField.tsx";
import { PrimaryAction } from "./PrimaryAction.tsx";

const TOOL = "add-page-numbers";
const DEFAULTS: PageNumberOptions = {
  position: "bottom-center",
  format: "1",
  fontSize: 12,
  color: { r: 30, g: 41, b: 59 },
  margin: 36,
  startNumber: 1,
  firstPage: 1,
};
const FORMATS: PageNumberFormat[] = ["1", "Page 1", "1 / N", "Page 1 of N"];
const fields = (total: number) =>
  [
    { key: "firstPage", label: "First page", min: 1, max: total, unit: "", slider: false },
    { key: "startNumber", label: "Start at", min: 1, max: 999999, unit: "", slider: false },
    { key: "fontSize", label: "Size", min: 8, max: 24, unit: "pt", slider: true },
    { key: "margin", label: "Margin", min: 12, max: 72, unit: "pt", slider: true },
  ] as const;
type NumberKey = ReturnType<typeof fields>[number]["key"];
const optionsOf = (slice: Record<string, unknown>): PageNumberOptions =>
  (slice.options as PageNumberOptions) ?? DEFAULTS;
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
  const text = pageNumberText(o, selectedPage + 1, doc?.pageCount ?? 1);
  const paintOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      if (!active || !text || widthPt <= 0) return;
      const s = w / widthPt;
      ctx.save();
      ctx.fillStyle = `rgb(${o.color.r},${o.color.g},${o.color.b})`;
      ctx.font = `${o.fontSize * s}px Helvetica, Arial, sans-serif`;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = o.position.endsWith("left")
        ? "left"
        : o.position.endsWith("right")
          ? "right"
          : "center";
      const x =
        ctx.textAlign === "left"
          ? o.margin * s
          : ctx.textAlign === "right"
            ? w - o.margin * s
            : w / 2;
      const y = o.position.startsWith("top") ? (o.margin + o.fontSize) * s : h - o.margin * s;
      ctx.fillText(text, x, y);
      ctx.restore();
    },
    [active, text, widthPt, o],
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
  const numericFields = fields(doc?.pageCount ?? 1);
  const rawValue = (key: NumberKey) => numbers[key] ?? String(o[key]);
  const invalid = numericFields.some((f) => !valid(rawValue(f.key), f));
  const set = (patch: Partial<PageNumberOptions>) => {
    setFailed(false);
    patchToolState(TOOL, { options: { ...o, ...patch } });
  };
  const preview = pageNumberText(o, selectedPage + 1, doc?.pageCount ?? 1);
  const apply = async () => {
    if (!active || invalid || busy || applying.current) return;
    applying.current = true;
    setFailed(false);
    try {
      await applyTransform(async (d) => ({
        bytes: await addPageNumbers(docToFile(d), o),
        label: "Add page numbers",
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
    <div className="pdf-mark-panel pdf-numbering-panel">
      <section aria-label="Page number settings" tabIndex={-1} data-busy-focus-fallback>
        <p>Add numbers from the first page you choose through the end of the PDF.</p>
        {!active && initialized && (
          <>
            <p role="status" className="air-help">
              No pending numbers. Start another to use these settings. Undo restores the previous
              PDF.
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
              Start another numbering
            </button>
          </>
        )}
      </section>
      <fieldset className="pdf-overlay-settings" disabled={busy || !active}>
        <legend className="sr-only">Page number appearance</legend>
        <PositionGrid value={o.position} onChange={(position) => set({ position })} />
        <div className="pdf-property-field">
          <label className="air-label" htmlFor="page-number-format">
            Format
          </label>
          <Select
            id="page-number-format"
            ariaLabel="Number format"
            disabled={busy || !active}
            value={o.format}
            onChange={(format) => set({ format })}
            options={FORMATS.map((format) => ({ value: format, label: format }))}
          />
        </div>
        <ColorPicker
          label="Number colour"
          value={rgbToHex(o.color.r, o.color.g, o.color.b)}
          onChange={(hex) => set({ color: hexToRgb(hex) })}
        />
        <section aria-label="Number sequence" className="pdf-numbering-values">
          {numericFields.map((f) => (
            <PrecisionField
              key={f.key}
              id={`number-${f.key}`}
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
          <p className="air-help">
            First page skips earlier pages. Start at sets its label. Formats with a total show the
            final number in the sequence.
          </p>
        </section>
      </fieldset>
      <section aria-label="Apply page numbers">
        <p className="air-help" id="page-number-preview">
          {!active
            ? "No pending preview."
            : preview
              ? `Preview on this page: ${preview}`
              : "This page is before the first numbered page."}
        </p>
        {failed && (
          <p role="alert" className="air-notice air-notice--error">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>
              Couldn't add page numbers. Your PDF and settings are unchanged. Check the message
              above, then try again.
            </span>
          </p>
        )}
        <PrimaryAction label="Add page numbers" disabled={!active || invalid} onApply={apply} />
      </section>
    </div>
  );
}
