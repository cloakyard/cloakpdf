import type { Annotation } from "../utils/pdf/annotate.ts";
import { cropPagesIndividual } from "../utils/pdf/transform.ts";
import { docToFile, type CanvasDoc } from "./doc.ts";
import type { FractionRect } from "./types.ts";

export type CropMargins = Record<"top" | "right" | "bottom" | "left", string>;

/** Keep text drafts intact; only valid percentages may change the page geometry. */
export function parseCropMargins(margins: CropMargins) {
  const values = Object.values(margins);
  if (
    values.some(
      (v) => !v.trim() || !Number.isFinite(Number(v)) || Number(v) < 0 || Number(v) >= 100,
    )
  )
    return { keep: null, error: "Enter a percentage from 0 to less than 100 for each margin." };
  const top = Number(margins.top) / 100,
    right = Number(margins.right) / 100;
  const bottom = Number(margins.bottom) / 100,
    left = Number(margins.left) / 100;
  if (top + bottom >= 1 || left + right >= 1)
    return { keep: null, error: "Opposite margins must add up to less than 100%." };
  return {
    keep:
      top || right || bottom || left
        ? { xPct: left, yPct: top, wPct: 1 - left - right, hPct: 1 - top - bottom }
        : null,
    error: "",
  };
}

export function cropMarginsFromRect(rect: FractionRect): CropMargins {
  const percent = (v: number) => String(Number((Math.max(0, v) * 100).toFixed(4)));
  return {
    top: percent(rect.yPct),
    right: percent(1 - rect.xPct - rect.wPct),
    bottom: percent(1 - rect.yPct - rect.hPct),
    left: percent(rect.xPct),
  };
}

/** Crop the bytes and keep pending marks attached to their original content.
 * Out-of-bounds marks remain editable/undoable; the paper clips their display. */
export async function cropDoc(doc: CanvasDoc, keeps: Map<number, FractionRect>) {
  const margins = new Map<number, { left: number; right: number; top: number; bottom: number }>();
  for (const [index, k] of keeps) {
    const page = doc.pages[index];
    if (
      !page ||
      !Object.values(k).every(Number.isFinite) ||
      k.xPct < 0 ||
      k.yPct < 0 ||
      k.wPct <= 0 ||
      k.hPct <= 0 ||
      k.xPct + k.wPct > 1 + 1e-7 ||
      k.yPct + k.hPct > 1 + 1e-7
    )
      continue;
    margins.set(index, {
      left: k.xPct * page.widthPt,
      right: (1 - k.xPct - k.wPct) * page.widthPt,
      top: k.yPct * page.heightPt,
      bottom: (1 - k.yPct - k.hPct) * page.heightPt,
    });
  }
  const { bytes } = await cropPagesIndividual(docToFile(doc), margins);
  const objects = doc.objects.map((o) => {
    const k = keeps.get(o.pageIndex);
    if (!k || !margins.has(o.pageIndex)) return o;
    const x = (v: number) => (v - k.xPct) / k.wPct;
    const y = (v: number) => (v - k.yPct) / k.hPct;
    const rect = o.rect && {
      xPct: x(o.rect.xPct),
      yPct: y(o.rect.yPct),
      wPct: o.rect.wPct / k.wPct,
      hPct: o.rect.hPct / k.hPct,
    };
    if (o.kind !== "annotation" || !o.payload) return { ...o, rect };
    const a = o.payload as Annotation;
    let payload: Annotation = a;
    if (a.kind === "stroke") {
      payload = {
        ...a,
        points: a.points.map((p) => ({ x: x(p.x), y: y(p.y) })),
        thicknessFrac: a.thicknessFrac / k.wPct,
      };
    } else if (a.kind === "line" || a.kind === "arrow") {
      payload = {
        ...a,
        x1: x(a.x1),
        y1: y(a.y1),
        x2: x(a.x2),
        y2: y(a.y2),
        thicknessFrac: a.thicknessFrac / k.wPct,
      };
    } else if (a.kind === "text") {
      payload = {
        ...a,
        x: x(a.x),
        y: y(a.y),
        w: a.w == null ? undefined : a.w / k.wPct,
        h: a.h == null ? undefined : a.h / k.hPct,
        sizeFrac: a.sizeFrac / k.hPct,
      };
    } else if (a.kind === "rect" || a.kind === "ellipse" || a.kind === "icon") {
      payload = { ...a, x: x(a.x), y: y(a.y), w: a.w / k.wPct, h: a.h / k.hPct };
      if (payload.kind !== "icon") payload.thicknessFrac /= k.wPct;
    }
    return { ...o, rect, payload };
  });
  return { bytes, objects };
}
