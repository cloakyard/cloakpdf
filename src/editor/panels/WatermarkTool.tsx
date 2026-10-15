// Air Stamp: settings persist across tool/layout changes; the preview belongs to
// one byte revision and retires after Apply, including subsequent Undo.
import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ColorPicker, hexToRgb, rgbToHex } from "../../components/ColorPicker.tsx";
import { SegmentedControl } from "../../components/SegmentedControl.tsx";
import type { WatermarkOptions } from "../../types.ts";
import {
  addWatermark,
  baseFileName,
  getPdfMetadata,
  resolveStampTokens,
  STAMP_TOKENS,
} from "../../utils/pdf-operations.ts";
import { clearStampCache, paintStamp, renderStampDataUrl } from "../../utils/pdf/stamp-render.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { useStageProps } from "../stage.tsx";
import { PrimaryAction } from "./PrimaryAction.tsx";

const TOOL = "stamp-pdf";
const DEFAULTS: WatermarkOptions = {
  text: "CONFIDENTIAL",
  fontSize: 48,
  color: { r: 100, g: 116, b: 139 },
  opacity: 0.3,
  rotation: 45,
  shape: "none",
  finish: "digital",
  inkTexture: 0.25,
};
const NUMBERS = [
  { key: "fontSize", label: "Size", min: 16, max: 120, step: 1, unit: "pt", factor: 1 },
  { key: "opacity", label: "Opacity", min: 5, max: 100, step: 5, unit: "%", factor: 100 },
  { key: "rotation", label: "Angle", min: -90, max: 90, step: 5, unit: "°", factor: 1 },
  { key: "inkTexture", label: "Texture", min: 0, max: 50, step: 5, unit: "%", factor: 100 },
] as const;
type NumberKey = (typeof NUMBERS)[number]["key"];
type Context = { bytes: Uint8Array; title: string; timestamp: number };
const optionsOf = (slice: Record<string, unknown>): WatermarkOptions =>
  (slice.options as WatermarkOptions) ?? DEFAULTS;
const validNumber = (raw: string, field: (typeof NUMBERS)[number]) =>
  raw.trim() !== "" &&
  Number.isFinite(Number(raw)) &&
  Number(raw) >= field.min &&
  Number(raw) <= field.max &&
  Number.isInteger((Number(raw) - field.min) / field.step);

export function Stage() {
  useEffect(() => clearStampCache, []);
  const { doc, selectedPage } = useEditorRead();
  const slice = useToolSlice(TOOL);
  const o = optionsOf(slice);
  const context = slice.context as Context | undefined;
  const active = slice.sourceBytes === doc?.bytes && context?.bytes === doc?.bytes;
  const widthPt = doc?.pages[selectedPage]?.widthPt ?? 0;
  const resolved = resolveStampTokens(o.text, {
    page: selectedPage + 1,
    total: doc?.pageCount ?? 1,
    title: context?.title ?? "",
    filename: baseFileName(doc?.fileName ?? ""),
    date: new Date(context?.timestamp ?? 0),
  });
  const paintOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      if (!active || !resolved.trim() || widthPt <= 0) return;
      const scale = w / widthPt;
      if (o.shape === "none" && o.finish === "digital") {
        ctx.save();
        ctx.globalAlpha = o.opacity;
        ctx.fillStyle = `rgb(${o.color.r},${o.color.g},${o.color.b})`;
        ctx.font = `bold ${o.fontSize * scale}px Helvetica, Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.translate(w / 2, h / 2);
        ctx.rotate((-o.rotation * Math.PI) / 180);
        // Helvetica-Bold's PDF height is 925/1000 em; the PDF writer positions
        // the baseline half that height below the rotated page centre.
        ctx.fillText(resolved, 0, (o.fontSize * scale * 0.925) / 2);
        ctx.restore();
      } else {
        try {
          paintStamp(ctx, w / 2, h / 2, o.fontSize, scale, o.rotation, o.opacity, {
            text: resolved,
            color: o.color,
            shape: o.shape ?? "none",
            finish: o.finish ?? "digital",
            texture: o.inkTexture,
          });
        } catch {
          // The panel reports a bounded-buffer failure and preserves the draft.
        }
      }
    },
    [active, resolved, widthPt, o],
  );
  useStageProps({ paintOverlay });
  return null;
}

export function Panel() {
  const { doc, selectedPage, busyLabel } = useEditorRead();
  const { applyTransform, patchToolState } = useEditorActions();
  const slice = useToolSlice(TOOL);
  const o = optionsOf(slice);
  const context = slice.context as Context | undefined;
  const current = context?.bytes === doc?.bytes ? context : undefined;
  const active = slice.sourceBytes === doc?.bytes && !!doc;
  const [attempt, setAttempt] = useState(0);
  const [readFailed, setReadFailed] = useState(false);
  const [failed, setFailed] = useState(false);
  const applying = useRef(false);
  const textRef = useRef<HTMLInputElement>(null);
  const initialized = !!slice.initialized;
  const bytes = doc?.bytes,
    fileName = doc?.fileName;
  useEffect(() => {
    if (!bytes || context?.bytes === bytes) return;
    let live = true;
    setReadFailed(false);
    const file = new File([bytes as Uint8Array<ArrayBuffer>], fileName ?? "document.pdf");
    void getPdfMetadata(file).then(
      (metadata) => {
        if (!live) return;
        patchToolState(TOOL, {
          context: { bytes, title: metadata.title, timestamp: Date.now() },
          ...(!initialized ? { initialized: true, sourceBytes: bytes } : {}),
        });
      },
      () => {
        if (live) setReadFailed(true);
      },
    );
    return () => {
      live = false;
    };
  }, [bytes, fileName, attempt, initialized, patchToolState, context]);
  const busy = busyLabel !== null;
  const drafts = (slice.numbers as Partial<Record<NumberKey, string>>) ?? {};
  const touched = (slice.touched as Partial<Record<NumberKey, boolean>>) ?? {};
  const fields = NUMBERS.filter((f) => f.key !== "inkTexture" || o.finish === "ink");
  const rawValue = (f: (typeof NUMBERS)[number]) =>
    drafts[f.key] ?? String(Math.round((o[f.key] ?? 0) * f.factor));
  const invalid = fields.some((f) => !validNumber(rawValue(f), f));
  const set = (patch: Partial<WatermarkOptions>) => {
    setFailed(false);
    patchToolState(TOOL, { options: { ...o, ...patch } });
  };
  const resolved = resolveStampTokens(o.text, {
    page: selectedPage + 1,
    total: doc?.pageCount ?? 1,
    title: current?.title ?? "",
    filename: baseFileName(fileName ?? ""),
    date: new Date(current?.timestamp ?? 0),
  });
  const previewError = useMemo(() => {
    if (!current || !active || !resolved.trim() || (o.shape === "none" && o.finish === "digital"))
      return "";
    try {
      renderStampDataUrl(o.fontSize, {
        text: resolved,
        color: o.color,
        shape: o.shape ?? "none",
        finish: o.finish ?? "digital",
        texture: o.inkTexture,
      });
      return "";
    } catch (e) {
      return e instanceof Error
        ? e.message
        : "Couldn't prepare this stamp. Reduce its size or text.";
    }
  }, [active, current, resolved, o.fontSize, o.color, o.shape, o.finish, o.inkTexture]);
  const insert = (token: string) => {
    const input = textRef.current;
    if (!input || busy) return;
    const start = input.selectionStart ?? o.text.length,
      end = input.selectionEnd ?? start;
    set({ text: o.text.slice(0, start) + token + o.text.slice(end) });
    input.focus();
    requestAnimationFrame(() => {
      // A subsequent field click wins over this deferred caret update.
      if (input.isConnected && document.activeElement === input) {
        input.setSelectionRange(start + token.length, start + token.length);
      }
    });
  };
  const apply = async () => {
    if (
      !current ||
      !active ||
      invalid ||
      !resolved.trim() ||
      previewError ||
      busy ||
      applying.current
    )
      return;
    applying.current = true;
    setFailed(false);
    try {
      await applyTransform(async (d) => ({
        bytes: await addWatermark(docToFile(d), { ...o, timestamp: current.timestamp }),
        label: "Add stamp",
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
    <div className="pdf-mark-panel pdf-stamp-panel">
      <section aria-label="Stamp text" tabIndex={-1} data-busy-focus-fallback>
        <p>Add a stamp to every page. Preview it on the page before applying.</p>
        {!active && current && (
          <>
            <p role="status" className="air-help">
              No pending stamp. Start another to use these settings. Undo restores the previous PDF.
            </p>
            <button
              type="button"
              className="air-button"
              disabled={busy}
              onClick={() => {
                setFailed(false);
                patchToolState(TOOL, {
                  sourceBytes: bytes,
                  context: { ...current, timestamp: Date.now() },
                });
              }}
            >
              Start another stamp
            </button>
          </>
        )}
        <div className="pdf-property-field">
          <label className="air-label" htmlFor="stamp-text">
            Text
          </label>
          <input
            ref={textRef}
            id="stamp-text"
            name="stamp-text"
            className="air-field"
            autoComplete="off"
            value={o.text}
            disabled={busy || !active}
            onChange={(e) => set({ text: e.target.value })}
            aria-describedby="stamp-preview-text"
          />
        </div>
        <div className="pdf-property-field">
          <span className="air-label">Insert field</span>
          <div className="pdf-stamp-tokens" role="group" aria-label="Insert field">
            {STAMP_TOKENS.map((t) => (
              <button
                type="button"
                key={t.token}
                className="air-button"
                disabled={busy || !active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insert(t.token)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <p id="stamp-preview-text" className="air-help">
          {current
            ? `Preview: ${resolved || "No text on this page. Enter text or choose another field."}`
            : "Reading document fields…"}
        </p>
        {readFailed && (
          <>
            <p role="alert" className="air-notice air-notice--error">
              <AlertTriangle size={16} aria-hidden="true" />
              Couldn't read document fields. Your PDF and settings are unchanged.
            </p>
            <button
              className="air-button"
              type="button"
              disabled={busy}
              onClick={() => setAttempt((n) => n + 1)}
            >
              Read fields again
            </button>
          </>
        )}
      </section>
      <fieldset className="pdf-stamp-settings" disabled={busy || !active}>
        <legend className="sr-only">Stamp appearance</legend>
        <div className="pdf-property-field">
          <span className="air-label">Shape</span>
          <SegmentedControl
            ariaLabel="Shape"
            fullWidth
            value={o.shape ?? "none"}
            onChange={(shape) => set({ shape })}
            options={[
              { value: "none", label: "None" },
              { value: "rect", label: "Box" },
              { value: "circle", label: "Circle" },
            ]}
          />
        </div>
        <div className="pdf-property-field">
          <span className="air-label">Finish</span>
          <SegmentedControl
            ariaLabel="Finish"
            fullWidth
            value={o.finish ?? "digital"}
            onChange={(finish) => set({ finish })}
            options={[
              { value: "digital", label: "Digital" },
              { value: "ink", label: "Ink stamp" },
            ]}
          />
        </div>
        <ColorPicker
          label="Stamp colour"
          value={rgbToHex(o.color.r, o.color.g, o.color.b)}
          onChange={(hex) => set({ color: hexToRgb(hex) })}
        />
        <section aria-label="Stamp dimensions" className="pdf-stamp-numbers">
          {fields.map((f) => {
            const raw = rawValue(f),
              error = touched[f.key] && !validNumber(raw, f);
            const update = (value: string) => {
              setFailed(false);
              patchToolState(TOOL, {
                numbers: { ...drafts, [f.key]: value },
                ...(validNumber(value, f)
                  ? { options: { ...o, [f.key]: Number(value) / f.factor } }
                  : {}),
              });
            };
            return (
              <div className="pdf-stamp-number" key={f.key}>
                <div className="pdf-stamp-number__heading">
                  <label className="air-label" htmlFor={`stamp-${f.key}`}>
                    {f.label}
                  </label>
                  <div className="pdf-stamp-number__value">
                    <input
                      id={`stamp-${f.key}`}
                      name={`stamp-${f.key}`}
                      className="air-field"
                      type="number"
                      inputMode="decimal"
                      min={f.min}
                      max={f.max}
                      step={f.step}
                      value={raw}
                      aria-label={`${f.label} (${f.unit})`}
                      aria-invalid={!!error}
                      aria-describedby={error ? `stamp-${f.key}-error` : undefined}
                      onChange={(e) => update(e.target.value)}
                      onBlur={() =>
                        patchToolState(TOOL, { touched: { ...touched, [f.key]: true } })
                      }
                    />
                    <span aria-hidden="true">{f.unit}</span>
                  </div>
                </div>
                <div className="pdf-stamp-range-track">
                  {f.min < 0 && <span className="pdf-stamp-neutral" aria-hidden="true" />}
                  <input
                    className="pdf-stamp-range"
                    type="range"
                    aria-label={`${f.label} slider`}
                    aria-valuetext={`${Math.round((o[f.key] ?? 0) * f.factor)} ${f.unit}`}
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={(o[f.key] ?? 0) * f.factor}
                    onChange={(e) => update(e.target.value)}
                  />
                </div>
                {error && (
                  <p id={`stamp-${f.key}-error`} className="air-help air-help--error">
                    Enter {f.min} to {f.max} {f.unit}, in steps of {f.step}.
                  </p>
                )}
              </div>
            );
          })}
        </section>
      </fieldset>
      <section aria-label="Apply stamp">
        <p className="air-help">
          {o.shape === "none" && o.finish === "digital"
            ? "Plain digital stamps remain selectable text. Shapes and ink stamps are embedded as images."
            : "This stamp is embedded as an image. Existing page text remains selectable."}{" "}
          Date and time use this preview's timestamp. A stamp does not hide or redact underlying
          content.
        </p>
        {(failed || previewError) && (
          <p role="alert" className="air-notice air-notice--error">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>
              {previewError ||
                "Couldn't add the stamp. Your PDF and settings are unchanged. Check the message above, then try again."}
            </span>
          </p>
        )}
        <PrimaryAction
          label="Add stamp"
          disabled={!active || !current || !resolved.trim() || invalid || !!previewError}
          onApply={apply}
        />
      </section>
    </div>
  );
}
