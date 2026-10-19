/** Local PDF comparison. Own every loading task, canvas and temporary URL. */
import type { PDFDocumentProxy } from "pdfjs-dist";
import { pdfjsLib } from "./pdf-renderer.ts";
import { PDFJS_WASM_URL } from "./pdfjs-config.ts";
import { canvas as canvasColors } from "../config/theme.ts";

export interface PageComparison {
  page: number;
  thumbA: string | null;
  thumbB: string | null;
  diffThumb: string | null;
  diffPercent: number;
  width: number;
  height: number;
  widthA: number;
  heightA: number;
  widthB: number;
  heightB: number;
}

/** Compare at original pixel positions; never stretch different page sizes. */
export function comparePixels(
  a: Pick<ImageData, "data" | "width" | "height">,
  b: Pick<ImageData, "data" | "width" | "height">,
) {
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height);
  const data = new Uint8ClampedArray(width * height * 4);
  let changed = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inA = x < a.width && y < a.height;
      const inB = x < b.width && y < b.height;
      const ai = (y * a.width + x) * 4;
      const bi = (y * b.width + x) * 4;
      const different =
        inA !== inB ||
        (inA &&
          inB &&
          (Math.abs(a.data[ai] - b.data[bi]) > 30 ||
            Math.abs(a.data[ai + 1] - b.data[bi + 1]) > 30 ||
            Math.abs(a.data[ai + 2] - b.data[bi + 2]) > 30));
      if (!different) continue;
      const i = (y * width + x) * 4;
      const { r, g, b: blue, a: alpha } = canvasColors.diffHighlight;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = blue;
      data[i + 3] = alpha;
      changed++;
    }
  }
  // Preserve the existing half-of-one-decimal raster-noise tolerance.
  const raw = width * height ? (changed / (width * height)) * 100 : 0;
  const diffPercent = raw < 0.05 ? 0 : raw;
  if (!diffPercent) data.fill(0);
  return { data, width, height, diffPercent };
}

export function releaseComparisons(results: PageComparison[]) {
  for (const result of results) {
    for (const url of [result.thumbA, result.thumbB, result.diffThumb]) {
      if (url) URL.revokeObjectURL(url);
    }
  }
}

/** Stop waiting immediately; native reads that cannot abort remain observed. */
function withAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const cancel = () => reject(signal.reason);
    signal.addEventListener("abort", cancel, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", cancel));
    if (signal.aborted) cancel();
  });
}

async function renderPage(pdf: PDFDocumentProxy, number: number, signal: AbortSignal) {
  const page = await withAbort(pdf.getPage(number), signal);
  const canvas = document.createElement("canvas");
  let rendered = false;
  try {
    const viewport = page.getViewport({ scale: 1.5 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    signal.throwIfAborted();
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Page canvas unavailable.");
    const rendering = page.render({ canvasContext: context, viewport, canvas });
    const cancel = () => rendering.cancel();
    signal.addEventListener("abort", cancel, { once: true });
    try {
      await rendering.promise;
      signal.throwIfAborted();
      rendered = true;
      return canvas;
    } finally {
      signal.removeEventListener("abort", cancel);
    }
  } finally {
    try {
      page.cleanup();
    } finally {
      if (!rendered) {
        canvas.width = 0;
        canvas.height = 0;
      }
    }
  }
}

async function canvasUrl(canvas: HTMLCanvasElement, signal: AbortSignal, urls: Set<string>) {
  const blob = await withAbort(
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error("Page image unavailable."))),
        "image/png",
      );
    }),
    signal,
  );
  signal.throwIfAborted();
  const url = URL.createObjectURL(blob);
  urls.add(url);
  return url;
}

export async function comparePdfFiles(
  files: [File, File],
  signal: AbortSignal,
  onProgress: (done: number, total: number) => void,
): Promise<PageComparison[]> {
  signal.throwIfAborted();
  const tasks: ReturnType<typeof pdfjsLib.getDocument>[] = [];
  const urls = new Set<string>();
  const destruction = new Map<ReturnType<typeof pdfjsLib.getDocument>, Promise<void>>();
  const destroy = () => {
    for (const task of tasks) {
      if (!destruction.has(task))
        destruction.set(
          task,
          task.destroy().catch(() => {}),
        );
    }
  };
  signal.addEventListener("abort", destroy, { once: true });
  try {
    const bytes = await withAbort(Promise.all(files.map((file) => file.arrayBuffer())), signal);
    signal.throwIfAborted();
    for (const data of bytes) tasks.push(pdfjsLib.getDocument({ data, wasmUrl: PDFJS_WASM_URL }));
    const [a, b] = await withAbort(Promise.all(tasks.map((task) => task.promise)), signal);
    const total = Math.max(a.numPages, b.numPages);
    const results: PageComparison[] = [];
    onProgress(0, total);
    for (let page = 1; page <= total; page++) {
      signal.throwIfAborted();
      const canvases: HTMLCanvasElement[] = [];
      try {
        const render = async (pdf: PDFDocumentProxy) => {
          if (page > pdf.numPages) return null;
          const canvas = await renderPage(pdf, page, signal);
          canvases.push(canvas);
          return canvas;
        };
        const ca = await render(a);
        const cb = await render(b);
        signal.throwIfAborted();
        const result: PageComparison = {
          page,
          thumbA: null,
          thumbB: null,
          diffThumb: null,
          diffPercent: 100,
          width: Math.max(ca?.width ?? 0, cb?.width ?? 0),
          height: Math.max(ca?.height ?? 0, cb?.height ?? 0),
          widthA: ca?.width ?? 0,
          heightA: ca?.height ?? 0,
          widthB: cb?.width ?? 0,
          heightB: cb?.height ?? 0,
        };
        if (ca) result.thumbA = await canvasUrl(ca, signal, urls);
        if (cb) result.thumbB = await canvasUrl(cb, signal, urls);
        if (ca && cb) {
          const diff = comparePixels(
            ca.getContext("2d")!.getImageData(0, 0, ca.width, ca.height),
            cb.getContext("2d")!.getImageData(0, 0, cb.width, cb.height),
          );
          const canvas = document.createElement("canvas");
          canvases.push(canvas);
          canvas.width = diff.width;
          canvas.height = diff.height;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Difference canvas unavailable.");
          context.putImageData(new ImageData(diff.data, diff.width, diff.height), 0, 0);
          result.diffThumb = await canvasUrl(canvas, signal, urls);
          result.diffPercent = diff.diffPercent;
        }
        results.push(result);
        onProgress(page, total);
      } finally {
        for (const canvas of canvases) {
          canvas.width = 0;
          canvas.height = 0;
        }
      }
      await withAbort(new Promise<void>((resolve) => setTimeout(resolve, 0)), signal);
    }
    signal.throwIfAborted();
    return results;
  } catch (error) {
    for (const url of urls) URL.revokeObjectURL(url);
    throw error;
  } finally {
    signal.removeEventListener("abort", destroy);
    destroy();
    await Promise.all(destruction.values());
  }
}
