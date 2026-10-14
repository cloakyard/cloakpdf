/** Real browser checks for model-dialog recovery, storage transactions and Air geometry.
 * Uses an isolated profile, disposable storage fixtures and held model requests.
 * The actual model/answer path is covered separately by ai-tools.e2e.ts.
 */
import assert from "node:assert/strict";
import { auditAirDialog } from "./helpers/air-dialog-audit.ts";
import { launch, type Page, type HTTPRequest } from "puppeteer-core";

const url = process.env.E2E_URL ?? "http://localhost:5173";
const browser = await launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
await page.setBypassServiceWorker(true);
const dialog = '[data-testid="ai-model-details-dialog"]';
const evidenceDir = process.env.AIR_EVIDENCE_DIR ?? "/tmp/cloakpdf-air-modal-states";
const held: HTTPRequest[] = [];
let modelRequests = 0;
let rejectModels = false;
await page.setRequestInterception(true);
page.on("request", (request) => {
  if (/huggingface\.co|hf\.co/.test(request.url())) {
    modelRequests++;
    if (rejectModels) void request.abort();
    else held.push(request);
  } else void request.continue();
});
async function button(label: string) {
  for (const candidate of await page.$$("button")) {
    if (
      await candidate.evaluate(
        (node, text) =>
          node.textContent?.trim() === text && !node.disabled && !node.closest("[inert]"),
        label,
      )
    ) {
      await candidate.click();
      return;
    }
  }
  assert.fail(`Button unavailable: ${label}`);
}
async function openAsk() {
  await page.evaluate(() => {
    Array.from(document.querySelectorAll("h3"))
      .find((node) => node.textContent === "Ask your PDF")
      ?.closest("button")
      ?.click();
  });
  await page.waitForSelector("[data-rag-status]");
}
async function closed() {
  await page.waitForSelector('[role="dialog"]', { hidden: true });
  assert.equal(await page.$eval("#app", (node) => node.hasAttribute("inert")), false);
}
async function seedStorage(page: Page) {
  await page.evaluate(async () => {
    localStorage.setItem("cloakpdf:ai-model-ready:chat:lfm2-2.6b", "1");
    const cache = await caches.open("transformers-cache");
    await cache.put("/air-modal-disposable-model", new Response("test model"));
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("cloakpdf-rag", 6);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("index-cache", "readwrite");
        tx.objectStore("index-cache").put({ documentId: "air-modal-disposable-index" });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  });
}
try {
  await page.goto(url, { waitUntil: "networkidle2" });
  await seedStorage(page);
  await openAsk();
  await button("View details");
  await page.waitForSelector(dialog);
  const entryMotion = await page.evaluate(() =>
    document
      .getAnimations()
      .filter(
        (animation) =>
          animation.effect instanceof KeyframeEffect &&
          (animation.effect.target as Element)?.closest(".pdf-modal-root"),
      )
      .map((animation) => animation.effect?.getTiming().duration),
  );
  assert.ok(
    entryMotion.includes(240),
    `Pointer entrance did not use Air timing: ${JSON.stringify(entryMotion)}`,
  );
  await page.click(`${dialog} button[aria-label="Close"]`);
  const exitFrames = await page.evaluate(async () => {
    const frames = [];
    for (let i = 0; i < 20; i++) {
      frames.push({
        dialog: Boolean(document.querySelector('[role="dialog"]')),
        inert: document.querySelector<HTMLElement>("#app")!.inert,
      });
      if (!frames.at(-1)!.dialog) break;
      await new Promise(requestAnimationFrame);
    }
    return frames;
  });
  assert.ok(exitFrames.some((frame) => frame.dialog && frame.inert));
  assert.ok(
    exitFrames.every((frame) => !frame.dialog || frame.inert),
    "Background released before the exit finished",
  );
  await closed();
  await page.keyboard.press("Enter"); // restored View details trigger
  await page.waitForSelector(dialog);
  const keyboardAnimations = await page.evaluate(
    () =>
      document
        .querySelector('[role="dialog"]')!
        .getAnimations()
        .filter(
          (animation) =>
            animation.playState === "running" && Number(animation.effect?.getTiming().duration) > 0,
        ).length,
  );
  assert.equal(keyboardAnimations, 0);
  await page.keyboard.press("Escape");
  await closed();
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await button("View details");
  assert.equal(
    await page.$eval(
      '[role="dialog"]',
      (node) =>
        node
          .getAnimations()
          .filter(
            (animation) =>
              animation.playState === "running" &&
              Number(animation.effect?.getTiming().duration) > 0,
          ).length,
    ),
    0,
  );
  await page.keyboard.press("Escape");
  await closed();
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await button("View details");
  console.log("✓ Pointer motion, exit ownership, immediate keyboard/reduced-motion and reopen");
  await button("Delete cached models");
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), "Cancel");
  await auditAirDialog(page, "delete-confirmation", evidenceDir);
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () => document.activeElement?.textContent?.trim() === "Delete cached models",
  );
  assert.ok(await page.$(dialog), "Escape should cancel the destructive step first");
  assert.ok(await page.evaluate(() => caches.has("transformers-cache")));
  console.log("✓ Safe delete cancellation preserves storage and returns focus");

  // Both failures retain the dialog and retry controls. No deletion-success state
  // may be shown until CacheStorage and the IDB transaction actually succeed.
  for (const failure of ["cache", "index"] as const) {
    await page.evaluate((kind) => {
      if (kind === "cache") {
        // Preserve the method for restoration, not an unbound invocation.
        // oxlint-disable-next-line typescript/unbound-method
        const original = CacheStorage.prototype.delete;
        CacheStorage.prototype.delete = async function (...args) {
          CacheStorage.prototype.delete = original;
          throw new Error(`Test storage denial: ${args[0]}`);
        };
      } else {
        // The replacement calls the original with its explicit store receiver.
        // oxlint-disable-next-line typescript/unbound-method
        const original = IDBObjectStore.prototype.clear;
        IDBObjectStore.prototype.clear = function () {
          IDBObjectStore.prototype.clear = original;
          const result = original.call(this);
          this.transaction.abort();
          return result;
        };
      }
    }, failure);
    if (failure === "index") await seedStorage(page);
    if (failure === "cache") await button("Delete cached models");
    await button("Confirm delete");
    await page.waitForFunction(() =>
      document.querySelector('[role="alert"]')?.textContent?.includes("Could not delete"),
    );
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll("button")).some(
        (node) => node.textContent === "Confirm delete" && !node.disabled,
      ),
    );
    assert.ok(await page.$(dialog));
    assert.equal(
      await page.evaluate(() => localStorage.getItem("cloakpdf:ai-model-ready:chat:lfm2-2.6b")),
      "1",
    );
    console.log(`✓ ${failure} failure remains actionable without false success`);
  }
  await button("Confirm delete");
  await closed();
  assert.equal(await page.evaluate(() => caches.has("transformers-cache")), false);
  assert.equal(
    await page.evaluate(() => localStorage.getItem("cloakpdf:ai-model-ready:chat:lfm2-2.6b")),
    null,
  );
  const count = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const open = indexedDB.open("cloakpdf-rag");
        open.onsuccess = () => {
          const db = open.result;
          const request = db.transaction("index-cache").objectStore("index-cache").count();
          request.onsuccess = () => {
            db.close();
            resolve(request.result);
          };
        };
      }),
  );
  assert.equal(count, 0);
  assert.equal(
    await page.evaluate(() => document.activeElement?.textContent?.trim()),
    "View details",
  );
  console.log("✓ Retry removes real CacheStorage, committed IDB records and readiness flags");

  // Real warm-start status with downloads held: Cancel must remain idle instead
  // of promoting itself back to Loading forever or silently retrying.
  await page.evaluate(() => {
    for (const id of ["chat:lfm2.5-1.2b", "embed", "rerank"])
      localStorage.setItem(`cloakpdf:ai-model-ready:${id}`, "1");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await openAsk();
  await page.waitForSelector('[data-testid="ai-consent-dialog"]');
  await button("Cancel");
  await closed();
  const requestsAfterCancel = modelRequests;
  await new Promise((resolve) => setTimeout(resolve, 600));
  assert.equal(
    await page.$eval("[data-rag-status]", (node) => node.getAttribute("data-rag-status")),
    "idle",
  );
  assert.equal(modelRequests, requestsAfterCancel);
  assert.ok(await page.$("[data-ai-load-models]:not(:disabled)"));
  console.log("✓ Cancelled cached loading stays idle and permits explicit reload");

  await button("Load models");
  await page.waitForSelector('[data-testid="ai-consent-dialog"]');
  await page.waitForFunction(
    () => document.querySelector('[role="progressbar"]')?.getAttribute("aria-valuemax") === "3",
  );
  assert.equal(
    await page.$eval('[role="progressbar"]', (node) => node.getAttribute("aria-valuenow")),
    "0",
  );
  await page.keyboard.press("Escape");
  assert.ok(
    await page.$('[data-testid="ai-consent-dialog"]'),
    "Escape must not cancel active loading",
  );
  await auditAirDialog(page, "loading", evidenceDir);
  // Release held and subsequent requests as failures (the loader requests
  // configuration files in stages) to exercise the visible Retry path.
  rejectModels = true;
  for (const request of held.splice(0))
    if (!request.isInterceptResolutionHandled()) await request.abort().catch(() => {});
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll("button")).some(
      (node) => node.textContent === "Retry download",
    ),
  );
  assert.equal(
    await page.$eval('[role="progressbar"]', (node) => node.getAttribute("aria-valuenow")),
    "0",
  );
  await auditAirDialog(page, "download-error", evidenceDir);
  rejectModels = false;
  await button("Retry download");
  await page.waitForFunction(
    () =>
      document.querySelector("[data-rag-status]")?.getAttribute("data-rag-status") ===
      "downloading",
  );
  await button("Cancel");
  await closed();
  console.log("✓ Download errors stay at actual ready count; Retry and Cancel recover");
} catch (error) {
  console.log(
    "Failure state",
    modelRequests,
    await page.$eval("[role=dialog]", (node) => node.textContent).catch(() => "no dialog"),
  );
  throw error;
} finally {
  await browser.close();
}
