// Export choices transform private document bytes; the working document and history stay intact.
import {
  AlertTriangle,
  Download,
  FileCode2,
  FileText,
  Image as ImageIcon,
  type LucideIcon,
  LayoutGrid,
  Scissors,
  Type,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { ModalCloseButton, ModalShell } from "../components/ModalShell.tsx";
import { downloadBlob, downloadPdf, pdfFilename } from "../utils/file-helpers.ts";
import { extractLayout, extractMarkdown, layoutToPlainText } from "../utils/layout-extract.ts";
import {
  compressPdf,
  flattenPdf,
  grayscalePdf,
  nupPages,
  repairPdf,
  splitPdfIntoParts,
  stripMetadata,
} from "../utils/pdf-operations.ts";
import { renderPagesToBlobs } from "../utils/pdf-renderer.ts";
import { flattenDestructiveObjects } from "./doc.ts";
import { useEditorRead, useToolSlice } from "./EditorContext.tsx";
import { hasPendingPageChanges, ORGANIZE_ID } from "./panels/OrganizeTool.tsx";

const IMAGE_DPI = 150;

type Quality = "low" | "medium" | "high";
type Format = "pdf" | "images" | "contact" | "split" | "text" | "markdown";

// Compression is smart per-page: light text/vector pages are kept lossless
// (text stays selectable), and scanned / image-heavy pages are re-rendered only
// when that's actually smaller — so the level below controls those pages' detail.
const COMPRESS_INFO: Record<Quality, string> = {
  low: "Text pages kept sharp & selectable; image pages at high detail (2×, JPEG 82%).",
  medium: "Text pages kept selectable; image pages balanced (1.5×, JPEG 68%).",
  high: "Text pages kept selectable; image pages smallest & softest (1×, JPEG 50%).",
};

const FORMATS: { value: Format; icon: LucideIcon; label: string; hint: string }[] = [
  { value: "pdf", icon: FileText, label: "PDF", hint: "The edited document" },
  { value: "images", icon: ImageIcon, label: "Images", hint: "PNG pages; ZIP for multiple" },
  { value: "contact", icon: LayoutGrid, label: "Contact sheet", hint: "3×3 overview PDF" },
  { value: "split", icon: Scissors, label: "Split pages (.zip)", hint: "One PDF per page" },
  { value: "text", icon: Type, label: "Text (.txt)", hint: "Reading-order plain text" },
  {
    value: "markdown",
    icon: FileCode2,
    label: "Markdown (.md)",
    hint: "Headings, lists & links",
  },
];

/** One labelled native switch; PDF transforms remain independent choices. */
function OptionRow({
  label,
  hint,
  checked,
  onChange,
  children,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  children?: React.ReactNode;
}) {
  const id = `export-${label.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <div>
      <label className="air-switch-row pdf-export-option">
        <span>
          <span>{label}</span>
          <small id={`${id}-hint`}>{hint}</small>
        </span>
        <input
          type="checkbox"
          role="switch"
          className="air-switch"
          aria-label={label}
          aria-describedby={`${id}-hint`}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
      </label>
      {checked && children}
    </div>
  );
}

export function ExportButton() {
  const { doc, busyLabel } = useEditorRead();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);

  // Output selection + modifiers. Modifiers only apply to a PDF output.
  const [format, setFormat] = useState<Format>("pdf");
  const [compress, setCompress] = useState(false);
  const [quality, setQuality] = useState<Quality>("medium");
  const [grayscale, setGrayscale] = useState(false);
  const [flatten, setFlatten] = useState(false);
  const [repair, setRepair] = useState(false);
  const [stripMeta, setStripMeta] = useState(false);

  const busy = phase !== null;
  const close = () => {
    if (!running.current) setOpen(false);
  };

  const baseName = doc ? doc.fileName.replace(/\.pdf$/i, "") : "document";
  // Pending redaction / erase marks are flattened into the bytes at export — so
  // every output path starts from the burned document, never the live bytes
  // (which still hold the original text). Surfaced as a note in the modal too.
  const pendingMarks = doc
    ? doc.objects.filter((o) => o.kind === "redaction" || o.kind === "erase").length
    : 0;
  // Unapplied Organize changes (rotate / reorder / delete) live in tool state,
  // not the bytes — export builds from the committed bytes, so without an "Apply
  // changes" they'd be silently dropped from the download. Warn so they aren't.
  const organizeSlice = useToolSlice(ORGANIZE_ID);
  const pendingPageChanges = hasPendingPageChanges(organizeSlice);

  // The document with every destructive mark burned in, wrapped as a File for
  // the writers. The single source of bytes for every export format.
  const flattenedFile = useCallback(async (): Promise<File> => {
    if (!doc) throw new Error("No document");
    const bytes = await flattenDestructiveObjects(doc);
    // slice(0): hand the writer a private copy so its PDF.js worker can detach
    // the buffer without corrupting the doc's canonical bytes (flatten returns
    // doc.bytes verbatim when there's nothing to burn).
    return new File([bytes.slice(0) as Uint8Array<ArrayBuffer>], doc.fileName, {
      type: "application/pdf",
    });
  }, [doc]);

  // Build the final PDF by applying the enabled modifiers in a fixed order:
  // flatten (bake vectors) → grayscale → compress (rasterise) → repair (clean up).
  // Each op takes a File and returns bytes, so we re-wrap between steps.
  const buildPdf = useCallback(async (): Promise<{ bytes: Uint8Array; suffix: string }> => {
    if (!doc) throw new Error("No document");
    const tags: string[] = [];
    let bytes = await flattenDestructiveObjects(doc);
    // Private copy (slice) so the first modifier's PDF.js worker can't detach
    // the doc's canonical bytes — flatten returns them verbatim when empty.
    let file = new File([bytes.slice(0) as Uint8Array<ArrayBuffer>], doc.fileName, {
      type: "application/pdf",
    });
    const next = (b: Uint8Array) => {
      bytes = b;
      file = new File([b as Uint8Array<ArrayBuffer>], doc.fileName, { type: "application/pdf" });
    };
    if (flatten) {
      next(await flattenPdf(file));
      tags.push("flattened");
    }
    if (grayscale) {
      next(await grayscalePdf(file));
      tags.push("grayscale");
    }
    if (compress) {
      next(await compressPdf(file, quality));
      tags.push("compressed");
    }
    if (repair) {
      next(await repairPdf(file));
      tags.push("repaired");
    }
    // Strip last so it also clears any metadata the rasterising / rebuild steps
    // (compress, grayscale, repair) may have stamped on the way out.
    if (stripMeta) {
      next(await stripMetadata(file));
      tags.push("no-metadata");
    }
    return { bytes, suffix: tags.length ? `_${tags.join("-")}` : "_edited" };
  }, [doc, flatten, grayscale, compress, repair, stripMeta, quality]);

  // Export owns its progress/error state. The modal protects the working doc;
  // transforms receive private bytes and never create editor history entries.
  const handleDownload = async () => {
    if (!doc || running.current || busyLabel !== null) return;
    running.current = true;
    setError(null);
    setPhase("Preparing your download…");
    try {
      if (format === "images") {
        setPhase("Rendering PNG pages…");
        const indices = Array.from({ length: doc.pageCount }, (_, i) => i);
        const rendered = await renderPagesToBlobs(
          await flattenedFile(),
          indices,
          IMAGE_DPI,
          "image/png",
        );
        if (rendered.length === 1) {
          downloadBlob(rendered[0].blob, `${baseName}.png`);
        } else {
          const { makeZip } = await import("../utils/zip.ts");
          const zip = await makeZip(
            rendered.map(({ pageIndex, blob }) => ({
              name: `${baseName}_p${String(pageIndex + 1).padStart(3, "0")}.png`,
              data: blob,
            })),
          );
          downloadBlob(zip, `${baseName}_images.zip`);
        }
      } else if (format === "contact") {
        setPhase("Building contact sheet…");
        downloadPdf(
          await nupPages(await flattenedFile(), "3x3"),
          pdfFilename(doc.fileName, "_contact-sheet"),
        );
      } else if (format === "split") {
        setPhase("Splitting pages…");
        const parts = Array.from({ length: doc.pageCount }, (_, i) => [i]);
        const pdfs = await splitPdfIntoParts(await flattenedFile(), parts);
        const { makeZip } = await import("../utils/zip.ts");
        const zip = await makeZip(
          pdfs.map((bytes, i) => ({
            name: `${baseName}_p${String(i + 1).padStart(3, "0")}.pdf`,
            data: bytes,
          })),
        );
        downloadBlob(zip, `${baseName}_pages.zip`);
      } else if (format === "text" || format === "markdown") {
        const isMd = format === "markdown";
        setPhase(isMd ? "Building Markdown…" : "Extracting text…");
        const onOcrPage = (done: number, total: number) =>
          setPhase(`Recognising page ${done} / ${total}…`);
        const file = await flattenedFile();
        const content = isMd
          ? await extractMarkdown(file, { onOcrPage })
          : layoutToPlainText(await extractLayout(file, { onOcrPage }));
        downloadBlob(
          new Blob([content], {
            type: isMd ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8",
          }),
          `${baseName}.${isMd ? "md" : "txt"}`,
        );
      } else {
        const { bytes, suffix } = await buildPdf();
        downloadPdf(bytes, pdfFilename(doc.fileName, suffix));
      }
      setOpen(false);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The download could not be prepared. Please try again.",
      );
    } finally {
      running.current = false;
      setPhase(null);
    }
  };

  const isPdf = format === "pdf";
  const isText = format === "text" || format === "markdown";

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.currentTarget.focus();
          setError(null);
          setOpen(true);
        }}
        disabled={!doc || busyLabel !== null || busy}
        aria-haspopup="dialog"
        aria-label="Export"
        className="air-button air-button--primary pdf-export-trigger"
      >
        <Download size={18} strokeWidth={1.6} aria-hidden="true" />
        <span>Export</span>
      </button>
      <ModalShell
        open={open}
        onClose={close}
        dismissOnBackdrop={!busy}
        dismissOnEscape={!busy}
        labelledBy="export-dialog-title"
        describedBy="export-dialog-description"
        testId="export-dialog"
      >
        <header className="pdf-dialog__header">
          <div className="min-w-0 flex-1">
            <h2 id="export-dialog-title" className="pdf-dialog__title">
              Export document
            </h2>
            <p id="export-dialog-description" className="pdf-dialog__description">
              {doc
                ? `${doc.fileName} · ${doc.pageCount} ${doc.pageCount === 1 ? "page" : "pages"}`
                : "Choose a format for your download."}
            </p>
          </div>
          <ModalCloseButton onClick={close} label="Close export" disabled={busy} />
        </header>
        <div className="pdf-dialog__body pdf-export-body">
          {pendingMarks > 0 && (
            <div className="air-notice air-notice--warning" role="note">
              <AlertTriangle size={18} strokeWidth={1.6} aria-hidden="true" />
              <p>
                {pendingMarks} redaction/erase mark{pendingMarks === 1 ? "" : "s"} will be
                permanently burned into the pages on export. Marked pages become images, lose
                selectable text and may increase the file size.
              </p>
            </div>
          )}
          {pendingPageChanges && (
            <div className="air-notice air-notice--warning" role="alert">
              <AlertTriangle size={18} strokeWidth={1.6} aria-hidden="true" />
              <p>
                You have unapplied page changes (rotate / reorder / delete). Close this and choose{" "}
                <strong>Apply changes</strong> in Organize first, or they won't be in the download.
              </p>
            </div>
          )}
          <fieldset className="air-choice-group" disabled={busy}>
            <legend>Export format</legend>
            <div
              className="pdf-export-formats"
              onKeyDown={(event) => {
                // Native radios own arrows/Space; preserve the existing Home/End shortcuts.
                if (event.key !== "Home" && event.key !== "End") return;
                event.preventDefault();
                const inputs = event.currentTarget.querySelectorAll<HTMLInputElement>("input");
                const input = inputs[event.key === "Home" ? 0 : inputs.length - 1];
                input?.focus();
                input?.click();
              }}
            >
              {FORMATS.map(({ value, icon: Icon, label, hint }) => (
                <label key={value} className="air-check-label pdf-export-format">
                  <input
                    type="radio"
                    name="export-format"
                    value={value}
                    className="air-check"
                    aria-label={label}
                    aria-describedby={`export-${value}-hint`}
                    checked={format === value}
                    onChange={() => {
                      setFormat(value);
                      setError(null);
                    }}
                    data-dialog-initial-focus={format === value ? "true" : undefined}
                  />
                  <span>
                    <span className="pdf-export-format-title">
                      <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
                      {label}
                    </span>
                    <small id={`export-${value}-hint`}>{hint}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {isText && (
            <p className="air-help">
              {format === "markdown"
                ? "Headings, lists and links are detected on-device. "
                : "Reading order is reconstructed on-device. "}
              Scanned pages use OCR, which may need a one-time engine download. Your document stays
              here.
            </p>
          )}
          {format === "images" && (
            <p className="air-help">
              PNG images at {IMAGE_DPI} DPI. One page downloads as a PNG; multiple pages download
              together in a ZIP.
            </p>
          )}
          {isPdf && (
            <fieldset className="air-choice-group pdf-export-options" disabled={busy}>
              <legend>
                PDF options <span className="pdf-export-optional">Optional</span>
              </legend>
              <OptionRow
                label="Compress"
                hint="Keep text sharp; reduce image size where possible"
                checked={compress}
                onChange={setCompress}
              >
                <fieldset
                  className="air-choice-group pdf-export-quality"
                  aria-describedby="export-quality-hint"
                >
                  <legend>Compression</legend>
                  <div className="air-segments">
                    {(
                      [
                        { value: "low", label: "Light" },
                        { value: "medium", label: "Balanced" },
                        { value: "high", label: "Maximum" },
                      ] as const
                    ).map((item) => (
                      <label key={item.value} className="air-segment">
                        <input
                          type="radio"
                          name="export-quality"
                          value={item.value}
                          checked={quality === item.value}
                          onChange={() => setQuality(item.value)}
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                  <p id="export-quality-hint" className="air-help">
                    {COMPRESS_INFO[quality]}
                  </p>
                </fieldset>
              </OptionRow>
              <OptionRow
                label="Grayscale"
                hint="Remove all colour"
                checked={grayscale}
                onChange={setGrayscale}
              />
              <OptionRow
                label="Flatten"
                hint="Bake in forms and annotations"
                checked={flatten}
                onChange={setFlatten}
              />
              <OptionRow
                label="Repair"
                hint="Rebuild the file structure"
                checked={repair}
                onChange={setRepair}
              />
              <OptionRow
                label="Strip metadata"
                hint="Remove title, author, dates and XMP"
                checked={stripMeta}
                onChange={setStripMeta}
              />
            </fieldset>
          )}
        </div>
        <footer className="pdf-dialog__footer pdf-export-footer">
          <div className="pdf-export-feedback" role="status" aria-live="polite" aria-atomic="true">
            {error ? (
              <div className="air-notice air-notice--error">
                <AlertTriangle size={18} strokeWidth={1.6} aria-hidden="true" />
                <p>
                  <strong>Couldn’t prepare the download.</strong> {error} Your document and options
                  are unchanged. Try again.
                </p>
              </div>
            ) : (
              <p>
                {phase ?? "Your document stays on this device."}
                {busy && " Keep this window open while it finishes."}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={!doc}
            aria-disabled={busy}
            aria-busy={busy}
            className="air-button air-button--primary"
            data-export-download
          >
            <Download size={18} strokeWidth={1.6} aria-hidden="true" />
            <span className="air-action-labels">
              {["Download", "Preparing…", "Retry download"].map((label) => {
                const active =
                  label === (busy ? "Preparing…" : error ? "Retry download" : "Download");
                return (
                  <span key={label} data-active={active ? "" : undefined} aria-hidden={!active}>
                    {label}
                  </span>
                );
              })}
            </span>
          </button>
        </footer>
      </ModalShell>
    </>
  );
}
