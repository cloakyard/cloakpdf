// doc.ts — The canvas editor's document model.
//
// `CanvasDoc` is the single source of truth every tool and the canvas mutate
// through `applyTransform`. It is
// deliberately NON-DESTRUCTIVE: `bytes` is the canonical pdf-lib-writable
// source, and overlay edits live as `objects` (fraction-rect tagged shapes)
// that are burned into bytes only at export. See CLAUDE.md for the rationale
// (history snapshots cheap bytes-by-ref + object deltas, never page rasters).

import { PDFDocument } from "@pdfme/pdf-lib";
import { type EraseMode, erasePdf, redactPdf } from "../utils/pdf-operations.ts";
import { PREVIEW_SCALE, renderAllThumbnails, revokeThumbnails } from "../utils/pdf-renderer.ts";
import type { FractionRect } from "./types.ts";

/** Re-exported so editor modules revoke thumbnail blob URLs without reaching
 *  into the renderer directly (history eviction, full teardown). */
export { revokeThumbnails };

/** Per-page geometry + cached preview. Dimensions are in PDF points (the space
 *  pdf-lib writes in) and taken from the CropBox — the visible box PDF.js
 *  renders — so the focus canvas aspect ratio always matches the thumbnail,
 *  even for cropped pages or inputs that ship a CropBox. `rotation` is the
 *  page's own /Rotate angle. */
export interface PageMeta {
  index: number;
  widthPt: number;
  heightPt: number;
  rotation: number;
  /** PDF.js blob: URL preview, or null before it renders. Revoke on replace. */
  thumbUrl: string | null;
}

/** Tagged overlay kinds the editor can place on a page. The roster grows as
 *  overlay tools land (M1+); the union is the contract the layers list and the
 *  per-tool dispatch read. */
export type CanvasObjectKind =
  | "redaction"
  | "erase"
  | "annotation"
  | "signature"
  | "stamp"
  | "text"
  | "watermark"
  | "pageNumber";

/** Payload for an `erase` overlay object — how the region is flattened at
 *  export. Captured from the Smart-Erase controls when the region is drawn. */
export interface ErasePayload {
  mode: EraseMode;
  /** Pixelate block size as a fraction of the region's smaller dimension. */
  blockFrac: number;
}

/** A 0–255 RGB colour — structurally the editor's `Rgb` (panels/controls). */
export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/** Payload for a `redaction` overlay object — the box appearance the user
 *  chose, previewed on canvas and burned in at flatten. */
export interface RedactionPayload {
  fill: RgbColor;
  border: RgbColor;
}

/** Default redaction box look: a solid black bar with a red border — the
 *  recognisable, conventional redaction look. The single source of truth the
 *  Redact tool seeds its colour pickers from, so the preview and burn agree.
 *  The fill matches the "Black" colour-picker preset (#1E293B / slate-800) so
 *  the swatch reads as selected at rest; over a page this is visually black and
 *  the box is destructive, fully covering the content beneath either way. */
export const DEFAULT_REDACTION_FILL: RgbColor = { r: 30, g: 41, b: 59 };
export const DEFAULT_REDACTION_BORDER: RgbColor = { r: 220, g: 38, b: 38 };

/** CSS `rgb(...)` string for a colour (for canvas fillStyle / strokeStyle). */
export function rgbCss(c: RgbColor): string {
  return `rgb(${c.r}, ${c.g}, ${c.b})`;
}

/** A non-destructive overlay placed on one page. `rect` carries simple
 *  box-shaped marks (redaction, stamp); freeform marks (pen strokes) keep
 *  their geometry in `payload` instead, so `rect` is optional. */
export interface CanvasObject {
  id: string;
  kind: CanvasObjectKind;
  pageIndex: number;
  rect?: FractionRect;
  /** Tool-specific data (the Annotation shape, colour, text, …). Typed per tool. */
  payload?: unknown;
}

/** The in-memory editor document. */
export interface CanvasDoc {
  id: string;
  fileName: string;
  /** Canonical, pdf-lib-writable source of truth. */
  bytes: Uint8Array;
  pageCount: number;
  pages: PageMeta[];
  /** Non-destructive overlay objects across all pages. */
  objects: CanvasObject[];
}

let docSeq = 0;
/** Cheap monotonic id — a sequence counter keeps ids stable and deterministic
 *  within a session (no Math.random / crypto needed). */
export function nextId(prefix = "obj"): string {
  docSeq += 1;
  return `${prefix}-${docSeq.toString(36)}`;
}

/**
 * Build a {@link CanvasDoc} from an uploaded PDF file.
 *
 * Reads the bytes once for pdf-lib (page dimensions / rotation) and renders
 * every page to a preview thumbnail via PDF.js. `pdf-lib` gets a private copy
 * of the bytes (`slice(0)`) because PDF.js detaches the File's ArrayBuffer to
 * its worker on render — the two readers must not share one buffer.
 *
 * @param file - the dropped PDF.
 * @param onProgress - optional `(rendered, total)` for a determinate bar.
 */
export async function createDocFromFile(
  file: File,
  onProgress?: (rendered: number, total: number) => void,
): Promise<CanvasDoc> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);

  // pdf-lib gets its own copy so PDF.js's worker-side detach can't strand it.
  const pdf = await PDFDocument.load(bytes.slice(0));
  const pages: PageMeta[] = pdf.getPages().map((p, index) => {
    // CropBox (defaults to MediaBox when absent) — the box PDF.js renders, so
    // the canvas aspect ratio matches the preview for cropped pages too.
    const { width, height } = p.getCropBox();
    return {
      index,
      widthPt: width,
      heightPt: height,
      rotation: p.getRotation().angle,
      thumbUrl: null,
    };
  });

  // One render pass at preview scale — crisp enough for the focus canvas, and
  // CSS-downscaled for the strip / overview grid. Matches RedactPdf's approach.
  const thumbs = await renderAllThumbnails(file, PREVIEW_SCALE, onProgress);
  for (let i = 0; i < pages.length; i++) pages[i].thumbUrl = thumbs[i] ?? null;

  return {
    id: nextId("doc"),
    fileName: file.name,
    bytes,
    pageCount: pages.length,
    pages,
    objects: [],
  };
}

/**
 * Build a {@link CanvasDoc} from raw bytes (e.g. the output of a `DocTransform`
 * or a multi-file "doc constructor" like Merge). Wraps the bytes in a File and
 * reuses {@link createDocFromFile}, so the returned doc owns a private copy of
 * the bytes.
 */
export async function createDocFromBytes(
  bytes: Uint8Array,
  fileName: string,
  onProgress?: (rendered: number, total: number) => void,
): Promise<CanvasDoc> {
  const file = new File([bytes.slice(0)], fileName, { type: "application/pdf" });
  return createDocFromFile(file, onProgress);
}

/** Wrap the doc's current bytes as a File so the existing `pdf-operations`
 *  writers (which take a File) can run against the live document. */
export function docToFile(doc: CanvasDoc): File {
  // Copy into a fresh buffer so callers that detach it (PDF.js) can't corrupt
  // the doc's canonical bytes.
  const copy = doc.bytes.slice(0);
  return new File([copy], doc.fileName, { type: "application/pdf" });
}

// ── Deferred destructive flattening ───────────────────────────────────────
//
// Redaction and erase RASTERISE the pages they touch, destroying the text layer
// — so doing it the instant you place a box would stop you searching or
// redacting the rest of that page (the bug this defers). Instead those marks
// live as ordinary overlay objects and are burned in only at export, or just
// before the next byte transform (EditorContext.applyTransform), so they always
// land on the geometry they were drawn on and multiple rounds stay lossless.

/** Overlay kinds that destroy page content when flattened (they rasterise). */
const DESTRUCTIVE_KINDS = new Set<CanvasObjectKind>(["redaction", "erase"]);

/** Any pending redaction / erase marks still waiting to be burned in? */
export function hasPendingDestructive(doc: CanvasDoc | null): boolean {
  return !!doc && doc.objects.some((o) => DESTRUCTIVE_KINDS.has(o.kind));
}

/** How many redaction / erase marks are still waiting to be burned in — drives
 *  the persistent "N marks pending" indicator so the un-applied destructive
 *  state is visible regardless of which tool is active. */
export function countPendingDestructive(doc: CanvasDoc | null): number {
  return doc ? doc.objects.filter((o) => DESTRUCTIVE_KINDS.has(o.kind)).length : 0;
}

/** The object list minus every destructive mark — used once they've been
 *  burned into the bytes so they aren't double-applied. */
export function withoutDestructive(objects: CanvasObject[]): CanvasObject[] {
  return objects.filter((o) => !DESTRUCTIVE_KINDS.has(o.kind));
}

/**
 * Burn every pending destructive overlay into the document bytes — erase regions
 * first, then redaction boxes — rasterising the affected pages. This is the
 * deferred flatten the editor runs at export (and just before any other byte
 * transform). Returns the doc's own bytes untouched when there are none.
 *
 * Order matters when a page carries BOTH marks: erase runs first so its Fill
 * sampler reads the original page pixels (not a just-burned black redaction box,
 * which would tint the patch dark), and redaction's hard black boxes are laid
 * down last so they always win on any overlap.
 */
export async function flattenDestructiveObjects(doc: CanvasDoc): Promise<Uint8Array> {
  let bytes = doc.bytes;
  const asFile = () => new File([bytes.slice(0)], doc.fileName, { type: "application/pdf" });

  const erases = doc.objects
    .filter((o) => o.kind === "erase" && o.rect)
    .map((o) => {
      const r = o.rect as FractionRect;
      const p = (o.payload ?? {}) as Partial<ErasePayload>;
      return {
        pageIndex: o.pageIndex,
        xPct: r.xPct,
        yPct: r.yPct,
        wPct: r.wPct,
        hPct: r.hPct,
        mode: (p.mode ?? "fill") as EraseMode,
        blockFrac: p.blockFrac,
      };
    });
  if (erases.length > 0) bytes = await erasePdf(asFile(), erases);

  const redactions = doc.objects
    .filter((o) => o.kind === "redaction" && o.rect)
    .map((o) => {
      const r = o.rect as FractionRect;
      const p = (o.payload ?? {}) as Partial<RedactionPayload>;
      return {
        pageIndex: o.pageIndex,
        xPct: r.xPct,
        yPct: r.yPct,
        wPct: r.wPct,
        hPct: r.hPct,
        fillColor: rgbCss(p.fill ?? DEFAULT_REDACTION_FILL),
        // No payload (legacy mark) → no border, the original pure-black look.
        borderColor: p.border ? rgbCss(p.border) : undefined,
      };
    });
  if (redactions.length > 0) bytes = await redactPdf(asFile(), redactions);

  return bytes;
}
