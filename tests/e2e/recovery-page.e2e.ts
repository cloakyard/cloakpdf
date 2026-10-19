/** Real production 404 + installed-app routing. Requires a local Workers asset server. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { launch } from "puppeteer-core";

const base = process.env.E2E_URL ?? "http://127.0.0.1:8134/";
const output = process.env.AIR_EVIDENCE_DIR ?? "/tmp/cloakpdf-air-recovery-page";
await mkdir(output, { recursive: true });
const browser = await launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const rows: unknown[] = [];
const errors: string[] = [];
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
try {
  const page = await browser.newPage();
  page.on("pageerror", (error) => errors.push(String(error)));
  const missing = new URL(
    `missing/${"a-long-document-address-".repeat(8)}?example=%3Cscript%3E`,
    base,
  );
  for (const javascript of [true, false]) {
    await page.setJavaScriptEnabled(javascript);
    for (const theme of ["light", "dark"]) {
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
      for (const [width, height] of sizes) {
        await page.setViewport({ width, height, hasTouch: width <= 1024 });
        const response = await page.goto(missing.href, { waitUntil: "networkidle0" });
        assert.equal(response?.status(), 404, "Host must return an actual 404");
        for (const root of javascript ? [16, 32] : [16]) {
          const result = await page.evaluate(async (fontSize) => {
            document.documentElement.style.fontSize = `${fontSize}px`;
            await document.fonts.ready;
            const nodes = [
              ...document.querySelectorAll<HTMLElement>(
                "header a, main p, main h1, main a, main code, footer a, footer p",
              ),
            ].filter((n) => n.getClientRects().length);
            const bounds = nodes.flatMap((node) => {
              const range = document.createRange();
              range.selectNodeContents(node);
              return [...range.getClientRects()]
                .filter((r) => r.width > 0 && (r.left < -1 || r.right > innerWidth + 1))
                .map((r) => ({ text: node.textContent, x: r.x, right: r.right }));
            });
            const targets = [
              ...document.querySelectorAll<HTMLElement>("header a, main a, footer a"),
            ];
            return {
              overflow: document.documentElement.scrollWidth > innerWidth,
              coarsePointer: matchMedia("(pointer: coarse)").matches,
              bounds,
              smallTargets: targets
                .filter(
                  (n) =>
                    n.getBoundingClientRect().height <
                    (matchMedia("(pointer: coarse)").matches ? 43.5 : 39.5),
                )
                .map((n) => n.textContent),
              background: getComputedStyle(document.body).backgroundColor,
              path: document.querySelector("#requested-path")?.textContent,
              pathHidden: document.querySelector("#requested-path")?.parentElement?.hidden,
              mainCount: document.querySelectorAll("main").length,
              headingCount: document.querySelectorAll("h1").length,
              fonts: [...document.querySelectorAll('link[as="font"]')].length,
              mark: document.querySelector(".air-page-mark")?.getBoundingClientRect().width,
            };
          }, root);
          assert.equal(result.overflow, false, JSON.stringify({ width, height, root, result }));
          assert.deepEqual(result.bounds, [], JSON.stringify({ width, height, root, result }));
          assert.deepEqual(result.smallTargets, []);
          assert.equal(
            result.background,
            theme === "light" ? "rgb(250, 251, 252)" : "rgb(16, 18, 22)",
          );
          assert.equal(result.mainCount, 1);
          assert.equal(result.headingCount, 1);
          assert.equal(result.mark, 36);
          assert.equal(result.fonts, 0);
          assert.equal(result.pathHidden, !javascript);
          if (javascript) assert.equal(result.path, missing.pathname + missing.search);
          rows.push({ javascript, theme, width, height, root, ...result });
          if (javascript && [320, 390, 768, 1280, 1440].includes(width)) {
            await page.screenshot({
              path: resolve(output, `${width}-${theme}-${root}.png`),
              fullPage: true,
            });
          }
        }
      }
    }
  }
  // Without scripts, keyboard recovery still reaches the main content and real home URL.
  await page.setViewport({ width: 390, height: 844, hasTouch: true });
  await page.goto(missing.href, { waitUntil: "networkidle0" });
  await page.keyboard.press("Tab");
  assert.ok(await page.$eval(".air-page-skip", (n) => n === document.activeElement));
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "main-content");
  await page.click("main .air-button");
  assert.equal(new URL(page.url()).pathname, new URL(base).pathname);
  await page.setJavaScriptEnabled(true);
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForSelector("#home-title");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const installedMissing = await page.goto(missing.href, { waitUntil: "networkidle0" });
  assert.equal(
    installedMissing?.status(),
    404,
    "Installed app must not turn unknown URLs into the home screen",
  );
  assert.equal(await page.$eval("h1", (n) => n.textContent), "This page isn’t here.");
  const assets = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map((n) => n.href),
  );
  for (const asset of assets) assert.equal((await fetch(asset)).status, 200);
  const cdp = await page.createCDPSession();
  for (const feature of ["prefers-reduced-motion", "forced-colors"]) {
    await cdp.send("Emulation.setEmulatedMedia", {
      features: [{ name: feature, value: feature === "forced-colors" ? "active" : "reduce" }],
    });
    await page.keyboard.press("Tab");
    await page.screenshot({ path: resolve(output, `${feature}.png`), fullPage: true });
  }
  // Keep valid offline entry points, including query strings and /index.html.
  await page.setOfflineMode(true);
  for (const path of ["?source=install", "index.html?source=bookmark"]) {
    const response = await page.goto(new URL(path, base).href, { waitUntil: "load" });
    assert.equal(response?.status(), 200);
    await page.waitForSelector("#home-title");
  }
  await page.setOfflineMode(false);
  assert.deepEqual(errors, []);
  await writeFile(
    resolve(output, "results.json"),
    JSON.stringify(
      {
        rows,
        errors,
        checks: [
          "Actual host 404 before and after SW install",
          "Shared built CSS resolves",
          "No-JS keyboard/home recovery",
          "Valid root and index offline navigation",
          "Path text safety, no retired font preload",
          "Reduced motion and forced colours",
        ],
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `PASS: ${rows.length} recovery layouts; HTTP 404 before/after install, no-JS keyboard/home, real offline entries and shared CSS.`,
  );
} finally {
  await browser.close();
}
