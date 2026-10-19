/** Air editor navigation: real document, responsive chrome, state and keyboard ownership. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PDFDocument, StandardFonts } from "@pdfme/pdf-lib";
import { launch } from "puppeteer-core";
import { EDITOR_TOOLS } from "../../src/editor/tools.ts";

const output = process.env.AIR_EVIDENCE_DIR ?? "/tmp/cloakpdf-air-navigation";
await mkdir(output, { recursive: true });
const pdf = await PDFDocument.create();
const font = await pdf.embedFont(StandardFonts.Helvetica);
for (let i = 1; i <= 3; i++) {
  const p = pdf.addPage([595, 842]);
  p.drawText(`A little room to think. Page ${i}`, { x: 48, y: 740, size: 20, font });
  p.drawText("A synthetic document for the Air editor study.", { x: 48, y: 700, size: 12, font });
}
const fixture = resolve(output, "Air workspace study.pdf");
await writeFile(fixture, await pdf.save());
const browser = await launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage();
await page.setBypassServiceWorker(true);
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
const rows: unknown[] = [];
try {
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(process.env.E2E_URL ?? "http://localhost:5173", { waitUntil: "networkidle2" });
  await (await page.$('input[type="file"]'))!.uploadFile(fixture);
  await page.waitForSelector('img[alt="Page 1"]');
  // View changes preserve page and zoom; same-mode tool switches keep the actual page node.
  await page.click('button[aria-label="Next page"]');
  await page.click('button[aria-label="Zoom in"]');
  await page.waitForSelector('img[alt="Page 2"]');
  await page.evaluate(() => {
    document
      .querySelector('img[alt="Page 2"]')!
      .setAttribute("data-persistence-proof", "same-page");
  });
  await page.click('button[aria-label="Annotate"]');
  await page.click('button[aria-label="Signature"]');
  assert.ok(await page.$('[data-persistence-proof="same-page"]'));
  assert.match(await page.$eval(".editor-topbar", (n) => n.textContent!), /120%/);
  await page.click('button[aria-label="Signature"]');
  await page.click('button[aria-label="Fit to screen"]');
  await page.click('button[aria-label="2-column grid"]');
  await page.click('button[aria-label="Single page"]');
  await page.waitForSelector('img[alt="Page 2"]');
  for (let repeat = 0; repeat < 2; repeat++) {
    await page.click('[aria-label="Search tools"]');
    await page.waitForSelector("#command-palette-query");
    await page.type("#command-palette-query", "page numbers");
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      () =>
        document.activeElement?.matches(".editor-properties h2") &&
        document.activeElement.textContent === "Page numbers",
    );
    await page.keyboard.press("Tab");
    assert.ok(await page.evaluate(() => !!document.activeElement?.closest(".editor-properties")));
  }
  await page.click('[aria-label="Page numbers"]');
  const cdp = await page.createCDPSession();
  const sizes = [
    [320, 568],
    [375, 812],
    [390, 844],
    [430, 932],
    [844, 390],
    [767, 1024],
    [768, 1024],
    [769, 1024],
    [1023, 768],
    [1024, 768],
    [1025, 768],
    [1280, 720],
    [1366, 768],
    [1440, 900],
    [1920, 1080],
    [844, 499],
    [844, 500],
    [844, 501],
  ];
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
    for (const [width, height] of sizes) {
      await page.setViewport({ width, height });
      await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: width <= 1024 });
      for (const root of [16, 32]) {
        await page.evaluate((size) => {
          document.documentElement.style.fontSize = `${size}px`;
        }, root);
        const mobile = width < 768 || (width < 1024 && height < 500);
        await page.waitForSelector(
          mobile ? '[data-testid="mobile-tool-sheet"]' : ".editor-toolrail",
        );
        await page.waitForFunction(
          (layout) =>
            document.querySelector(".editor-topbar")?.getAttribute("data-layout") === layout,
          {},
          mobile ? "mobile" : width < 1024 ? "tablet" : "desktop",
        );
        const states = mobile ? ["closed", "picker", "expanded"] : ["rail"];
        if (width < 1024) states.push("document");
        for (const state of states) {
          if (state === "picker") {
            // First-install production cache feedback can cover the bottom dock.
            const notice = await page.$(
              '.pdf-toast button[aria-label="Dismiss cache status"], .pdf-toast-actions > button:first-child',
            );
            if (notice) {
              await notice.click();
              await page.waitForSelector(".pdf-toast", { hidden: true });
            }
            await page.locator('[aria-label="Open tools"]').click();
            await page.waitForSelector('[aria-label="Expand controls"]');
          }
          if (state === "expanded") {
            await page.click('[aria-label="Expand controls"]');
            await page.waitForSelector('[aria-label="Return to split view"]');
          }
          if (state === "document") {
            await page.click('button[aria-label="Document information"]');
            await page.waitForSelector("#editor-document-info:popover-open");
          }
          const result = await page.evaluate(async () => {
            await new Promise(requestAnimationFrame);
            const selectors = [
              ".editor-topbar",
              ".editor-toolrail",
              ".editor-mobile-sheet__header",
              ".editor-mobile-sheet__body",
              "#editor-document-info:popover-open",
            ];
            const regions = selectors
              .flatMap((s) => [...document.querySelectorAll<HTMLElement>(s)])
              .filter((n) => n.getClientRects().length);
            const min = matchMedia("(pointer: coarse)").matches ? 44 : 40;
            const rect = (n: HTMLElement) => {
              const r = n.getBoundingClientRect();
              return [r.x, r.y, r.width, r.height];
            };
            return {
              layout: document.querySelector(".editor-topbar")!.getAttribute("data-layout"),
              headerHeight: document.querySelector(".editor-topbar")!.getBoundingClientRect()
                .height,
              overflow: regions
                .filter((n) => n.scrollWidth > n.clientWidth + 1)
                .map((n) => n.className),
              clipped: regions
                .filter((n) => {
                  const r = n.getBoundingClientRect();
                  return (
                    r.x < -1 || r.right > innerWidth + 1 || r.y < -1 || r.bottom > innerHeight + 1
                  );
                })
                .map((n) => [n.className, rect(n)]),
              undersized: regions
                .flatMap((n) => [...n.querySelectorAll<HTMLElement>("button")])
                .filter(
                  (n) => n.getClientRects().length && n.getBoundingClientRect().height < min - 0.5,
                )
                .map((n) => n.getAttribute("aria-label") ?? n.textContent),
              bodyHeight:
                document.querySelector(".editor-mobile-sheet__body")?.getBoundingClientRect()
                  .height ?? null,
            };
          });
          rows.push({ theme, width, height, root, state, ...result });
          assert.equal(result.layout, mobile ? "mobile" : width < 1024 ? "tablet" : "desktop");
          assert.deepEqual(result.overflow, [], JSON.stringify(rows.at(-1)));
          assert.deepEqual(result.clipped, [], JSON.stringify(rows.at(-1)));
          assert.deepEqual(result.undersized, [], JSON.stringify(rows.at(-1)));
          if (root === 16)
            assert.equal(result.headerHeight, 64, "Toolbar stays in one 64px row at every width");
          if (state === "expanded") assert.ok(result.bodyHeight! > 64, JSON.stringify(rows.at(-1)));
          if (root === 16 && [390, 768, 1280, 1440].includes(width) && state !== "closed")
            await page.screenshot({ path: resolve(output, `${state}-${width}-${theme}.png`) });
          if (state === "document") await page.keyboard.press("Escape");
        }
        if (mobile) {
          await page.click('[aria-label="Close tools"]');
          await page.waitForSelector('[aria-label="Open tools"]');
        }
      }
    }
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "16px";
  });
  await page.setViewport({ width: 390, height: 844 });
  await page.waitForSelector('[aria-label="Open tools"]');
  await page.click('button[aria-label="Document information"]');
  await page.waitForSelector("#editor-document-info:popover-open");
  assert.equal(
    await page.$eval("#editor-document-name", (n) => n.textContent),
    "Air workspace study.pdf",
  );
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement?.textContent?.trim()),
    "Back to home",
  );
  await page.keyboard.press("Escape");
  await page.waitForSelector("#editor-document-info:popover-open", { hidden: true });
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    "Document information",
  );
  await page.mouse.move(380, 300);
  await page.hover('button[aria-label="Document information"]');
  await page.waitForSelector("#editor-document-info:popover-open");
  await page.hover("#editor-document-info");
  assert.ok(await page.$("#editor-document-info:popover-open"));
  await page.keyboard.press("Escape");
  await page.click('button[aria-label="Document information"]');
  await page.click('[aria-label="Next page"]');
  await page.waitForSelector("#editor-document-info:popover-open", { hidden: true });
  await page.click('button[aria-label="Document information"]');
  await page.keyboard.down("Control");
  await page.keyboard.press("k");
  await page.keyboard.up("Control");
  await page.waitForSelector("#command-palette-query");
  await page.waitForSelector("#editor-document-info:popover-open", { hidden: true });
  await page.keyboard.press("Escape");
  await page.waitForSelector("#command-palette-query", { hidden: true });
  await page.click('[aria-label="Open tools"]');
  await page.type("#mobile-editor-tool-search", "qzx no such tool");
  assert.equal(await page.$eval(".editor-mobile-empty > p", (n) => n.textContent), "No tool found");
  await page.click('[aria-label="Clear editor tool search"]');
  assert.equal(await page.evaluate(() => document.activeElement?.id), "mobile-editor-tool-search");
  await page.type("#mobile-editor-tool-search", "page numbers");
  assert.equal(
    await page.$eval(".editor-mobile-tool-list button", (node) => node.getAttribute("aria-label")),
    "Page numbers",
  );
  await page.keyboard.press("Tab"); // clear control
  await page.keyboard.press("Tab"); // matching tool
  await page.keyboard.press("Enter");
  await page.waitForSelector('[aria-label="Done"]');
  assert.equal(await page.evaluate(() => document.activeElement?.tagName), "H2");
  await page.click('[aria-label="Expand controls"]');
  await page.click('[aria-label="Return to split view"]');
  await page.click('[aria-label="Cancel"]');
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    "Open tools",
  );
  // Exercise real commit/undo and keep document shortcuts out of Export's modal.
  await page.setViewport({ width: 1440, height: 900 });
  await page.waitForSelector(".editor-toolrail");
  await page.click('[aria-label="Page numbers"]');
  await page.waitForSelector(".editor-properties");
  const apply = await page.$("button::-p-text(Add page numbers)");
  assert.ok(apply, "Page numbers apply action");
  await apply.click();
  await page.waitForFunction(
    () => document.querySelector('[aria-label="Undo"]')?.getAttribute("aria-disabled") === "false",
  );
  await page.click('[aria-label="Export"]');
  await page.waitForSelector('[role="dialog"]');
  await page.focus('[aria-label="Close export"]');
  await page.keyboard.down("Control");
  await page.keyboard.press("z");
  await page.keyboard.up("Control");
  assert.equal(
    await page.$eval('[aria-label="Undo"]', (n) => n.getAttribute("aria-disabled") === "true"),
    false,
  );
  await page.keyboard.press("Escape");
  await page.waitForSelector('[role="dialog"]', { hidden: true });
  await page.keyboard.down("Control");
  await page.keyboard.press("z");
  await page.keyboard.up("Control");
  await page.waitForFunction(
    () => document.querySelector('[aria-label="Redo"]')?.getAttribute("aria-disabled") === "false",
  );
  // History boundaries retain the initiating control on desktop/tablet/phone.
  // Semantic disabling must guard pointer and keyboard activation, not just look dim.
  for (const width of [1440, 768, 390]) {
    await page.focus('[aria-label="Undo"]');
    await page.setViewport({ width, height: 900 });
    await page.waitForFunction(
      (layout) => document.querySelector(".editor-topbar")?.getAttribute("data-layout") === layout,
      {},
      width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop",
    );
    await page.evaluate(async () => {
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    });
    assert.equal(
      await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
      "Undo",
    );
    for (const [label, opposite] of [
      ["Redo", "Undo"],
      ["Undo", "Redo"],
    ]) {
      const selector = `button[aria-label="${label}"]`;
      await page.focus(selector);
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        (sel) => document.querySelector(sel)?.getAttribute("aria-disabled") === "true",
        {},
        selector,
      );
      assert.equal(
        await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
        label,
      );
      const before = await page.$eval('img[alt="Page 3"]', (n) => n.getAttribute("src"));
      await page.keyboard.press("Space");
      await page.click(selector);
      assert.equal(await page.$eval('img[alt="Page 3"]', (n) => n.getAttribute("src")), before);
      assert.equal(
        await page.$eval(`[aria-label="${opposite}"]`, (n) => n.getAttribute("aria-disabled")),
        "false",
      );
      assert.equal(
        await page.$eval(
          selector,
          (n) => getComputedStyle(n).opacity === (n.matches(":focus-visible") ? "1" : "0.5"),
        ),
        true,
      );
      assert.equal(
        await page.$eval(selector, (n) => getComputedStyle(n).backgroundColor),
        "rgba(0, 0, 0, 0)",
      );
      await page.mouse.down();
      assert.equal(await page.$eval(selector, (n) => getComputedStyle(n).transform), "none");
      await page.mouse.up();
    }
  }
  await page.setViewport({ width: 1440, height: 900 });
  await page.click('[aria-label="Redo"]');
  await page.focus('[aria-label="Reset to original"]');
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () => document.querySelector('[aria-label="Undo"]')?.getAttribute("aria-disabled") === "true",
  );
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    "Reset to original",
  );
  for (const key of ["Enter", "Space"] as const) await page.keyboard.press(key);
  assert.equal(
    await page.$eval('[aria-label="Redo"]', (n) => n.getAttribute("aria-disabled")),
    "true",
  );
  await page.focus('[aria-label="Undo"]');
  await page.keyboard.press("Tab");
  await page.keyboard.down("Shift");
  await page.keyboard.press("Tab");
  await page.keyboard.up("Shift");
  assert.deepEqual(
    await page.$eval('[aria-label="Undo"]', (n) => ({
      visible: n.matches(":focus-visible"),
      opacity: getComputedStyle(n).opacity,
      outline: getComputedStyle(n).outlineStyle,
    })),
    { visible: true, opacity: "1", outline: "solid" },
  );
  // Reduced motion and high contrast still expose active selection and focus.
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-reduced-motion", value: "reduce" },
      { name: "forced-colors", value: "active" },
    ],
  });
  await page.click('[aria-label="Annotate"]');
  assert.equal(
    await page.$eval(
      '.editor-toolrail [aria-pressed="true"]',
      (n) => getComputedStyle(n).outlineStyle,
    ),
    "solid",
  );
  await cdp.send("Emulation.setEmulatedMedia", { features: [] });
  // Every registered tool must remain reachable from the shared command surface
  // on desktop, laptop, tablet and phone. Switching tools preserves source pages.
  const registryRows: unknown[] = [];
  const sourcePreview = await page.$eval('img[alt="Page 3"]', (n) => n.getAttribute("src"));
  for (const [width, height] of [
    [1440, 900],
    [1280, 720],
    [768, 1024],
    [390, 844],
  ]) {
    await page.setViewport({ width, height });
    for (const theme of ["light", "dark"] as const) {
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
      for (const tool of EDITOR_TOOLS) {
        await page.keyboard.down("Control");
        await page.keyboard.press("k");
        await page.keyboard.up("Control");
        await page.waitForSelector("#command-palette-query");
        await page.type("#command-palette-query", tool.name);
        assert.equal(
          await page.evaluate((name) => {
            const label = [...document.querySelectorAll(".pdf-command-option__label")].find(
              (node) => node.textContent === name,
            );
            const option = label?.closest<HTMLElement>("[role=option]");
            option?.click();
            return !!option;
          }, tool.name),
          true,
          `${tool.id} is searchable`,
        );
        await page.waitForFunction(
          (name) =>
            document.activeElement?.tagName === "H2" && document.activeElement.textContent === name,
          {},
          tool.name,
        );
        await page.waitForSelector("#command-palette-query", { hidden: true });
        assert.equal(
          await page.$eval('img[alt="Page 3"]', (n) => n.getAttribute("src")),
          sourcePreview,
        );
        const overflow = await page.$eval(
          'main[aria-label="PDF editor"]',
          (n) => n.scrollWidth > n.clientWidth + 1,
        );
        assert.equal(overflow, false, `${tool.id} ${width} ${theme} fits`);
        assert.equal(
          await page.$eval('[aria-label="Undo"]', (n) => n.getAttribute("aria-disabled")),
          "true",
          "tool selection does not mutate the document",
        );
        registryRows.push({ tool: tool.id, width, height, theme });
      }
      await page.screenshot({ path: resolve(output, `registry-${width}-${theme}.png`) });
    }
  }
  await writeFile(
    resolve(output, "registry-routes.json"),
    JSON.stringify(registryRows, null, 2) + "\n",
  );
  console.log(
    `PASS: ${registryRows.length} registered tool selections preserve pages, focus and history.`,
  );
  await page.setViewport({ width: 1440, height: 900 });
  await page.waitForSelector('[aria-label="Back to home"]', { visible: true });
  await page.click('[aria-label="Back to home"]');
  const longName =
    "Air workspace study with a very long filename for a multilingual annual report and supporting documents 2026.pdf";
  const longFile = resolve(output, longName);
  await writeFile(longFile, await pdf.save());
  await page.waitForSelector('input[type="file"]');
  await (await page.$('input[type="file"]'))!.uploadFile(longFile);
  await page.waitForFunction(
    (name) => document.querySelector(".editor-topbar__file > span")?.getAttribute("title") === name,
    {},
    longName,
  );
  for (const width of [320, 768, 1280, 1440]) {
    await page.setViewport({ width, height: 900 });
    await page.waitForFunction(
      (mobile) =>
        (document.querySelector(".editor-topbar")?.getAttribute("data-layout") === "mobile") ===
        mobile,
      {},
      width < 768,
    );
    assert.deepEqual(
      await page.$eval(".editor-topbar", (node) => {
        const el = node as HTMLElement;
        const name = el.querySelector(
          ".editor-topbar__file > span, #editor-document-name",
        ) as HTMLElement;
        return {
          fits: el.scrollWidth <= el.clientWidth + 1,
          text: name.textContent,
        };
      }),
      { fits: true, text: longName },
    );
    if (width < 1024) {
      await page.click('button[aria-label="Document information"]');
      await page.waitForSelector("#editor-document-info:popover-open");
      assert.equal(
        await page.$eval("#editor-document-info", (n) => n.scrollWidth <= n.clientWidth + 1),
        true,
      );
      await page.keyboard.press("Escape");
    }
  }
  assert.deepEqual(errors, []);
  await writeFile(resolve(output, "geometry.json"), JSON.stringify(rows, null, 2) + "\n");
  console.log(
    `PASS: ${rows.length} navigation layouts; page/zoom persistence, view modes, mobile search and focus, expanded controls, real apply/undo, modal shortcut ownership, reduced motion and forced colours.`,
  );
} catch (error) {
  await page.screenshot({ path: resolve(output, "failure.png") });
  console.error(
    await page.evaluate(() => ({
      text: document.body.innerText.slice(-1500),
      active: document.activeElement?.tagName,
      sheet: document.querySelector(".editor-mobile-sheet")?.outerHTML.slice(0, 1300),
    })),
  );
  throw error;
} finally {
  await browser.close();
}
