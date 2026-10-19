/** Chat UI lifecycle and geometry with a deterministic RAG boundary. Real models: ai-tools.e2e.ts. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { PDFDocument, StandardFonts } from "@pdfme/pdf-lib";
import { launch, type ElementHandle } from "puppeteer-core";
import { startAskPdfServer } from "./helpers/ask-pdf-server.ts";
import type {} from "./fixtures/ask-pdf-runtime.ts";

const server = process.env.CHAT_TEST_URL ? null : await startAskPdfServer();
const url = process.env.CHAT_TEST_URL ?? "http://127.0.0.1:8142";
const evidence = process.env.AIR_EVIDENCE_DIR ?? "/tmp/cloakpdf-air-chat";
await mkdir(evidence, { recursive: true });
const pdf = await PDFDocument.create();
const font = await pdf.embedFont(StandardFonts.Helvetica);
for (const text of [
  "A little room to think. This document is a synthetic Air test fixture.",
  "Keep the source close. Make one clear decision at a time.",
])
  pdf.addPage([600, 800]).drawText(text, { x: 40, y: 700, size: 12, font });
const bytes = await pdf.save();
const fixture = `${evidence}/Air chat fixture.pdf`;
await writeFile(fixture, bytes);
const browser = await launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
const pageErrors: string[] = [];
page.on("pageerror", (error) => pageErrors.push(String(error)));
await page.setBypassServiceWorker(true);
page.setDefaultTimeout(15_000);
async function button(text: string) {
  const handle = await page.waitForFunction(
    (label) =>
      [...document.querySelectorAll("button")].find(
        (node) => node.textContent?.trim() === label && !node.disabled,
      ),
    {},
    text,
  );
  await (handle.asElement() as ElementHandle<HTMLButtonElement>).click();
  await handle.dispose();
}
async function upload(path = fixture) {
  await page.waitForSelector('input[type="file"]');
  await (await page.$('input[type="file"]'))!.uploadFile(path);
}
async function ready() {
  await page.waitForSelector("#pdf-chat-question");
}
async function send(question: string) {
  await page.type("#pdf-chat-question", question);
  await page.keyboard.press("Enter");
}
const geometry: unknown[] = [];
async function audit(state: string) {
  const cdp = await page.createCDPSession();
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
    for (const [width, height] of [
      [320, 568],
      [375, 812],
      [390, 844],
      [430, 932],
      [844, 390],
      [768, 1024],
      [1023, 768],
      [1024, 768],
      [1025, 768],
      [1280, 720],
      [1366, 768],
      [1440, 900],
      [1920, 1080],
      [639, 800],
      [640, 800],
      [641, 800],
    ]) {
      await page.setViewport({ width, height });
      await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: width <= 1024 });
      for (const root of [16, 32]) {
        const row = await page.evaluate(async (size) => {
          document.documentElement.style.fontSize = `${size}px`;
          await new Promise(requestAnimationFrame);
          const scope = document.querySelector<HTMLElement>(".pdf-chat-workspace")!;
          const log = scope.querySelector<HTMLElement>(".pdf-chat-log");
          const minimum = matchMedia("(pointer: coarse)").matches ? 44 : 40;
          return {
            pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
            scopeOverflow: scope.scrollWidth > scope.clientWidth + 1,
            logOverflow: log ? log.scrollWidth > log.clientWidth + 1 : false,
            smallControls: [...scope.querySelectorAll<HTMLElement>("button, .pdf-chat-sources a")]
              .filter(
                (node) =>
                  node.getClientRects().length &&
                  node.getBoundingClientRect().height < minimum - 0.5,
              )
              .map((node) => node.textContent),
            inputSize: log ? getComputedStyle(scope.querySelector("textarea")!).fontSize : null,
          };
        }, root);
        geometry.push({ state, theme, width, height, root, ...row });
        assert.ok(
          !row.pageOverflow && !row.scopeOverflow && !row.logOverflow && !row.smallControls.length,
          JSON.stringify(geometry.at(-1)),
        );
        if (root === 16 && [320, 390, 768, 1440].includes(width)) {
          await page.$eval(".pdf-chat-workspace", (node) =>
            node.scrollIntoView({ block: "start" }),
          );
          await page.screenshot({
            path: `${evidence}/${state}-${width}-${theme}.png`,
            fullPage: true,
          });
        }
      }
    }
  }
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false });
  await cdp.detach();
  await page.setViewport({ width: 1440, height: 900 });
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "16px";
  });
  console.log(`✓ ${state}: 64 size/theme/text cases`);
}
try {
  await page.goto(url, { waitUntil: "networkidle2" });
  await page.locator("button ::-p-text(Ask your PDF)").click();
  await upload();
  await page.waitForFunction(() => window.airChatTest?.indexes.length === 1);
  assert.equal(
    await page.$eval('[role="progressbar"]', (node) => node.hasAttribute("aria-valuenow")),
    false,
  );
  await page.evaluate(() =>
    window.airChatTest.indexes[0].progress({
      kind: "extract",
      phase: "text-layer",
      current: 1,
      total: 2,
    }),
  );
  await page.waitForFunction(
    () => document.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow") === "1",
  );
  assert.equal(
    await page.$eval('[role="progressbar"]', (node) => node.getAttribute("aria-valuemax")),
    "2",
  );
  await audit("indexing");
  for (const progress of [
    { kind: "extract", phase: "ocr", current: 2, total: 3 },
    { kind: "embed", current: 2, total: 7 },
  ] as const) {
    await page.evaluate((value) => window.airChatTest.indexes[0].progress(value), progress);
    await page.waitForFunction(
      (total) =>
        document.querySelector('[role="progressbar"]')?.getAttribute("aria-valuemax") ===
        String(total),
      {},
      progress.total,
    );
    assert.equal(
      await page.$eval('[role="progressbar"]', (node) => node.getAttribute("aria-valuenow")),
      "2",
    );
  }
  await page.evaluate(() =>
    window.airChatTest.indexes[0].fail("Unable to read the document cache. Try again."),
  );
  await page.waitForSelector("#pdf-chat-recovery-title");
  await audit("index-error");
  assert.equal(await page.evaluate(() => window.airChatTest.indexes.length), 1);
  await button("Try preparing again");
  await page.waitForFunction(() => window.airChatTest.indexes.length === 2);
  await page.evaluate(() => window.airChatTest.indexes[1].fail("No usable text was found"));
  await page.waitForFunction(
    () =>
      document.querySelector("#pdf-chat-recovery-title")?.textContent === "No readable text found",
  );
  // A failed attempt stays failed; only an explicit click starts another job.
  await audit("no-text");
  assert.equal(await page.evaluate(() => window.airChatTest.indexes.length), 2);
  await button("Try preparing again");
  await page.waitForFunction(() => window.airChatTest.indexes.length === 3);
  await page.evaluate(() => window.airChatTest.indexes[2].finish());
  await ready();
  assert.equal(await page.evaluate(() => document.activeElement?.id), "pdf-chat-question");
  await audit("empty");
  await page.type("textarea", "First question");
  await page.evaluate(() =>
    document
      .querySelector("textarea")!
      .dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true }),
      ),
  );
  assert.equal(await page.evaluate(() => window.airChatTest.answers.length), 0);
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.airChatTest.answers.length === 1);
  await page.type("textarea", "Keep this next draft");
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => window.airChatTest.answers.length), 1);
  assert.equal(await page.$eval("textarea", (node) => node.value), "Keep this next draft");
  assert.equal((await page.$$("[data-bubble]")).length, 2);
  await page.evaluate(() => {
    window.airChatTest.answers[0].token("A partial answer worth keeping.");
    window.airChatTest.answers[0].fail();
  });
  await page.waitForSelector(".pdf-chat-recovery");
  assert.match(
    await page.$eval('[data-bubble="assistant"]', (node) => node.textContent!),
    /partial answer/,
  );
  await audit("answer-error");
  await button("Retry answer");
  await page.waitForFunction(() => window.airChatTest.answers.length === 2);
  assert.equal(await page.evaluate(() => window.airChatTest.answers[1].question), "First question");
  assert.equal(await page.$eval("textarea", (node) => node.value), "Keep this next draft");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "pdf-chat-question");
  await page.evaluate(() => window.airChatTest.answers[1].finish());
  await page.waitForSelector(".pdf-chat-sources a");
  assert.equal((await page.$$(".pdf-chat-sources a")).length, 2);
  const href = await page.$eval(".pdf-chat-sources a", (node) => node.href);
  assert.ok(href.startsWith("blob:") && href.endsWith("#page=1"));
  assert.equal(
    await page.evaluate(
      async (source) => (await (await fetch(source)).arrayBuffer()).byteLength,
      href,
    ),
    bytes.length,
  );
  await audit("answer");
  await page.focus("textarea");
  const focus = await page.$eval("textarea", (node) => {
    const s = getComputedStyle(node);
    return {
      outline: s.outlineWidth,
      offset: s.outlineOffset,
      shadow: s.boxShadow,
      border: s.borderColor,
    };
  });
  assert.equal(focus.outline, "2px");
  assert.equal(focus.offset, "0px");
  assert.equal(focus.shadow, "none");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.airChatTest.answers.length === 3);
  await page.evaluate(() => window.airChatTest.answers[2].token("A longer answer.\n".repeat(100)));
  await page.waitForFunction(() => {
    const log = document.querySelector(".pdf-chat-log")!;
    return log.scrollHeight - log.scrollTop - log.clientHeight < 3;
  });
  await page.$eval(".pdf-chat-log", (node) => {
    node.scrollTop = 0;
    node.dispatchEvent(new Event("scroll"));
  });
  await page.waitForSelector(".pdf-chat-latest");
  await page.evaluate(() =>
    window.airChatTest.answers[2].token("More text while reading above.\n".repeat(40)),
  );
  await page.waitForFunction(() =>
    document.querySelectorAll('[data-bubble="assistant"]')[1]?.textContent?.includes("More text"),
  );
  assert.equal(await page.$eval(".pdf-chat-log", (node) => node.scrollTop), 0);
  await button("Latest answer");
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("role")), "log");
  await page.evaluate(() =>
    window.airChatTest.answers[2].finish(
      "## Formatting\n\n" +
        "longword".repeat(100) +
        "\n\n```text\n" +
        "code ".repeat(120) +
        "\n```\n\n[Unsafe](javascript:alert(1)) ![No remote pixels](https://invalid.example/track.png)",
    ),
  );
  await page.waitForSelector(".pdf-chat-prose pre");
  assert.equal((await page.$$(".pdf-chat-prose img")).length, 0);
  assert.equal((await page.$$('a[href^="javascript:"]')).length, 0);
  await audit("long-content");
  await page.focus("textarea");
  await page.type("textarea", "Line one");
  await page.keyboard.down("Shift");
  await page.keyboard.press("Enter");
  await page.keyboard.up("Shift");
  await page.type("textarea", "Line two");
  assert.equal(await page.$eval("textarea", (node) => node.value), "Line one\nLine two");
  await page.$eval("textarea", (node) => node.select());
  await page.type("textarea", "x".repeat(510));
  assert.equal(await page.$eval("textarea", (node) => node.value.length), 500);
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.airChatTest.answers.length === 4);
  await button("Change file");
  await upload();
  await page.waitForFunction(() => window.airChatTest.indexes.length === 4);
  await page.evaluate(() => {
    window.airChatTest.answers[3].token("obsolete");
    window.airChatTest.answers[3].finish("obsolete");
  });
  await button("Change file");
  await upload();
  await page.waitForFunction(() => window.airChatTest.indexes.length === 5);
  await page.evaluate(() => window.airChatTest.indexes[3].finish());
  assert.equal(await page.$("textarea"), null);
  await page.evaluate(() => window.airChatTest.indexes[4].finish());
  await ready();
  assert.equal((await page.$$("[data-bubble]")).length, 0);
  assert.equal(await page.$eval("textarea", (node) => node.value), "");
  assert.ok(await page.evaluate(() => window.airChatTest.interrupted > 0));
  assert.equal(
    await page.evaluate(async (source) => {
      try {
        await fetch(source);
        return true;
      } catch {
        return false;
      }
    }, href),
    false,
  );
  await send("Hello");
  await page.waitForFunction(() => window.airChatTest.answers.length === 5);
  await page.evaluate(() => window.airChatTest.answers[4].finish("Hello!", "chitchat"));
  await page.waitForSelector('[data-bubble="assistant"][data-streaming="false"]');
  assert.equal((await page.$$(".pdf-chat-sources")).length, 0);
  const media = await page.createCDPSession();
  await media.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-reduced-motion", value: "reduce" },
      { name: "forced-colors", value: "active" },
    ],
  });
  await page.focus("textarea");
  assert.equal(
    await page.$eval("textarea", (node) => getComputedStyle(node).outlineStyle),
    "solid",
  );
  assert.equal(
    await page.$eval(".pdf-chat", (node) => node.getAnimations({ subtree: true }).length),
    0,
  );
  await send("A question before leaving");
  await page.waitForFunction(() => window.airChatTest.answers.length === 6);
  await page.click('button[aria-label="Back to home"]');
  await page.waitForSelector("#home-title");
  await page.evaluate(() => {
    window.airChatTest.answers[5].token("Obsolete token after navigation");
    window.airChatTest.answers[5].finish();
  });
  assert.equal((await page.$$("[data-bubble]")).length, 0);
  assert.deepEqual(pageErrors, []);
  console.log(
    "✓ Explicit indexing retry; IME, Shift+Enter and limits; guarded send; partial recovery; draft/focus retention; real source bytes; safe markdown; scroll ownership; obsolete-result isolation; source URL cleanup; reduced motion/forced colours",
  );
} catch (error) {
  await page.screenshot({ path: `${evidence}/failure.png`, fullPage: true });
  throw error;
} finally {
  await writeFile(`${evidence}/geometry.json`, JSON.stringify(geometry, null, 2));
  await browser.close();
  await server?.close();
}
