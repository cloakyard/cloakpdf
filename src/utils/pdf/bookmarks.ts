/**
 * PDF outline (bookmarks) authoring — flat or nested — plus an optional
 * clickable in-document Table of Contents page.
 */

import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFRef,
  rgb,
  StandardFonts,
} from "@pdfme/pdf-lib";

/** One outline entry. `pageIndex` is 0-based into the *input* document (before
 *  any contents page is inserted). `level` nests the entry: 1 = top-level, 2 =
 *  child of the nearest preceding level-1, and so on (clamped to 3). Omitting
 *  `level` (or passing all 1s) yields a flat outline — byte-compatible with the
 *  original flat-only behaviour. */
export interface BookmarkEntry {
  title: string;
  pageIndex: number;
  level?: number;
}

export interface BookmarkOptions {
  /** Prepend a clickable Table-of-Contents page that lists every entry with its
   *  page number; clicking a row jumps to that page. The entries' targets are
   *  shifted to account for the inserted page(s). */
  contentsPage?: boolean;
}

interface OutlineNode {
  title: string;
  /** 0-based index into the *output* document (after any TOC insertion). */
  targetIndex: number;
  level: number;
  children: OutlineNode[];
  ref: PDFRef;
}

const MARGIN = 56;
const TITLE_SIZE = 20;
const TITLE_BLOCK = 52; // vertical space the "Contents" heading reserves
const ENTRY_SIZE = 11;
const LINE_GAP = 22;
const INDENT = 18; // per nesting level

interface MeasurableFont {
  widthOfTextAtSize: (t: string, s: number) => number;
}

/** Standard-14 fonts only encode WinAnsi (Latin-1). A heading with glyphs they
 *  can't represent (CJK, emoji) would throw inside measure/draw and abort the
 *  whole contents page. Replace ONLY the characters the font can't encode with
 *  "?", per code point — so accented Latin (é, ü) is kept verbatim even when the
 *  same title also contains a non-encodable glyph. */
function encodableText(text: string, font: MeasurableFont): string {
  try {
    font.widthOfTextAtSize(text, ENTRY_SIZE);
    return text;
  } catch {
    let out = "";
    for (const ch of text) {
      try {
        font.widthOfTextAtSize(ch, ENTRY_SIZE);
        out += ch;
      } catch {
        out += "?";
      }
    }
    return out;
  }
}

/** Trim `text` so it (plus an ellipsis) fits within `maxW` at `size`. */
function fitText(text: string, font: MeasurableFont, size: number, maxW: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxW) return text;
  let t = text;
  while (t.length > 1 && font.widthOfTextAtSize(`${t}…`, size) > maxW) t = t.slice(0, -1);
  return `${t}…`;
}

/** How many entries fit on each contents page (the first reserves the heading). */
function planContentsPages(count: number, pageHeight: number): number[] {
  const firstCap = Math.max(1, Math.floor((pageHeight - MARGIN * 2 - TITLE_BLOCK) / LINE_GAP));
  const otherCap = Math.max(1, Math.floor((pageHeight - MARGIN * 2) / LINE_GAP));
  const pages: number[] = [];
  let remaining = count;
  const first = Math.min(remaining, firstCap);
  pages.push(first);
  remaining -= first;
  while (remaining > 0) {
    const n = Math.min(remaining, otherCap);
    pages.push(n);
    remaining -= n;
  }
  return pages;
}

/** Total descendant nodes (for an item's /Count when its subtree is open). */
function countDescendants(node: OutlineNode): number {
  let c = node.children.length;
  for (const child of node.children) c += countDescendants(child);
  return c;
}

/**
 * Add bookmarks (a PDF outline) to a document, optionally nested by `level` and
 * optionally preceded by a clickable Table-of-Contents page.
 *
 * Any existing outline is replaced and /PageMode is set to UseOutlines so PDF
 * viewers show the bookmarks panel by default.
 *
 * @param file - The source PDF file.
 * @param bookmarks - Entries (0-based page index, optional nesting level).
 * @param options - `contentsPage` to insert a clickable TOC page up front.
 * @returns New PDF bytes with the outline (and optional TOC page) inserted.
 */
export async function addPdfBookmarks(
  file: File,
  bookmarks: BookmarkEntry[],
  options: BookmarkOptions = {},
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);

  if (bookmarks.length === 0) return pdf.save();

  // Sanitise levels up front (1–3) so both the outline tree and the TOC indent
  // read from the same normalised value.
  const entries = bookmarks.map((b) => ({
    title: b.title,
    pageIndex: b.pageIndex,
    level: Math.max(1, Math.min(3, Math.round(b.level ?? 1))),
  }));

  // ── Optional contents page ─────────────────────────────────────────────
  let shift = 0;
  if (options.contentsPage) {
    const { width: W, height: H } = pdf.getPage(0).getSize();
    const tocPlan = planContentsPages(entries.length, H);
    shift = tocPlan.length;

    // Insert the blank TOC pages at the front, in order.
    for (let p = 0; p < shift; p++) pdf.insertPage(p, [W, H]);

    const pagesAfter = pdf.getPages();
    const helv = await pdf.embedFont(StandardFonts.Helvetica);
    const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const textColor = rgb(0.12, 0.16, 0.23);
    const numColor = rgb(0.45, 0.5, 0.58);

    let entryIdx = 0;
    for (let tp = 0; tp < shift; tp++) {
      const tocPage = pagesAfter[tp];
      let topY = H - MARGIN;
      if (tp === 0) {
        tocPage.drawText("Contents", {
          x: MARGIN,
          y: topY - TITLE_SIZE,
          size: TITLE_SIZE,
          font: helvBold,
          color: textColor,
        });
        topY -= TITLE_BLOCK;
      }

      for (let n = 0; n < tocPlan[tp]; n++) {
        const entry = entries[entryIdx++];
        const targetIndex = Math.max(0, Math.min(entry.pageIndex + shift, pagesAfter.length - 1));
        const baseline = topY - ENTRY_SIZE;
        const x = MARGIN + (entry.level - 1) * INDENT;
        const numLabel = String(targetIndex + 1);
        const numWidth = helv.widthOfTextAtSize(numLabel, ENTRY_SIZE);
        const titleMaxW = W - MARGIN - x - numWidth - 16;
        const titleText = fitText(encodableText(entry.title, helv), helv, ENTRY_SIZE, titleMaxW);

        tocPage.drawText(titleText, {
          x,
          y: baseline,
          size: ENTRY_SIZE,
          font: helv,
          color: textColor,
        });
        tocPage.drawText(numLabel, {
          x: W - MARGIN - numWidth,
          y: baseline,
          size: ENTRY_SIZE,
          font: helv,
          color: numColor,
        });

        // Clickable link spanning the whole row, jumping to the target page.
        addLinkAnnotation(
          pdf,
          tocPage.node,
          [MARGIN, baseline - 4, W - MARGIN, baseline + ENTRY_SIZE + 4],
          pagesAfter[targetIndex].ref,
        );

        topY -= LINE_GAP;
      }
    }
  }

  // ── Build the (possibly nested) outline ────────────────────────────────
  const pages = pdf.getPages();
  const targetOf = (pageIndex: number) =>
    Math.max(0, Math.min(pageIndex + shift, pages.length - 1));

  // Create + register one outline node (Title + Dest). PDFHexString.fromText
  // emits UTF-16BE (with BOM) so non-Latin-1 titles — routine from the heading
  // auto-detector on non-English docs — render correctly in the viewer's
  // outline; PDFString.of would mangle them.
  const makeNode = (title: string, targetIndex: number, level: number): OutlineNode => {
    const dest = pdf.context.obj([pages[targetIndex].ref, PDFName.of("Fit")]) as PDFArray;
    const dict = pdf.context.obj({ Title: PDFHexString.fromText(title), Dest: dest }) as PDFDict;
    return { title, targetIndex, level, children: [], ref: pdf.context.register(dict) };
  };

  // Assemble the forest from the real entries by nesting level.
  const roots: OutlineNode[] = [];
  const stack: OutlineNode[] = [];
  for (const e of entries) {
    const node = makeNode(e.title, targetOf(e.pageIndex), e.level);
    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) stack.pop();
    if (stack.length === 0) roots.push(node);
    else stack[stack.length - 1].children.push(node);
    stack.push(node);
  }

  // The synthetic "Contents" bookmark is a top-level SIBLING, never a parent —
  // prepend it AFTER the forest is built so a leading H2/H3 heading can't end
  // up nested under it.
  if (options.contentsPage) roots.unshift(makeNode("Contents", 0, 1));

  const outlineDict = pdf.context.obj({ Type: PDFName.of("Outlines") }) as PDFDict;
  const outlineRef = pdf.context.register(outlineDict);

  let totalNodes = 0;
  const wireSiblings = (siblings: OutlineNode[], parentRef: PDFRef) => {
    for (let i = 0; i < siblings.length; i++) {
      totalNodes++;
      const node = siblings[i];
      const dict = pdf.context.lookup(node.ref);
      if (!(dict instanceof PDFDict)) continue;
      dict.set(PDFName.of("Parent"), parentRef);
      if (i > 0) dict.set(PDFName.of("Prev"), siblings[i - 1].ref);
      if (i < siblings.length - 1) dict.set(PDFName.of("Next"), siblings[i + 1].ref);
      if (node.children.length > 0) {
        dict.set(PDFName.of("First"), node.children[0].ref);
        dict.set(PDFName.of("Last"), node.children[node.children.length - 1].ref);
        dict.set(PDFName.of("Count"), PDFNumber.of(countDescendants(node)));
        wireSiblings(node.children, node.ref);
      }
    }
  };
  wireSiblings(roots, outlineRef);

  outlineDict.set(PDFName.of("First"), roots[0].ref);
  outlineDict.set(PDFName.of("Last"), roots[roots.length - 1].ref);
  outlineDict.set(PDFName.of("Count"), PDFNumber.of(totalNodes));

  pdf.catalog.set(PDFName.of("Outlines"), outlineRef);
  pdf.catalog.set(PDFName.of("PageMode"), PDFName.of("UseOutlines"));

  return pdf.save();
}

/** Register a /Link annotation (a GoTo-Fit jump to `targetRef`) and attach it to
 *  the page's /Annots array, creating the array if absent. */
function addLinkAnnotation(
  pdf: PDFDocument,
  pageNode: PDFDict,
  rect: [number, number, number, number],
  targetRef: PDFRef,
): void {
  const linkDict = pdf.context.obj({
    Type: PDFName.of("Annot"),
    Subtype: PDFName.of("Link"),
    Rect: pdf.context.obj(rect),
    Border: pdf.context.obj([0, 0, 0]),
    Dest: pdf.context.obj([targetRef, PDFName.of("Fit")]),
  }) as PDFDict;
  const linkRef = pdf.context.register(linkDict);

  const existing = pageNode.lookup(PDFName.of("Annots"));
  if (existing instanceof PDFArray) existing.push(linkRef);
  else pageNode.set(PDFName.of("Annots"), pdf.context.obj([linkRef]));
}
