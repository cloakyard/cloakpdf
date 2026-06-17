/**
 * Unit tests for the download-cancellation wiring in `ai-runtime`.
 *
 * The bug these pin: clicking "Cancel" in the AI consent/download modal
 * used to reject the consumer's promise but leave the underlying
 * Transformers.js network fetches streaming on in the background.
 *
 * The fix routes every fetch through a wrapped `env.fetch`
 * ({@link createAbortableFetch}) that attaches a per-model
 * `AbortSignal`, and `abortPendingLoad` fires that signal so the live
 * download actually stops. We don't stand up the real Transformers.js
 * runtime here — we exercise the wrapper + controller registry directly
 * with a stub base fetch, which is where all the abort logic lives.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { getModelInfo } from "../../src/utils/ai-models.ts";
import {
  abortPendingLoad,
  abortSignalForUrl,
  beginDownload,
  createAbortableFetch,
} from "../../src/utils/ai-runtime.ts";

/** Build the kind of CDN URL Transformers.js fetches for a model file. */
function fileUrl(modelId: Parameters<typeof getModelInfo>[0], file = "onnx/model.onnx"): string {
  return `https://huggingface.co/${getModelInfo(modelId).repo}/resolve/main/${file}`;
}

/** Stub base fetch that records the `init` it was handed. */
function stubFetch() {
  const calls: Array<RequestInit | undefined> = [];
  const base = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
    calls.push(init);
    return Promise.resolve(new Response("ok"));
  });
  return { base: base as unknown as typeof fetch, calls };
}

// Controllers live in module state — make sure no test leaks an active
// download into the next one.
afterEach(() => {
  abortPendingLoad("embed");
  abortPendingLoad("rerank");
  abortPendingLoad("chat:lfm2.5-1.2b");
  abortPendingLoad("chat:lfm2-2.6b");
});

describe("ai-runtime download cancellation", () => {
  it("attaches the model's abort signal to a matching fetch and fires it on cancel", async () => {
    const controller = beginDownload("embed");
    const { base, calls } = stubFetch();
    const wrapped = createAbortableFetch(base);

    await wrapped(fileUrl("embed"));

    const signal = calls[0]?.signal;
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal?.aborted).toBe(false);

    // The user clicks Cancel.
    abortPendingLoad("embed");

    expect(signal?.aborted).toBe(true);
    expect(controller.signal.aborted).toBe(true);
  });

  it("leaves unrelated requests untouched (no signal injected)", async () => {
    beginDownload("embed");
    const { base, calls } = stubFetch();
    const wrapped = createAbortableFetch(base);

    // A URL that doesn't belong to any active download.
    await wrapped("https://example.com/not-a-model.json");

    expect(base).toHaveBeenCalledTimes(1);
    expect(calls[0]?.signal).toBeUndefined();
  });

  it("only aborts the cancelled model, not a sibling download", async () => {
    beginDownload("embed");
    beginDownload("rerank");
    const { base, calls } = stubFetch();
    const wrapped = createAbortableFetch(base);

    await wrapped(fileUrl("embed"));
    await wrapped(fileUrl("rerank"));
    const embedSignal = calls[0]?.signal;
    const rerankSignal = calls[1]?.signal;

    abortPendingLoad("embed");

    expect(embedSignal?.aborted).toBe(true);
    expect(rerankSignal?.aborted).toBe(false);
  });

  it("returns no signal once every download has finished", () => {
    // Nothing registered (afterEach cleared the previous test).
    expect(abortSignalForUrl(fileUrl("embed"))).toBeUndefined();
  });

  it("replaces a stale controller when a download restarts (retry)", () => {
    const first = beginDownload("embed");
    const second = beginDownload("embed");

    // Re-registering aborts the previous controller so an old in-flight
    // fetch can't survive a retry, and the new one governs fresh requests.
    expect(first).not.toBe(second);
    expect(first.signal.aborted).toBe(true);
    expect(second.signal.aborted).toBe(false);
    expect(abortSignalForUrl(fileUrl("embed"))).toBe(second.signal);
  });
});
