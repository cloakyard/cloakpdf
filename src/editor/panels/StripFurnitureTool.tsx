// StripFurnitureTool.tsx — Auto-detect and remove "page furniture": running
// headers, footers, and page numbers that repeat at the same position across
// pages. Mirrors CropTool's split: the Stage previews the bands that will be
// trimmed on the focused page; the Panel analyses the document on open
// (extractTextGeometry → detectRunningFurniture), lists what it found, and
// crops the selected top/bottom margin on Apply.
//
// Removal is a non-destructive crop (the band stays in the file but won't show
// or print) — never a rasterising redaction — so the rest of the document keeps
// its selectable text. The detector already clamps each band so it can't reach
// into body content. Identical on desktop + mobile (the Panel is a plain column
// of controls; PrimaryAction routes Apply to the mobile sheet's ✓).

import { docToFile } from "../doc.ts";
import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { canvas as canvasTheme, canvasAccent } from "../../config/theme.ts";
import {
  detectRunningFurniture,
  extractTextGeometry,
  type FurnitureGroup,
  furnitureCropMargins,
} from "../../utils/layout-extract.ts";
import { cropDoc } from "../crop.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { useStageProps } from "../stage.tsx";
import { PrimaryAction } from "./PrimaryAction.tsx";

const TOOL_ID = "strip-furniture";
interface ScanResult {
  sourceBytes: Uint8Array;
  groups: FurnitureGroup[];
  selected: string[];
  hadText: boolean;
}
function selectedMargins(result: ScanResult | undefined) {
  return furnitureCropMargins(result?.groups.filter((g) => result.selected.includes(g.id)) ?? []);
}

const KIND_LABELS: Record<FurnitureGroup["kind"], string> = {
  header: "Running header",
  footer: "Running footer",
  "page-number": "Page numbers",
};

export function Stage() {
  const slice = useToolSlice(TOOL_ID);
  const { doc } = useEditorRead();
  const result = slice.result as ScanResult | undefined;
  const { topPct, bottomPct } = selectedMargins(
    result?.sourceBytes === doc?.bytes ? result : undefined,
  );

  const paintOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const top = Math.max(0, topPct) * h;
      const bot = Math.max(0, bottomPct) * h;
      if (top <= 0 && bot <= 0) return;
      ctx.save();
      ctx.fillStyle = canvasTheme.selectionDim;
      if (top > 0) ctx.fillRect(0, 0, w, top);
      if (bot > 0) ctx.fillRect(0, h - bot, w, bot);
      ctx.strokeStyle = canvasAccent(ctx);
      ctx.lineWidth = 1.5;
      if (top > 0) {
        ctx.beginPath();
        ctx.moveTo(0, top);
        ctx.lineTo(w, top);
        ctx.stroke();
      }
      if (bot > 0) {
        ctx.beginPath();
        ctx.moveTo(0, h - bot);
        ctx.lineTo(w, h - bot);
        ctx.stroke();
      }
      ctx.restore();
    },
    [topPct, bottomPct],
  );

  useStageProps({ cursor: "default", paintOverlay });
  return null;
}

export function Panel() {
  const { doc, busyLabel } = useEditorRead();
  const { applyTransform, patchToolState } = useEditorActions();
  const slice = useToolSlice(TOOL_ID);
  const saved = slice.result as ScanResult | undefined;
  const result = saved?.sourceBytes === doc?.bytes ? saved : undefined;
  const { topPct, bottomPct } = selectedMargins(result);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState("");
  const [note, setNote] = useState({ text: "", failed: false });
  const [saveFailed, setSaveFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const request = useRef<AbortController | null>(null);
  const scannedAttempt = useRef(0);
  const applying = useRef(false);
  const current = useRef(doc);
  current.current = doc;
  const scanButton = useRef<HTMLButtonElement>(null);
  const tooFew = !doc || doc.pageCount < 3;
  const busy = !!busyLabel;
  const nothingSelected = topPct <= 0 && bottomPct <= 0;

  useEffect(() => {
    setScanning(false);
    if (!doc || tooFew || (attempt === scannedAttempt.current && slice.hasScanned)) return;
    scannedAttempt.current = attempt;
    const controller = new AbortController();
    request.current = controller;
    patchToolState(TOOL_ID, { hasScanned: true });
    setScanning(true);
    setNote({ text: "", failed: false });
    setProgress("Scanning pages for repeating text…");
    const ownsRequest = () =>
      !controller.signal.aborted &&
      request.current === controller &&
      current.current?.bytes === doc.bytes;
    void extractTextGeometry(docToFile(doc), {
      ocr: false,
      signal: controller.signal,
      onProgress: (done, total) => {
        if (ownsRequest()) setProgress(`Reading pages… ${done} of ${total}`);
      },
    })
      .then((pages) => {
        if (!ownsRequest()) return;
        const groups = detectRunningFurniture(pages);
        patchToolState(TOOL_ID, {
          result: {
            sourceBytes: doc.bytes,
            groups,
            selected: groups.map((g) => g.id),
            hadText: pages.some((p) => p.items.length > 0),
          } satisfies ScanResult,
        });
      })
      .catch(() => {
        if (ownsRequest())
          setNote({
            text: "Couldn't read the pages. Your selection is unchanged. Try scanning again.",
            failed: true,
          });
      })
      .finally(() => {
        if (ownsRequest()) {
          request.current = null;
          setScanning(false);
          setProgress("");
        }
      });
    return () => {
      controller.abort();
      if (request.current === controller) request.current = null;
    };
  }, [doc?.bytes, tooFew, attempt]);

  const apply = async () => {
    if (!doc || nothingSelected || busy || request.current || applying.current) return;
    applying.current = true;
    setSaveFailed(false);
    try {
      await applyTransform(async (d) => ({
        ...(await cropDoc(
          d,
          new Map(
            d.pages.map((p) => [
              p.index,
              { xPct: 0, yPct: topPct, wPct: 1, hPct: 1 - topPct - bottomPct },
            ]),
          ),
        )),
        label: "Strip furniture",
      }));
      patchToolState(TOOL_ID, { result: undefined, hasScanned: true });
      setNote({
        text: "Selected margins trimmed. Undo restores the previous page frames.",
        failed: false,
      });
    } catch (e) {
      setSaveFailed(true);
      throw e;
    } finally {
      applying.current = false;
    }
  };

  return (
    <div className="pdf-mark-panel pdf-furniture-panel">
      <section aria-label="Find repeating text">
        <p>
          Find running headers, footers and page numbers, then trim their margins on every page.
        </p>
        {tooFew ? (
          <p className="air-notice">
            Needs at least 3 pages to distinguish repeating text from body content.
          </p>
        ) : (
          <>
            <button
              type="button"
              className="air-button"
              ref={scanButton}
              data-busy-focus-fallback
              aria-disabled={busy || scanning}
              aria-busy={scanning}
              onClick={() => {
                if (!busy && !request.current) {
                  setSaveFailed(false);
                  setAttempt((n) => n + 1);
                }
              }}
            >
              Scan again
            </button>
            {scanning && (
              <>
                <p className="air-help" role="status">
                  {progress}
                </p>
                <button
                  type="button"
                  className="air-button air-button--quiet"
                  onClick={() => {
                    request.current?.abort();
                    request.current = null;
                    setScanning(false);
                    setProgress("");
                    setNote({
                      text: "Scan cancelled. Your selection is unchanged.",
                      failed: false,
                    });
                    scanButton.current?.focus();
                  }}
                >
                  Cancel scan
                </button>
              </>
            )}
            {!scanning && !result && !note.text && (
              <p className="air-help" role="status">
                Scan again to find repeating text in this document.
              </p>
            )}
            {!scanning && result && !result.groups.length && (
              <p className="air-notice" role="status">
                {result.hadText
                  ? "No repeating headers, footers or page numbers found."
                  : "No selectable text found. Run OCR first to detect furniture on a scanned PDF."}
              </p>
            )}
          </>
        )}
        {note.text && (
          <p
            role={note.failed ? "alert" : "status"}
            className={note.failed ? "air-notice air-notice--error" : "air-help"}
          >
            {note.failed && <AlertTriangle size={16} aria-hidden="true" />}
            <span>{note.text}</span>
          </p>
        )}
      </section>
      {!!result?.groups.length && (
        <section aria-label="Margins to trim">
          <ul className="pdf-furniture-list">
            {result.groups.map((g) => (
              <li key={g.id}>
                <label className="air-check-label">
                  <input
                    type="checkbox"
                    className="air-check"
                    checked={result.selected.includes(g.id)}
                    disabled={busy || scanning}
                    onChange={() => {
                      setSaveFailed(false);
                      patchToolState(TOOL_ID, {
                        result: {
                          ...result,
                          selected: result.selected.includes(g.id)
                            ? result.selected.filter((id) => id !== g.id)
                            : [...result.selected, g.id],
                        },
                      });
                    }}
                  />
                  <span>
                    <strong>{KIND_LABELS[g.kind]}</strong>
                    <span className="air-help">
                      {g.region === "top" ? "Top" : "Bottom"} margin · {g.pageCount} of{" "}
                      {doc?.pageCount} pages
                    </span>
                    {g.sampleText && <span className="air-help">“{g.sampleText}”</span>}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <p className="air-help" role="status">
            {nothingSelected
              ? "Select at least one margin to trim."
              : `Trims ${(topPct * 100).toFixed(1)}% from the top and ${(bottomPct * 100).toFixed(1)}% from the bottom of every page.`}
          </p>
          <p className="air-help">
            Review every page in the preview. Repeated text can be part of your content.
          </p>
        </section>
      )}
      {saveFailed && (
        <p className="air-notice air-notice--error" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>Couldn't trim the pages. Your selection is saved. Try again.</span>
        </p>
      )}
      <PrimaryAction
        label="Trim furniture"
        onApply={apply}
        disabled={nothingSelected || scanning || tooFew}
      />
      <p className="air-help">
        Cropping hides content; it does not remove it from the file. Selectable text is preserved.
        Use Redact to remove sensitive information.
      </p>
    </div>
  );
}
