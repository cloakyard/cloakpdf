/**
 * Model-cache upgrade regression tests.
 *
 * A changed model registry must delete Transformers.js' shared
 * CacheStorage entry before the app mounts, clear stale ready flags,
 * and persist the new signature so later starts stay warm.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AI_MODEL_CACHE_SIGNATURE } from "../../src/utils/ai-models.ts";
import { synchronizeModelCache } from "../../src/utils/ai-runtime.ts";

function makeStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, String(value));
    },
    removeItem: (key) => {
      data.delete(key);
    },
    key: (index) => Array.from(data.keys())[index] ?? null,
  } satisfies Storage;
}

beforeEach(() => {
  vi.stubGlobal(
    "localStorage",
    makeStorage({
      "cloakpdf:ai-model-ready:chat:lfm2.5-1.2b": "1",
      "cloakpdf:ai-model-ready:embed": "1",
      "cloakpdf:ai-model-cache-signature": "old-registry",
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("synchronizeModelCache", () => {
  it("evicts stale model bytes and records the active registry", async () => {
    const deleteCache = vi.fn(async () => true);
    vi.stubGlobal("caches", { delete: deleteCache });

    const result = await synchronizeModelCache();

    expect(result).toMatchObject({
      upgraded: true,
      deletedCaches: 1,
      failedCaches: 0,
      cacheApiAvailable: true,
    });
    expect(deleteCache).toHaveBeenCalledWith("transformers-cache");
    expect(localStorage.getItem("cloakpdf:ai-model-ready:embed")).toBeNull();
    expect(localStorage.getItem("cloakpdf:ai-model-ready:chat:lfm2.5-1.2b")).toBeNull();
    expect(localStorage.getItem("cloakpdf:ai-model-cache-signature")).toBe(
      AI_MODEL_CACHE_SIGNATURE,
    );
  });

  it("keeps a current cache warm on later starts", async () => {
    vi.stubGlobal(
      "localStorage",
      makeStorage({
        "cloakpdf:ai-model-cache-signature": AI_MODEL_CACHE_SIGNATURE,
        "cloakpdf:ai-model-ready:embed": "1",
      }),
    );
    const deleteCache = vi.fn(async () => true);
    vi.stubGlobal("caches", { delete: deleteCache });

    const result = await synchronizeModelCache();

    expect(result.upgraded).toBe(false);
    expect(deleteCache).not.toHaveBeenCalled();
    expect(localStorage.getItem("cloakpdf:ai-model-ready:embed")).toBe("1");
  });

  it("leaves the old signature in place when eviction fails so startup retries", async () => {
    vi.stubGlobal("caches", {
      delete: vi.fn(async () => {
        throw new Error("storage busy");
      }),
    });

    const result = await synchronizeModelCache();

    expect(result.failedCaches).toBe(1);
    expect(localStorage.getItem("cloakpdf:ai-model-cache-signature")).toBe("old-registry");
  });
});
