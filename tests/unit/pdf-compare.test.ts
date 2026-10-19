import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { comparePdfFiles, comparePixels, releaseComparisons } from "../../src/utils/pdf-compare.ts";
import { pdfjsLib } from "../../src/utils/pdf-renderer.ts";
vi.mock("../../src/utils/pdf-renderer.ts", () => ({ pdfjsLib: { getDocument: vi.fn() } }));

function pixels(width: number, height: number, value = 255) {
  return { width, height, data: new Uint8ClampedArray(width * height * 4).fill(value) };
}
describe("visual difference", () => {
  it("keeps identical pages transparent and tolerates channel differences up to 30", () => {
    expect(comparePixels(pixels(2, 2), pixels(2, 2, 225)).diffPercent).toBe(0);
    expect([...comparePixels(pixels(2, 2), pixels(2, 2)).data].every((v) => v === 0)).toBe(true);
    expect(comparePixels(pixels(2, 2), pixels(2, 2, 224)).diffPercent).toBe(100);
  });
  it("measures the changed area and discards sub-precision raster noise", () => {
    const b = pixels(10, 10);
    b.data[0] = 0;
    expect(comparePixels(pixels(10, 10), b).diffPercent).toBe(1);
    const noise = pixels(100, 100);
    noise.data[0] = 0;
    const result = comparePixels(pixels(100, 100), noise);
    expect(result.diffPercent).toBe(0);
    expect(result.data.every((v) => v === 0)).toBe(true);
  });
  it("preserves pixel coordinates and marks only extra paper when page sizes differ", () => {
    const a = pixels(2, 2);
    a.data[0] = 0;
    const b = pixels(4, 2);
    b.data[0] = 0;
    const result = comparePixels(a, b);
    expect(result.diffPercent).toBe(50);
    expect([result.width, result.height]).toEqual([4, 2]);
    expect(result.data[3]).toBe(0); // Same black pixel, not stretched across columns.
    expect(result.data[11]).toBeGreaterThan(0); // Added paper.
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const input = () => [new File(["a"], "a.pdf"), new File(["b"], "b.pdf")] as [File, File];
const canvasList: Array<{ width: number; height: number; toBlob: ReturnType<typeof vi.fn> }> = [];
let encode: (callback: BlobCallback) => void;
let sequence = 0;
const createdUrl = vi.fn(() => `blob:page-${++sequence}`);
const revokedUrl = vi.fn();
function task(numPages = 1) {
  const page = {
    getViewport: vi.fn(() => ({ width: 2, height: 2 })),
    cleanup: vi.fn(),
    render: vi.fn(() => ({ promise: Promise.resolve(), cancel: vi.fn() })),
  };
  const doc = { numPages, getPage: vi.fn(async () => page) };
  return { promise: Promise.resolve(doc), destroy: vi.fn(async () => {}), doc, page };
}
function useTasks(...tasks: ReturnType<typeof task>[]) {
  for (const value of tasks)
    vi.mocked(pdfjsLib.getDocument).mockReturnValueOnce(
      value as unknown as ReturnType<typeof pdfjsLib.getDocument>,
    );
}

beforeEach(() => {
  vi.clearAllMocks();
  canvasList.length = 0;
  sequence = 0;
  encode = (callback) => callback(new Blob(["png"]));
  vi.spyOn(URL, "createObjectURL").mockImplementation(createdUrl);
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(revokedUrl);
  vi.stubGlobal(
    "ImageData",
    class {
      data: Uint8ClampedArray;
      width: number;
      height: number;
      constructor(data: Uint8ClampedArray, width: number, height: number) {
        this.data = data;
        this.width = width;
        this.height = height;
      }
    },
  );
  vi.stubGlobal("document", {
    createElement: () => {
      const canvas = {
        width: 0,
        height: 0,
        toBlob: vi.fn((callback: BlobCallback) => encode(callback)),
        getContext: () => ({ getImageData: () => pixels(2, 2), putImageData: vi.fn() }),
      };
      canvasList.push(canvas);
      return canvas;
    },
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("comparison resource ownership", () => {
  it("reports every page, preserves missing sides, and returns URLs until released", async () => {
    const a = task(1),
      b = task(2);
    useTasks(a, b);
    const progress = vi.fn();
    const result = await comparePdfFiles(input(), new AbortController().signal, progress);
    expect(result).toHaveLength(2);
    expect(result[0].diffPercent).toBe(0);
    expect(result[1]).toMatchObject({ thumbA: null, diffThumb: null, diffPercent: 100 });
    expect(progress.mock.calls).toEqual([
      [0, 2],
      [1, 2],
      [2, 2],
    ]);
    expect(a.destroy).toHaveBeenCalledTimes(1);
    expect(b.destroy).toHaveBeenCalledTimes(1);
    expect(a.page.cleanup).toHaveBeenCalledTimes(1);
    expect(b.page.cleanup).toHaveBeenCalledTimes(2);
    expect(canvasList.every((c) => !c.width && !c.height)).toBe(true);
    expect(revokedUrl).not.toHaveBeenCalled();
    releaseComparisons(result);
    expect(revokedUrl).toHaveBeenCalledTimes(4);
  });
  it("destroys both loading tasks when only one document opens", async () => {
    const a = task(),
      b = task();
    b.promise = Promise.reject(new Error("broken"));
    useTasks(a, b);
    await expect(comparePdfFiles(input(), new AbortController().signal, vi.fn())).rejects.toThrow(
      "broken",
    );
    expect(a.destroy).toHaveBeenCalledTimes(1);
    expect(b.destroy).toHaveBeenCalledTimes(1);
  });
  it("releases URLs already encoded for an unfinished page on failure", async () => {
    useTasks(task(), task());
    let encoded = 0;
    encode = (callback) => callback(++encoded === 2 ? null : new Blob(["png"]));
    await expect(comparePdfFiles(input(), new AbortController().signal, vi.fn())).rejects.toThrow(
      "Page image unavailable",
    );
    expect(revokedUrl).toHaveBeenCalledWith("blob:page-1");
    expect(canvasList.every((c) => !c.width && !c.height)).toBe(true);
  });
  it("cancels a pending native read without starting late PDF tasks", async () => {
    const files = input(),
      read = deferred<ArrayBuffer>(),
      abort = new AbortController();
    vi.spyOn(files[0], "arrayBuffer").mockReturnValue(read.promise);
    const work = comparePdfFiles(files, abort.signal, vi.fn());
    const rejection = expect(work).rejects.toThrow();
    abort.abort();
    await rejection;
    read.resolve(new ArrayBuffer(0));
    await Promise.resolve();
    expect(pdfjsLib.getDocument).not.toHaveBeenCalled();
  });
  it("cancels both loading tasks before their document promises settle", async () => {
    const a = task(),
      b = task(),
      loading = deferred<typeof a.doc>(),
      abort = new AbortController();
    a.promise = loading.promise;
    useTasks(a, b);
    const work = comparePdfFiles(input(), abort.signal, vi.fn());
    const rejection = expect(work).rejects.toThrow();
    await vi.waitFor(() => expect(pdfjsLib.getDocument).toHaveBeenCalledTimes(2));
    abort.abort();
    await rejection;
    expect(a.destroy).toHaveBeenCalledTimes(1);
    expect(b.destroy).toHaveBeenCalledTimes(1);
    loading.resolve(a.doc);
    await Promise.resolve();
    expect(a.doc.getPage).not.toHaveBeenCalled();
  });
  it("cancels active rendering and releases its canvas and page", async () => {
    const a = task(),
      b = task(),
      rendering = deferred<void>(),
      abort = new AbortController();
    const cancel = vi.fn(() => rendering.reject(new Error("cancelled")));
    a.page.render.mockReturnValue({ promise: rendering.promise, cancel });
    useTasks(a, b);
    const work = comparePdfFiles(input(), abort.signal, vi.fn());
    const rejection = expect(work).rejects.toThrow("cancelled");
    await vi.waitFor(() => expect(a.page.render).toHaveBeenCalled());
    abort.abort();
    await rejection;
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(a.page.cleanup).toHaveBeenCalledTimes(1);
    expect(canvasList.every((c) => !c.width && !c.height)).toBe(true);
  });
  it("does not create a stale URL when a cancelled image encoder completes", async () => {
    const a = task(),
      b = task(),
      abort = new AbortController();
    useTasks(a, b);
    let finish: BlobCallback | undefined;
    encode = (callback) => {
      finish = callback;
    };
    const work = comparePdfFiles(input(), abort.signal, vi.fn());
    const rejection = expect(work).rejects.toThrow();
    await vi.waitFor(() => expect(finish).toBeDefined());
    abort.abort();
    await rejection;
    finish!(new Blob(["late"]));
    await Promise.resolve();
    expect(createdUrl).not.toHaveBeenCalled();
    expect(canvasList.every((c) => !c.width && !c.height)).toBe(true);
    expect(a.destroy).toHaveBeenCalledTimes(1);
    expect(b.destroy).toHaveBeenCalledTimes(1);
  });
});
