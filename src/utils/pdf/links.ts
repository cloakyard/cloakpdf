import {
  PDFArray,
  PDFDict,
  PDFHexString,
  PDFName,
  PDFNull,
  PDFNumber,
  PDFRef,
  type PDFPage,
  type PDFDocument,
  type PDFObject,
} from "@pdfme/pdf-lib";
import type { FracRect } from "../text-select.ts";
import { visiblePageGeometry, visibleRectToPdf } from "./page-geometry.ts";

export interface LinkRegion {
  pageIndex: number;
  rect: FracRect;
}

function linkCoordinates(
  page: PDFPage,
  { xPct, yPct, wPct, hPct }: FracRect,
): [number, number, number, number] {
  if (
    ![xPct, yPct, wPct, hPct].every(Number.isFinite) ||
    xPct < 0 ||
    yPct < 0 ||
    wPct <= 0 ||
    hPct <= 0 ||
    xPct + wPct > 1.000001 ||
    yPct + hPct > 1.000001
  )
    throw new Error("Choose an area inside the page.");
  const size = visiblePageGeometry(page);
  const { x, y, width, height } = visibleRectToPdf(page, {
    x: xPct * size.width,
    y: (1 - yPct - hPct) * size.height,
    width: wPct * size.width,
    height: hPct * size.height,
  });
  return [x, y, x + width, y + height];
}

export function addDetailLink(pdf: PDFDocument, source: LinkRegion, detail: LinkRegion) {
  const from = pdf.getPage(source.pageIndex),
    to = pdf.getPage(detail.pageIndex);
  const dest = pdf.context.obj([to.ref, PDFName.of("FitR"), ...linkCoordinates(to, detail.rect)]);
  addLinkAnnotation(
    pdf,
    from.node,
    linkCoordinates(from, source.rect),
    { Dest: dest },
    "Go to linked detail",
  );
}

/** Append a native link while preserving other annotations and form widgets. */
export function addLinkAnnotation(
  pdf: PDFDocument,
  pageNode: PDFDict,
  rect: [number, number, number, number],
  target: { Dest?: PDFObject; A?: PDFObject },
  description?: string,
): void {
  if (!target.Dest && !target.A) return;
  const linkDict = pdf.context.obj({
    Type: PDFName.of("Annot"),
    Subtype: PDFName.of("Link"),
    Rect: pdf.context.obj(rect),
    Border: pdf.context.obj([0, 0, 0]),
    ...target,
    ...(description ? { Contents: PDFHexString.fromText(description) } : {}),
  }) as PDFDict;
  const linkRef = pdf.context.register(linkDict);

  const existing = pageNode.lookup(PDFName.of("Annots"));
  if (existing instanceof PDFArray) existing.push(linkRef);
  else pageNode.set(PDFName.of("Annots"), pdf.context.obj([linkRef]));
}

interface PageCopy {
  page: PDFPage;
  index: number;
  rasterized?: boolean;
}

/** copyPages follows an indirect destination as if it were page content. Detach detail
 * references in this privately loaded source before copying, then bind them to the
 * actual output pages. In particular an excluded or redacted page must never be
 * pulled into the file through a surviving reference. The source is copy-only after this. */
export function prepareDetailLinkCopy(source: PDFDocument) {
  const pages = source.getPages();
  const indices = new Map(pages.map((page, index) => [page.ref, index]));
  const destinations = new Map<PDFDict, PDFArray>();
  const links = new Map<number, { slot: number; target: number }[]>();
  for (const [i, page] of pages.entries()) {
    const annots = page.node.lookup(PDFName.of("Annots"));
    if (!(annots instanceof PDFArray)) continue;
    for (let slot = 0; slot < annots.size(); slot++) {
      const annot = annots.lookup(slot);
      if (!(annot instanceof PDFDict) || annot.get(PDFName.of("Subtype")) !== PDFName.of("Link"))
        continue;
      const dest = annot.lookup(PDFName.of("Dest"));
      if (!(dest instanceof PDFArray) || dest.size() !== 6 || dest.get(1) !== PDFName.of("FitR"))
        continue;
      const ref = dest.get(0);
      if (!(ref instanceof PDFRef)) continue;
      const entries = links.get(i) ?? [];
      entries.push({ slot, target: indices.get(ref) ?? -1 });
      links.set(i, entries);
      destinations.set(annot, dest);
    }
  }
  // An annotation dictionary can be shared by several pages. Record all uses first.
  for (const [annot, dest] of destinations) {
    const detached = dest.clone();
    detached.set(0, PDFNull);
    annot.set(PDFName.of("Dest"), detached);
  }
  return (copies: PageCopy[]) => {
    if (!links.size) return;
    const targets = new Map<number, PageCopy>();
    for (const copy of copies) if (!targets.has(copy.index)) targets.set(copy.index, copy);
    for (const copy of copies) {
      const entries = links.get(copy.index);
      if (!entries || copy.rasterized) continue;
      const original = copy.page.node.lookup(PDFName.of("Annots"));
      if (!(original instanceof PDFArray)) continue;
      const annots = original.clone();
      copy.page.node.set(PDFName.of("Annots"), annots);
      // Remove backwards so indices continue to match the source annotation array.
      for (let i = entries.length - 1; i >= 0; i--) {
        const { slot, target } = entries[i];
        const to = target === copy.index ? copy : targets.get(target);
        if (!to) {
          annots.remove(slot);
          continue;
        }
        const annotation = annots.lookup(slot, PDFDict).clone();
        const dest = annotation.lookup(PDFName.of("Dest"), PDFArray).clone();
        dest.set(0, to.page.ref);
        if (to.rasterized) {
          // Rebuilt pages use visible, unrotated physical points at origin (0,0).
          const [a, b, c, d, e, f] = visiblePageGeometry(pages[target]).matrix;
          const point = (n: number) => {
            const x = dest.lookup(n, PDFNumber).asNumber() - e,
              y = dest.lookup(n + 1, PDFNumber).asNumber() - f;
            return [(d * x - c * y) / (a * d - b * c), (a * y - b * x) / (a * d - b * c)];
          };
          const [x0, y0] = point(2),
            [x1, y1] = point(4);
          [Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1)].forEach((v, j) =>
            dest.set(j + 2, PDFNumber.of(v)),
          );
        }
        annotation.set(PDFName.of("Dest"), dest);
        annots.set(slot, copy.page.doc.context.register(annotation));
      }
    }
  };
}
