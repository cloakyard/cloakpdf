/**
 * Extract Images tool.
 *
 * Scans every page of a PDF for embedded images (via PDF.js operator lists),
 * displays them in a selectable grid, and lets the user download individual
 * images or a ZIP of all selected images.
 */

import { Check } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActionButton } from "../components/ActionButton.tsx";
import { AlertBox } from "../components/AlertBox.tsx";
import { FileDropZone } from "../components/FileDropZone.tsx";
import { FileInfoBar } from "../components/FileInfoBar.tsx";
import { LoadingState } from "../components/LoadingState.tsx";
import { ProgressBar } from "../components/ProgressBar.tsx";
import { useAsyncProcess } from "../hooks/useAsyncProcess.ts";
import { usePdfFile } from "../hooks/usePdfFile.ts";
import { downloadBlob, formatFileSize } from "../utils/file-helpers.ts";
import { pdfjsLib } from "../utils/pdf-renderer.ts";
import { PDFJS_WASM_URL } from "../utils/pdfjs-config.ts";

/** Metadata for a single extracted image. */
interface ExtractedImage {
  /** 1-based page number where the image was found. */
  page: number;
  /** Sequential index within the page (0-based). */
  indexOnPage: number;
  /** Image width in pixels. */
  width: number;
  /** Image height in pixels. */
  height: number;
  /** Data-URL thumbnail for preview. */
  dataUrl: string;
  /** Full-resolution Blob for download. */
  blob: Blob;
}

/** Shape returned by PDF.js for resolved image objects. */
interface PdfjsImageData {
  width: number;
  height: number;
  data?: Uint8ClampedArray;
  kind?: number;
  src?: string;
  bitmap?: ImageBitmap;
}

/** Fetch a named image object, routing to commonObjs for global ("g_"-prefixed) IDs. */
function fetchNamedImage(
  page: Awaited<ReturnType<PDFDocumentProxy["getPage"]>>,
  objName: string,
): Promise<PdfjsImageData> {
  return new Promise<PdfjsImageData>((resolve, reject) => {
    try {
      const store = objName.startsWith("g_") ? page.commonObjs : page.objs;
      store.get(objName, (obj: unknown) => {
        if (obj) resolve(obj as PdfjsImageData);
        else reject(new Error("null object"));
      });
    } catch {
      reject(new Error("object not found"));
    }
  });
}

/** Paint image data onto a canvas, handling ImageBitmap, raw pixels (RGBA/RGB), and src URLs. */
async function paintImageToCanvas(
  imgData: PdfjsImageData,
  ctx: CanvasRenderingContext2D,
): Promise<boolean> {
  if (imgData.bitmap) {
    ctx.drawImage(imgData.bitmap, 0, 0);
    return true;
  }

  if (imgData.data) {
    const expectedRgba = imgData.width * imgData.height * 4;
    if (imgData.data.length === expectedRgba) {
      ctx.putImageData(
        new ImageData(new Uint8ClampedArray(imgData.data), imgData.width, imgData.height),
        0,
        0,
      );
      return true;
    }
    // RGB (3 bytes per pixel) — expand to RGBA
    const expectedRgb = imgData.width * imgData.height * 3;
    if (imgData.data.length === expectedRgb) {
      const rgba = new Uint8ClampedArray(expectedRgba);
      const src = imgData.data;
      for (let j = 0, k = 0; j < src.length; j += 3, k += 4) {
        rgba[k] = src[j];
        rgba[k + 1] = src[j + 1];
        rgba[k + 2] = src[j + 2];
        rgba[k + 3] = 255;
      }
      ctx.putImageData(new ImageData(rgba, imgData.width, imgData.height), 0, 0);
      return true;
    }
    return false;
  }

  if (imgData.src) {
    await new Promise<void>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        resolve();
      };
      img.onerror = reject;
      img.src = imgData.src as string;
    });
    return true;
  }

  return false;
}

/**
 * Extract all raster images embedded in a PDF document.
 *
 * Iterates through every page's operator list, finds image paint operations,
 * retrieves the raw image object from PDF.js, and converts it to a PNG blob
 * via an offscreen canvas.
 */
async function extractImagesFromPdf(
  pdf: PDFDocumentProxy,
  signal: AbortSignal,
  onProgress?: (done: number, total: number) => void,
): Promise<ExtractedImage[]> {
  const images: ExtractedImage[] = [];

  // Reuse a single pair of canvases across all images to avoid
  // creating/destroying DOM elements per image.
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const thumbCanvas = document.createElement("canvas");
  const tctx = thumbCanvas.getContext("2d")!;

  try {
    for (let p = 1; p <= pdf.numPages; p++) {
      signal.throwIfAborted();
      const page = await pdf.getPage(p);
      try {
        const ops = await page.getOperatorList();
        signal.throwIfAborted();

        // Track which named objects we've already extracted on this page to
        // avoid duplicates when the same XObject is painted more than once.
        const seen = new Set<string>();
        let indexOnPage = 0;

        for (let i = 0; i < ops.fnArray.length; i++) {
          signal.throwIfAborted();
          const fn = ops.fnArray[i];

          let imgData: PdfjsImageData | null = null;

          if (
            fn === pdfjsLib.OPS.paintImageXObject ||
            fn === pdfjsLib.OPS.paintImageXObjectRepeat
          ) {
            // Named image reference — look up in the correct object store.
            const objName = ops.argsArray[i]?.[0] as string | undefined;
            if (!objName || typeof objName !== "string" || seen.has(objName)) continue;
            seen.add(objName);
            try {
              imgData = await fetchNamedImage(page, objName);
            } catch {
              continue;
            }
          } else if (fn === pdfjsLib.OPS.paintInlineImageXObject) {
            // Inline image — the image data is embedded directly in the args.
            const arg = ops.argsArray[i]?.[0];
            if (!arg || typeof arg !== "object") continue;
            imgData = arg as PdfjsImageData;
          } else {
            continue;
          }

          // Skip tiny images (likely artifacts or masks)
          if (!imgData || imgData.width < 10 || imgData.height < 10) continue;

          try {
            canvas.width = imgData.width;
            canvas.height = imgData.height;

            const painted = await paintImageToCanvas(imgData, ctx);
            if (!painted) continue;

            // Convert to PNG blob
            const blob = await new Promise<Blob>((resolve, reject) =>
              canvas.toBlob(
                (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
                "image/png",
              ),
            );

            // Build a smaller thumbnail for the preview grid
            const thumbScale = Math.min(1, 200 / Math.max(imgData.width, imgData.height));
            const tw = Math.round(imgData.width * thumbScale);
            const th = Math.round(imgData.height * thumbScale);
            thumbCanvas.width = tw;
            thumbCanvas.height = th;
            tctx.drawImage(canvas, 0, 0, tw, th);
            const dataUrl = thumbCanvas.toDataURL("image/png");

            images.push({
              page: p,
              indexOnPage,
              width: imgData.width,
              height: imgData.height,
              dataUrl,
              blob,
            });
            indexOnPage++;
          } catch {
            // Skip images that can't be decoded
          }
        }
      } finally {
        page.cleanup();
      }
      onProgress?.(p, pdf.numPages);
      // Yield so the progress counter repaints between pages instead of the
      // whole extraction pinning the main thread (matches the compress/grayscale
      // per-page-yield pattern in pdf-operations.ts).
      await new Promise((r) => setTimeout(r, 0));
    }

    signal.throwIfAborted();
    return images;
  } finally {
    // Release canvas memory even when a scan is cancelled or fails.
    canvas.width = 0;
    canvas.height = 0;
    thumbCanvas.width = 0;
    thumbCanvas.height = 0;
  }
}

export default function ExtractImages() {
  const root = useRef<HTMLDivElement>(null);
  const focusRequest = useRef<"intake" | "result" | null>(null);
  const alive = useRef(true);
  const activeScan = useRef<{
    controller: AbortController;
    task?: ReturnType<typeof pdfjsLib.getDocument>;
  } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [completed, setCompleted] = useState<{
    file: File;
    selection: Set<number>;
    name: string;
  } | null>(null);
  const downloadTask = useAsyncProcess();
  const cancelScan = useCallback(() => {
    const scan = activeScan.current;
    activeScan.current = null;
    scan?.controller.abort();
    // Destroy PDF.js work immediately; the loader's finally also releases it.
    void scan?.task?.destroy().catch(() => {});
  }, []);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      cancelScan();
    };
  }, [cancelScan]);

  const pdf = usePdfFile<ExtractedImage[]>({
    load: async (file) => {
      const scan: NonNullable<typeof activeScan.current> = { controller: new AbortController() };
      activeScan.current = scan;
      const { signal } = scan.controller;
      try {
        const arrayBuffer = await file.arrayBuffer();
        signal.throwIfAborted();
        const task = pdfjsLib.getDocument({ data: arrayBuffer, wasmUrl: PDFJS_WASM_URL });
        scan.task = task;
        const doc = await task.promise;
        signal.throwIfAborted();
        return await extractImagesFromPdf(doc, signal, (done, total) => {
          if (activeScan.current === scan && alive.current) setProgress({ done, total });
        });
      } finally {
        await scan.task?.destroy();
        if (activeScan.current === scan) {
          activeScan.current = null;
          if (alive.current) setProgress(null);
        }
      }
    },
    onReset: () => {
      cancelScan();
      setSelected(new Set());
      setProgress(null);
      setCompleted(null);
      downloadTask.setError(null);
    },
    loadErrorMessage: "Couldn’t read this PDF. Choose another file and try again.",
  });
  const file = pdf.file;
  const images = pdf.data ?? [];
  const loading = pdf.loading;
  const downloading = downloadTask.processing;
  const error = pdf.loadError
    ? "Couldn’t read this PDF. Choose a valid PDF and try again."
    : downloadTask.error
      ? "Couldn’t prepare this download. Your images and selection are still here. Try fewer images or try again."
      : null;

  useEffect(() => {
    if (!focusRequest.current) return;
    if (loading) {
      root.current
        ?.querySelector<HTMLElement>(".pdf-file-info button, [data-cancel-scan]")
        ?.focus();
      return;
    }
    const selector =
      focusRequest.current === "result" && pdf.data
        ? "[data-extract-heading]"
        : 'input[type="file"], .pdf-encrypted button';
    const target = root.current?.querySelector<HTMLElement>(selector);
    if (target) {
      target.focus();
      focusRequest.current = null;
    }
  }, [loading, file, pdf.data, pdf.loadError, pdf.encryptedFile]);

  const changeFile = () => {
    if (downloading) return;
    focusRequest.current = "intake";
    pdf.reset();
  };
  const acceptFiles = (files: File[]) => {
    if (loading || downloading || !files.length) return;
    const file = files[0];
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
      pdf.setLoadError("Choose a PDF file to extract its images.");
      return;
    }
    focusRequest.current = "result";
    pdf.onFiles(files);
  };
  const toggleImage = (index: number) => {
    if (downloading) return;
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };
  const handleDownload = async () => {
    if (!file || !selected.size) return;
    setCompleted(null);
    await downloadTask.run(async () => {
      const baseName = file.name.replace(/\.pdf$/i, "");
      const chosen = Array.from(selected)
        .sort((a, b) => a - b)
        .map((i) => images[i]);
      let blob: Blob;
      let name: string;
      if (chosen.length === 1) {
        const image = chosen[0];
        blob = image.blob;
        name = `${baseName}_p${image.page}_img${image.indexOnPage + 1}.png`;
      } else {
        const { makeZip } = await import("../utils/zip.ts");
        blob = await makeZip(
          chosen.map((image) => ({
            name: `${baseName}_p${image.page}_img${image.indexOnPage + 1}.png`,
            data: image.blob,
          })),
        );
        name = `${baseName}_images.zip`;
      }
      if (!alive.current) return;
      downloadBlob(blob, name);
      setCompleted({ file, selection: selected, name });
    }, "Couldn’t prepare the download. Your images and selection are still here. Try again.");
  };
  const totalSize = useMemo(
    () => Array.from(selected).reduce((sum, i) => sum + (images[i]?.blob.size ?? 0), 0),
    [selected, images],
  );

  return (
    <div className="pdf-extract" ref={root}>
      {!file ? (
        <FileDropZone
          accept=".pdf,application/pdf"
          onFiles={acceptFiles}
          disabled={loading}
          encryptedFile={pdf.encryptedFile}
          onClearEncrypted={changeFile}
          label="Drop a PDF file here"
          hint="Find embedded images and download them as PNG or ZIP"
        />
      ) : (
        <FileInfoBar
          fileName={file.name}
          details={formatFileSize(file.size)}
          onChangeFile={changeFile}
          disabled={downloading}
          changeLabel={loading ? "Cancel scan" : "Change file"}
        />
      )}
      {loading && (
        <div>
          {progress ? (
            <ProgressBar current={progress.done} total={progress.total} label="Scanning pages…" />
          ) : (
            <LoadingState label={file ? "Reading images…" : "Reading PDF…"} />
          )}
          {!file && (
            <button className="air-button" type="button" data-cancel-scan onClick={changeFile}>
              Cancel scan
            </button>
          )}
        </div>
      )}
      {file &&
        !loading &&
        pdf.data &&
        (images.length === 0 ? (
          <div className="air-collection-empty">
            <h2 data-extract-heading tabIndex={-1}>
              No embedded images found
            </h2>
            <p className="air-help">
              This PDF may contain text or vector artwork. Choose another PDF to extract embedded
              images.
            </p>
          </div>
        ) : (
          <>
            <div className="air-collection-heading">
              <div>
                <h2 data-extract-heading tabIndex={-1}>
                  {images.length} image{images.length === 1 ? "" : "s"} found
                </h2>
                <p className="air-help">
                  Choose the images you’d like to keep. Each download uses its full resolution.
                </p>
              </div>
              <div className="air-collection-actions">
                <button
                  type="button"
                  className="air-button"
                  aria-disabled={downloading || selected.size === images.length || undefined}
                  onClick={() => {
                    if (!downloading && selected.size !== images.length)
                      setSelected(new Set(images.map((_, i) => i)));
                  }}
                >
                  Select all
                </button>
                <button
                  type="button"
                  className="air-button air-button--quiet"
                  aria-disabled={downloading || selected.size === 0 || undefined}
                  onClick={() => {
                    if (!downloading && selected.size) setSelected(new Set());
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
            <ul className="pdf-extract-grid" aria-label="Extracted images">
              {images.map((image, index) => (
                <li key={index}>
                  <label
                    className="pdf-extract-choice"
                    data-selected={selected.has(index) || undefined}
                  >
                    <span className="pdf-extract-preview">
                      <img
                        src={image.dataUrl}
                        alt=""
                        width={image.width}
                        height={image.height}
                        loading="lazy"
                        decoding="async"
                      />
                    </span>
                    <span className="pdf-extract-caption">
                      <input
                        type="checkbox"
                        className="air-check"
                        checked={selected.has(index)}
                        disabled={downloading}
                        aria-label={`Image ${index + 1} from page ${image.page}`}
                        onChange={() => toggleImage(index)}
                      />
                      <span>
                        <span className="pdf-extract-name">
                          Image {index + 1} · Page {image.page}
                        </span>
                        <span className="air-help">
                          {image.width} × {image.height} px
                        </span>
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="pdf-extract-selection" role="status" aria-atomic="true">
              {selected.size} of {images.length} selected
              {selected.size > 0
                ? ` · ${formatFileSize(totalSize)}`
                : " · Choose at least one image to download"}
            </p>
            <ActionButton
              onClick={handleDownload}
              processing={downloading}
              disabled={!selected.size}
              label={
                selected.size === 0
                  ? "Download selected images"
                  : selected.size === 1
                    ? "Download image"
                    : `Download ${selected.size} as ZIP`
              }
              processingLabel="Preparing download…"
            />
            {completed?.file === file && completed.selection === selected && (
              <div className="air-notice air-notice--success pdf-result" role="status">
                <Check size={18} strokeWidth={1.6} aria-hidden="true" />
                <p>
                  {completed.name} is ready. Download requested. Your images and selection remain
                  here.
                </p>
              </div>
            )}
          </>
        ))}
      {error && <AlertBox message={error} />}
    </div>
  );
}
