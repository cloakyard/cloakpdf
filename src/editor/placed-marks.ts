import {
  annotatePdf,
  addSignature,
  addCodeStampAt,
  type Annotation,
  type CodeStampType,
} from "../utils/pdf-operations.ts";
import { hexToRgb } from "../components/ColorPicker.tsx";
import { prepareSignature } from "./signature.ts";
import { docToFile, type CanvasDoc, type CanvasObject } from "./doc.ts";

export interface StampPayload {
  type: CodeStampType;
  content: string;
  colorHex: string;
  caption: boolean;
  /** Rendered preview PNG for the on-canvas overlay (burn re-draws as vector). */
  dataUrl: string;
}

/** Write only the supplied editable marks. The caller owns history and page remapping. */
export async function writePlacedMarks(d: CanvasDoc, marks: CanvasObject[], background?: string) {
  let bytes = d.bytes;
  const annotations = marks
    .filter((o) => o.kind === "annotation")
    .map((o) => ({ ...(o.payload as Annotation), pageIndex: o.pageIndex }));
  if (annotations.length) bytes = await annotatePdf(docToFile(d), annotations);
  const signatures = marks.filter((o) => o.kind === "signature");
  const backgrounds = new Map<string, string>();
  for (const o of signatures) {
    const page = d.pages[o.pageIndex];
    const r = o.rect;
    const payload = o.payload as { dataUrl: string } | undefined;
    if (!page || !r || !payload?.dataUrl)
      throw new Error("A signature is incomplete. Remove it and place it again.");
    let url = payload.dataUrl;
    if (background) {
      let prepared = backgrounds.get(url);
      if (!prepared) {
        prepared = (await prepareSignature(url, { background })).dataUrl;
        backgrounds.set(url, prepared);
      }
      url = prepared;
    }
    bytes = await addSignature(
      new File([bytes.slice(0)], d.fileName, { type: "application/pdf" }),
      url,
      [o.pageIndex],
      {
        x: r.xPct * page.widthPt,
        y: (1 - r.yPct - r.hPct) * page.heightPt,
        width: r.wPct * page.widthPt,
        height: r.hPct * page.heightPt,
      },
    );
  }

  const stamps = marks.filter((o) => o.kind === "stamp");
  // Group placements by payload identity (type/content/colour/caption) so one
  // addCodeStampAt call burns every box that shares the same code.
  const groups = new Map<
    string,
    {
      payload: StampPayload;
      placements: { pageIndex: number; x: number; y: number; width: number; height: number }[];
    }
  >();
  for (const o of stamps) {
    const payload = o.payload as StampPayload;
    const r = o.rect!;
    const page = d.pages[o.pageIndex];
    if (!page || !r || !payload)
      throw new Error("A placed code is incomplete. Review it before applying.");
    const key = JSON.stringify([payload.type, payload.content, payload.colorHex, payload.caption]);
    const width = r.wPct * page.widthPt;
    const height = r.hPct * page.heightPt;
    const x = r.xPct * page.widthPt;
    const y = (1 - r.yPct) * page.heightPt - height;
    const g = groups.get(key) ?? { payload, placements: [] };
    g.placements.push({ pageIndex: o.pageIndex, x, y, width, height });
    groups.set(key, g);
  }

  for (const { payload, placements } of groups.values()) {
    const file = new File([bytes.slice(0)], d.fileName, { type: "application/pdf" });
    bytes = await addCodeStampAt(
      file,
      {
        type: payload.type,
        content: payload.content,
        color: hexToRgb(payload.colorHex),
        caption: payload.caption,
      },
      placements,
    );
  }

  return bytes;
}

/** Bake these marks before any overlapping redactions are rasterized. */
export async function bakePlacedMarks(
  doc: CanvasDoc,
  marks: CanvasObject[],
  background?: string,
): Promise<CanvasDoc> {
  if (!marks.length) return doc;
  const ids = new Set(marks.map((o) => o.id));
  return {
    ...doc,
    bytes: await writePlacedMarks(doc, marks, background),
    objects: doc.objects.filter((o) => !ids.has(o.id)),
  };
}
