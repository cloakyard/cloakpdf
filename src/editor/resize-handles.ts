// resize-handles.ts — Shared drag-to-resize machinery for placed overlay
// objects (annotation shapes/boxes, signatures, code stamps). Extracted from
// AnnotateTool so every "place then drag a handle to resize" tool reads the same
// geometry, hit-testing, and selection chrome — one source of truth for the
// eight-handle resize UX across desktop (mouse) and mobile (touch).
//
// All boxes are top-left fraction rects (0–1 of the page). Hit-testing and
// painting take the overlay canvas's device-px size so handle slop is constant
// on screen regardless of zoom. See AnnotateTool / SignatureTool / CodeStampTool.

/** The eight resize handles, by compass id. */
export type HandleId = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export const HANDLE_IDS: HandleId[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
/** Corner handles only — the set aspect-locked tools (signature, QR) expose so a
 *  drag always scales proportionally and never distorts the artwork. */
export const CORNER_IDS: HandleId[] = ["nw", "ne", "se", "sw"];

export const HANDLE_CURSOR: Record<HandleId, string> = {
  nw: "nwse-resize",
  n: "ns-resize",
  ne: "nesw-resize",
  e: "ew-resize",
  se: "nwse-resize",
  s: "ns-resize",
  sw: "nesw-resize",
  w: "ew-resize",
};

/** Hit slop (device px) around a resize handle — generous so a finger can grab
 *  it on a phone, where the fit-to-screen page renders small. */
export const HANDLE_TOL_PX = 14;
/** Painted half-size (device px) of a resize-handle square. */
export const HANDLE_HALF_PX = 5;
/** Padding (device px) between a mark's bbox and its selection chrome. */
export const SELECT_PAD = 3;
/** Smallest box size (fractions) a resize can shrink a mark to. */
export const MIN_BOX_FRAC = 0.015;

/** A top-left fraction box. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Device-px centres of the eight handles around a fraction bbox (+chrome pad). */
export function handleCenters(
  b: Box,
  w: number,
  h: number,
): Record<HandleId, { x: number; y: number }> {
  const x0 = b.x * w - SELECT_PAD;
  const y0 = b.y * h - SELECT_PAD;
  const x1 = (b.x + b.w) * w + SELECT_PAD;
  const y1 = (b.y + b.h) * h + SELECT_PAD;
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  return {
    nw: { x: x0, y: y0 },
    n: { x: mx, y: y0 },
    ne: { x: x1, y: y0 },
    e: { x: x1, y: my },
    se: { x: x1, y: y1 },
    s: { x: mx, y: y1 },
    sw: { x: x0, y: y1 },
    w: { x: x0, y: my },
  };
}

/** Which handle (if any) the device-px point lands on. `ids` restricts the set
 *  tested (e.g. corners only for aspect-locked tools). */
export function hitHandle(
  b: Box,
  px: number,
  py: number,
  w: number,
  h: number,
  ids: HandleId[] = HANDLE_IDS,
): HandleId | null {
  const centers = handleCenters(b, w, h);
  for (const id of ids) {
    const c = centers[id];
    if (Math.abs(px - c.x) <= HANDLE_TOL_PX && Math.abs(py - c.y) <= HANDLE_TOL_PX) return id;
  }
  return null;
}

/** Resize a fraction bbox by dragging `handle` by a fraction delta, keeping the
 *  opposite edge(s) pinned and clamping to a minimum size within the page. */
export function resizeBBox(
  orig: Box,
  handle: HandleId,
  dx: number,
  dy: number,
  minFrac = MIN_BOX_FRAC,
): Box {
  let { x, y, w, h } = orig;
  const right = orig.x + orig.w;
  const bottom = orig.y + orig.h;
  if (handle.includes("w")) {
    x = Math.min(orig.x + dx, right - minFrac);
    x = Math.max(0, x);
    w = right - x;
  }
  if (handle.includes("e")) {
    w = Math.max(minFrac, Math.min(orig.w + dx, 1 - orig.x));
  }
  if (handle.includes("n")) {
    y = Math.min(orig.y + dy, bottom - minFrac);
    y = Math.max(0, y);
    h = bottom - y;
  }
  if (handle.includes("s")) {
    h = Math.max(minFrac, Math.min(orig.h + dy, 1 - orig.y));
  }
  return { x, y, w, h };
}

/**
 * Resize a fraction bbox by a CORNER handle while locking its aspect ratio
 * (`aspect` = w / h). The corner opposite the dragged handle stays pinned; the
 * box scales uniformly to follow the pointer, then shrinks if needed so it never
 * leaves the page. Used by aspect-true artwork (signatures, QR codes) so a drag
 * can never stretch them. Edge handles fall back to free resize.
 */
export function resizeBBoxAspect(
  orig: Box,
  handle: HandleId,
  dx: number,
  dy: number,
  aspect: number,
  minFrac = MIN_BOX_FRAC,
): Box {
  const isCorner = CORNER_IDS.includes(handle);
  if (!isCorner || !(aspect > 0)) return resizeBBox(orig, handle, dx, dy, minFrac);

  const west = handle.includes("w");
  const north = handle.includes("n");
  const right = orig.x + orig.w;
  const bottom = orig.y + orig.h;
  // The pinned (anchor) corner is opposite the dragged one.
  const anchorX = west ? right : orig.x;
  const anchorY = north ? bottom : orig.y;
  // Where the dragged corner wants to go.
  const targetX = (west ? orig.x : right) + dx;
  const targetY = (north ? orig.y : bottom) + dy;

  // Free width/height from the anchor to the pointer, then "contain" to aspect
  // (follow whichever axis moved least so the box stays under the cursor).
  let nw = Math.abs(targetX - anchorX);
  let nh = Math.abs(targetY - anchorY);
  if (nw / nh > aspect) nw = nh * aspect;
  else nh = nw / aspect;

  // Clamp to the page: room available from the anchor in the drag direction.
  const roomX = west ? anchorX : 1 - anchorX;
  const roomY = north ? anchorY : 1 - anchorY;
  const maxW = Math.min(roomX, roomY * aspect);
  nw = Math.min(Math.max(minFrac, nw), Math.max(minFrac, maxW));
  nh = nw / aspect;

  const x = west ? anchorX - nw : anchorX;
  const y = north ? anchorY - nh : anchorY;
  return { x, y, w: nw, h: nh };
}

/** Dashed selection box around a mark's bbox, with square resize handles. Pass
 *  `handles` to restrict the drawn set (corners only for aspect-locked tools);
 *  pass an empty array for a move-only mark (corner ticks only). */
export function drawSelectionChrome(
  ctx: CanvasRenderingContext2D,
  b: Box,
  w: number,
  h: number,
  opts: { handles?: HandleId[]; accent?: string } = {},
): void {
  const accent = opts.accent ?? "#2563eb";
  const handles = opts.handles ?? HANDLE_IDS;
  const x = b.x * w - SELECT_PAD;
  const y = b.y * h - SELECT_PAD;
  const bw = b.w * w + SELECT_PAD * 2;
  const bh = b.h * h + SELECT_PAD * 2;
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(x, y, bw, bh);
  ctx.setLineDash([]);
  if (handles.length > 0) {
    const centers = handleCenters(b, w, h);
    ctx.lineWidth = 1.5;
    for (const id of handles) {
      const c = centers[id];
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(
        c.x - HANDLE_HALF_PX,
        c.y - HANDLE_HALF_PX,
        HANDLE_HALF_PX * 2,
        HANDLE_HALF_PX * 2,
      );
      ctx.strokeStyle = accent;
      ctx.strokeRect(
        c.x - HANDLE_HALF_PX,
        c.y - HANDLE_HALF_PX,
        HANDLE_HALF_PX * 2,
        HANDLE_HALF_PX * 2,
      );
    }
  } else {
    // Move-only mark: small corner ticks, no grab handles.
    ctx.fillStyle = accent;
    const hs = 3;
    for (const [hx, hy] of [
      [x, y],
      [x + bw, y],
      [x, y + bh],
      [x + bw, y + bh],
    ]) {
      ctx.fillRect(hx - hs, hy - hs, hs * 2, hs * 2);
    }
  }
  ctx.restore();
}
