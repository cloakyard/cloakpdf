/** Shared Air modal matrix, used by state/recovery and real-model integration tests. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import type { Page } from "puppeteer-core";

export async function auditAirDialog(page: Page, state: string, evidenceDir: string) {
  const cdp = await page.createCDPSession();
  const viewport = page.viewport();
  const geometry: unknown[] = [];
  await mkdir(evidenceDir, { recursive: true });
  await page.evaluate(async () => {
    await Promise.all(
      document
        .querySelector(".pdf-modal-root")!
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished.catch(() => {})),
    );
  });
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
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
      [639, 800],
      [640, 800],
      [641, 800],
    ]) {
      await page.setViewport({ width, height, deviceScaleFactor: 1 });
      await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: width <= 1024 });
      for (const root of [16, 32]) {
        const row = await page.evaluate(async (fontSize) => {
          document.documentElement.style.fontSize = `${fontSize}px`;
          const panel = document.querySelector<HTMLElement>('[role="dialog"]')!;
          panel.scrollTop = 0;
          await new Promise(requestAnimationFrame);
          const box = panel.getBoundingClientRect();
          const minimum = matchMedia("(pointer: coarse)").matches ? 44 : 40;
          return {
            pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
            dialogOverflow: panel.scrollWidth > panel.clientWidth + 1,
            contained:
              box.left >= -1 &&
              box.top >= -1 &&
              box.right <= innerWidth + 1 &&
              box.bottom <= innerHeight + 1,
            undersized: [...panel.querySelectorAll<HTMLElement>("button,a")]
              .filter(
                (node) =>
                  !node.matches(":disabled") && node.getBoundingClientRect().height < minimum - 0.5,
              )
              .map((node) => node.textContent),
          };
        }, root);
        geometry.push({ state, theme, width, height, root, ...row });
        assert.ok(
          row.contained && !row.pageOverflow && !row.dialogOverflow && !row.undersized.length,
          `${state} ${width}/${theme}/${root}: ${JSON.stringify(row)}`,
        );
        if (root === 16 && [320, 390, 768, 1440].includes(width)) {
          if (state === "delete-confirmation")
            await page.$eval('[role="dialog"]', (node) => {
              node.scrollTop = node.scrollHeight;
            });
          await page.screenshot({ path: `${evidenceDir}/${state}-${width}-${theme}.png` });
        }
      }
    }
  }
  if (viewport) await page.setViewport(viewport);
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false });
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "16px";
  });
  await cdp.detach();
  await writeFile(`${evidenceDir}/${state}-geometry.json`, JSON.stringify(geometry, null, 2));
  console.log(`✓ ${state}: 56 theme/viewport/text cases, including dialog breakpoint neighbors`);
}
