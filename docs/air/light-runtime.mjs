/** Shared finite Air light lifecycle. One optional landing enhancement; never an editor effect. */
import { motionMilliseconds } from "./motion.mjs";

export function mountAirLight(
  field,
  {
    pointerTarget = field.parentElement,
    loadRenderer = () => import("./assets/air-light-shader.js"),
    onState = () => {},
  } = {},
) {
  const canvas = field.querySelector("canvas");
  const forced = matchMedia("(forced-colors: active)");
  let disposed = false;
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
  let drawingGeneration = null;

  function restriction() {
    if (disposed) return "disposed";
    if (forced.matches) return "forced";
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
    field.dataset.lightFrames = String(frames);
    field.dataset.lightFirstDraw = firstDraw.toFixed(1);
    onState({
      state,
      frames,
      firstDraw,
      averageCPU: cpuTotal / Math.max(frames, 1),
      fine: fine.matches,
    });
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
        modulePromise ??= loadRenderer();
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
    const duration =
      motionMilliseconds(styles.getPropertyValue("--air-motion-arrival")) * (1 - from);
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
    if (frame || drawingGeneration === generation || !renderer || restriction()) return;
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
        drawingGeneration = token;
        await instance.draw({ ...palette(), aim: current, arrival });
        if (token !== generation) return;
        cpuTotal += performance.now() - start;
        frames++;
      } catch {
        if (token === generation) fail();
        return;
      } finally {
        if (drawingGeneration === token) drawingGeneration = null;
      }
    }
    if (!entering && arrivalAnimation) {
      canvas.style.opacity = "1";
      arrivalAnimation.cancel();
      arrivalAnimation = null;
    }
    const stillMoving = Math.abs(target - current) > 0.001 || Math.abs(velocity) > 0.003;
    if (entering || stillMoving || dirty) {
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
    try {
      renderer.resize(entry.contentRect.width, entry.contentRect.height);
      dirty = true;
      wake();
    } catch (error) {
      fail(error);
    }
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
  const themeObserver = new MutationObserver(themeChanged);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-air-theme"],
  });
  appearance.addEventListener("change", themeChanged);
  reduce.addEventListener("change", refresh);
  forced.addEventListener("change", refresh);
  function inputChanged() {
    target = current = 0.5;
    velocity = 0;
    dirty = true;
    refresh();
  }
  fine.addEventListener("change", inputChanged);
  connection?.addEventListener("change", refresh);
  document.addEventListener("visibilitychange", refresh);
  function pointerMoved(event) {
    if (!fine.matches || event.pointerType !== "mouse" || !renderer || restriction()) return;
    const bounds = field.getBoundingClientRect();
    target = 0.15 + 0.7 * Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    lastInput = performance.now();
    wake();
  }
  function pointerLeft() {
    target = 0.5;
    lastInput = performance.now();
    wake();
  }
  pointerTarget.addEventListener("pointermove", pointerMoved, { passive: true });
  pointerTarget.addEventListener("pointerleave", pointerLeft, { passive: true });
  function pageHidden() {
    deactivate("hidden");
  }
  function pageShown(event) {
    if (event.persisted) refresh();
  }
  window.addEventListener("pagehide", pageHidden);
  window.addEventListener("pageshow", pageShown);
  setState(restriction() || "loading");
  return {
    setFrozen(value) {
      frozen = value;
      refresh();
    },
    async replay(animate = true) {
      failed = false;
      if (!renderer) {
        arrived = !animate;
        await mount();
      } else if (animate) playArrival();
      else {
        arrivalAnimation?.cancel();
        arrivalAnimation = null;
        canvas.style.opacity = "1";
        current = target;
        velocity = 0;
        dirty = true;
        wake();
      }
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      deactivate("disposed");
      visibility.disconnect();
      resize.disconnect();
      themeObserver.disconnect();
      appearance.removeEventListener("change", themeChanged);
      reduce.removeEventListener("change", refresh);
      forced.removeEventListener("change", refresh);
      fine.removeEventListener("change", inputChanged);
      connection?.removeEventListener("change", refresh);
      document.removeEventListener("visibilitychange", refresh);
      pointerTarget.removeEventListener("pointermove", pointerMoved);
      pointerTarget.removeEventListener("pointerleave", pointerLeft);
      window.removeEventListener("pagehide", pageHidden);
      window.removeEventListener("pageshow", pageShown);
    },
  };
}
