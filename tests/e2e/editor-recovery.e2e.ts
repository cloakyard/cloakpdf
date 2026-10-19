/** Real editor loading, local-draft recovery, request ownership and Air states. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument } from "@pdfme/pdf-lib";
import { launch } from "puppeteer-core";

const output = process.env.AIR_EVIDENCE_DIR ?? "/tmp/cloakpdf-air-review";
await mkdir(output, { recursive: true });
async function fixture(text: string) {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < 3; i++)
    pdf.addPage([400, 600]).drawText(`${text} / ${i + 1}`, { x: 30, y: 500, size: 18 });
  return Array.from(await pdf.save());
}
const original = await fixture("Room to recover");
const saved = await fixture("Your restored work");
const path = join(output, "Air recovery.pdf");
await writeFile(path, new Uint8Array(original));
const browser = await launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage();
const cdp = await page.createCDPSession();
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.setBypassServiceWorker(true);
const settle = () =>
  page.evaluate(async () => {
    for (let i = 0; i < 5; i++) await new Promise(requestAnimationFrame);
  });
const ready = () =>
  page.waitForFunction(
    () =>
      (window as any).airRead?.doc &&
      !(window as any).airRead.opening &&
      !(window as any).airRead.busyLabel,
  );
const docBytes = () =>
  page.evaluate(() => Array.from((window as any).airRead.doc.bytes as Uint8Array));
const captures: unknown[] = [];
async function capture(
  state: string,
  width: number,
  height: number,
  theme: string,
  enlarged = false,
) {
  await page.setViewport({ width, height });
  await cdp.send("Emulation.setTouchEmulationEnabled", {
    enabled: width < 1100,
    maxTouchPoints: 1,
  });
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-color-scheme", value: theme },
      { name: "pointer", value: width < 1100 ? "coarse" : "fine" },
    ],
  });
  await page.evaluate(
    ({ theme, enlarged }) => {
      document.documentElement.dataset.airTheme = theme;
      document.documentElement.style.fontSize = enlarged ? "32px" : "";
    },
    { theme, enlarged },
  );
  await settle();
  const metrics = await page.evaluate(() => {
    const main = document.querySelector('main[aria-label="PDF editor"]')!;
    const notices = document.querySelector(".editor-notices");
    const opening = document.querySelector(".editor-opening");
    const busy = document.querySelector(".editor-busy");
    const region = busy ?? notices ?? opening ?? main;
    const rect = region.getBoundingClientRect();
    const coarse = matchMedia("(pointer: coarse)").matches;
    const bad = Array.from(region.querySelectorAll("button")).flatMap((e) => {
      const r = e.getBoundingClientRect();
      return r.width &&
        (r.width < (coarse ? 43 : 31) ||
          r.height < (coarse ? 43 : 31) ||
          r.right > innerWidth + 1 ||
          r.left < -1)
        ? [{ text: e.textContent, width: r.width, height: r.height }]
        : [];
    });
    return {
      coarse,
      overflow: region.scrollWidth > region.clientWidth + 1,
      bad,
      regionHeight: rect.height,
      screen: innerHeight,
      canvasHeight: document.querySelector(".editor-stage")?.getBoundingClientRect().height,
      rootFont: getComputedStyle(document.body).fontFamily,
      topLayer: !busy || !!document.elementFromPoint(1, 1)?.closest(".editor-busy"),
    };
  });
  assert.equal(metrics.coarse, width < 1100, "pointer emulation is active");
  assert.doesNotMatch(metrics.rootFont, /Archivo|JetBrains/, "UI uses the Air system stack");
  assert.equal(
    metrics.topLayer,
    true,
    "Processing still owns pointer interaction above the editor",
  );
  assert.equal(metrics.overflow, false, `${state} ${width} ${theme} horizontal overflow`);
  assert.deepEqual(metrics.bad, [], `${state} ${width} ${theme} controls`);
  if (state === "notices")
    assert.ok(metrics.regionHeight <= height * 0.4 + 1, "notices preserve canvas space");
  const file = `shell-${state}-${width}x${height}-${theme}${enlarged ? "-text200" : ""}.png`;
  await page.screenshot({ path: join(output, file) });
  captures.push({ state, width, height, theme, enlarged, ...metrics, file });
}
const sizes = [
  [320, 568],
  [375, 812],
  [390, 844],
  [430, 932],
  [844, 390],
  [768, 1024],
  [1024, 768],
  [1280, 720],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
];
async function matrix(state: string) {
  for (const [w, h] of sizes)
    for (const theme of ["light", "dark"]) await capture(state, w, h, theme);
  for (const [w, h] of [
    [320, 568],
    [768, 1024],
    [1440, 900],
  ])
    for (const theme of ["light", "dark"]) await capture(state, w, h, theme, true);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
  });
  await page.setViewport({ width: 1440, height: 900 });
  console.log(`✓ ${state} responsive/theme/text matrix`);
}
try {
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(process.env.E2E_URL ?? "http://127.0.0.1:8122", { waitUntil: "networkidle2" });
  await page.evaluate(
    async ({ original, saved }) => {
      const load = (s: string) => import(s);
      const React = (await load("/node_modules/.vite/deps/react.js")).default;
      const { createRoot } = (await load("/node_modules/.vite/deps/react-dom_client.js")).default;
      const source = await (await fetch("/src/editor/EditorShell.tsx")).text();
      const context = source.match(/from ["']([^"']*EditorContext\.tsx[^"']*)["']/)![1];
      const { EditorProvider, useEditorRead, useEditorActions, useActiveTool } =
        await load(context);
      const { EditorShell } = await load("/src/editor/EditorShell.tsx");
      const { StageProvider, useActiveStageProps } = await load("/src/editor/stage.tsx");
      const { toolImpl } = await load("/src/editor/registry.tsx");
      for (const id of [null, "", "missing", "constructor", "toString", "__proto__"])
        if (toolImpl(id) !== null) throw new Error(`Unknown tool implementation: ${id}`);
      const { MotionProvider } = await load("/src/components/motion.tsx");
      const store = await load("/src/editor/draft-store.ts");
      const w = window as any;
      w.original = original;
      w.saved = saved;
      w.store = store;
      w.key = await store.hashDocBytes(new Uint8Array(original));
      w.seed = async () =>
        store.saveDraft({
          key: w.key,
          fileName: "Air recovery.pdf",
          bytes: new Uint8Array(saved),
          objects: [],
          savedAt: Date.now(),
        });
      await w.seed();
      // Faults delay/fail actual browser file reads and PNG encoding, not provider state.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const read = File.prototype.arrayBuffer;
      File.prototype.arrayBuffer = async function () {
        if (w.failRead) {
          w.failRead = false;
          throw new Error(
            "The saved PDF could not be read. Your original is still open. Retry restoring your edits.",
          );
        }
        if (w.holdName === this.name) {
          w.holdName = null;
          await new Promise<void>((resolve) => {
            w.releaseRead = resolve;
          });
        }
        return read.call(this);
      };
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const blob = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
        if (w.holdPreview) {
          w.holdPreview = false;
          w.releasePreview = () => blob.call(this, callback, ...args);
        } else blob.call(this, callback, ...args);
      };
      const made: string[] = [],
        retired: string[] = [];
      const create = URL.createObjectURL.bind(URL),
        revoke = URL.revokeObjectURL.bind(URL);
      URL.createObjectURL = (b) => {
        const url = create(b);
        made.push(url);
        return url;
      };
      URL.revokeObjectURL = (url) => {
        retired.push(url);
        revoke(url);
      };
      w.urls = { made, retired };
      function Probe() {
        w.airRead = useEditorRead();
        w.airActions = useEditorActions();
        w.airActiveTool = useActiveTool();
        w.airStage = useActiveStageProps();
        return React.createElement(EditorShell);
      }
      w.mount = (strict = false, file = null) => {
        const host = document.createElement("div");
        document.body.append(host);
        const root = createRoot(host);
        w.root = root;
        root.render(
          React.createElement(
            strict ? React.StrictMode : React.Fragment,
            null,
            React.createElement(
              EditorProvider,
              { initialFile: file, onExit: () => root.unmount() },
              React.createElement(
                MotionProvider,
                null,
                React.createElement(StageProvider, null, React.createElement(Probe)),
              ),
            ),
          ),
        );
      };
      w.open = (input = original, name = "Air recovery.pdf") =>
        w.airActions.loadFile(new File([new Uint8Array(input)], name, { type: "application/pdf" }));
      w.mount();
    },
    { original, saved },
  );
  await page.waitForSelector("input[type=file]");
  // Protected input uses the shared notice; its shell centres safely and scrolls on short screens.
  await page.evaluate(async () => {
    const load = (path: string) => import(path);
    const { protectPdf } = await load("/src/utils/pdf-security.ts");
    const w = window as any;
    const encrypted = await protectPdf(
      new File([new Uint8Array(w.original)], "Original.pdf"),
      "test-password",
      "test-owner",
    );
    await w.open(Array.from(encrypted), "Protected.pdf");
  });
  await page.waitForSelector(".pdf-encrypted");
  await matrix("encrypted");
  await page.locator(".pdf-encrypted button::-p-text(Choose another file)").click();
  assert.equal(await page.$('main[aria-label="PDF editor"]'), null);
  await page.evaluate(() => (window as any).mount());
  await page.waitForSelector('main[aria-label="PDF editor"] input[type=file]');
  // Real corrupt-file failure is actionable and keeps selected editor intent.
  await page.evaluate(async () => {
    const w = window as any;
    w.airActions.setActiveTool("crop-pages");
    await w.open([1, 2, 3], "Broken.pdf");
  });
  await page.waitForSelector(".editor-intake-error[role=alert]");
  assert.match(
    await page.$eval('main[aria-label="PDF editor"] h2', (e) => e.textContent!),
    /Choose another PDF/,
  );
  await matrix("open-error");
  await page.evaluate(() => {
    const w = window as any;
    w.holdName = "Air recovery.pdf";
    w.holdPreview = true;
  });
  await (await page.$('main[aria-label="PDF editor"] input[type=file]'))!.uploadFile(path);
  await page.waitForSelector(".editor-opening");
  assert.equal(await page.$("[role=progressbar]"), null, "unknown work has no invented percentage");
  await matrix("reading");
  await page.evaluate(() => (window as any).releaseRead());
  await page.waitForFunction(() => !!(window as any).releasePreview);
  assert.equal(await page.$eval("[role=progressbar]", (e) => e.getAttribute("aria-valuenow")), "0");
  assert.equal(await page.$eval("[role=progressbar]", (e) => e.getAttribute("aria-valuemax")), "3");
  await capture("previews", 390, 844, "dark");
  await page.evaluate(() => {
    const w = window as any;
    w.holdPreview = true;
    w.releasePreview();
  });
  await page.waitForFunction(
    () => (window as any).airRead.opening?.rendered === 1 && !(window as any).holdPreview,
  );
  assert.equal(await page.$eval("[role=progressbar]", (e) => e.getAttribute("aria-valuenow")), "1");
  await page.evaluate(() => (window as any).releasePreview());
  await ready();
  await page.waitForSelector(".editor-notice__actions");
  assert.equal(
    await page.$eval('main[aria-label="PDF editor"] h2', (e) => e.textContent),
    "Crop",
    "file retry preserves selected tool",
  );
  assert.equal(
    await page.evaluate(() => typeof (window as any).airStage.onPointerDown),
    "function",
  );
  await page.evaluate(() => (window as any).airActions.setActiveTool(null));
  await settle();
  assert.deepEqual(
    await page.evaluate(() => Object.keys((window as any).airStage)),
    [],
    "departed tool leaves no canvas handlers or overlay",
  );
  await page.evaluate(() => (window as any).airActions.setActiveTool("constructor"));
  await settle();
  assert.equal(await page.evaluate(() => (window as any).airActiveTool), null);
  // Failed restore retains source bytes, draft/action and keyboard focus, without an unhandled rejection.
  await page.evaluate(() => {
    (window as any).failRead = true;
  });
  await page.locator("button::-p-text(Restore edits)").click();
  await page.waitForSelector(".editor-notice [role=alert]");
  await ready();
  await settle();
  assert.deepEqual(await docBytes(), original);
  assert.ok(await page.evaluate(() => !!(window as any).airRead.pendingDraft));
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), "Restore edits");
  await matrix("notices");
  // At enlarged text/short heights the notice owns scrolling; keyboard reaches every action.
  await page.setViewport({ width: 320, height: 568 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "32px";
    document.querySelector<HTMLElement>(".editor-notices")!.focus();
  });
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    "Dismiss error",
  );
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    "Discard saved edits",
  );
  assert.ok(await page.$eval(".editor-notices", (e) => e.scrollTop > 0));
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
  });
  await page.setViewport({ width: 1440, height: 900 });
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "forced-colors", value: "active" },
      { name: "prefers-reduced-motion", value: "reduce" },
    ],
  });
  await page.screenshot({ path: join(output, "shell-notices-forced-colors.png") });
  await cdp.send("Emulation.setEmulatedMedia", { features: [] });
  // Retry is awaited, deduplicated and blocks editor actions; status remains outside busy/inert content.
  await page.evaluate(() => {
    (window as any).holdName = "Air recovery.pdf";
  });
  await page.locator("button::-p-text(Restore edits)").click();
  await page.waitForSelector(".editor-busy");
  await page.waitForFunction(() => !!(window as any).releaseRead);
  assert.equal(
    await page.$eval('main[aria-label="PDF editor"]', (e) => e.hasAttribute("inert")),
    true,
  );
  assert.equal(
    await page.$eval(".editor-busy [role=status]", (e) => !!e.closest("[aria-busy=true], [inert]")),
    false,
  );
  await page.evaluate(async () => {
    await (window as any).airActions.restoreDraft();
  });
  await matrix("busy");
  await page.evaluate(() => (window as any).releaseRead());
  await ready();
  await settle();
  assert.deepEqual(await docBytes(), saved);
  assert.equal(await page.evaluate(() => (window as any).airRead.pendingDraft), null);
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    "Export",
  );
  // Discard only the offered draft; preserve the source and an unrelated local record.
  await page.evaluate(async () => {
    const w = window as any;
    await w.seed();
    await w.store.saveDraft({
      key: "unrelated",
      fileName: "Other.pdf",
      bytes: new Uint8Array(w.saved),
      objects: [],
      savedAt: Date.now(),
    });
    await w.open();
  });
  await page.waitForSelector(".editor-notice__actions");
  await page.locator('button[aria-label="Discard saved edits"]').click();
  await settle();
  assert.deepEqual(await docBytes(), original);
  assert.equal(
    await page.evaluate(async () => {
      const w = window as any;
      return await w.store.loadDraft(w.key);
    }),
    null,
  );
  assert.ok(
    await page.evaluate(async () => !!(await (window as any).store.loadDraft("unrelated"))),
  );
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    "Export",
  );
  // A delayed earlier file cannot replace a newer one or leak the previews it creates.
  await page.evaluate(() => {
    const w = window as any;
    w.holdName = "Older.pdf";
    w.older = w.open(w.original, "Older.pdf");
  });
  await page.waitForFunction(() => (window as any).airRead.opening?.fileName === "Older.pdf");
  await page.evaluate(async () => {
    const w = window as any;
    await w.open(w.saved, "Newer.pdf");
    w.releaseRead();
    await w.older;
  });
  await ready();
  assert.deepEqual(await docBytes(), saved);
  assert.equal(await page.evaluate(() => (window as any).airRead.doc.fileName), "Newer.pdf");
  // Late draft hashing may not offer a previous file's saved work on the new document.
  await page.evaluate(async () => {
    const w = window as any;
    await w.seed();
    const digest = crypto.subtle.digest.bind(crypto.subtle);
    let first = true;
    crypto.subtle.digest = async (...args) => {
      if (first) {
        first = false;
        await new Promise<void>((resolve) => {
          w.releaseHash = resolve;
        });
      }
      return digest(...args);
    };
    await w.open();
    await w.open(w.saved, "Newer.pdf");
    w.releaseHash();
    crypto.subtle.digest = digest;
  });
  await settle();
  assert.equal(await page.evaluate(() => (window as any).airRead.pendingDraft), null);
  // Leaving while a draft restores must release its late thumbnails as well.
  await page.evaluate(async () => {
    const w = window as any;
    await w.seed();
    await w.open();
  });
  await page.waitForSelector(".editor-notice__actions");
  await page.evaluate(() => {
    const w = window as any;
    w.releaseRead = null;
    w.holdName = "Air recovery.pdf";
    w.restoring = w.airActions.restoreDraft();
  });
  await page.waitForFunction(() => typeof (window as any).releaseRead === "function");
  await page.evaluate(async () => {
    const w = window as any;
    w.root.unmount();
    w.releaseRead();
    await w.restoring;
  });
  // StrictMode effect replay still reaches a ready document; leaving during an actual read releases late previews.
  await page.evaluate(() => {
    const w = window as any;
    w.root.unmount();
    w.mount(true, new File([new Uint8Array(w.saved)], "Strict.pdf"));
  });
  await page.waitForFunction(
    () =>
      (window as any).airRead.doc?.fileName === "Strict.pdf" && !(window as any).airRead.opening,
  );
  await page.evaluate(() => {
    const w = window as any;
    w.holdName = "Leaving.pdf";
    w.leaving = w.open(w.original, "Leaving.pdf");
  });
  await page.waitForFunction(() => (window as any).airRead.opening?.fileName === "Leaving.pdf");
  await page.locator(".editor-opening button::-p-text(Back to toolkit)").click();
  await page.evaluate(async () => {
    const w = window as any;
    w.releaseRead();
    await w.leaving;
  });
  assert.equal(await page.$('main[aria-label="PDF editor"]'), null);
  // Departing before the busy surface paints must not start queued document work.
  await page.evaluate(() => {
    const w = window as any;
    w.mount(true, new File([new Uint8Array(w.original)], "Queued.pdf"));
  });
  await page.waitForFunction(() => (window as any).airRead.doc?.fileName === "Queued.pdf");
  assert.equal(
    await page.evaluate(async () => {
      const w = window as any;
      let ran = false;
      const task = w.airActions.runTask("Queued", () => {
        ran = true;
      });
      w.root.unmount();
      await task;
      return ran;
    }),
    false,
    "abandoned queued tasks never start",
  );
  console.log("✓ Departed queued task never starts");
  // An in-flight transform cannot build previews or install output after departure.
  await page.evaluate(() => {
    const w = window as any;
    w.mount(true, new File([new Uint8Array(w.original)], "Transform.pdf"));
  });
  await page.waitForFunction(() => (window as any).airRead.doc?.fileName === "Transform.pdf");
  await page.evaluate(() => {
    const w = window as any;
    w.releaseTransform = null;
    w.transform = w.airActions.applyTransform(async () => {
      await new Promise<void>((resolve) => {
        w.releaseTransform = resolve;
      });
      return { bytes: new Uint8Array(w.saved), label: "Late output" };
    });
  });
  await page.waitForFunction(() => typeof (window as any).releaseTransform === "function");
  assert.equal(
    await page.evaluate(async () => {
      const w = window as any;
      const count = w.urls.made.length;
      w.root.unmount();
      w.releaseTransform();
      await w.transform;
      return w.urls.made.length - count;
    }),
    0,
    "abandoned transform output never starts preview generation",
  );
  console.log("✓ Departed transform does not generate previews");
  // If preview generation already started, every late result must still be released.
  await page.evaluate(() => {
    const w = window as any;
    w.mount(true, new File([new Uint8Array(w.original)], "Previewing.pdf"));
  });
  await page.waitForFunction(() => (window as any).airRead.doc?.fileName === "Previewing.pdf");
  await page.evaluate(() => {
    const w = window as any;
    w.holdPreview = true;
    w.releasePreview = null;
    w.transform = w.airActions.applyTransform(async () => ({
      bytes: new Uint8Array(w.saved),
      label: "Late previews",
    }));
  });
  await page.waitForFunction(() => typeof (window as any).releasePreview === "function");
  await page.evaluate(async () => {
    const w = window as any;
    w.root.unmount();
    w.releasePreview();
    await w.transform;
  });
  const leaked = await page.evaluate(() => {
    const w = window as any;
    return w.urls.made.filter((url: string) => !w.urls.retired.includes(url));
  });
  assert.deepEqual(leaked, [], "all document and late-result preview URLs released");
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, "shell-results.json"),
    JSON.stringify(
      {
        captures,
        features:
          "file failure/retry, measured previews, retained failed draft, retry/dedup/focus, discard isolation, newer-file ownership, stale hashing, StrictMode, queued-task cancellation and late transform/preview cleanup",
        errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `PASS editor loading/recovery; ${captures.length} layout captures, forced colours/reduced motion, no console errors or leaked thumbnails`,
  );
} finally {
  await browser.close();
}
