/** Text selection belongs to one visible page and exact document revision. */
import { AlertTriangle, Highlighter, Copy, EyeOff, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { extractPageTextGeometry } from "../../utils/layout-extract.ts";
import { type Annotation, annotatePdf } from "../../utils/pdf-operations.ts";
import {
  nearestWordIndex,
  orderReading,
  type SelWord,
  selectedRects,
  selectedText,
  selectionRange,
} from "../../utils/text-select.ts";
import {
  DEFAULT_REDACTION_BORDER,
  DEFAULT_REDACTION_FILL,
  docToFile,
  hasPendingDestructive,
  type RedactionPayload,
} from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { type StagePoint, type StageKeyboardEvent, useStageProps } from "../stage.tsx";

const TOOL = "select-text";
interface TextPage {
  bytes: Uint8Array;
  pageIndex: number;
  words: SelWord[];
  failed?: boolean;
}
interface Selection {
  page: TextPage;
  anchor: number;
  focus: number;
}
const EMPTY: SelWord[] = [];
function useSelection() {
  const { doc, selectedPage, busyLabel } = useEditorRead();
  const slice = useToolSlice(TOOL);
  const stored = slice.page as TextPage | undefined;
  const blocked = hasPendingDestructive(doc);
  const page =
    !blocked && stored?.bytes === doc?.bytes && stored?.pageIndex === selectedPage
      ? stored
      : undefined;
  const saved = slice.selection as Selection | undefined;
  const selection = page && saved?.page === page ? saved : undefined;
  return { doc, selectedPage, busy: busyLabel !== null, blocked, page, selection, slice };
}
function range(selection: Selection) {
  return selectionRange(selection.anchor, selection.focus);
}

export function Stage() {
  const { doc, selectedPage, busy, blocked, page, selection, slice } = useSelection();
  const { patchToolState } = useEditorActions();
  const bytes = doc?.bytes;
  const retry = slice.retry;
  useEffect(() => {
    if (!doc || blocked || page) return;
    let live = true;
    patchToolState(TOOL, { selection: undefined });
    void extractPageTextGeometry(docToFile(doc), selectedPage + 1, { selectionBounds: true }).then(
      (layout) => {
        if (!live) return;
        const words = layout
          ? orderReading(
              layout.items
                .filter(
                  (item) =>
                    item.text.trim() &&
                    item.width > 0 &&
                    item.height > 0 &&
                    item.x < layout.width &&
                    item.y < layout.height &&
                    item.x + item.width > 0 &&
                    item.y + item.height > 0,
                )
                .map((item) => ({
                  text: item.text,
                  rect: {
                    xPct: Math.max(0, item.x) / layout.width,
                    yPct: Math.max(0, item.y) / layout.height,
                    wPct:
                      (Math.min(layout.width, item.x + item.width) - Math.max(0, item.x)) /
                      layout.width,
                    hPct:
                      (Math.min(layout.height, item.y + item.height) - Math.max(0, item.y)) /
                      layout.height,
                  },
                })),
              layout.rotation,
            )
          : [];
        patchToolState(TOOL, {
          page: {
            bytes: doc.bytes,
            pageIndex: selectedPage,
            words,
            failed: !layout,
          } satisfies TextPage,
        });
      },
      () => {
        if (live)
          patchToolState(TOOL, {
            page: {
              bytes: doc.bytes,
              pageIndex: selectedPage,
              words: [],
              failed: true,
            } satisfies TextPage,
          });
      },
    );
    return () => {
      live = false;
    };
    // Only byte/page changes or an explicit retry invalidate the text geometry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bytes, selectedPage, blocked, retry, patchToolState]);

  const words = page?.words ?? EMPTY;
  const dragging = useRef<Selection | null>(null);
  const frame = useRef<number | null>(null);
  const [draft, setDraft] = useState<Selection | null>(null);
  const cancelDrag = useCallback(() => {
    dragging.current = null;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    setDraft(null);
  }, []);
  useEffect(() => {
    cancelDrag();
    return cancelDrag;
  }, [page, cancelDrag]);

  const visible = draft?.page === page ? draft : selection;
  const paintOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, pageIndex: number) => {
      if (!visible || visible.page.pageIndex !== pageIndex) return;
      ctx.save();
      ctx.fillStyle = getComputedStyle(ctx.canvas).getPropertyValue("--air-paper-accent");
      ctx.globalAlpha = 0.28;
      for (const r of selectedRects(visible.page.words, ...range(visible)))
        ctx.fillRect(r.xPct * w, r.yPct * h, r.wPct * w, r.hPct * h);
      ctx.restore();
    },
    [visible],
  );
  const onPointerDown = useCallback(
    (p: StagePoint) => {
      if (!page || busy) return;
      const anchor = nearestWordIndex(words, p.xPct, p.yPct);
      if (anchor < 0) return;
      dragging.current = { page, anchor, focus: anchor };
      setDraft(dragging.current);
    },
    [page, words, busy],
  );
  const onPointerMove = useCallback(
    (p: StagePoint) => {
      if (!dragging.current || dragging.current.page !== page) return;
      dragging.current = { ...dragging.current, focus: nearestWordIndex(words, p.xPct, p.yPct) };
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        setDraft(dragging.current);
      });
    },
    [page, words],
  );
  const onPointerUp = useCallback(
    (p: StagePoint) => {
      if (dragging.current?.page === page && page && !busy)
        patchToolState(TOOL, {
          selection: { ...dragging.current, focus: nearestWordIndex(words, p.xPct, p.yPct) },
        });
      cancelDrag();
    },
    [page, words, busy, patchToolState, cancelDrag],
  );
  const onKeyDown = useCallback(
    (e: StageKeyboardEvent) => {
      if (!page || !words.length || busy || e.nativeEvent.isComposing) return false;
      if (e.key === "Escape" && (selection || draft)) {
        cancelDrag();
        patchToolState(TOOL, { selection: undefined });
        return true;
      }
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return false;
      const focus =
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? words.length - 1
            : Math.max(
                0,
                Math.min(
                  words.length - 1,
                  selection ? selection.focus + (e.key === "ArrowRight" ? 1 : -1) : 0,
                ),
              );
      cancelDrag();
      patchToolState(TOOL, {
        selection: {
          page,
          anchor: e.shiftKey && selection ? selection.anchor : focus,
          focus,
        } satisfies Selection,
      });
      return true;
    },
    [page, words, busy, selection, draft, cancelDrag, patchToolState],
  );
  useStageProps({
    cursor: busy || !words.length ? "default" : "text",
    paintOverlay,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: cancelDrag,
    onKeyDown,
    keyboardHelp: words.length
      ? "Use Left and Right to select text, Shift to extend, Home and End to reach the first and last text, and Escape to clear. Up and Down pan the page."
      : undefined,
    keyboardShortcuts: words.length
      ? "ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight Home End Shift+Home Shift+End Escape"
      : undefined,
  });
  return null;
}

export function Panel() {
  const { doc, page, selection, blocked, busy, slice } = useSelection();
  const { addObjects, applyTransform, patchToolState, setActiveTool } = useEditorActions();
  const [copying, setCopying] = useState(false);
  const applying = useRef(false);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  const [note, setNote] = useState<{
    text: string;
    failed?: boolean;
    selection?: Selection;
    bytes?: Uint8Array;
  }>();
  const bytes = doc?.bytes;
  useEffect(() => {
    if (note && !note.bytes && bytes) setNote({ ...note, bytes });
  }, [bytes, note]);
  const feedback =
    note?.bytes === bytes && (!note?.selection || note.selection === selection) ? note : undefined;
  const text = selection ? selectedText(selection.page.words, ...range(selection)) : "";
  const disabled = busy || copying || !selection;
  const clear = () => {
    patchToolState(TOOL, { selection: undefined });
    setNote(undefined);
  };
  const mark = async (mode: "highlight" | "box") => {
    if (!selection || disabled || applying.current) return;
    applying.current = true;
    setNote(undefined);
    const color = mode === "highlight" ? { r: 250, g: 204, b: 21 } : { r: 220, g: 38, b: 38 };
    const annotations: Annotation[] = selectedRects(selection.page.words, ...range(selection)).map(
      (r) => ({
        kind: "rect",
        pageIndex: selection.page.pageIndex,
        x: r.xPct,
        y: r.yPct,
        w: r.wPct,
        h: r.hPct,
        color,
        thicknessFrac: mode === "box" ? 0.004 : 0.0008,
        ...(mode === "highlight" ? { fill: { color, opacity: 0.4 } } : {}),
      }),
    );
    try {
      await applyTransform(async (d) => {
        if (d.bytes !== selection.page.bytes)
          throw new Error("The document changed. Select its text again.");
        return {
          bytes: await annotatePdf(docToFile(d), annotations),
          label: mode === "highlight" ? "Highlight selection" : "Box selection",
        };
      });
      if (live.current)
        setNote({
          text:
            mode === "highlight"
              ? "Highlight added. Undo restores the original."
              : "Box added. Undo restores the original.",
        });
    } catch {
      if (live.current)
        setNote({
          bytes,
          selection,
          failed: true,
          text: "Couldn't add the mark. Your selection is preserved. Try again.",
        });
    } finally {
      applying.current = false;
    }
  };
  const redact = () => {
    if (!selection || disabled) return;
    addObjects(
      selectedRects(selection.page.words, ...range(selection)).map((rect) => ({
        kind: "redaction",
        pageIndex: selection.page.pageIndex,
        rect,
        payload: {
          fill: DEFAULT_REDACTION_FILL,
          border: DEFAULT_REDACTION_BORDER,
        } satisfies RedactionPayload,
      })),
      "Redact selection",
    );
    clear();
  };
  const copy = async () => {
    if (!selection || disabled) return;
    setCopying(true);
    setNote(undefined);
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      if (live.current) setNote({ bytes, selection, text: "Text copied." });
    } catch {
      if (live.current)
        setNote({
          bytes,
          selection,
          failed: true,
          text: "Couldn't copy to the clipboard. Select the text above and copy it manually, or try again.",
        });
    } finally {
      if (live.current) setCopying(false);
    }
  };
  return (
    <div className="pdf-mark-panel pdf-selecttext-panel" tabIndex={-1} data-busy-focus-fallback>
      {blocked ? (
        <section aria-label="Pending privacy marks">
          <p className="air-notice">
            Redaction or erase marks are waiting. Export applies them permanently; Undo removes the
            last edit. Text selection is paused so covered text cannot be copied.
          </p>
          <button className="air-button" type="button" onClick={() => setActiveTool("redact")}>
            Review redactions
          </button>
        </section>
      ) : !page ? (
        <p className="air-help" role="status">
          Reading page text…
        </p>
      ) : page.failed ? (
        <section aria-label="Read page text">
          <p className="air-notice air-notice--error" role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>Couldn't read this page's text. Your PDF is unchanged.</span>
          </p>
          <button
            className="air-button"
            type="button"
            onClick={() =>
              patchToolState(TOOL, { page: undefined, retry: Number(slice.retry ?? 0) + 1 })
            }
          >
            Retry reading text
          </button>
        </section>
      ) : !page.words.length ? (
        <section aria-label="No selectable text">
          <p className="air-notice">
            This page has no selectable text. For a scanned page, run OCR to add a text layer, then
            return here.
          </p>
          <button className="air-button" type="button" onClick={() => setActiveTool("ocr")}>
            Open OCR
          </button>
        </section>
      ) : (
        <>
          <section aria-label="Text selection">
            {selection ? (
              <>
                <div className="pdf-form-heading">
                  <label className="air-label" htmlFor="selected-page-text">
                    Selected text
                  </label>
                  <span className="air-help">Page {page.pageIndex + 1}</span>
                </div>
                <textarea
                  id="selected-page-text"
                  className="air-field pdf-selection-preview"
                  readOnly
                  value={text}
                  rows={4}
                />
                <p className="sr-only" role="status">
                  {text.length} characters selected.
                </p>
              </>
            ) : (
              <p className="air-help">
                Drag across text on the page, or select the whole page below.
              </p>
            )}
            <div className="pdf-selection-actions">
              <button
                className="air-button"
                type="button"
                disabled={disabled}
                onClick={() => void mark("highlight")}
              >
                <Highlighter size={16} aria-hidden="true" />
                Highlight
              </button>
              <button
                className="air-button"
                type="button"
                disabled={disabled}
                onClick={() => void mark("box")}
              >
                <Square size={16} aria-hidden="true" />
                Box
              </button>
              <button
                className="air-button"
                type="button"
                disabled={disabled}
                onClick={redact}
                aria-describedby="selection-redaction-help"
              >
                <EyeOff size={16} aria-hidden="true" />
                Redact
              </button>
              <button
                className="air-button"
                type="button"
                disabled={disabled}
                aria-busy={copying}
                onClick={() => void copy()}
              >
                <Copy size={16} aria-hidden="true" />
                Copy text
              </button>
            </div>
            <p className="air-help" id="selection-redaction-help">
              Redact adds removable marks. Exporting or applying another edit makes them permanent
              in that output.
            </p>
            <div className="pdf-selection-actions">
              <button
                className="air-button air-button--quiet"
                type="button"
                disabled={busy || copying}
                onClick={() => {
                  setNote(undefined);
                  patchToolState(TOOL, {
                    selection: {
                      page,
                      anchor: 0,
                      focus: page.words.length - 1,
                    } satisfies Selection,
                  });
                }}
              >
                Select page text
              </button>
              <button
                className="air-button air-button--quiet"
                type="button"
                disabled={disabled}
                onClick={clear}
              >
                Clear selection
              </button>
            </div>
          </section>
          <details className="pdf-selection-help">
            <summary>Keyboard selection</summary>
            <p className="air-help">
              Focus the page, then use Left or Right to move through text. Hold Shift to extend the
              selection. Home and End reach the first and last text; Escape clears it. Up and Down
              pan the page.
            </p>
          </details>
        </>
      )}
      <p
        className={feedback?.failed ? "air-notice air-notice--error" : "air-help"}
        role={feedback?.failed ? "alert" : "status"}
      >
        {feedback?.failed && <AlertTriangle size={16} aria-hidden="true" />}
        <span>{feedback?.text}</span>
      </p>
    </div>
  );
}
