import { AlertTriangle } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { ColorPicker, hexToRgb, rgbToHex } from "../../components/ColorPicker.tsx";
import { SegmentedControl } from "../../components/SegmentedControl.tsx";
import type { HeaderFooterOptions } from "../../types.ts";
import { addHeaderFooter, baseFileName, resolveStampTokens } from "../../utils/pdf-operations.ts";
import {
  HEADER_FOOTER_SLOTS,
  headerFooterRuns,
  slotLabel,
  type HeaderFooterSlot,
} from "../../utils/pdf/header-footer.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { useStageProps } from "../stage.tsx";
import { PrecisionField } from "./PrecisionField.tsx";
import { PrimaryAction } from "./PrimaryAction.tsx";
import { TextTokens } from "./TextTokens.tsx";
import { useTextOverlayContext, type TextOverlayContext } from "./useTextOverlayContext.ts";

const TOOL = "header-footer";
const DEFAULTS: HeaderFooterOptions = {
  headerLeft: "",
  headerCenter: "",
  headerRight: "",
  footerLeft: "",
  footerCenter: "",
  footerRight: "",
  fontSize: 10,
  margin: 36,
  color: { r: 100, g: 116, b: 139 },
  skipFirstPage: false,
};
const NUMBERS = [
  { key: "fontSize", label: "Size", min: 7, max: 18 },
  { key: "margin", label: "Margin", min: 12, max: 72 },
] as const;
type NumberKey = (typeof NUMBERS)[number]["key"];
const optionsOf = (slice: Record<string, unknown>): HeaderFooterOptions =>
  (slice.options as HeaderFooterOptions) ?? DEFAULTS;
const valid = (raw: string, f: (typeof NUMBERS)[number]) =>
  raw.trim() !== "" &&
  Number.isInteger(Number(raw)) &&
  Number(raw) >= f.min &&
  Number(raw) <= f.max;

export function Stage() {
  const { doc, selectedPage } = useEditorRead();
  const slice = useToolSlice(TOOL),
    o = optionsOf(slice);
  const context = slice.context as TextOverlayContext | undefined;
  const active = !!doc && slice.sourceBytes === doc.bytes && context?.bytes === doc.bytes;
  const widthPt = doc?.pages[selectedPage]?.widthPt ?? 0;
  const paintOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      if (!active || !context || widthPt <= 0) return;
      const s = w / widthPt;
      ctx.save();
      ctx.fillStyle = `rgb(${o.color.r},${o.color.g},${o.color.b})`;
      ctx.font = `${o.fontSize * s}px Helvetica, Arial, sans-serif`;
      ctx.textBaseline = "alphabetic";
      try {
        const runs = headerFooterRuns(
          o,
          {
            page: selectedPage + 1,
            total: doc.pageCount,
            title: context.title,
            filename: baseFileName(doc.fileName),
            date: new Date(context.timestamp),
          },
          widthPt,
          h / s,
          (text) => ctx.measureText(text).width / s,
        );
        for (const run of runs) ctx.fillText(run.text, run.x * s, run.y * s);
      } catch {
        /* The panel reports invalid layout without painting clipped text. */
      }
      ctx.restore();
    },
    [active, context, widthPt, o, doc, selectedPage],
  );
  useStageProps({ paintOverlay });
  return null;
}

export function Panel() {
  const { doc, selectedPage, busyLabel } = useEditorRead();
  const { applyTransform, patchToolState } = useEditorActions();
  const slice = useToolSlice(TOOL),
    o = optionsOf(slice);
  const { current, readFailed, retryRead } = useTextOverlayContext(TOOL, slice);
  const active = !!doc && slice.sourceBytes === doc.bytes,
    busy = busyLabel !== null;
  const row = (slice.row as "header" | "footer") ?? "header";
  const target = (slice.target as HeaderFooterSlot) ?? "headerLeft";
  const inputs = useRef<Partial<Record<HeaderFooterSlot, HTMLInputElement | null>>>({});
  const applying = useRef(false);
  const [failed, setFailed] = useState(false);
  const numbers = (slice.numbers as Partial<Record<NumberKey, string>>) ?? {};
  const touched = (slice.touched as Partial<Record<NumberKey, boolean>>) ?? {};
  const raw = (key: NumberKey) => numbers[key] ?? String(o[key]);
  const invalid = NUMBERS.some((f) => !valid(raw(f.key), f));
  const tokenContext = {
    page: selectedPage + 1,
    total: doc?.pageCount ?? 1,
    title: current?.title ?? "",
    filename: baseFileName(doc?.fileName ?? ""),
    date: new Date(current?.timestamp ?? 0),
  };
  const empty = !HEADER_FOOTER_SLOTS.some((key) => resolveStampTokens(o[key], tokenContext).trim());
  const noPages = o.skipFirstPage && doc?.pageCount === 1;
  const page = doc?.pages[selectedPage];
  const previewError = useMemo(() => {
    if (!active || !current || !doc || !page) return "";
    const ctx = document.createElement("canvas").getContext("2d")!;
    ctx.font = `${o.fontSize}px Helvetica, Arial, sans-serif`;
    try {
      headerFooterRuns(
        o,
        {
          page: selectedPage + 1,
          total: doc.pageCount,
          title: current.title,
          filename: baseFileName(doc.fileName),
          date: new Date(current.timestamp),
        },
        page.widthPt,
        page.heightPt,
        (text) => ctx.measureText(text).width,
      );
      return "";
    } catch (error) {
      return (error as Error).message;
    }
  }, [active, current, doc, page, selectedPage, o]);
  const set = (patch: Partial<HeaderFooterOptions>) => {
    setFailed(false);
    patchToolState(TOOL, { options: { ...o, ...patch } });
  };
  const insert = (token: string) => {
    const input = inputs.current[target];
    if (!input || busy || !active) return;
    const start = input.selectionStart ?? o[target].length,
      end = input.selectionEnd ?? start;
    set({ [target]: o[target].slice(0, start) + token + o[target].slice(end) });
    input.focus();
    requestAnimationFrame(() => {
      if (input.isConnected && document.activeElement === input)
        input.setSelectionRange(start + token.length, start + token.length);
    });
  };
  const apply = async () => {
    if (
      !active ||
      !current ||
      invalid ||
      empty ||
      noPages ||
      previewError ||
      busy ||
      applying.current
    )
      return;
    applying.current = true;
    setFailed(false);
    try {
      await applyTransform(async (d) => ({
        bytes: await addHeaderFooter(docToFile(d), { ...o, timestamp: current.timestamp }),
        label: "Header & footer",
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
    <div className="pdf-mark-panel pdf-header-footer-panel">
      <section aria-label="Header and footer settings" tabIndex={-1} data-busy-focus-fallback>
        <p>Add repeating text at the top and bottom of your pages. Empty fields stay blank.</p>
        {!active && current && (
          <>
            <p role="status" className="air-help">
              No pending header or footer. Start another to use these settings. Undo restores the
              previous PDF.
            </p>
            <button
              type="button"
              className="air-button"
              disabled={busy}
              onClick={() => {
                setFailed(false);
                patchToolState(TOOL, {
                  sourceBytes: doc?.bytes,
                  context: { ...current, timestamp: Date.now() },
                });
              }}
            >
              Start another header & footer
            </button>
          </>
        )}
        {!current && (
          <p className="air-help" role="status">
            {readFailed ? "Document fields are unavailable." : "Reading document fields…"}
          </p>
        )}
        {readFailed && (
          <>
            <p role="alert" className="air-notice air-notice--error">
              <AlertTriangle size={16} aria-hidden="true" />
              Couldn't read document fields. Your PDF and settings are unchanged.
            </p>
            <button type="button" className="air-button" disabled={busy} onClick={retryRead}>
              Read fields again
            </button>
          </>
        )}
      </section>
      <fieldset className="pdf-overlay-settings" disabled={busy || !active}>
        <legend className="sr-only">Header and footer appearance</legend>
        <section className="pdf-header-footer-fields" aria-label="Header and footer text">
          <SegmentedControl
            ariaLabel="Text position"
            fullWidth
            value={row}
            disabled={busy || !active}
            options={[
              { value: "header", label: "Header" },
              { value: "footer", label: "Footer" },
            ]}
            onChange={(row) => patchToolState(TOOL, { row, target: `${row}Left` })}
          />
          {HEADER_FOOTER_SLOTS.filter((key) => key.startsWith(row)).map((key) => (
            <div className="pdf-property-field" key={key}>
              <label className="air-label" htmlFor={`hf-${key}`}>
                {key.slice(row.length)}
              </label>
              <input
                id={`hf-${key}`}
                name={key}
                className="air-field"
                autoComplete="off"
                value={o[key]}
                aria-label={slotLabel(key)}
                aria-describedby="hf-preview"
                ref={(node) => {
                  inputs.current[key] = node;
                }}
                onFocus={() => patchToolState(TOOL, { target: key })}
                onChange={(e) => set({ [key]: e.target.value })}
              />
            </div>
          ))}
          <TextTokens disabled={busy || !active} onInsert={insert} />
          <p className="air-help" id="hf-preview">
            Insert into {slotLabel(target)}. Preview:{" "}
            {resolveStampTokens(o[target], tokenContext) || "Empty"}
          </p>
        </section>
        <ColorPicker
          label="Text colour"
          value={rgbToHex(o.color.r, o.color.g, o.color.b)}
          onChange={(hex) => set({ color: hexToRgb(hex) })}
        />
        <section className="pdf-header-footer-values" aria-label="Text spacing">
          {NUMBERS.map((f) => (
            <PrecisionField
              key={f.key}
              id={`hf-${f.key}`}
              label={f.label}
              min={f.min}
              max={f.max}
              unit="pt"
              raw={raw(f.key)}
              value={o[f.key]}
              error={
                touched[f.key] && !valid(raw(f.key), f)
                  ? `Enter a whole number from ${f.min} to ${f.max} pt.`
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
          <label className="air-switch-row">
            <span>Skip first page</span>
            <input
              type="checkbox"
              role="switch"
              className="air-switch"
              checked={o.skipFirstPage}
              onChange={(e) => set({ skipFirstPage: e.target.checked })}
            />
          </label>
        </section>
      </fieldset>
      <section aria-label="Apply header and footer">
        <p className="air-help">
          {noPages
            ? "This PDF has one page. Turn off Skip first page to add text."
            : o.skipFirstPage && selectedPage === 0
              ? "This cover page is excluded. Select another page to preview."
              : "Date and time use this preview's timestamp. Text remains selectable; it does not hide existing content."}
        </p>
        {(failed || previewError) && (
          <p role="alert" className="air-notice air-notice--error">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>
              {previewError ||
                "Couldn't add the header and footer. Your PDF and settings are unchanged. Check the message above, then try again."}
            </span>
          </p>
        )}
        <PrimaryAction
          label="Add header & footer"
          disabled={!active || !current || invalid || empty || noPages || !!previewError}
          onApply={apply}
        />
      </section>
    </div>
  );
}
