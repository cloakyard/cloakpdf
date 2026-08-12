// ExportModal.tsx — The editor's "Export" control: a button that opens a modal
// of output options, each driven off the LIVE document bytes. Replaces the old
// dropdown menu AND absorbs the whole-document "convert then download" tools
// (compress / grayscale / flatten / repair) that used to live on the tool rail
// — they're terminal outputs, not edit steps, so they belong with Export.
//
// One decision, then one button:
//   Format (pick one):  PDF · Images (.zip) · Contact sheet · Split (.zip)
//   Options (PDF only):  Compress (quality) · Grayscale · Flatten · Repair
//                        — independent switches, applied in a fixed, sensible
//                        order (flatten → grayscale → compress → repair) when
//                        you hit Download.
//
// Long-running ops run under the editor's busy overlay via `runTask` (no history
// commit — exports never mutate the working doc). The modal mirrors the app's
// dialog idiom (ChatModelPickerModal): portal, scroll-lock, Escape / backdrop
// dismiss, bottom-sheet on mobile / centered card on desktop.

import {
  Archive,
  Contrast,
  Download,
  FileCode2,
  FileText,
  FileX2,
  Image as ImageIcon,
  Layers,
  type LucideIcon,
  LayoutGrid,
  Scissors,
  Type,
  Wrench,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { ModalCloseButton, ModalSectionLabel, ModalShell } from "../components/ModalShell.tsx";
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
import { flattenDestructiveObjects, hasPendingDestructive } from "./doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "./EditorContext.tsx";
import { Switch } from "./panels/controls.tsx";
import { hasPendingPageChanges, ORGANIZE_ID } from "./panels/OrganizeTool.tsx";
import { Segmented } from "./panels/WholeDocPanel.tsx";

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
  { value: "images", icon: ImageIcon, label: "Images (.zip)", hint: "Each page as PNG" },
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

/** Selectable output-format card (single choice — radio semantics). */
function FormatCard({
  index,
  icon: Icon,
  label,
  hint,
  selected,
  onSelect,
  tabIndex,
  cardRef,
}: {
  index: number;
  icon: LucideIcon;
  label: string;
  hint: string;
  selected: boolean;
  onSelect: () => void;
  /** Roving tabindex: 0 for the checked radio, -1 for the rest, so the group
   *  is a single tab stop and arrow keys move between options. */
  tabIndex: number;
  cardRef: (el: HTMLButtonElement | null) => void;
}) {
  const descriptionId = `export-format-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-hint`;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      aria-describedby={descriptionId}
      tabIndex={tabIndex}
      ref={cardRef}
      data-dialog-initial-focus={selected ? "true" : undefined}
      onClick={onSelect}
      className={`relative grid min-h-[3.75rem] w-full grid-cols-[1.75rem_1.25rem_minmax(0,1fr)] items-center gap-2.5 px-3 py-2.5 text-left transition-colors active:translate-y-px focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-focus)] ${
        selected
          ? "bg-[var(--color-accent-soft)] shadow-[inset_2px_0_0_var(--color-accent)]"
          : "bg-[var(--color-surface)] hover:bg-[var(--color-paper)]"
      }`}
    >
      <span className="font-mono text-[9px] tabular-nums text-[var(--color-ink-3)]">
        {String(index + 1).padStart(2, "0")}
      </span>
      <Icon
        className={`h-4 w-4 ${selected ? "text-primary-600" : "text-[var(--color-ink-3)]"}`}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[var(--color-ink)]">{label}</span>
        <span id={descriptionId} className="block truncate text-xs text-[var(--color-ink-2)]">
          {hint}
        </span>
      </span>
    </button>
  );
}

/** A toggleable convert option: icon + label + hint + switch, with optional
 *  detail (e.g. compress quality) revealed below when the switch is on. */
function OptionRow({
  icon: Icon,
  label,
  hint,
  checked,
  onChange,
  children,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`transition-colors ${
        checked
          ? "bg-[var(--color-accent-soft)] shadow-[inset_2px_0_0_var(--color-accent)]"
          : "bg-[var(--color-surface)]"
      }`}
    >
      <div className="flex min-h-[3.75rem] items-center gap-3 px-3 py-2.5">
        <Icon className="h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-[var(--color-ink)]">{label}</span>
          <span className="block text-xs text-[var(--color-ink-2)]">{hint}</span>
        </span>
        <Switch checked={checked} onChange={onChange} label={label} />
      </div>
      {checked && children && (
        <div className="border-t border-[var(--color-rule)] bg-[var(--color-surface)] px-3 py-3">
          {children}
        </div>
      )}
    </div>
  );
}

export function ExportButton() {
  const { doc, busyLabel } = useEditorRead();
  const { runTask } = useEditorActions();
  const [open, setOpen] = useState(false);

  // Output selection + modifiers. Modifiers only apply to a PDF output.
  const [format, setFormat] = useState<Format>("pdf");
  const [compress, setCompress] = useState(false);
  const [quality, setQuality] = useState<Quality>("medium");
  const [grayscale, setGrayscale] = useState(false);
  const [flatten, setFlatten] = useState(false);
  const [repair, setRepair] = useState(false);
  const [stripMeta, setStripMeta] = useState(false);

  const busy = busyLabel !== null;

  // Roving-tabindex + arrow-key navigation for the format radiogroup, per the
  // WAI-ARIA radio pattern the role advertises: one tab stop into the group,
  // then Arrow/Home/End move selection. focus() is called only here (never on
  // the click path), so mouse selection is unaffected.
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const moveFormat = useCallback(
    (dir: 1 | -1 | "home" | "end") => {
      const i = FORMATS.findIndex((f) => f.value === format);
      const n = FORMATS.length;
      const next = dir === "home" ? 0 : dir === "end" ? n - 1 : (i + dir + n) % n;
      setFormat(FORMATS[next].value);
      cardRefs.current[next]?.focus();
    },
    [format],
  );

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

  const handleDownload = useCallback(() => {
    if (!doc) return;
    setOpen(false);

    if (format === "images") {
      void runTask("Rendering images…", async () => {
        const indices = Array.from({ length: doc.pageCount }, (_, i) => i);
        const rendered = await renderPagesToBlobs(
          await flattenedFile(),
          indices,
          IMAGE_DPI,
          "image/png",
        );
        if (rendered.length === 1) {
          downloadBlob(rendered[0].blob, `${baseName}.png`);
          return;
        }
        const { makeZip } = await import("../utils/zip.ts");
        const zipBlob = await makeZip(
          rendered.map(({ pageIndex, blob }) => ({
            name: `${baseName}_p${String(pageIndex + 1).padStart(3, "0")}.png`,
            data: blob,
          })),
        );
        downloadBlob(zipBlob, `${baseName}_images.zip`);
      });
      return;
    }

    if (format === "contact") {
      void runTask("Building contact sheet…", async () => {
        const bytes = await nupPages(await flattenedFile(), "3x3");
        downloadPdf(bytes, pdfFilename(doc.fileName, "_contact-sheet"));
      });
      return;
    }

    if (format === "split") {
      void runTask("Splitting pages…", async () => {
        const parts = Array.from({ length: doc.pageCount }, (_, i) => [i]);
        const pdfs = await splitPdfIntoParts(await flattenedFile(), parts);
        const { makeZip } = await import("../utils/zip.ts");
        const zipBlob = await makeZip(
          pdfs.map((bytes, i) => ({
            name: `${baseName}_p${String(i + 1).padStart(3, "0")}.pdf`,
            data: bytes,
          })),
        );
        downloadBlob(zipBlob, `${baseName}_pages.zip`);
      });
      return;
    }

    // Text / Markdown — reconstruct the document on-device, then serialise.
    // Markdown uses liteparse's native renderer (real heading levels, lists,
    // [text](url) links); text uses the column-aware reading-order reflow. Both
    // OCR scanned pages with Tesseract. The wasm + OCR engine stay lazy inside
    // the extractors, so importing them costs nothing until used. Extracts from
    // the FLATTENED bytes so any pending redaction is gone first.
    if (format === "text" || format === "markdown") {
      const isMd = format === "markdown";
      void runTask(isMd ? "Building Markdown…" : "Extracting text…", async (setLabel) => {
        // Scanned pages run on-device OCR (one-time engine download) which can
        // take many seconds; surface determinate progress in the overlay so a
        // long extraction doesn't read as a hang. Wording matches OcrTool so the
        // two surfaces read identically. Digital PDFs skip OCR and keep the
        // static "Building Markdown…" / "Extracting text…" label.
        const onOcrPage = (done: number, total: number) =>
          setLabel(`Recognising page ${done} / ${total}…`);
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
      });
      return;
    }

    // PDF — fast path when no modifiers are on AND nothing to burn in.
    if (!(compress || grayscale || flatten || repair || stripMeta)) {
      if (!hasPendingDestructive(doc)) {
        downloadPdf(doc.bytes, pdfFilename(doc.fileName, "_edited"));
        return;
      }
      void runTask("Exporting…", async () => {
        const bytes = await flattenDestructiveObjects(doc);
        downloadPdf(bytes, pdfFilename(doc.fileName, "_edited"));
      });
      return;
    }
    void runTask("Exporting…", async () => {
      const { bytes, suffix } = await buildPdf();
      downloadPdf(bytes, pdfFilename(doc.fileName, suffix));
    });
  }, [
    doc,
    format,
    compress,
    grayscale,
    flatten,
    repair,
    stripMeta,
    baseName,
    runTask,
    buildPdf,
    flattenedFile,
  ]);

  const isPdf = format === "pdf";
  const isText = format === "text" || format === "markdown";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!doc || busy}
        aria-haspopup="dialog"
        aria-label="Export"
        className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3.5 py-2 font-mono text-xs font-semibold text-[var(--color-accent-ink)] hover:bg-primary-700 active:translate-y-px pointer-coarse:min-h-11 disabled:cursor-not-allowed disabled:opacity-40 transition-[color,background-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Export</span>
      </button>

      <ModalShell
        open={open}
        onClose={() => setOpen(false)}
        labelledBy="export-dialog-title"
        describedBy="export-dialog-description"
        panelClassName="max-h-[90svh] sm:max-h-[min(700px,calc(100svh-64px))] sm:w-[min(560px,100%)]"
        testId="export-dialog"
      >
        <header className="cloak-dialog__header">
          <div className="min-w-0 flex-1">
            <p className="cloak-dialog__eyebrow">Output / local execution</p>
            <h2 id="export-dialog-title" className="cloak-dialog__title">
              Export document
            </h2>
            <p id="export-dialog-description" className="cloak-dialog__description truncate">
              {doc
                ? `${doc.fileName} · ${doc.pageCount} ${doc.pageCount === 1 ? "page" : "pages"}`
                : "Choose an output format and download it directly."}
            </p>
          </div>
          <ModalCloseButton onClick={() => setOpen(false)} label="Close export" />
        </header>

        <div className="cloak-dialog__body thin-scrollbar flex flex-col gap-4">
          {pendingMarks > 0 && (
            <div className="cloak-notice cloak-notice--warning text-xs" role="note">
              <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                {pendingMarks} redaction/erase mark{pendingMarks === 1 ? "" : "s"} will be
                permanently burned into the pages on export.
              </span>
            </div>
          )}
          {pendingPageChanges && (
            <div className="cloak-notice cloak-notice--warning text-xs" role="alert">
              <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                You have unapplied page changes (rotate / reorder / delete). Close this and hit{" "}
                <strong>Apply changes</strong> in Organize first, or they won't be in the download.
              </span>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <ModalSectionLabel trailing={`${FORMATS.length} outputs`}>Format</ModalSectionLabel>
            <div
              role="radiogroup"
              aria-label="Export format"
              className="cloak-ledger cloak-export-format-grid"
              onKeyDown={(e) => {
                switch (e.key) {
                  case "ArrowDown":
                  case "ArrowRight":
                    e.preventDefault();
                    moveFormat(1);
                    break;
                  case "ArrowUp":
                  case "ArrowLeft":
                    e.preventDefault();
                    moveFormat(-1);
                    break;
                  case "Home":
                    e.preventDefault();
                    moveFormat("home");
                    break;
                  case "End":
                    e.preventDefault();
                    moveFormat("end");
                    break;
                }
              }}
            >
              {FORMATS.map((f, i) => (
                <FormatCard
                  key={f.value}
                  index={i}
                  icon={f.icon}
                  label={f.label}
                  hint={f.hint}
                  selected={format === f.value}
                  onSelect={() => setFormat(f.value)}
                  tabIndex={format === f.value ? 0 : -1}
                  cardRef={(el) => {
                    cardRefs.current[i] = el;
                  }}
                />
              ))}
            </div>
          </div>

          {isText && (
            <p className="-mt-1 px-0.5 text-xs leading-relaxed text-[var(--color-ink-2)]">
              {format === "markdown"
                ? "Headings, lists, and links are detected on-device. "
                : "Reading order is reconstructed on-device. "}
              Scanned pages are read with OCR (one-time engine download) — nothing leaves your
              browser.
            </p>
          )}

          {isPdf && (
            <div className="flex flex-col gap-2">
              <ModalSectionLabel trailing="Optional / PDF only">Options</ModalSectionLabel>
              <div className="cloak-ledger">
                <OptionRow
                  icon={Archive}
                  label="Compress"
                  hint="Shrink smartly — keep text, re-render image pages"
                  checked={compress}
                  onChange={setCompress}
                >
                  <Segmented
                    value={quality}
                    onChange={setQuality}
                    options={[
                      { value: "low", label: "Light", sub: "Sharp" },
                      { value: "medium", label: "Balanced" },
                      { value: "high", label: "Max", sub: "Smallest" },
                    ]}
                  />
                  <p className="mt-2 text-xs text-[var(--color-ink-2)]">{COMPRESS_INFO[quality]}</p>
                </OptionRow>
                <OptionRow
                  icon={Contrast}
                  label="Grayscale"
                  hint="Remove all colour"
                  checked={grayscale}
                  onChange={setGrayscale}
                />
                <OptionRow
                  icon={Layers}
                  label="Flatten"
                  hint="Bake in forms & annotations"
                  checked={flatten}
                  onChange={setFlatten}
                />
                <OptionRow
                  icon={Wrench}
                  label="Repair"
                  hint="Rebuild the file structure"
                  checked={repair}
                  onChange={setRepair}
                />
                <OptionRow
                  icon={FileX2}
                  label="Strip metadata"
                  hint="Remove title, author, dates & XMP"
                  checked={stripMeta}
                  onChange={setStripMeta}
                />
              </div>
            </div>
          )}
        </div>

        <footer className="cloak-dialog__footer sm:justify-between">
          <div className="hidden min-w-0 sm:block">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-[var(--color-ink-3)]">
              Local output
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-ink-2)]">Nothing is uploaded</p>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!doc || busy}
            className="cloak-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary-600 px-5 py-2.5 font-mono text-xs font-semibold text-[var(--color-accent-ink)] transition-[color,background-color,transform] hover:bg-primary-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download
          </button>
        </footer>
      </ModalShell>
    </>
  );
}
