/**
 * Focused keyboard regression for the persistent editor stage:
 *   annotate rectangle → focus canvas → Arrow nudges only the annotation →
 *   one undo reverts the full nudge burst → Delete removes it → with no
 *   selected content, Arrow pans, + zooms, and 0 resets the viewport.
 *
 * Requirements: Chrome at CHROME_PATH and `vp dev` at E2E_URL (5173 by default).
 * Fixture: tests/fixtures/multipage.pdf.
 *
 * Run: node --experimental-strip-types tests/e2e/editor-interactions.e2e.ts
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { CDPSession, KeyInput, Page } from "puppeteer-core";
import { launch } from "puppeteer-core";

const DEV_URL = process.env.E2E_URL ?? "http://localhost:5173";
const CHROME_PATH =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FIXTURE_PATH = resolve(import.meta.dirname, "../fixtures/multipage.pdf");
const USER_DATA_DIR =
  process.env.E2E_USER_DATA_DIR ??
  resolve(import.meta.dirname, "../.puppeteer-profile-editor-interactions");
const STAGE = 'div[role="region"][aria-label^="Page 1 editing canvas"]';
const OVERLAY = `${STAGE} > canvas[aria-hidden="true"]`;

interface OverlayBounds {
  minX: number;
  maxX: number;
}

interface ViewTransform {
  panX: number;
  panY: number;
  zoom: number;
}

interface Point {
  x: number;
  y: number;
}

function fail(message: string): never {
  throw new Error(message);
}

if (!existsSync(CHROME_PATH)) fail(`Chrome not found at ${CHROME_PATH} (set CHROME_PATH).`);
if (!existsSync(FIXTURE_PATH)) fail(`Fixture not found at ${FIXTURE_PATH}.`);

async function clickByText(page: Page, label: string): Promise<boolean> {
  return page.evaluate((text) => {
    const elements = Array.from(document.querySelectorAll("button, a, [role=button]"));
    const element = elements.find(
      (candidate) =>
        (candidate.textContent ?? "").trim().toLowerCase() === text.trim().toLowerCase(),
    );
    if (!element) return false;
    (element as HTMLElement).click();
    return true;
  }, label);
}

async function waitForText(page: Page, pattern: RegExp, timeout = 10_000): Promise<void> {
  await page.waitForFunction(
    (source: string, flags: string) => new RegExp(source, flags).test(document.body.innerText),
    { timeout },
    pattern.source,
    pattern.flags,
  );
}

async function pageBox(
  page: Page,
): Promise<{ x: number; y: number; width: number; height: number }> {
  const image = await page.$('img[alt="Page 1"]');
  if (!image) fail("Focused page image not found.");
  const box = await image.boundingBox();
  if (!box) fail("Focused page image has no layout box.");
  return box;
}

async function canvasBox(
  page: Page,
): Promise<{ x: number; y: number; width: number; height: number }> {
  return page.$eval(STAGE, (node) => {
    const surface = node.parentElement?.parentElement;
    if (!surface) throw new Error("Editing canvas surface not found.");
    const rect = surface.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
}

async function dispatchPinch(
  cdp: CDPSession,
  startCenter: Point,
  startHalf: number,
  endCenter: Point,
  endHalf: number,
): Promise<void> {
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { id: 1, x: startCenter.x - startHalf, y: startCenter.y },
      { id: 2, x: startCenter.x + startHalf, y: startCenter.y },
    ],
  });
  await new Promise((resolveWait) => setTimeout(resolveWait, 20));
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      {
        id: 1,
        x: (startCenter.x + endCenter.x - startHalf - endHalf) / 2,
        y: (startCenter.y + endCenter.y) / 2,
      },
      {
        id: 2,
        x: (startCenter.x + endCenter.x + startHalf + endHalf) / 2,
        y: (startCenter.y + endCenter.y) / 2,
      },
    ],
  });
  await new Promise((resolveWait) => setTimeout(resolveWait, 20));
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { id: 1, x: endCenter.x - endHalf, y: endCenter.y },
      { id: 2, x: endCenter.x + endHalf, y: endCenter.y },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

async function drawRect(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
): Promise<void> {
  const box = await pageBox(page);
  const x1 = box.x + box.width * from.x;
  const y1 = box.y + box.height * from.y;
  const x2 = box.x + box.width * to.x;
  const y2 = box.y + box.height * to.y;
  await page.mouse.move(x1, y1);
  await page.mouse.down();
  await page.mouse.move(x2, y2, { steps: 10 });
  await page.mouse.up();
}

async function readOverlayBounds(page: Page): Promise<OverlayBounds | null> {
  return page.$eval(OVERLAY, (node) => {
    const canvas = node as HTMLCanvasElement;
    const context = canvas.getContext("2d");
    if (!context || canvas.width === 0 || canvas.height === 0) return null;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let minX = canvas.width;
    let maxX = -1;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        if (pixels[(y * canvas.width + x) * 4 + 3] === 0) continue;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    }
    return maxX >= 0 ? { minX, maxX } : null;
  });
}

async function readView(page: Page): Promise<ViewTransform> {
  return page.$eval(STAGE, (node) => {
    const raw = (node as HTMLElement).style.transform;
    const match = raw.match(/^translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)\s+scale\((-?[\d.]+)\)$/);
    if (!match) throw new Error(`Unexpected stage transform: ${raw}`);
    return { panX: Number(match[1]), panY: Number(match[2]), zoom: Number(match[3]) };
  });
}

async function waitUntil<T>(
  read: () => Promise<T>,
  predicate: (value: T) => boolean,
  label: string,
  timeout = 8_000,
): Promise<T> {
  const deadline = Date.now() + timeout;
  let lastValue: T | undefined;
  while (Date.now() < deadline) {
    const value = await read();
    lastValue = value;
    if (predicate(value)) return value;
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  }
  fail(`Timed out waiting for ${label}; last value: ${JSON.stringify(lastValue)}.`);
}

async function pressMeta(page: Page, key: KeyInput, shift = false): Promise<void> {
  await page.keyboard.down("Meta");
  if (shift) await page.keyboard.down("Shift");
  await page.keyboard.press(key);
  if (shift) await page.keyboard.up("Shift");
  await page.keyboard.up("Meta");
}

function sameView(a: ViewTransform, b: ViewTransform): boolean {
  return a.panX === b.panX && a.panY === b.panY && a.zoom === b.zoom;
}

async function main(): Promise<void> {
  const errors: string[] = [];
  const browser = await launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: true,
    defaultViewport: { width: 1280, height: 900 },
  });
  const page = await browser.newPage();

  try {
    page.setDefaultTimeout(20_000);
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error: unknown) =>
      errors.push(`pageerror: ${error instanceof Error ? error.message : String(error)}`),
    );

    await page.goto(DEV_URL, { waitUntil: "networkidle2" });
    await page.evaluate(
      () =>
        new Promise<void>((resolveDelete) => {
          const request = indexedDB.deleteDatabase("cloakpdf-editor");
          request.onsuccess = request.onerror = request.onblocked = () => resolveDelete();
        }),
    );
    await page.waitForSelector("input[type=file]", { timeout: 15_000 });
    const input = await page.$("input[type=file]");
    if (!input) fail("Home PDF input not found.");
    await (input as unknown as { uploadFile: (...paths: string[]) => Promise<void> }).uploadFile(
      FIXTURE_PATH,
    );
    await page.waitForSelector('img[alt="Page 1"]', { timeout: 20_000 });

    await page.click('button[aria-label="Annotate"]');
    await waitForText(page, /Apply annotations/i);
    if (!(await clickByText(page, "Rectangle"))) fail("Rectangle annotation tool not found.");
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll('button[aria-pressed="true"]')).some(
        (button) => (button.textContent ?? "").trim() === "Rectangle",
      ),
    );
    await drawRect(page, { x: 0.25, y: 0.3 }, { x: 0.55, y: 0.5 });
    await waitForText(page, /\b1 mark\b/i);
    await waitForText(page, /Mark selected/i);

    await page.focus(STAGE);
    const focused = await page.$eval(STAGE, (node) => document.activeElement === node);
    if (!focused) fail("Editing canvas did not accept keyboard focus.");
    const shortcuts = await page.$eval(
      STAGE,
      (node) => node.getAttribute("aria-keyshortcuts") ?? "",
    );
    if (!shortcuts.includes("Delete") || !shortcuts.includes("Backspace"))
      fail(`Selected-annotation shortcuts are not exposed accessibly: ${shortcuts}`);
    const canvasLabel = await page.$eval(STAGE, (node) => node.getAttribute("aria-label") ?? "");
    if (!canvasLabel.includes("Control or Command plus scroll")) {
      fail(`Canvas zoom help omits a supported desktop modifier: ${canvasLabel}`);
    }

    const initialBounds = await readOverlayBounds(page);
    if (!initialBounds) fail("Selected annotation did not paint on the overlay.");
    const fixedView = await readView(page);

    // A burst of content Arrow keys moves only the selected mark. Waiting past
    // the debounce then undoing once must restore the entire burst.
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    const movedBounds = await waitUntil(
      () => readOverlayBounds(page),
      (bounds) => bounds != null && bounds.minX > initialBounds.minX + 1,
      "annotation Arrow nudge",
    );
    await new Promise((resolveWait) => setTimeout(resolveWait, 450));
    const viewAfterNudge = await readView(page);
    if (!sameView(viewAfterNudge, fixedView))
      fail(`Annotation Arrow also changed the viewport: ${JSON.stringify(viewAfterNudge)}`);

    await pressMeta(page, "z");
    await waitUntil(
      () => readOverlayBounds(page),
      (bounds) => bounds?.minX === initialBounds.minX && bounds.maxX === initialBounds.maxX,
      "coalesced nudge undo",
    );
    await pressMeta(page, "z", true);
    await waitUntil(
      () => readOverlayBounds(page),
      (bounds) =>
        bounds != null &&
        movedBounds != null &&
        bounds.minX === movedBounds.minX &&
        bounds.maxX === movedBounds.maxX,
      "coalesced nudge redo",
    );
    if (!sameView(await readView(page), fixedView)) fail("Undo/redo changed the viewport.");
    console.log("  ✓ annotation Arrow keys nudge without panning; burst is one undo step");

    await page.keyboard.press("Delete");
    await waitForText(page, /\b0 marks\b/i);
    await page.waitForFunction(
      (selector) =>
        !(document.querySelector(selector)?.getAttribute("aria-keyshortcuts") ?? "").includes(
          "Delete",
        ),
      {},
      STAGE,
    );
    console.log("  ✓ Delete removes the selected annotation from the focused canvas");

    // No selected content claims the keys now, so the stage's ordinary view
    // shortcuts take over again.
    await page.focus(STAGE);
    const resetView = await readView(page);
    await page.keyboard.press("ArrowRight");
    const pannedView = await waitUntil(
      () => readView(page),
      (view) => view.panX > resetView.panX,
      "viewport Arrow pan",
    );
    await page.keyboard.down("Shift");
    await page.keyboard.press("=");
    await page.keyboard.up("Shift");
    const zoomedView = await waitUntil(
      () => readView(page),
      (view) => view.zoom > pannedView.zoom,
      "viewport + zoom",
    );
    if (zoomedView.panX !== pannedView.panX) fail("Zoom unexpectedly changed the viewport pan.");
    await page.keyboard.press("0");
    const finalView = await waitUntil(
      () => readView(page),
      (view) => view.panX === 0 && view.panY === 0 && view.zoom === 1,
      "viewport reset",
    );
    if (!sameView(finalView, { panX: 0, panY: 0, zoom: 1 })) fail("Viewport did not reset.");
    console.log("  ✓ unhandled Arrow pans; + zooms; 0 resets the viewport");

    // Direct-manipulation viewport gestures: a pinch must soften the raw
    // distance ratio, keep the initial page point beneath the moving midpoint,
    // and pan at the same time. CDP emits real touch pointer events here (not a
    // synthetic DOM event), including the first-finger tool cancel path.
    const cdp = await page.target().createCDPSession();
    const pinchBefore = await pageBox(page);
    const startCenter = {
      x: pinchBefore.x + pinchBefore.width * 0.6,
      y: pinchBefore.y + pinchBefore.height * 0.4,
    };
    const endCenter = {
      x: startCenter.x + pinchBefore.width * 0.04,
      y: startCenter.y + pinchBefore.height * 0.05,
    };
    const startHalf = pinchBefore.width * 0.1;
    const endHalf = startHalf * 2;

    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    try {
      await dispatchPinch(cdp, startCenter, startHalf, endCenter, endHalf);
    } finally {
      await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false });
    }

    const pinchedView = await waitUntil(
      () => readView(page),
      (next) => next.zoom > 1.6,
      "damped pinch zoom",
    );
    const pinchAfter = await pageBox(page);
    const beforePinchFraction = {
      x: (startCenter.x - pinchBefore.x) / pinchBefore.width,
      y: (startCenter.y - pinchBefore.y) / pinchBefore.height,
    };
    const afterPinchFraction = {
      x: (endCenter.x - pinchAfter.x) / pinchAfter.width,
      y: (endCenter.y - pinchAfter.y) / pinchAfter.height,
    };
    const expectedPinchZoom = 2 ** (3 / 4);
    if (Math.abs(pinchedView.zoom - expectedPinchZoom) > 0.03) {
      fail(`Pinch sensitivity drifted: expected ${expectedPinchZoom}, got ${pinchedView.zoom}.`);
    }
    if (
      Math.abs(beforePinchFraction.x - afterPinchFraction.x) > 0.01 ||
      Math.abs(beforePinchFraction.y - afterPinchFraction.y) > 0.01
    ) {
      fail(
        `Pinch lost its moving focal point: ${JSON.stringify({ beforePinchFraction, afterPinchFraction })}.`,
      );
    }
    await waitForText(page, /\b0 marks\b/i);
    console.log("  ✓ pinch zoom is damped and follows simultaneous two-finger pan");

    // A mouse user can hand-pan without leaving an active drawing tool. This is
    // particularly important once the zoomed page fills the whole canvas and
    // there is no background left to grab.
    await page.focus(STAGE);
    await page.keyboard.press("0");
    await waitUntil(
      () => readView(page),
      (next) => sameView(next, { panX: 0, panY: 0, zoom: 1 }),
      "pre-middle-drag viewport reset",
    );
    const middleBox = await pageBox(page);
    const middleStart = {
      x: middleBox.x + middleBox.width / 2,
      y: middleBox.y + middleBox.height / 2,
    };
    await page.mouse.move(middleStart.x, middleStart.y);
    await page.mouse.down({ button: "middle" });
    await page.mouse.move(middleStart.x + 68, middleStart.y + 44, { steps: 8 });
    await page.mouse.up({ button: "middle" });
    const middlePanned = await waitUntil(
      () => readView(page),
      (next) => next.panX > 60 && next.panY > 36,
      "middle-button hand pan",
    );
    if (Math.abs(middlePanned.panX - 68) > 1 || Math.abs(middlePanned.panY - 44) > 1) {
      fail(`Middle-button hand pan drifted: ${JSON.stringify(middlePanned)}.`);
    }
    await waitForText(page, /\b0 marks\b/i);
    console.log("  ✓ middle-button drag pans without switching or firing the active tool");

    // Trackpad pinch arrives as Ctrl+wheel in Chromium. It should use a
    // continuous delta (not a fixed 10% per event), remain cursor-anchored, and
    // ordinary two-axis wheel input should pan like a document viewer.
    await page.focus(STAGE);
    await page.keyboard.press("0");
    await waitUntil(
      () => readView(page),
      (next) => sameView(next, { panX: 0, panY: 0, zoom: 1 }),
      "post-pinch viewport reset",
    );
    const wheelBefore = await pageBox(page);
    const wheelFocal = {
      x: wheelBefore.x + wheelBefore.width * 0.72,
      y: wheelBefore.y + wheelBefore.height * 0.35,
    };
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseWheel",
      x: wheelFocal.x,
      y: wheelFocal.y,
      deltaX: 0,
      deltaY: -100,
      modifiers: 2, // Ctrl
      pointerType: "mouse",
    });
    const wheelZoomed = await waitUntil(
      () => readView(page),
      (next) => next.zoom > 1.2,
      "cursor-anchored wheel zoom",
    );
    const wheelAfter = await pageBox(page);
    const beforeWheelFraction = {
      x: (wheelFocal.x - wheelBefore.x) / wheelBefore.width,
      y: (wheelFocal.y - wheelBefore.y) / wheelBefore.height,
    };
    const afterWheelFraction = {
      x: (wheelFocal.x - wheelAfter.x) / wheelAfter.width,
      y: (wheelFocal.y - wheelAfter.y) / wheelAfter.height,
    };
    if (
      Math.abs(beforeWheelFraction.x - afterWheelFraction.x) > 0.001 ||
      Math.abs(beforeWheelFraction.y - afterWheelFraction.y) > 0.001
    ) {
      fail(
        `Wheel zoom lost its cursor focal point: ${JSON.stringify({ beforeWheelFraction, afterWheelFraction })}.`,
      );
    }
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseWheel",
      x: wheelFocal.x,
      y: wheelFocal.y,
      deltaX: 35,
      deltaY: 80,
      modifiers: 0,
      pointerType: "mouse",
    });
    const wheelPanned = await waitUntil(
      () => readView(page),
      (next) => next.panX < wheelZoomed.panX - 34 && next.panY < wheelZoomed.panY - 79,
      "two-axis wheel pan",
    );
    if (
      Math.abs(wheelPanned.panX - (wheelZoomed.panX - 35)) > 0.2 ||
      Math.abs(wheelPanned.panY - (wheelZoomed.panY - 80)) > 0.2
    ) {
      fail(
        `Wheel pan did not follow native deltas: ${JSON.stringify({ wheelZoomed, wheelPanned })}.`,
      );
    }
    await page.focus(STAGE);
    await page.keyboard.press("0");
    await waitUntil(
      () => readView(page),
      (next) => sameView(next, { panX: 0, panY: 0, zoom: 1 }),
      "post-wheel viewport reset",
    );

    // A chrome control used inside the wheel idle window must win. Otherwise a
    // stale delayed commit makes Fit visibly snap back to the transient zoom.
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseWheel",
      x: wheelFocal.x,
      y: wheelFocal.y,
      deltaX: 0,
      deltaY: -100,
      modifiers: 2,
      pointerType: "mouse",
    });
    await page.click('button[aria-label="Fit to screen"]');
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
    const fitAfterWheel = await readView(page);
    if (!sameView(fitAfterWheel, { panX: 0, panY: 0, zoom: 1 })) {
      fail(`Late wheel commit overrode Fit to screen: ${JSON.stringify(fitAfterWheel)}.`);
    }
    console.log("  ✓ top-bar controls cannot be overwritten by a late wheel commit");

    // A high-frequency trackpad burst should not re-read layout per event. The
    // gesture caches the surface size/origin until its idle commit.
    const layoutReads = await page.$eval(STAGE, async (paper) => {
      const available = paper.parentElement;
      const surface = available?.parentElement;
      if (!available || !surface) throw new Error("Canvas geometry nodes not found.");
      const nativeRect = Object.getOwnPropertyDescriptor(Element.prototype, "getBoundingClientRect")
        ?.value as (this: Element) => DOMRect;
      const surfaceRect = nativeRect.call(surface);
      let surfaceReads = 0;
      let availableReads = 0;
      Element.prototype.getBoundingClientRect = function () {
        if (this === surface) surfaceReads += 1;
        if (this === available) availableReads += 1;
        return nativeRect.call(this);
      };
      try {
        for (let i = 0; i < 12; i++) {
          surface.dispatchEvent(
            new WheelEvent("wheel", {
              bubbles: true,
              cancelable: true,
              clientX: surfaceRect.x + surfaceRect.width / 2,
              clientY: surfaceRect.y + surfaceRect.height / 2,
              ctrlKey: true,
              deltaY: -2,
            }),
          );
        }
        await new Promise((resolveWait) => setTimeout(resolveWait, 30));
      } finally {
        Element.prototype.getBoundingClientRect = nativeRect;
      }
      return { surfaceReads, availableReads };
    });
    if (layoutReads.surfaceReads !== 1 || layoutReads.availableReads !== 1) {
      fail(`Wheel burst repeated layout reads: ${JSON.stringify(layoutReads)}.`);
    }
    await waitUntil(
      () => readView(page),
      (next) => next.zoom > 1.04,
      "fine-delta wheel burst",
    );
    await new Promise((resolveWait) => setTimeout(resolveWait, 150));
    await page.focus(STAGE);
    await page.keyboard.press("0");
    await waitUntil(
      () => readView(page),
      (next) => sameView(next, { panX: 0, panY: 0, zoom: 1 }),
      "post-burst viewport reset",
    );
    console.log("  ✓ a 12-event wheel burst measures layout once and stays compositor-driven");

    // Extreme scrolling may overshoot, but it must never lose the paper. A
    // subsequent zoom-out should progressively pull that paper back to centre.
    const reachableBefore = await pageBox(page);
    const reachableSurface = await canvasBox(page);
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseWheel",
      x: reachableSurface.x + reachableSurface.width / 2,
      y: reachableSurface.y + reachableSurface.height / 2,
      deltaX: 0,
      deltaY: 10_000,
      modifiers: 0,
      pointerType: "mouse",
    });
    const edgePanned = await waitUntil(
      () => readView(page),
      (next) => Math.abs(next.panY + reachableBefore.height / 2) < 1,
      "reachable paper boundary",
    );
    for (let i = 0; i < 10; i++) await page.keyboard.press("-");
    const zoomedOutAtEdge = await waitUntil(
      () => readView(page),
      (next) => next.zoom === 0.2,
      "minimum zoom with bounded pan",
    );
    const expectedZoomedOutPan = -reachableBefore.height * 0.1;
    if (Math.abs(zoomedOutAtEdge.panY - expectedZoomedOutPan) > 1) {
      fail(
        `Zoom-out did not recover an overscrolled page: ${JSON.stringify({ edgePanned, zoomedOutAtEdge, expectedZoomedOutPan })}.`,
      );
    }

    // At minimum zoom most of the viewport is background. Pinch must work from
    // that background too, with simultaneous midpoint panning, so users are not
    // forced to hunt for the tiny paper before zooming back into a section.
    const tinyPage = await pageBox(page);
    const surface = await canvasBox(page);
    const leftGap = tinyPage.x - surface.x;
    const rightGap = surface.x + surface.width - (tinyPage.x + tinyPage.width);
    const largestGap = Math.max(leftGap, rightGap);
    if (largestGap < 140) fail(`No safe canvas background for pinch: ${largestGap}px.`);
    const backgroundCenter = {
      x: leftGap >= rightGap ? surface.x + leftGap / 2 : tinyPage.x + tinyPage.width + rightGap / 2,
      y: surface.y + surface.height / 2,
    };
    const movedBackgroundCenter = { x: backgroundCenter.x, y: backgroundCenter.y + 28 };
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    try {
      await dispatchPinch(cdp, backgroundCenter, 24, movedBackgroundCenter, 55);
    } finally {
      await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false });
    }
    const backgroundPinched = await waitUntil(
      () => readView(page),
      (next) => next.zoom > 0.36,
      "background pinch with simultaneous pan",
    );
    const expectedBackgroundZoom = 0.2 * (110 / 48) ** (3 / 4);
    if (Math.abs(backgroundPinched.zoom - expectedBackgroundZoom) > 0.02) {
      fail(
        `Background pinch sensitivity drifted: ${JSON.stringify({ backgroundPinched, expectedBackgroundZoom })}.`,
      );
    }
    const expectedBackgroundPanY = -(reachableBefore.height * backgroundPinched.zoom) / 2 + 28;
    if (Math.abs(backgroundPinched.panY - expectedBackgroundPanY) > 2) {
      fail(
        `Background pinch lost its simultaneous midpoint pan: ${JSON.stringify({ backgroundPinched, expectedBackgroundPanY })}.`,
      );
    }
    await waitForText(page, /\b0 marks\b/i);
    await page.focus(STAGE);
    await page.keyboard.press("0");
    await waitUntil(
      () => readView(page),
      (next) => sameView(next, { panX: 0, panY: 0, zoom: 1 }),
      "post-background-pinch viewport reset",
    );
    await cdp.detach();
    console.log(
      "  ✓ trackpad zoom stays anchored; overscroll remains reachable; background pinch recovers the view",
    );

    // Shared disclosure controls: Metadata's date picker keeps a valid
    // trigger→popover relationship and a single roving calendar tab stop even
    // when day 31 is carried into a shorter month.
    await page.click('button[aria-label="Metadata"]');
    await waitForText(page, /Edit the document properties/i);
    const dateTrigger = 'aside button[aria-haspopup="dialog"]';
    const controlledId = await page.$eval(dateTrigger, (button) =>
      button.getAttribute("aria-controls"),
    );
    if (!controlledId) fail("Date/time trigger does not expose aria-controls.");
    await page.click(dateTrigger);
    const dateDialog = 'div[role="dialog"][aria-label="Date and time picker"]';
    await page.waitForSelector(dateDialog);
    const openedId = await page.$eval(dateDialog, (dialog) => dialog.id);
    if (openedId !== controlledId)
      fail(`Date/time aria-controls points to ${controlledId}, not ${openedId}.`);

    if (!(await clickByText(page, "Clear"))) fail("Date/time Clear action not found.");
    await page.waitForSelector(dateDialog, { hidden: true });
    await page.click(dateTrigger);
    const unsetPeriods = await page.$$eval(`${dateDialog} button`, (buttons) =>
      buttons
        .filter((button) => ["AM", "PM"].includes((button.textContent ?? "").trim()))
        .map((button) => button.getAttribute("aria-pressed")),
    );
    if (unsetPeriods.length !== 2 || unsetPeriods.some((pressed) => pressed !== "false")) {
      fail(`Unset date/time exposes a selected period: ${JSON.stringify(unsetPeriods)}.`);
    }
    if (!(await clickByText(page, "Now"))) fail("Date/time Now action not found.");

    const thirtyOneBeforeShorter = new Set(["January", "March", "May", "August", "October"]);
    let foundTransition = false;
    for (let attempts = 0; attempts < 12; attempts++) {
      const state = await page.$eval(dateDialog, (dialog) => {
        const table = dialog.querySelector("table[aria-label]");
        const month = (table?.getAttribute("aria-label") ?? "").split(" ")[0];
        const day31 = dialog.querySelector<HTMLButtonElement>(
          'button[data-day="31"]:not(:disabled)',
        );
        const next = dialog.querySelector<HTMLButtonElement>('button[aria-label="Next month"]');
        return { month, has31: Boolean(day31), canGoNext: Boolean(next && !next.disabled) };
      });
      if (state.has31 && state.canGoNext && thirtyOneBeforeShorter.has(state.month)) {
        foundTransition = true;
        break;
      }
      await page.click(`${dateDialog} button[aria-label="Previous month"]`);
    }
    if (!foundTransition) fail("Could not find a past 31-day → shorter-month calendar transition.");
    await page.click(`${dateDialog} button[data-day="31"]`);
    await page.click(`${dateDialog} button[aria-label="Next month"]`);
    const calendarTabStops = await page.$$eval(
      `${dateDialog} button[data-day][tabindex="0"]:not(:disabled)`,
      (buttons) => buttons.map((button) => button.getAttribute("data-day")),
    );
    if (calendarTabStops.length !== 1 || Number(calendarTabStops[0]) > 30) {
      fail(`Calendar lost its clamped roving tab stop: ${JSON.stringify(calendarTabStops)}.`);
    }
    if (!(await clickByText(page, "Done"))) fail("Date/time Done action not found.");
    console.log("  ✓ date/time disclosure semantics and shorter-month focus clamp");

    // The custom colour field is a non-modal disclosure with two independent
    // native values, so keyboard/screen-reader users can adjust both axes.
    await page.click('button[aria-label="Signature"]');
    await waitForText(page, /Draw or upload a signature/i);
    const colorTrigger = 'button[aria-label^="Custom color"]';
    await page.click(colorTrigger);
    const colorDialog = 'div[role="dialog"][aria-label="Custom color picker"]';
    await page.waitForSelector(colorDialog);
    const colorControls = await page.$eval(colorTrigger, (button) =>
      button.getAttribute("aria-controls"),
    );
    const colorDialogId = await page.$eval(colorDialog, (dialog) => dialog.id);
    if (!colorControls || colorControls !== colorDialogId) {
      fail(`Custom colour aria-controls points to ${colorControls}, not ${colorDialogId}.`);
    }
    const axes = await page.$$eval(`${colorDialog} input[type="range"]`, (inputs) =>
      inputs.map((input) => input.getAttribute("aria-label")),
    );
    if (!axes.includes("Saturation") || !axes.includes("Brightness")) {
      fail(`Custom colour field does not expose both axes: ${JSON.stringify(axes)}.`);
    }
    const saturation = `${colorDialog} input[aria-label="Saturation"]`;
    await page.focus(saturation);
    const saturationBefore = await page.$eval(saturation, (input) =>
      Number((input as HTMLInputElement).value),
    );
    await page.keyboard.press("ArrowRight");
    const saturationAfter = await page.$eval(saturation, (input) =>
      Number((input as HTMLInputElement).value),
    );
    if (saturationAfter <= saturationBefore)
      fail("Saturation slider did not respond to ArrowRight.");
    await page.keyboard.press("Tab");
    const focusedAxis = await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label"),
    );
    if (focusedAxis !== "Brightness") fail(`Tab moved to ${focusedAxis}, not Brightness.`);
    await page.keyboard.press("Escape");
    await page.waitForSelector(colorDialog, { hidden: true });
    const colorFocusRestored = await page.$eval(
      colorTrigger,
      (button) => document.activeElement === button,
    );
    if (!colorFocusRestored) fail("Custom colour picker did not return focus to its trigger.");
    console.log("  ✓ custom colour exposes independent saturation and brightness controls");

    // Repeat the core gesture in the actual narrow, canvas-above-sheet layout.
    // This catches regressions hidden by the roomier desktop stage sizing.
    await page.setViewport({ width: 390, height: 844 });
    await page.waitForSelector('[data-testid="mobile-tool-sheet"]');
    await page.focus(STAGE);
    await page.keyboard.press("0");
    await waitUntil(
      () => readView(page),
      (next) => sameView(next, { panX: 0, panY: 0, zoom: 1 }),
      "mobile-width viewport reset",
    );
    const mobileBefore = await pageBox(page);
    const mobileStart = {
      x: mobileBefore.x + mobileBefore.width * 0.55,
      y: mobileBefore.y + mobileBefore.height * 0.45,
    };
    const mobileEnd = { x: mobileStart.x + 18, y: mobileStart.y + 14 };
    const mobileStartHalf = mobileBefore.width * 0.1;
    const mobileCdp = await page.target().createCDPSession();
    await mobileCdp.send("Emulation.setTouchEmulationEnabled", {
      enabled: true,
      maxTouchPoints: 5,
    });
    try {
      await dispatchPinch(mobileCdp, mobileStart, mobileStartHalf, mobileEnd, mobileStartHalf * 2);
    } finally {
      await mobileCdp.send("Emulation.setTouchEmulationEnabled", { enabled: false });
      await mobileCdp.detach();
    }
    const mobilePinched = await waitUntil(
      () => readView(page),
      (next) => next.zoom > 1.6 && next.panX !== 0 && next.panY !== 0,
      "mobile-width pinch and pan",
    );
    const expectedMobileZoom = 2 ** (3 / 4);
    if (Math.abs(mobilePinched.zoom - expectedMobileZoom) > 0.03) {
      fail(`Mobile-width pinch sensitivity drifted: ${JSON.stringify(mobilePinched)}.`);
    }
    console.log("  ✓ pinch and simultaneous pan remain natural in the mobile editor layout");

    if (errors.length > 0) fail(`Console/page errors:\n${errors.join("\n")}`);
    console.log("✓ editor keyboard interactions passed");
  } finally {
    await browser.close();
  }
}

void main().catch((error: unknown) => {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
