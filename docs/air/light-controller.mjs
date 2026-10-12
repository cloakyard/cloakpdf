/** Lazy, finite motion for the Air study. Editors never import this module. */
const field = document.querySelector("#air-light");
const canvas = field.querySelector("canvas");
const status = document.querySelector("#light-status");
const replay = document.querySelector("#light-replay");
const still = document.querySelector("#light-still");
const metrics = document.querySelector("#light-metrics");
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
const fine = matchMedia("(hover: hover) and (pointer: fine)");
const appearance = matchMedia("(prefers-color-scheme: dark)");
const connection = navigator.connection;
let renderer = null,
  mounting = null,
  generation = 0,
  visible = false,
  frozen = false;
let failed = false,
  arrived = false,
  frame = 0,
  arrivalAnimation = null,
  arrivalDeadline = 0;
let current = 0.5,
  target = 0.5,
  velocity = 0,
  lastFrame = 0,
  lastInput = 0;
let dirty = false,
  frames = 0,
  cpuTotal = 0,
  firstDraw = 0;
let modulePromise, mountAbort;

function restriction() {
  if (reduce.matches) return "reduced";
  if (frozen) return "still";
  if (
    connection?.saveData ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
  )
    return "constrained";
  if (!navigator.gpu) return "unsupported";
  if (document.hidden) return "hidden";
  if (!visible) return "offscreen";
  if (failed) return "failed";
  return "";
}
function setState(state) {
  field.dataset.lightState = state;
  const description = {
    loading: "Preparing the light. The still artwork stays visible.",
    live: fine.matches ? "Move across the light to explore." : "A soft arrival, then stillness.",
    idle: fine.matches ? "Move across the light to explore." : "A soft arrival, then stillness.",
    reduced: "Still artwork · reduced motion.",
    still: "Still artwork selected.",
    constrained: "Still artwork · conserving device resources.",
    unsupported: "Still artwork · WebGPU isn’t available here.",
    hidden: "Light rests while this tab is hidden.",
    offscreen: "Light rests outside the viewport.",
    failed: "Still artwork · the light couldn’t start. You can retry.",
  }[state];
  if (status.textContent !== description) status.textContent = description;
  replay.disabled = ["reduced", "still", "constrained", "unsupported", "loading"].includes(state);
  replay.textContent = state === "failed" ? "Retry light" : "Replay arrival";
  metrics.textContent = firstDraw
    ? `Local Shaders 4.0.4 · first draw ${Math.round(firstDraw)} ms · ${frames} submitted frames · ${(cpuTotal / Math.max(frames, 1)).toFixed(2)} ms average CPU submission. GPU time and battery cost are separate checks.`
    : "The renderer loads only when the artwork is visible. No remote assets or telemetry.";
  field.dataset.lightFrames = String(frames);
  field.dataset.lightFirstDraw = firstDraw.toFixed(1);
}
function palette() {
  const styles = getComputedStyle(field);
  return {
    base: styles.backgroundColor,
    accent: styles.color,
    plane: styles.outlineColor,
    dark:
      getComputedStyle(document.documentElement).colorScheme === "dark" ||
      (document.documentElement.dataset.airTheme !== "light" && appearance.matches)
        ? 1
        : 0,
  };
}
function deactivate(reason) {
  generation++;
  mountAbort?.abort();
  mountAbort = null;
  mounting = null;
  cancelAnimationFrame(frame);
  frame = 0;
  arrivalAnimation?.cancel();
  arrivalAnimation = null;
  canvas.style.opacity = "1";
  delete field.dataset.lightReady;
  const previous = renderer;
  renderer = null;
  previous?.destroy();
  current = target = 0.5;
  velocity = 0;
  lastFrame = 0;
  setState(reason);
}
function fail(error) {
  field.dataset.lightFailure = String(error?.message || error || "Graphics unavailable");
  failed = true;
  deactivate("failed");
}
function mount() {
  const reason = restriction();
  if (reason) {
    deactivate(reason);
    return;
  }
  if (renderer || mounting) return mounting;
  const token = ++generation,
    started = performance.now();
  setState("loading");
  delete field.dataset.lightFailure;
  mountAbort = new AbortController();
  const signal = mountAbort.signal;
  const timeout = setTimeout(() => {
    if (token === generation) fail();
  }, 6000);
  mounting = (async () => {
    let instance;
    try {
      modulePromise ??= import("./assets/air-light-shader.js");
      const { createAirLightRenderer } = await modulePromise;
      if (token !== generation) return;
      if (restriction()) {
        deactivate(restriction());
        return;
      }
      instance = await createAirLightRenderer(
        canvas,
        palette(),
        () => {
          if (token === generation) fail();
        },
        signal,
      );
      if (token !== generation || restriction()) {
        instance.destroy();
        if (token === generation) deactivate(restriction());
        return;
      }
      renderer = instance;
      firstDraw ||= performance.now() - started;
      field.dataset.lightReady = "true";
      dirty = true;
      if (!arrived) {
        arrived = true;
        playArrival();
      } else wake();
    } catch (error) {
      modulePromise = undefined;
      instance?.destroy();
      if (token === generation) fail(error);
    } finally {
      clearTimeout(timeout);
      if (token === generation) mounting = null;
    }
  })();
  return mounting;
}
function playArrival() {
  if (!renderer || restriction()) return;
  // A deliberate replay restarts after completion; an interrupted arrival keeps its progress.
  const previousProgress = arrivalAnimation?.effect.getComputedTiming().progress ?? 0;
  const from =
    arrivalAnimation?.playState === "running"
      ? arrivalAnimation.airFrom + (1 - arrivalAnimation.airFrom) * previousProgress
      : 0;
  arrivalAnimation?.cancel();
  const styles = getComputedStyle(field);
  const duration = parseFloat(styles.getPropertyValue("--air-motion-arrival")) * (1 - from);
  arrivalDeadline = performance.now() + duration;
  arrivalAnimation = canvas.animate([{ opacity: from }, { opacity: 1 }], {
    duration,
    easing: styles.getPropertyValue("--air-ease-out").trim(),
    fill: "both",
  });
  arrivalAnimation.airFrom = from;
  setState("live");
  dirty = true;
  wake();
}
function wake() {
  if (frame || !renderer || restriction()) return;
  frame = requestAnimationFrame(tick);
}
async function tick(now) {
  frame = 0;
  if (!renderer || restriction()) return;
  if (lastFrame && now - lastFrame < 1000 / 30 - 1) {
    wake();
    return;
  }
  const dt = Math.min((now - (lastFrame || now - 16)) / 1000, 1 / 30);
  lastFrame = now;
  const moving = Math.abs(target - current) > 0.001 || Math.abs(velocity) > 0.003;
  if (moving) {
    // Shared motion brief: spring mass 1, stiffness 100, damping 10; light only.
    velocity += ((target - current) * 100 - velocity * 10) * dt;
    current = Math.max(0.05, Math.min(0.95, current + velocity * dt));
    if (now - lastInput > 1800) {
      current = target;
      velocity = 0;
    }
  }
  // A backgrounded compositor must not keep a "running" WAAPI effect alive forever.
  const entering = arrivalAnimation?.playState === "running" && now < arrivalDeadline;
  const progress = arrivalAnimation?.effect.getComputedTiming().progress ?? 1;
  const arrival = entering
    ? arrivalAnimation.airFrom + (1 - arrivalAnimation.airFrom) * progress
    : 1;
  if (dirty || moving || arrivalAnimation) {
    const instance = renderer,
      token = generation,
      start = performance.now();
    dirty = false;
    try {
      await instance.draw({ ...palette(), aim: current, arrival });
      if (token !== generation) return;
      cpuTotal += performance.now() - start;
      frames++;
    } catch {
      if (token === generation) fail();
      return;
    }
  }
  if (!entering && arrivalAnimation) {
    canvas.style.opacity = "1";
    arrivalAnimation.cancel();
    arrivalAnimation = null;
  }
  if (entering || moving) {
    setState("live");
    wake();
  } else {
    lastFrame = 0;
    setState("idle");
  }
}
const visibility = new IntersectionObserver(
  (entries) => {
    const entry = entries.at(-1);
    visible = entry.isIntersecting && entry.intersectionRatio > 0.01;
    if (restriction()) deactivate(restriction());
    else void mount();
  },
  { threshold: [0, 0.01] },
);
visibility.observe(field);
const resize = new ResizeObserver(([entry]) => {
  if (!renderer || restriction()) return;
  renderer.resize(entry.contentRect.width, entry.contentRect.height);
  dirty = true;
  wake();
});
resize.observe(field);
function refresh() {
  const reason = restriction();
  if (reason) deactivate(reason);
  else if (!renderer) void mount();
  else {
    dirty = true;
    wake();
  }
}
function themeChanged() {
  // Never tween appearance. The shader gets the same palette as its solid fallback.
  refresh();
}
new MutationObserver(themeChanged).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-air-theme"],
});
appearance.addEventListener("change", themeChanged);
reduce.addEventListener("change", refresh);
fine.addEventListener("change", () => {
  target = current = 0.5;
  velocity = 0;
  dirty = true;
  refresh();
});
connection?.addEventListener("change", refresh);
document.addEventListener("visibilitychange", refresh);
field.parentElement.addEventListener("pointermove", (event) => {
  if (!fine.matches || event.pointerType !== "mouse" || !renderer || restriction()) return;
  const bounds = field.getBoundingClientRect();
  target = 0.15 + 0.7 * Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
  lastInput = performance.now();
  wake();
});
field.parentElement.addEventListener("pointerleave", () => {
  target = 0.5;
  lastInput = performance.now();
  wake();
});
still.addEventListener("click", () => {
  frozen = !frozen;
  still.setAttribute("aria-pressed", String(frozen));
  refresh();
});
replay.addEventListener("click", async (event) => {
  failed = false;
  field.scrollIntoView({ block: "center", behavior: "instant" });
  if (!renderer) {
    arrived = event.detail === 0;
    await mount();
  } else if (event.detail !== 0) playArrival();
  else {
    dirty = true;
    wake();
  }
});
window.addEventListener("pagehide", () => deactivate("hidden"));
window.addEventListener("pageshow", (event) => {
  if (event.persisted) refresh();
});
setState(restriction() || "loading");
