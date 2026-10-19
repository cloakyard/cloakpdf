import { afterEach, expect, it, vi } from "vite-plus/test";
const pipeline = vi.hoisted(() => vi.fn());
vi.mock("@huggingface/transformers", () => ({ env: {}, pipeline }));
import {
  abortPendingLoad,
  abortSignalForUrl,
  loadPipeline,
  unloadModel,
} from "../../src/utils/ai-runtime.ts";
import { getModelInfo } from "../../src/utils/ai-models.ts";

afterEach(async () => {
  await unloadModel("embed");
  vi.unstubAllGlobals();
});
it("a cancelled GPU preparation cannot start a download or abort the current retry", async () => {
  let finishOld!: (value: object) => void;
  let finishNew!: (value: object) => void;
  const oldGpu = new Promise<object>((resolve) => {
    finishOld = resolve;
  });
  const newPipeline = new Promise<object>((resolve) => {
    finishNew = resolve;
  });
  const requestAdapter = vi.fn().mockReturnValueOnce(oldGpu).mockResolvedValue({});
  vi.stubGlobal("navigator", { gpu: { requestAdapter } });
  pipeline.mockReturnValue(newPipeline);
  const oldLoad = loadPipeline("embed");
  const rejected = expect(oldLoad).rejects.toThrow("load-cancelled");
  await vi.waitFor(() => expect(requestAdapter).toHaveBeenCalledTimes(1));
  abortPendingLoad("embed");
  const retry = loadPipeline("embed");
  await vi.waitFor(() => expect(pipeline).toHaveBeenCalledTimes(1));
  const signal = abortSignalForUrl(getModelInfo("embed").repo);
  expect(signal?.aborted).toBe(false);
  finishOld({});
  await rejected;
  expect(pipeline).toHaveBeenCalledTimes(1);
  expect(signal?.aborted).toBe(false);
  finishNew({});
  await expect(retry).resolves.toEqual({});
});
