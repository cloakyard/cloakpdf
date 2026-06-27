// stamp-render.ts — Shared canvas renderer for shaped / inked text stamps.
//
// One painter feeds two consumers so the live preview and the burned output are
// the same pixels (the "preview == output" invariant the Stamp tool relies on):
//   • the editor overlay (StampTools) calls `paintStamp` to composite the stamp
//     onto the page canvas as you tune it;
//   • the burn (`addWatermark`, ink/shape path) calls `buildStampImage` to get an
//     unrotated PNG it embeds with pdf-lib, applying rotation/opacity there.
//
// A stamp is drawn UNROTATED and centred in a tight offscreen buffer; rotation
// and opacity are applied by the consumer (canvas transform for preview, pdf-lib
// `rotate`/`opacity` for the burn). The "ink" finish erodes the crisp ink into a
// rubber-stamp texture (see `applyInkTexture`): uneven low-frequency coverage,
// broken edges, and fine grit. The PRNG is seeded from the text, so the pattern
// is stable across re-renders rather than reshuffling every frame.

import type { StampFinish, StampShape } from "../../types.ts";

const STAMP_FONT = "Helvetica, Arial, sans-serif";

const RECT_FILL_ALPHA = 0.07; // faint tint inside the rounded box

// ── Rubber-stamp ink texture ─────────────────────────────────────────────────
//
// A real stamp transfers ink in a BINARY way: each spot of rubber either touches
// the paper or it doesn't, so the dropout has hard, grainy, irregular edges — not
// the soft transparency gradients that read as watercolour. We model that as
// erosion passes over the crisp ink, all `destination-out` so they remove ink:
//
//   1. ERODE — a multi-octave value-noise field evaluated at FULL buffer
//      resolution and HARD-thresholded (binary, with a sub-pixel feather only to
//      avoid jaggies). The high-frequency octaves make the thresholded boundary
//      grainy/broken rather than smoothly blobby; a radial bias erodes the rim
//      harder so ring/box edges break up.
//   2. GRIT — many small, FULLY-opaque pinholes punched across the whole stamp
//      for the porous-rubber speckle.
//   3. SCRATCH — a few thin hairline gaps, the streaks a worn stamp leaves.
//
// Everything scales with `fontPx`, so the look is resolution-independent between
// the display-scale preview and the supersampled burn. The PRNG is seeded from
// the text so the pattern is stable across re-renders (no per-frame reshuffle).

/** Erosion noise octaves — `cell` is the feature size as a fraction of `fontPx`
 *  (smaller = finer/grainier), `amp` its weight. Fine octaves dominate enough to
 *  keep edges grainy rather than smooth. */
const ERODE_OCTAVES = [
  { cell: 0.7, amp: 0.55 }, // moderate patches (no full-stamp octave → avoids big chunky gaps)
  { cell: 0.3, amp: 0.7 },
  { cell: 0.13, amp: 0.65 },
  { cell: 0.06, amp: 0.5 }, // fine grain dominates the edge character
];
const ERODE_FEATHER = 0.022; // sub-pixel AA ramp around the threshold (keeps edges crisp, not jaggy)
// The "Texture" amount (0–1) scales every erosion lever between a LIGHT end (a
// faint vintage touch, text fully legible) and a HEAVY end (worn rubber grunge).
// Threshold is inverted: a higher field threshold removes LESS ink.
const ERODE_THRESHOLD_LIGHT = 0.82; // texture=0 → little erosion
const ERODE_THRESHOLD_HEAVY = 0.44; // texture=1 → heavy erosion
const ERODE_EDGE_BIAS_MAX = 0.16; // extra erosion toward the rim at texture=1 (broken edges)
const GRIT_DENSITY_MAX = 44; // crisp pinholes per fontPx² at texture=1 (porous speckle)
const SCRATCH_DENSITY_MAX = 0.7; // hairline scratches per fontPx² at texture=1
const DEFAULT_TEXTURE = 0.25; // used when an ink stamp doesn't specify an amount

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface StampImageOpts {
  text: string;
  color: { r: number; g: number; b: number };
  shape: StampShape;
  finish: StampFinish;
  /** Ink-texture amount 0–1 (light → heavy grunge). Defaults to `DEFAULT_TEXTURE`. */
  texture?: number;
}

/** FNV-1a hash → 32-bit seed so a given stamp text yields a stable distress pattern. */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** mulberry32 PRNG — tiny, deterministic, good enough for speckle placement. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface StampGeom {
  width: number;
  height: number;
  textWidth: number;
}

/** Geometry of the unrotated stamp (px) for a given font size + shape. The
 *  margin leaves room for the border stroke and the bleed halo so nothing clips. */
function measureStamp(
  ctx: CanvasRenderingContext2D,
  fontPx: number,
  opts: StampImageOpts,
): StampGeom {
  ctx.font = `bold ${fontPx}px ${STAMP_FONT}`;
  const textWidth = ctx.measureText(opts.text).width;
  const textHeight = fontPx; // cap-to-baseline approximation, matches drawn box
  const margin = fontPx * 0.5;
  if (opts.shape === "rect") {
    const padX = fontPx * 1.2;
    const padY = fontPx * 0.6;
    return {
      width: textWidth + padX * 2 + margin * 2,
      height: textHeight + padY * 2 + margin * 2,
      textWidth,
    };
  }
  if (opts.shape === "circle") {
    const innerR = textWidth / 2 + fontPx * 0.8;
    const outerR = innerR + fontPx * 0.55;
    return { width: outerR * 2 + margin * 2, height: outerR * 2 + margin * 2, textWidth };
  }
  return { width: textWidth + margin * 2, height: textHeight + margin * 2, textWidth };
}

/** Draw the crisp shape border + centred text in solid colour onto `ctx`,
 *  centred at (cx, cy). No distress, no opacity — that is layered on later. */
function drawGlyph(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  fontPx: number,
  geom: StampGeom,
  opts: StampImageOpts,
): void {
  const col = `rgb(${opts.color.r}, ${opts.color.g}, ${opts.color.b})`;
  ctx.save();
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineJoin = "round";

  if (opts.shape === "rect") {
    const padX = fontPx * 1.2;
    const padY = fontPx * 0.6;
    const w = geom.textWidth + padX * 2;
    const h = fontPx + padY * 2;
    const radius = fontPx * 0.4;
    const lw = Math.max(1, fontPx * 0.12);
    const x = cx - w / 2;
    const y = cy - h / 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    // A faint tint reads as a clean digital fill, but under the ink texture it
    // muddies into a flat panel — so the inked box is just border + text.
    if (opts.finish !== "ink") {
      ctx.globalAlpha = RECT_FILL_ALPHA;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.lineWidth = lw;
    ctx.stroke();
  } else if (opts.shape === "circle") {
    const innerR = geom.textWidth / 2 + fontPx * 0.8;
    const outerR = innerR + fontPx * 0.55;
    ctx.lineWidth = Math.max(1, fontPx * 0.14);
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = Math.max(1, fontPx * 0.1);
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = col;
  ctx.font = `bold ${fontPx}px ${STAMP_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(opts.text, cx, cy);
  ctx.restore();
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Bilinear sample of a random grid (`cols`×`rows`) at normalised (fx, fy) ∈ [0,1]. */
function sampleGrid(g: Float32Array, cols: number, rows: number, fx: number, fy: number): number {
  const gx = fx * (cols - 1);
  const gy = fy * (rows - 1);
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const x1 = Math.min(x0 + 1, cols - 1);
  const y1 = Math.min(y0 + 1, rows - 1);
  const tx = gx - x0;
  const ty = gy - y0;
  const a = g[y0 * cols + x0] + (g[y0 * cols + x1] - g[y0 * cols + x0]) * tx;
  const b = g[y1 * cols + x0] + (g[y1 * cols + x1] - g[y1 * cols + x0]) * tx;
  return a + (b - a) * ty;
}

function randomGrid(cols: number, rows: number, rng: () => number): Float32Array {
  const g = new Float32Array(cols * rows);
  for (let i = 0; i < g.length; i++) g[i] = rng();
  return g;
}

/** Build the erosion mask at FULL buffer resolution: a multi-octave value-noise
 *  field, hard-thresholded so the dropout has crisp, grainy edges (no soft
 *  gradient). The mask's alpha encodes erase amount; a radial bias erodes the
 *  rim harder so ring/box edges break up like a real stamp. */
function buildErosionMask(
  w: number,
  h: number,
  fontPx: number,
  rng: () => number,
  threshold: number,
  edgeBias: number,
): HTMLCanvasElement {
  const octaves = ERODE_OCTAVES.map((o) => {
    const cols = Math.max(2, Math.round(w / (fontPx * o.cell)));
    const rows = Math.max(2, Math.round(h / (fontPx * o.cell)));
    return { g: randomGrid(cols, rows, rng), cols, rows, amp: o.amp };
  });
  const ampSum = octaves.reduce((s, o) => s + o.amp, 0);

  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  const id = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const fy = y / (h - 1);
    for (let x = 0; x < w; x++) {
      const fx = x / (w - 1);
      let n = 0;
      for (const o of octaves) n += o.amp * sampleGrid(o.g, o.cols, o.rows, fx, fy);
      n /= ampSum;
      const edge = Math.max(Math.abs(fx - 0.5), Math.abs(fy - 0.5)) * 2; // 0 centre → 1 rim
      const field = n + edgeBias * edge * edge;
      // Hard threshold with a sub-pixel feather → binary dropout, crisp edges.
      const erase = smoothstep(threshold - ERODE_FEATHER, threshold + ERODE_FEATHER, field);
      id.data[(y * w + x) * 4 + 3] = erase * 255; // rgb stay 0; destination-out reads alpha
    }
  }
  ctx.putImageData(id, 0, 0);
  return c;
}

/** Erode the crisp ink into a rubber-stamp texture: a hard-thresholded noise
 *  field (broken coverage + edges), crisp full-opacity grit pinholes, then a few
 *  hairline scratches. All `destination-out`. Seeded from the text → stable. The
 *  `texture` amount (0–1) scales every lever from a faint touch to heavy grunge. */
function applyInkTexture(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  fontPx: number,
  seed: number,
  texture: number,
): void {
  const t = Math.min(1, Math.max(0, texture));
  const threshold = lerp(ERODE_THRESHOLD_LIGHT, ERODE_THRESHOLD_HEAVY, t);
  const edgeBias = ERODE_EDGE_BIAS_MAX * t;
  const rng = mulberry32(seed);
  const unit = fontPx / 40;
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";

  // 1. Hard-thresholded erosion field (1:1, no scaling → crisp grainy edges).
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 1;
  ctx.drawImage(buildErosionMask(w, h, fontPx, rng, threshold, edgeBias), 0, 0);

  // 2. Crisp pinhole grit — small and fully opaque so they read as sharp specks.
  const grit = Math.round(((w * h) / (fontPx * fontPx)) * GRIT_DENSITY_MAX * t);
  for (let i = 0; i < grit; i++) {
    // Mostly fine specks, with an occasional larger fleck (squared random skews small).
    const rr = rng();
    const r = (0.15 + rr * rr * 1.1) * unit;
    ctx.beginPath();
    ctx.arc(rng() * w, rng() * h, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Hairline scratches — short jagged streaks a worn stamp leaves behind.
  const scratches = Math.round(((w * h) / (fontPx * fontPx)) * SCRATCH_DENSITY_MAX * t);
  ctx.lineCap = "round";
  for (let i = 0; i < scratches; i++) {
    ctx.lineWidth = (0.15 + rng() * 0.35) * unit;
    let x = rng() * w;
    let y = rng() * h;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const segs = 2 + Math.floor(rng() * 3);
    for (let s = 0; s < segs; s++) {
      x += (rng() - 0.5) * fontPx * 0.5;
      y += (rng() - 0.5) * fontPx * 0.5;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

type StampImage = { canvas: HTMLCanvasElement; width: number; height: number };

// The ink texture is non-trivial to compute, and the preview repaints on every
// overlay frame (zoom, opacity/angle drag) — but those don't change the buffer
// (rotation + opacity are applied at composite). A small LRU keyed on the
// buffer-affecting inputs keeps the preview smooth; only text/shape/finish/
// colour/size changes rebuild. Capacity comfortably covers preview + burn.
const CACHE_CAP = 12;
const imageCache = new Map<string, StampImage>();

function buildStampImageUncached(fontPx: number, opts: StampImageOpts): StampImage | null {
  const measureCanvas = document.createElement("canvas");
  const mctx = measureCanvas.getContext("2d");
  if (!mctx) return null;
  const geom = measureStamp(mctx, fontPx, opts);
  const w = Math.ceil(geom.width);
  const h = Math.ceil(geom.height);

  const ink = document.createElement("canvas");
  ink.width = w;
  ink.height = h;
  const ictx = ink.getContext("2d");
  if (!ictx) return null;
  drawGlyph(ictx, w / 2, h / 2, fontPx, geom, opts);

  if (opts.finish === "ink") {
    const texture = opts.texture ?? DEFAULT_TEXTURE;
    applyInkTexture(ictx, w, h, fontPx, hashSeed(`${opts.text}|${opts.shape}`), texture);
  }
  return { canvas: ink, width: w, height: h };
}

/**
 * Render the stamp to a tight, unrotated offscreen canvas in full colour/opacity.
 * `digital` is crisp ink; `ink` erodes it into a rubber-stamp texture (uneven
 * coverage, broken edges, grit). Returns `null` for empty text. Memoised on the
 * inputs that change the pixels (rotation/opacity are applied by the caller).
 *
 * @param fontPx - Font size in canvas pixels (caller scales points → px).
 */
function buildStampImage(fontPx: number, opts: StampImageOpts): StampImage | null {
  if (!opts.text.trim() || fontPx < 1) return null;
  const tex = opts.finish === "ink" ? (opts.texture ?? DEFAULT_TEXTURE).toFixed(2) : "-";
  const key = `${Math.round(fontPx)}|${opts.shape}|${opts.finish}|${tex}|${opts.color.r},${opts.color.g},${opts.color.b}|${opts.text}`;
  const hit = imageCache.get(key);
  if (hit) {
    imageCache.delete(key); // re-insert → most-recently-used
    imageCache.set(key, hit);
    return hit;
  }
  const built = buildStampImageUncached(fontPx, opts);
  if (!built) return null;
  imageCache.set(key, built);
  if (imageCache.size > CACHE_CAP) imageCache.delete(imageCache.keys().next().value as string);
  return built;
}

/**
 * Composite a stamp onto an existing canvas context, centred at (cx, cy),
 * rotated and faded per the options. Used by the editor overlay for the live
 * preview. `fontPx` is the font size in display pixels; `rotationDeg` follows
 * the maths convention (counter-clockwise positive) — negated for the canvas.
 */
export function paintStamp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  fontPx: number,
  rotationDeg: number,
  opacity: number,
  opts: StampImageOpts,
): void {
  const img = buildStampImage(fontPx, opts);
  if (!img) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
  ctx.translate(cx, cy);
  ctx.rotate((-rotationDeg * Math.PI) / 180);
  ctx.drawImage(img.canvas, -img.width / 2, -img.height / 2);
  ctx.restore();
}

/** Supersample factor for the burned PNG so embedded stamp text stays sharp. */
const BURN_SUPERSAMPLE = 3;

/**
 * Render a stamp to a PNG data-URL for embedding in a PDF, plus the point
 * dimensions it should occupy. Supersampled then downscaled on draw, so the
 * raster stamp prints crisply. `fontSizePt` is in PDF points.
 */
export function renderStampDataUrl(
  fontSizePt: number,
  opts: StampImageOpts,
): { dataUrl: string; widthPt: number; heightPt: number } | null {
  const img = buildStampImage(fontSizePt * BURN_SUPERSAMPLE, opts);
  if (!img) return null;
  return {
    dataUrl: img.canvas.toDataURL("image/png"),
    widthPt: img.width / BURN_SUPERSAMPLE,
    heightPt: img.height / BURN_SUPERSAMPLE,
  };
}
