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
  Check,
  Contrast,
  Download,
  FileCode2,
  FileText,
  FileX2,
  Hash,
  Image as ImageIcon,
  Layers,
  type LucideIcon,
  LayoutGrid,
  Scissors,
  Type,
  Wrench,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusTrap } from "../utils/useFocusTrap";
import { createPortal } from "react-dom";
import { AnimatePresence, m, variants } from "../components/motion.tsx";
import { downloadBlob, downloadPdf, pdfFilename } from "../utils/file-helpers.ts";
import { extractLayout, layoutToMarkdown, layoutToPlainText } from "../utils/layout-extract.ts";
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
import { useEditorActions, useEditorRead } from "./EditorContext.tsx";
import { Segmented } from "./panels/WholeDocPanel.tsx";

const IMAGE_DPI = 150;

type Quality = "low" | "medium" | "high";
type Format = "pdf" | "images" | "contact" | "split" | "text" | "markdown";

const COMPRESS_INFO: Record<Quality, string> = {
  low: "Sharpest pages, modest size drop (1× render, JPEG 85%).",
  medium: "Balanced size vs quality — suits most documents (1.5× render, JPEG 70%).",
  high: "Smallest file, softest pages (2× render, JPEG 50%).",
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
    hint: "Headings + text, on-device",
  },
];

/** Selectable output-format card (single choice — radio semantics). */
function FormatCard({
  icon: Icon,
  label,
  hint,
  selected,
  onSelect,
  tabIndex,
  cardRef,
}: {
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
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      tabIndex={tabIndex}
      ref={cardRef}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-[color,background-color,border-color,transform] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
        selected
          ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500 dark:border-primary-500 dark:bg-primary-900/20"
          : "border-slate-200 bg-white hover:border-primary-300 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-surface dark:hover:border-primary-700 dark:hover:bg-dark-surface-alt"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          selected
            ? "bg-primary-600 text-white"
            : "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-800 dark:text-dark-text">
          {label}
        </span>
        <span className="block truncate text-xs text-slate-500 dark:text-dark-text-muted">
          {hint}
        </span>
      </span>
      {selected && <Check className="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />}
    </button>
  );
}

/** Accessible on/off switch. */
function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-[color,background-color,transform] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
        checked ? "bg-primary-600" : "bg-slate-300 dark:bg-dark-border"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
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
      className={`rounded-xl border transition-colors ${
        checked
          ? "border-primary-300 bg-primary-50/40 dark:border-primary-700 dark:bg-primary-900/10"
          : "border-slate-200 bg-white dark:border-dark-border dark:bg-dark-surface"
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-800 dark:text-dark-text">
            {label}
          </span>
          <span className="block text-xs text-slate-500 dark:text-dark-text-muted">{hint}</span>
        </span>
        <Switch checked={checked} onChange={onChange} label={label} />
      </div>
      {checked && children && (
        <div className="border-t border-slate-200/70 px-3 py-3 dark:border-dark-border">
          {children}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-0.5 text-xxs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-dark-text-muted">
      {children}
    </p>
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
  // Markdown export: infer headings from font-size bands (off → plain paragraphs).
  const [mdHeadings, setMdHeadings] = useState(true);

  const busy = busyLabel !== null;
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  // Trap Tab within the dialog + restore focus to the Export trigger on close.
  useFocusTrap(dialogRef, open);

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

  // Scroll-lock + Escape while open. Mirrors the app's modal idiom.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const baseName = doc ? doc.fileName.replace(/\.pdf$/i, "") : "document";
  // Pending redaction / erase marks are flattened into the bytes at export — so
  // every output path starts from the burned document, never the live bytes
  // (which still hold the original text). Surfaced as a note in the modal too.
  const pendingMarks = doc
    ? doc.objects.filter((o) => o.kind === "redaction" || o.kind === "erase").length
    : 0;

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
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        for (const { pageIndex, blob } of rendered) {
          zip.file(`${baseName}_p${String(pageIndex + 1).padStart(3, "0")}.png`, blob);
        }
        downloadBlob(await zip.generateAsync({ type: "blob" }), `${baseName}_images.zip`);
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
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        pdfs.forEach((bytes, i) => {
          zip.file(`${baseName}_p${String(i + 1).padStart(3, "0")}.pdf`, bytes);
        });
        downloadBlob(await zip.generateAsync({ type: "blob" }), `${baseName}_pages.zip`);
      });
      return;
    }

    // Text / Markdown — reconstruct reading-order text on-device (liteparse +
    // Tesseract for scanned pages), then serialise. The wasm + OCR engine stay
    // lazy inside extractLayout, so importing it costs nothing until used.
    // Extracts from the FLATTENED bytes so any pending redaction is gone first.
    if (format === "text" || format === "markdown") {
      const isMd = format === "markdown";
      void runTask(isMd ? "Building Markdown…" : "Extracting text…", async (setLabel) => {
        // Scanned pages run on-device OCR (one-time engine download) which can
        // take many seconds; surface determinate progress in the overlay so a
        // long extraction doesn't read as a hang. Wording matches OcrTool so the
        // two surfaces read identically. Digital PDFs skip OCR and keep the
        // static "Extracting text…" label.
        const pages = await extractLayout(await flattenedFile(), {
          onOcrPage: (done, total) => setLabel(`Recognising page ${done} / ${total}…`),
        });
        const content = isMd
          ? layoutToMarkdown(pages, { headings: mdHeadings })
          : layoutToPlainText(pages);
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
    mdHeadings,
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
        className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Export</span>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <m.div
              ref={dialogRef}
              className="fixed inset-0 z-200 flex items-end justify-center sm:items-center sm:px-3 md:px-6"
              role="dialog"
              aria-modal="true"
              aria-label="Export document"
              variants={variants.scrim}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <button
                type="button"
                aria-label="Close export"
                tabIndex={-1}
                onClick={() => setOpen(false)}
                className="absolute inset-0 cursor-default border-none bg-slate-900/30 backdrop-blur-sm"
              />
              <m.div
                className="relative flex max-h-[88svh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200/80 bg-white/90 shadow-2xl backdrop-blur-xl overscroll-contain sm:max-h-[min(640px,calc(100svh-64px))] sm:w-[min(480px,100%)] sm:rounded-2xl dark:border-dark-border dark:bg-dark-surface/90"
                variants={variants.sheet}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-slate-200/70 px-4 py-3 dark:border-dark-border">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-dark-text">
                      Export
                    </h2>
                    {doc && (
                      <p className="truncate text-xs text-slate-500 dark:text-dark-text-muted">
                        {doc.fileName} · {doc.pageCount} {doc.pageCount === 1 ? "page" : "pages"}
                      </p>
                    )}
                  </div>
                  <button
                    ref={closeBtnRef}
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-dark-surface-alt dark:hover:text-dark-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="thin-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
                  {pendingMarks > 0 && (
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/15 dark:text-amber-300">
                      <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        {pendingMarks} redaction/erase mark{pendingMarks === 1 ? "" : "s"} will be
                        permanently burned into the pages on export.
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <SectionLabel>Format</SectionLabel>
                    <div
                      role="radiogroup"
                      aria-label="Export format"
                      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
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
                    <p className="-mt-1 px-0.5 text-xs text-slate-500 dark:text-dark-text-muted">
                      Reading order is reconstructed on-device. Scanned pages are read with OCR
                      (one-time engine download) — nothing leaves your browser.
                    </p>
                  )}

                  {format === "markdown" && (
                    <div className="flex flex-col gap-2">
                      <SectionLabel>Markdown</SectionLabel>
                      <OptionRow
                        icon={Hash}
                        label="Infer headings"
                        hint="Use font sizes to add #, ##, ### headings"
                        checked={mdHeadings}
                        onChange={setMdHeadings}
                      />
                    </div>
                  )}

                  {isPdf && (
                    <div className="flex flex-col gap-2">
                      <SectionLabel>Options</SectionLabel>
                      <OptionRow
                        icon={Archive}
                        label="Compress"
                        hint="Shrink by re-rendering pages as images"
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
                        <p className="mt-2 text-xs text-slate-500 dark:text-dark-text-muted">
                          {COMPRESS_INFO[quality]}
                        </p>
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
                  )}
                </div>

                {/* Footer — the single action. */}
                <div className="shrink-0 border-t border-slate-200/70 px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] dark:border-dark-border">
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!doc || busy}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                </div>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
