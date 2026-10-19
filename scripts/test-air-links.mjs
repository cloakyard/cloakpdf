/** Public-page link conformance. Supply SITE_URL, AIR_ROUTES (comma-separated),
 * AIR_EVIDENCE_DIR, CHROME_PATH and external PUPPETEER_MODULE as needed.
 * Inspects every visible link, including nested text, without following downloads. */
import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const { default: puppeteer } = await import(process.env.PUPPETEER_MODULE || "puppeteer-core");
const base = process.env.SITE_URL || "http://127.0.0.1:8180";
const routes = (process.env.AIR_ROUTES || "/").split(",");
const out = process.env.AIR_EVIDENCE_DIR
  ? resolve(process.env.AIR_EVIDENCE_DIR)
  : await mkdtemp(join(tmpdir(), "air-links-"));
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const evidence = { base, layouts: [], interactions: [], errors: [] };
try {
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  page.on("pageerror", (error) => evidence.errors.push(error.message));
  async function inspect(state) {
    const result = await page.evaluate(() => {
      const visible = (node) =>
        !node.closest("[inert]") &&
        node.getClientRects().length &&
        getComputedStyle(node).visibility !== "hidden";
      const probe = document.createElement("span");
      // Product reduced-motion resets can still assign a tiny colour transition.
      probe.style.setProperty("transition", "none", "important");
      document.body.append(probe);
      const allowed = ["ink", "ink-secondary", "ink-muted", "action", "on-action"].map((token) => {
        probe.style.color = `var(--air-${token})`;
        return getComputedStyle(probe).color;
      });
      probe.remove();
      const links = [...document.querySelectorAll("a")].filter(visible).map((link) => {
        const textColours = [...link.querySelectorAll("*")]
          .filter(
            (node) =>
              visible(node) &&
              [...node.childNodes].some(
                (child) => child.nodeType === 3 && child.textContent.trim(),
              ),
          )
          .map((node) => getComputedStyle(node).color);
        const style = getComputedStyle(link);
        return {
          label: link.textContent.trim() || link.getAttribute("aria-label"),
          href: link.getAttribute("href"),
          colour: style.color,
          neutral: [style.color, ...textColours].every((colour) => allowed.includes(colour)),
        };
      });
      return { links, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
    });
    assert.ok(result.links.length, `${state.route}: no links`);
    assert.deepEqual(
      result.links.filter((link) => !link.neutral),
      [],
      `${JSON.stringify(state)} non-neutral hyperlink`,
    );
    assert.equal(result.overflow, false, `${JSON.stringify(state)} overflow`);
    evidence.layouts.push({ ...state, ...result });
  }
  for (const route of routes)
    for (const theme of ["light", "dark"]) {
      await page.emulateMediaFeatures([
        { name: "prefers-color-scheme", value: theme },
        { name: "prefers-reduced-motion", value: "reduce" },
      ]);
      await page.goto(base + route, { waitUntil: "networkidle0" });
      if (process.env.AIR_OPEN_LABEL) {
        const buttons = await page.$$("button");
        let opened = false;
        for (const button of buttons)
          if (
            await button.evaluate(
              (node, label) => node.textContent.trim() === label,
              process.env.AIR_OPEN_LABEL,
            )
          ) {
            await button.focus();
            await page.keyboard.press("Enter");
            opened = true;
            break;
          }
        assert.ok(opened, `Missing public-page trigger: ${process.env.AIR_OPEN_LABEL}`);
        assert.ok(process.env.AIR_OPEN_TARGET, "Set AIR_OPEN_TARGET to verify the opened surface");
        await page.waitForSelector(process.env.AIR_OPEN_TARGET, { visible: true });
      }
      await page.evaluate(() => new Promise(requestAnimationFrame));
      for (const [width, height] of [
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
      ]) {
        await page.setViewport({ width, height });
        await inspect({ route, theme, width, height, state: "rest" });
        const menus = await page.$$("header details");
        for (const menu of menus)
          if (await menu.evaluate((node) => node.getClientRects().length > 0)) {
            await menu.evaluate((node) => {
              node.open = true;
            });
            await inspect({ route, theme, width, height, state: "menu" });
            await menu.evaluate((node) => {
              node.open = false;
            });
          }
        if ([390, 1280, 1440].includes(width)) {
          await page.evaluate(() => scrollTo(0, 0));
          await page.screenshot({
            path: `${out}/${route.replaceAll("/", "_")}-${width}-${theme}.png`,
            fullPage: true,
          });
        }
      }
      await page.setViewport({ width: 320, height: 568 });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "32px";
      });
      await inspect({ route, theme, width: 320, textSize: 32 });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "";
      });
      await page.setViewport({ width: 1440, height: 900, hasTouch: false });
      const links = await page.$$("a");
      for (const link of links) {
        if (
          !(await link.evaluate(
            (node) =>
              !node.closest("[inert]") &&
              node.getClientRects().length &&
              getComputedStyle(node).visibility !== "hidden",
          ))
        )
          continue;
        if (
          !(await link.evaluate((node) =>
            node.matches(".skip-link, .air-page-skip, .img-skip, .resume-skip"),
          ))
        )
          await link.hover();
        await inspect({
          route,
          theme,
          state: "hover",
          href: await link.evaluate((node) => node.getAttribute("href")),
        });
        await page.keyboard.press("Tab");
        await link.focus();
        await inspect({ route, theme, state: "focus" });
        const focus = await link.evaluate((node) => ({
          label: node.textContent.trim() || node.getAttribute("aria-label"),
          visible: node.matches(":focus-visible"),
          outline: getComputedStyle(node).outlineStyle,
          width: parseFloat(getComputedStyle(node).outlineWidth),
        }));
        assert.ok(
          focus.visible && focus.outline !== "none" && focus.width >= 2,
          `${route}: missing keyboard focus ${focus.label}`,
        );
        evidence.interactions.push({ route, theme, ...focus });
      }
      await page.screenshot({ path: `${out}/${route.replaceAll("/", "_")}-focus-${theme}.png` });
    }
  assert.deepEqual(evidence.errors, []);
  await writeFile(`${out}/links.json`, JSON.stringify(evidence, null, 2) + "\n");
  console.log(
    `All links neutral: ${evidence.layouts.length} layout/state checks, ${evidence.interactions.length} keyboard checks. Evidence: ${out}`,
  );
} finally {
  await browser.close();
}
