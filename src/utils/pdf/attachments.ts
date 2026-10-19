/** Embedded files, with identity independent of their displayed filenames. */
import {
  PDFDocument,
  PDFDict,
  PDFArray,
  PDFName,
  PDFRawStream,
  PDFRef,
  PDFString,
  PDFHexString,
  PDFObject,
  PDFStream,
  FileEmbedder,
  decodePDFRawStream,
} from "@pdfme/pdf-lib";

export interface PdfAttachment {
  /** Valid only for the byte revision that was listed. Duplicate names stay distinct. */
  id: string;
  name: string;
  size: number;
  mimeType: string;
  data: Uint8Array;
}

type Entry = { id: string; key: PDFString | PDFHexString; value: PDFObject; spec: PDFDict };
const name = PDFName.of;
const text = (v: unknown) =>
  v instanceof PDFString || v instanceof PDFHexString ? v.decodeText() : undefined;
const invalid = () =>
  new Error("This PDF has an unreadable attachment tree. No files were changed.");

function readTree(pdf: PDFDocument) {
  const entries: Entry[] = [];
  const retired = new Set<PDFRef>();
  const names = pdf.catalog.lookup(name("Names"));
  if (names !== undefined && !(names instanceof PDFDict)) throw invalid();
  const root = names?.get(name("EmbeddedFiles"));
  const seen = new Set<PDFObject>();
  const resolve = (object: PDFObject) => {
    if (object instanceof PDFRef) retired.add(object);
    return pdf.context.lookup(object);
  };
  const visit = (object: PDFObject, path: string) => {
    const node = resolve(object);
    if (!(node instanceof PDFDict) || seen.has(node)) throw invalid();
    seen.add(node);
    const values = node.get(name("Names"));
    const children = node.get(name("Kids"));
    if (values && children) throw invalid();
    if (values) {
      const array = resolve(values);
      if (!(array instanceof PDFArray) || array.size() % 2) throw invalid();
      for (let i = 0; i < array.size(); i += 2) {
        const key = array.lookup(i);
        const spec = array.lookup(i + 1);
        if (
          !(key instanceof PDFString || key instanceof PDFHexString) ||
          !(spec instanceof PDFDict)
        )
          throw invalid();
        const value = array.get(i + 1);
        entries.push({
          id: `${path}:${i / 2}:${value instanceof PDFRef ? value.tag : key.toString()}`,
          key,
          value,
          spec,
        });
      }
    } else if (children) {
      const kids = resolve(children);
      if (!(kids instanceof PDFArray)) throw invalid();
      for (let i = 0; i < kids.size(); i++) visit(kids.get(i), `${path}.${i}`);
    } else throw invalid();
  };
  if (root) visit(root, "root");
  return { entries, retired, names };
}

function attachment(entry: Entry): PdfAttachment {
  const ef = entry.spec.lookup(name("EF"));
  if (!(ef instanceof PDFDict)) throw invalid();
  const stream = ef.lookup(name("UF")) ?? ef.lookup(name("F"));
  if (!(stream instanceof PDFRawStream)) throw invalid();
  const data = decodePDFRawStream(stream).decode();
  const subtype = stream.dict.lookup(name("Subtype"));
  return {
    id: entry.id,
    name:
      text(entry.spec.lookup(name("UF"))) ??
      text(entry.spec.lookup(name("F"))) ??
      entry.key.decodeText(),
    size: data.length,
    mimeType: subtype instanceof PDFName ? subtype.decodeText() : "application/octet-stream",
    data,
  };
}

export async function listPdfAttachments(file: File): Promise<PdfAttachment[]> {
  const pdf = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
  return readTree(pdf).entries.map(attachment);
}

/** Visit the live object graph, following indirect and direct containers once. */
function walk(pdf: PDFDocument, inspect?: (object: PDFDict) => void) {
  const seen = new Set<PDFObject>();
  const pending = Object.values(pdf.context.trailerInfo).filter((v): v is PDFObject => !!v);
  while (pending.length) {
    const object = pending.pop()!;
    if (seen.has(object)) continue;
    seen.add(object);
    if (object instanceof PDFRef) {
      const resolved = pdf.context.lookup(object);
      if (resolved) pending.push(resolved);
    } else if (object instanceof PDFDict) {
      inspect?.(object);
      pending.push(...object.values());
    } else if (object instanceof PDFArray) pending.push(...object.asArray());
    else if (object instanceof PDFStream) pending.push(object.dict);
  }
  return seen;
}

function writeTree(pdf: PDFDocument, tree: ReturnType<typeof readTree>, entries: Entry[]) {
  const names = tree.names ?? pdf.context.obj({});
  pdf.catalog.set(name("Names"), names);
  if (entries.length) {
    // PDF name-tree keys sort by their encoded bytes, not locale or displayed /UF.
    entries.sort((a, b) => {
      const x = a.key.asBytes(),
        y = b.key.asBytes();
      for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] !== y[i]) return x[i] - y[i];
      return x.length - y.length;
    });
    names.set(
      name("EmbeddedFiles"),
      pdf.context.obj({ Names: entries.flatMap((e) => [e.key, e.value]) }),
    );
  } else names.delete(name("EmbeddedFiles"));
}

function deleteUnused(pdf: PDFDocument, candidates: Set<PDFRef>, live = walk(pdf)) {
  for (const ref of candidates) if (!live.has(ref)) pdf.context.delete(ref);
}

export async function attachFilesToPdf(file: File, files: File[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
  const tree = readTree(pdf);
  const keys = new Set(tree.entries.map((e) => e.key.decodeText()));
  for (const file of files) {
    let key = file.name;
    for (let suffix = 2; keys.has(key); suffix++) key = `${file.name} (${suffix})`;
    keys.add(key);
    const ref = await FileEmbedder.for(new Uint8Array(await file.arrayBuffer()), file.name, {
      mimeType: file.type || "application/octet-stream",
      creationDate: new Date(),
      modificationDate: new Date(),
    }).embedIntoContext(pdf.context);
    tree.entries.push({
      id: "",
      key: PDFHexString.fromText(key),
      value: ref,
      spec: pdf.context.lookup(ref, PDFDict),
    });
    let af = pdf.catalog.lookup(name("AF"));
    if (af === undefined) {
      af = pdf.context.obj([]);
      pdf.catalog.set(name("AF"), af);
    }
    if (!(af instanceof PDFArray)) throw invalid();
    af.push(ref);
  }
  writeTree(pdf, tree, tree.entries);
  deleteUnused(pdf, tree.retired);
  return pdf.save();
}

/** Remove exact listed identities, including their standard associated-file references. */
export async function removeAttachmentsFromPdf(file: File, ids: Set<string>): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
  const tree = readTree(pdf);
  if ([...ids].some((id) => !tree.entries.some((e) => e.id === id)))
    throw new Error("Attachments changed. Read the list again before removing a file.");
  const kept = tree.entries.filter((e) => !ids.has(e.id));
  const removed = new Set(
    tree.entries
      .filter((e) => ids.has(e.id) && !kept.some((k) => k.spec === e.spec))
      .map((e) => e.spec),
  );
  for (const entry of tree.entries) {
    if (!removed.has(entry.spec)) continue;
    if (entry.value instanceof PDFRef) tree.retired.add(entry.value);
    const efRef = entry.spec.get(name("EF"));
    if (efRef instanceof PDFRef) tree.retired.add(efRef);
    const ef = entry.spec.lookup(name("EF"));
    if (ef instanceof PDFDict)
      for (const ref of ef.values()) if (ref instanceof PDFRef) tree.retired.add(ref);
  }
  writeTree(pdf, tree, kept);
  walk(pdf, (dict) => {
    for (const key of ["AF", "Annots"]) {
      const array = dict.lookup(name(key));
      if (!(array instanceof PDFArray)) continue;
      for (let i = array.size() - 1; i >= 0; i--) {
        const value = array.lookup(i);
        const spec =
          key === "AF"
            ? value
            : value instanceof PDFDict && value.lookup(name("Subtype")) === name("FileAttachment")
              ? value.lookup(name("FS"))
              : undefined;
        if (spec instanceof PDFDict && removed.has(spec)) {
          const ref = array.get(i);
          if (key === "Annots" && ref instanceof PDFRef) tree.retired.add(ref);
          array.remove(i);
        }
      }
      if (!array.size()) dict.delete(name(key));
    }
  });
  const remaining = walk(pdf);
  if ([...removed].some((spec) => remaining.has(spec))) {
    throw new Error(
      "This file has another attachment reference that cannot be removed safely. Your PDF is unchanged.",
    );
  }
  // Shared streams remain alive; unshared bytes and obsolete tree objects do not
  // survive merely because pdf-lib serializes unreachable indirect objects.
  deleteUnused(pdf, tree.retired, remaining);
  return pdf.save();
}
