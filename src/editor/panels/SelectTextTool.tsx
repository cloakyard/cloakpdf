// SelectTextTool.tsx — Real text selection over the page, like a PDF reader.
// Drag across the page and the actual words under the drag light up (mapped from
// PDF.js text geometry in reading order); then Highlight, Box, Redact, or Copy
// the selection. This is the only tool that *selects* existing text visually —
// Find & Act searches for it, Annotate places new marks. Deterministic geometry,
// no model, so it works identically on every device (scanned pages must be OCR'd
// first — they have no text layer to select).
//
// The committed selection lives in the tool slice (so Stage + Panel share it);
// the Stage paints it and owns the drag, the Panel acts on it.

import { Highlighter, type LucideIcon, Copy, EyeOff, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { extractPageTextGeometry } from "../../utils/layout-extract.ts";
import { type Annotation, annotatePdf } from "../../utils/pdf-operations.ts";
import {
  type FracRect,
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
  type RedactionPayload,
} from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { type StagePoint, useStageProps } from "../stage.tsx";

const TOOL_ID = "select-text";
const HILITE = { r: 37, g: 99, b: 235 }; // primary blue — the selection tint

interface SelectSlice {
  /** Page the committed selection belongs to. */
  pageIndex: number;
  /** Selected word boxes (page fractions), reading order. */
  rects: FracRect[];
  /** Selected text. */
  text: string;
}

function readSlice(slice: Record<string, unknown>): SelectSlice {
  return {
    pageIndex: (slice.pageIndex as number) ?? 0,
    rects: (slice.rects as FracRect[]) ?? [],
    text: (slice.text as string) ?? "",
  };
}

function paintRects(ctx: CanvasRenderingContext2D, rects: FracRect[], w: number, h: number) {
  ctx.save();
  ctx.fillStyle = `rgba(${HILITE.r}, ${HILITE.g}, ${HILITE.b}, 0.28)`;
  for (const r of rects) ctx.fillRect(r.xPct * w, r.yPct * h, r.wPct * w, r.hPct * h);
  ctx.restore();
}

export function Stage() {
  const { doc, selectedPage } = useEditorRead();
  const { patchToolState } = useEditorActions();
  const committed = readSlice(useToolSlice(TOOL_ID));

  // Reading-order words for the focused page (extracted lazily; empty for a
  // scanned page with no text layer).
  const wordsRef = useRef<SelWord[]>([]);
  const anchorRef = useRef(-1);
  const draggingRef = useRef(false);
  const [draft, setDraft] = useState<{ lo: number; hi: number } | null>(null);

  const bytes = doc?.bytes;
  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    wordsRef.current = [];
    setDraft(null);
    extractPageTextGeometry(docToFile(doc), selectedPage + 1)
      .then((page) => {
        if (cancelled || !page) return;
        const W = page.width || 1;
        const H = page.height || 1;
        const raw: SelWord[] = page.items
          .filter((it) => it.text.trim().length > 0)
          .map((it) => ({
            text: it.text,
            rect: { xPct: it.x / W, yPct: it.y / H, wPct: it.width / W, hPct: it.height / H },
          }));
        wordsRef.current = orderReading(raw);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // bytes identity changes when the doc is transformed → re-extract.
  }, [bytes, selectedPage, doc]);

  // rAF-coalesce drag updates (mirrors the other drag tools).
  const pendingRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const scheduleDraft = useCallback((focus: number) => {
    pendingRef.current = focus;
    if (frameRef.current != null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const f = pendingRef.current;
      if (f != null && anchorRef.current >= 0) {
        const [lo, hi] = selectionRange(anchorRef.current, f);
        setDraft({ lo, hi });
      }
    });
  }, []);
  const cancelFrame = useCallback(() => {
    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    pendingRef.current = null;
  }, []);
  useEffect(() => cancelFrame, [cancelFrame]);

  const draftRects = draft ? selectedRects(wordsRef.current, draft.lo, draft.hi) : null;

  const paintOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, pageIndex: number) => {
      // Draft (active drag) wins; otherwise paint the committed selection on its
      // own page.
      if (draftRects) paintRects(ctx, draftRects, w, h);
      else if (committed.rects.length > 0 && committed.pageIndex === pageIndex)
        paintRects(ctx, committed.rects, w, h);
    },
    [draftRects, committed.rects, committed.pageIndex],
  );

  const onPointerDown = useCallback(
    (p: StagePoint) => {
      const idx = nearestWordIndex(wordsRef.current, p.xPct, p.yPct);
      if (idx < 0) {
        // Empty area / no text — clear any committed selection.
        anchorRef.current = -1;
        draggingRef.current = false;
        setDraft(null);
        if (committed.rects.length > 0)
          patchToolState(TOOL_ID, { rects: [], text: "", pageIndex: selectedPage });
        return;
      }
      anchorRef.current = idx;
      draggingRef.current = true;
      setDraft({ lo: idx, hi: idx });
    },
    [committed.rects.length, patchToolState, selectedPage],
  );

  const onPointerMove = useCallback(
    (p: StagePoint) => {
      if (!draggingRef.current) return;
      const idx = nearestWordIndex(wordsRef.current, p.xPct, p.yPct);
      if (idx >= 0) scheduleDraft(idx);
    },
    [scheduleDraft],
  );

  const onPointerUp = useCallback(
    (p: StagePoint) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      cancelFrame();
      const words = wordsRef.current;
      const focus = nearestWordIndex(words, p.xPct, p.yPct);
      const anchor = anchorRef.current;
      if (anchor < 0 || focus < 0) {
        setDraft(null);
        return;
      }
      const [lo, hi] = selectionRange(anchor, focus);
      setDraft(null);
      patchToolState(TOOL_ID, {
        rects: selectedRects(words, lo, hi),
        text: selectedText(words, lo, hi),
        pageIndex: selectedPage,
      });
    },
    [cancelFrame, patchToolState, selectedPage],
  );

  const onPointerCancel = useCallback(() => {
    draggingRef.current = false;
    cancelFrame();
    setDraft(null);
  }, [cancelFrame]);

  useStageProps({
    cursor: "text",
    paintOverlay,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  });

  return null;
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface px-3 py-2 pointer-coarse:min-h-11 text-sm font-medium text-slate-700 dark:text-dark-text hover:border-primary-400 hover:text-primary-700 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export function Panel() {
  const { addObjects, applyTransform, patchToolState } = useEditorActions();
  const { pageIndex, rects, text } = readSlice(useToolSlice(TOOL_ID));
  const [copied, setCopied] = useState(false);
  const has = rects.length > 0;

  const clear = () => patchToolState(TOOL_ID, { rects: [], text: "", pageIndex });

  const mark = (mode: "highlight" | "box") => {
    if (!has) return;
    const color = mode === "highlight" ? { r: 250, g: 204, b: 21 } : { r: 220, g: 38, b: 38 };
    const anns: Annotation[] = rects.map((r) => {
      const base = {
        kind: "rect" as const,
        pageIndex,
        x: r.xPct,
        y: r.yPct,
        w: r.wPct,
        h: r.hPct,
        color,
        thicknessFrac: mode === "box" ? 0.004 : 0.0008,
      };
      return mode === "highlight" ? { ...base, fill: { color, opacity: 0.4 } } : base;
    });
    void applyTransform(async (d) => ({
      bytes: await annotatePdf(docToFile(d), anns),
      label: mode === "highlight" ? "Highlight selection" : "Box selection",
    })).then(clear);
  };

  const redact = () => {
    if (!has) return;
    addObjects(
      rects.map((r) => ({
        kind: "redaction" as const,
        pageIndex,
        rect: r,
        payload: {
          fill: DEFAULT_REDACTION_FILL,
          border: DEFAULT_REDACTION_BORDER,
        } satisfies RedactionPayload,
      })),
      "Redact selection",
    );
    clear();
  };

  const copy = () => {
    if (!text) return;
    void navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {},
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500 dark:text-dark-text-muted">
        Drag across the page to select the actual text — like a reader. Then highlight, box, redact,
        or copy it. Scanned pages must be OCR'd first.
      </p>

      {has ? (
        <>
          <div className="rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg p-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-400 dark:text-dark-text-muted">
              Selected · page {pageIndex + 1}
            </p>
            <p className="thin-scrollbar max-h-24 overflow-y-auto text-sm text-slate-700 dark:text-dark-text">
              {text || "(no text)"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <ActionButton icon={Highlighter} label="Highlight" onClick={() => mark("highlight")} />
            <ActionButton icon={Square} label="Box" onClick={() => mark("box")} />
            <ActionButton icon={EyeOff} label="Redact" onClick={redact} />
            <ActionButton
              icon={Copy}
              label={copied ? "Copied!" : "Copy text"}
              onClick={copy}
              disabled={!text}
            />
          </div>

          <button
            type="button"
            onClick={clear}
            className="self-start text-xs text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
          >
            Clear selection
          </button>
        </>
      ) : (
        <div className="rounded-lg bg-slate-50 dark:bg-dark-bg px-3 py-3 text-xs text-slate-500 dark:text-dark-text-muted">
          Drag across text on the page to select it. Multi-line selections follow reading order.
        </div>
      )}
    </div>
  );
}
