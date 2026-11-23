import type { Annotation, LinkAnnotation } from "../utils/pdf/annotate.ts";
import type { LinkRegion } from "../utils/pdf/links.ts";
import type { CanvasObject } from "./doc.ts";

export function isLinkObject(o: CanvasObject): o is CanvasObject & { payload: LinkAnnotation } {
  return o.kind === "annotation" && (o.payload as Annotation | undefined)?.kind === "link";
}

/** Page edits move both ends of a pending link. Removing either region retires it. */
export function remapLink(
  o: CanvasObject & { payload: LinkAnnotation },
  map: (region: LinkRegion) => LinkRegion | undefined,
): CanvasObject[] {
  const a = o.payload;
  const source = map({
    pageIndex: o.pageIndex,
    rect: { xPct: a.x, yPct: a.y, wPct: a.w, hPct: a.h },
  });
  const target = map(a.target);
  if (!source || !target) return [];
  const { xPct: x, yPct: y, wPct: w, hPct: h } = source.rect;
  return [
    {
      ...o,
      pageIndex: source.pageIndex,
      payload: { ...a, pageIndex: source.pageIndex, x, y, w, h, target } satisfies LinkAnnotation,
    },
  ];
}
