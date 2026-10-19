// FindActTool.tsx — Search the document's text layer for any term and mark
// every occurrence at once: Highlight it or Box it for review, in a colour you
// pick. This is the only path that *locates* existing user-supplied text and
// draws a non-destructive mark on it (Annotate places new marks but can't find
// existing ones; redacting found text lives in the Redact tool). Deterministic
// literal matching (no model) over the same PDF.js text layer + Tesseract OCR
// fallback the Redact tool uses, so it works identically on every device.
//
// State lives in the tool slice (like Crop's `keep`), not as doc objects: the
// Stage paints the staged matches for the focused page, the Panel drives search
// + apply. On Apply the matches are burned via annotatePdf and cleared.

import { AlertTriangle, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  dedupeTerms,
  extractTextGeometry,
  findTextRects,
  type LayoutPage,
  type TextMatchRect,
} from "../../utils/layout-extract.ts";
import { type Annotation, annotatePdf } from "../../utils/pdf-operations.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { PrimaryAction } from "./PrimaryAction.tsx";
import { useStageProps } from "../stage.tsx";
import type { FractionRect } from "../types.ts";
import type { Rgb } from "./controls.tsx";
import { ColorPicker, hexToRgb, rgbToHex } from "../../components/ColorPicker.tsx";
import { SegmentedControl } from "../../components/SegmentedControl.tsx";

const TOOL_ID = "find-act";

type ActMode = "highlight" | "box";

/** A resolved match staged in the tool slice. */
interface StoredMatch extends TextMatchRect {
  id: string;
  /** Included in the Apply batch (the per-hit checkbox). */
  on: boolean;
}

interface FindActSlice {
  input: string;
  sourceBytes?: Uint8Array;
  terms: string[];
  mode: ActMode;
  caseSensitive: boolean;
  wholeWord: boolean;
  highlightColor: Rgb;
  boxColor: Rgb;
  matches: StoredMatch[];
  /** A scanned page was OCR'd — matching is over recognised text only. */
  scanned: boolean;
  /** A search has completed (so an empty list means "0 matches", not "no search"). */
  searched: boolean;
}

const DEFAULT_HIGHLIGHT: Rgb = { r: 250, g: 204, b: 21 }; // Author highlight colour.
const DEFAULT_BOX: Rgb = { r: 220, g: 38, b: 38 }; // Author outline colour.

function readSlice(slice: Record<string, unknown>): FindActSlice {
  return {
    input: (slice.input as string) ?? "",
    sourceBytes: slice.sourceBytes as Uint8Array | undefined,
    terms: (slice.terms as string[]) ?? [],
    mode: (slice.mode as ActMode) ?? "highlight",
    caseSensitive: (slice.caseSensitive as boolean) ?? false,
    wholeWord: (slice.wholeWord as boolean) ?? false,
    highlightColor: (slice.highlightColor as Rgb) ?? DEFAULT_HIGHLIGHT,
    boxColor: (slice.boxColor as Rgb) ?? DEFAULT_BOX,
    matches: (slice.matches as StoredMatch[]) ?? [],
    scanned: (slice.scanned as boolean) ?? false,
    searched: (slice.searched as boolean) ?? false,
  };
}

function paintMatch(
  ctx: CanvasRenderingContext2D,
  r: FractionRect,
  w: number,
  h: number,
  mode: ActMode,
  color: Rgb,
) {
  const x = r.xPct * w;
  const y = r.yPct * h;
  const bw = r.wPct * w;
  const bh = r.hPct * h;
  if (mode === "highlight") {
    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.4)`;
    ctx.fillRect(x, y, bw, bh);
  } else {
    ctx.strokeStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, bw, bh);
  }
}

export function Stage() {
  const { doc } = useEditorRead();
  const slice = readSlice(useToolSlice(TOOL_ID));
  const { mode, highlightColor, boxColor } = slice;
  const matches = slice.sourceBytes === doc?.bytes ? slice.matches : [];
  const color = mode === "highlight" ? highlightColor : boxColor;

  const paintOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, pageIndex: number) => {
      for (const m of matches) {
        if (m.on && m.pageIndex === pageIndex) paintMatch(ctx, m, w, h, mode, color);
      }
    },
    [matches, mode, color],
  );

  useStageProps({ cursor: "default", paintOverlay });
  return null;
}

export function Panel() {
  const { doc, busyLabel } = useEditorRead();
  const { patchToolState, applyTransform, setSelectedPage, setViewMode } = useEditorActions();
  const slice = readSlice(useToolSlice(TOOL_ID));
  const { input, terms, mode, caseSensitive, wholeWord, highlightColor, boxColor, scanned } = slice;
  const currentResults = slice.sourceBytes === doc?.bytes;
  const matches = currentResults ? slice.matches : [];
  const searched = currentResults && slice.searched;
  const activeColor = mode === "highlight" ? highlightColor : boxColor;
  const [detecting, setDetecting] = useState(false);
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const request = useRef<AbortController | null>(null);
  const applying = useRef(false);
  const current = useRef(doc);
  current.current = doc;
  const inputRef = useRef<HTMLInputElement>(null);
  const geometry = useRef<{ key: Uint8Array; pages: LayoutPage[]; scanned: boolean } | null>(null);
  const blocked = detecting || busyLabel !== null;
  const enabled = matches.filter((m) => m.on);
  const pagesHit = new Set(matches.map((m) => m.pageIndex)).size;

  useEffect(() => {
    setDetecting(false);
    setProgress("");
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [doc?.id, doc?.bytes, busyLabel]);

  const runSearch = async (
    termList: string[],
    opts = { caseSensitive, wholeWord },
    clearInput = false,
  ) => {
    if (!doc || request.current || busyLabel !== null || applying.current) return;
    const cleaned = dedupeTerms(termList, opts.caseSensitive);
    if (!cleaned.length) {
      patchToolState(TOOL_ID, { terms: [], matches: [], searched: false, ...opts });
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    const ownsRequest = () =>
      request.current === controller &&
      !controller.signal.aborted &&
      current.current?.id === doc.id &&
      current.current?.bytes === doc.bytes;
    setDetecting(true);
    setMessage(null);
    setProgress("Finding matches…");
    try {
      let cached = geometry.current;
      if (cached?.key !== doc.bytes) {
        let sawScan = false;
        const pages = await extractTextGeometry(docToFile(doc), {
          ocr: true,
          signal: controller.signal,
          onProgress: (done, total) => {
            if (ownsRequest()) setProgress(`Reading pages… (${done}/${total})`);
          },
          onOcrPage: (done, total) => {
            sawScan = true;
            if (ownsRequest()) setProgress(`Reading scanned pages… (${done}/${total})`);
          },
        });
        if (!ownsRequest()) return;
        cached = { key: doc.bytes, pages, scanned: sawScan };
        geometry.current = cached;
      }
      if (!ownsRequest()) return;
      const previous = new Map(matches.map((m) => [m.id, m.on]));
      const found: StoredMatch[] = findTextRects(cached.pages, cleaned, opts).map((m) => {
        const id = `${m.pageIndex}:${m.xPct}:${m.yPct}:${m.matchStart}:${m.matchEnd}`;
        return { ...m, id, on: previous.get(id) ?? true };
      });
      patchToolState(TOOL_ID, {
        terms: cleaned,
        matches: found,
        scanned: cached.scanned,
        searched: true,
        sourceBytes: doc.bytes,
        ...opts,
        ...(clearInput ? { input: "" } : {}),
      });
    } catch {
      if (ownsRequest())
        setMessage({
          error: true,
          text: "Couldn't search this document. Your query and previous matches are unchanged. Try again.",
        });
    } finally {
      if (request.current === controller) {
        request.current = null;
        setDetecting(false);
        setProgress("");
      }
    }
  };
  const find = () =>
    void runSearch(input.trim() ? [...terms, input.trim()] : terms, undefined, true);
  const setAll = (on: boolean) =>
    patchToolState(TOOL_ID, { matches: matches.map((m) => ({ ...m, on })) });
  const clearAll = () => {
    if (blocked) return;
    inputRef.current?.focus();
    setMessage(null);
    patchToolState(TOOL_ID, { input: "", terms: [], matches: [], searched: false, scanned: false });
  };
  const jump = (page: number) => {
    setSelectedPage(page);
    setViewMode("focus");
  };
  const apply = async () => {
    if (!enabled.length || blocked || applying.current) return;
    applying.current = true;
    setMessage(null);
    const anns: Annotation[] = enabled.map((m) => ({
      kind: "rect",
      pageIndex: m.pageIndex,
      x: m.xPct,
      y: m.yPct,
      w: m.wPct,
      h: m.hPct,
      color: activeColor,
      thicknessFrac: mode === "box" ? 0.004 : 0.0008,
      ...(mode === "highlight" ? { fill: { color: activeColor, opacity: 0.4 } } : {}),
    }));
    try {
      await applyTransform(async (d) => ({
        bytes: await annotatePdf(docToFile(d), anns),
        label: `${mode === "highlight" ? "Highlight" : "Box"} ${anns.length}`,
      }));
      patchToolState(TOOL_ID, { matches: [], terms: [], searched: false, scanned: false });
      setMessage({
        text: `Applied ${anns.length} ${mode === "highlight" ? `highlight${anns.length === 1 ? "" : "s"}` : `box${anns.length === 1 ? "" : "es"}`}. Undo in the toolbar restores the previous document.`,
      });
    } catch (error) {
      setMessage({
        error: true,
        text: "Couldn't apply these marks. Your matches and selection are unchanged. Try again.",
      });
      throw error; // The mobile Done action must keep the panel open on failure.
    } finally {
      applying.current = false;
    }
  };
  const byPage = new Map<number, StoredMatch[]>();
  for (const m of matches) {
    const list = byPage.get(m.pageIndex) ?? [];
    list.push(m);
    byPage.set(m.pageIndex, list);
  }

  return (
    <div className="pdf-mark-panel pdf-find-panel">
      <p>
        Find a word or phrase, then highlight or box the matches you choose. Use Redact to remove
        sensitive text.
      </p>
      <section className="pdf-mark-query" aria-label="Find text">
        <label htmlFor="find-and-act-query" className="air-label">
          Text to find
        </label>
        <div className="pdf-mark-search">
          <input
            ref={inputRef}
            id="find-and-act-query"
            name="find-and-act-search"
            type="text"
            className="air-field"
            autoComplete="off"
            value={input}
            placeholder="Search text…"
            readOnly={blocked}
            aria-describedby="find-and-act-status"
            onChange={(e) => patchToolState(TOOL_ID, { input: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                e.preventDefault();
                find();
              }
            }}
          />
          <button
            type="button"
            className="air-button"
            aria-label="Find matches"
            aria-disabled={blocked || (!input.trim() && !terms.length)}
            aria-busy={detecting}
            onClick={find}
          >
            <Search size={16} aria-hidden="true" />
            <span className="air-action-labels">
              <span data-active={!detecting || undefined} aria-hidden={detecting}>
                Find
              </span>
              <span data-active={detecting || undefined} aria-hidden={!detecting}>
                Finding…
              </span>
            </span>
          </button>
        </div>
        <div className="pdf-mark-choices">
          {(["caseSensitive", "wholeWord"] as const).map((key) => (
            <label key={key} className="air-check-label">
              <input
                className="air-check"
                type="checkbox"
                checked={slice[key]}
                disabled={blocked}
                onChange={() =>
                  void runSearch(terms, { caseSensitive, wholeWord, [key]: !slice[key] })
                }
              />
              {key === "caseSensitive" ? "Match case" : "Whole word"}
            </label>
          ))}
        </div>
        {terms.length > 0 && (
          <ul className="pdf-find-terms" aria-label="Search terms">
            {terms.map((term) => (
              <li key={term}>
                <span>{term}</span>
                <button
                  type="button"
                  className="air-icon-button air-button--quiet"
                  aria-label={`Remove “${term}”`}
                  disabled={blocked}
                  onClick={() => {
                    inputRef.current?.focus();
                    void runSearch(terms.filter((t) => t !== term));
                  }}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p
          id="find-and-act-status"
          role={message?.error ? "alert" : "status"}
          className={message?.error ? "air-notice air-notice--error" : "air-help"}
        >
          {message?.error && <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />}
          <span>
            {detecting
              ? progress
              : (message?.text ??
                (searched
                  ? `${matches.length} ${matches.length === 1 ? "match" : "matches"} · ${pagesHit} ${pagesHit === 1 ? "page" : "pages"}.`
                  : terms.length
                    ? "The document changed. Find again to review current matches."
                    : "Add a word or phrase, then review the matches before applying."))}
          </span>
        </p>
        {detecting && (
          <button
            type="button"
            className="air-button"
            onClick={() => {
              request.current?.abort();
              request.current = null;
              setDetecting(false);
              setProgress("");
              setMessage({
                text: "Search cancelled. Your query and previous matches are unchanged.",
              });
              inputRef.current?.focus();
            }}
          >
            Cancel search
          </button>
        )}
      </section>
      <section aria-label="Mark appearance">
        <fieldset className="air-choice-group">
          <legend>Mark style</legend>
          <SegmentedControl
            value={mode}
            ariaLabel="Mark style"
            fullWidth
            disabled={blocked}
            onChange={(value: ActMode) => patchToolState(TOOL_ID, { mode: value })}
            options={[
              { value: "highlight", label: "Highlight" },
              { value: "box", label: "Box" },
            ]}
          />
        </fieldset>
        <ColorPicker
          label={mode === "highlight" ? "Highlight colour" : "Box colour"}
          value={rgbToHex(activeColor.r, activeColor.g, activeColor.b)}
          onChange={(hex) =>
            patchToolState(TOOL_ID, {
              [mode === "highlight" ? "highlightColor" : "boxColor"]: hexToRgb(hex),
            })
          }
        />
      </section>
      {scanned && searched && (
        <p className="air-notice air-notice--warning">
          <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />
          <span>Scanned pages use recognised text. Check each match against the page.</span>
        </p>
      )}
      {searched && !matches.length && (
        <p className="air-help">
          No matches. Check the spelling or turn off Match case and Whole word. OCR may miss text in
          images; review the page visually.
        </p>
      )}
      {matches.length > 0 && (
        <section aria-label="Matches" aria-busy={detecting}>
          <div className="pdf-find-selection">
            <span>{enabled.length} selected</span>
            <button
              type="button"
              className="air-button air-button--quiet"
              onClick={() => setAll(true)}
              disabled={blocked}
            >
              All
            </button>
            <button
              type="button"
              className="air-button air-button--quiet"
              onClick={() => setAll(false)}
              disabled={blocked}
            >
              None
            </button>
          </div>
          <div className="pdf-find-results">
            {[...byPage].map(([pageIndex, list]) => (
              <section key={pageIndex} aria-label={`Page ${pageIndex + 1} matches`}>
                <button
                  type="button"
                  className="air-button air-button--quiet"
                  onClick={() => jump(pageIndex)}
                >
                  Page {pageIndex + 1}
                </button>
                <ul>
                  {list.map((m, index) => (
                    <li key={m.id}>
                      <label className="air-check-label">
                        <input
                          type="checkbox"
                          className="air-check"
                          checked={m.on}
                          disabled={blocked}
                          aria-label={`Include match ${index + 1} on page ${pageIndex + 1}: ${m.term}`}
                          onChange={() =>
                            patchToolState(TOOL_ID, {
                              matches: matches.map((hit) =>
                                hit.id === m.id ? { ...hit, on: !hit.on } : hit,
                              ),
                            })
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="pdf-mark-list__location"
                        onClick={() => jump(pageIndex)}
                      >
                        <span>
                          {m.line.slice(0, m.matchStart)}
                          <mark className="pdf-command-match">
                            {m.line.slice(m.matchStart, m.matchEnd)}
                          </mark>
                          {m.line.slice(m.matchEnd)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </section>
      )}
      <section aria-label="Apply marks">
        <PrimaryAction
          label={`${mode === "highlight" ? "Highlight" : "Box"} ${enabled.length}`}
          onApply={apply}
          disabled={!enabled.length || blocked}
        />
        <button
          type="button"
          className="air-button air-button--quiet"
          aria-disabled={blocked || !terms.length}
          onClick={() => {
            if (terms.length) clearAll();
          }}
        >
          Clear search
        </button>
        <p className="air-help">
          Marks are added to the PDF when you apply. Text remains readable and selectable. Undo
          restores the previous document.
        </p>
      </section>
    </div>
  );
}
