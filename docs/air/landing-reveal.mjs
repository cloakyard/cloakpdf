import { motionMilliseconds } from "./motion.mjs";

/** A landing block opts in with data-air-reveal and one decorative .air-reveal-veil child. */
export function mountLandingReveals(root, { restoreFragment = false } = {}) {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const navigation = win?.performance.getEntriesByType?.("navigation")[0];
  if (!win || navigation?.type === "back_forward") return;
  // In client-rendered entries the browser can resolve the initial hash before the target exists.
  if (restoreFragment && win.location.hash && doc.activeElement === doc.body) {
    let id;
    try {
      id = decodeURIComponent(win.location.hash.slice(1));
    } catch {
      // Malformed fragments have no destination.
    }
    const target = id && doc.getElementById(id);
    if (target && root.contains(target)) {
      target.focus({ preventScroll: true });
      target.scrollIntoView();
    }
  }
  if (!win.IntersectionObserver || !win.matchMedia) return;
  const media = win.matchMedia(
    "screen and (prefers-reduced-motion: no-preference) and (forced-colors: none)",
  );
  if (!media.matches) return;

  const blocks = [...root.querySelectorAll("[data-air-reveal]")];
  if (!blocks.length) return;
  const stagger = motionMilliseconds(
    win.getComputedStyle(blocks[0]).getPropertyValue("--air-motion-landing-stagger"),
  );
  if (!Number.isFinite(stagger)) return;

  const inset = () => Math.min(96, Math.round(win.innerHeight * 0.13));
  const pending = new Set(
    blocks.filter((block) => {
      const { top, bottom } = block.getBoundingClientRect();
      if (block.matches(":focus-within") || (win.location.hash && top < win.innerHeight))
        return false;
      return (
        top >= win.innerHeight - inset() ||
        (win.scrollY === 0 && top > win.innerHeight / 2 && bottom > win.innerHeight)
      );
    }),
  );
  if (!pending.size) return;
  const listeners = new AbortController();
  const options = { signal: listeners.signal };
  const starts = new Map();
  let observer;
  let navigationFrame = 0;

  function settle(block) {
    if (!pending.delete(block)) return;
    observer?.unobserve(block);
    starts.delete(block);
    block.dataset.airReveal = "";
    block.style.removeProperty("--air-reveal-delay");
    if (!pending.size) {
      observer?.disconnect();
      listeners.abort();
      win.cancelAnimationFrame(navigationFrame);
    }
  }
  function stop() {
    for (const block of pending) settle(block);
  }
  function observe() {
    observer?.disconnect();
    observer = new win.IntersectionObserver(
      (entries, source) => {
        if (source !== observer || doc.hidden) return;
        const entering = new Set();
        for (const entry of entries) {
          const block = entry.target;
          if (!entry.isIntersecting) {
            if (starts.has(block) || entry.boundingClientRect.bottom <= 0) settle(block);
          } else if (block.matches(":focus-within")) {
            settle(block);
          } else if (!starts.has(block)) {
            entering.add(block);
          }
        }
        // The browser owns the stagger and interpolation. Scrolled-past blocks drop out.
        const now = win.performance.now();
        let start = now;
        for (const previous of starts.values()) start = Math.max(start, previous + stagger);
        for (const block of pending) {
          if (!entering.has(block)) continue;
          starts.set(block, start);
          block.style.setProperty("--air-reveal-delay", start - now + "ms");
          block.dataset.airReveal = "entering";
          start += stagger;
        }
      },
      { rootMargin: "0px 0px -" + inset() + "px 0px" },
    );
    for (const block of pending) observer.observe(block);
  }
  function settleViewport() {
    for (const block of pending) {
      const { top, bottom } = block.getBoundingClientRect();
      if (top < win.innerHeight && bottom > 0) settle(block);
    }
  }
  function afterNavigation() {
    win.cancelAnimationFrame(navigationFrame);
    navigationFrame = win.requestAnimationFrame(settleViewport);
  }
  function finish(event) {
    if (event.target.classList.contains("air-reveal-veil")) settle(event.target.parentElement);
  }

  for (const block of pending) block.dataset.airReveal = "pending";
  observe();
  root.addEventListener("animationend", finish, options);
  root.addEventListener("animationcancel", finish, options);
  root.addEventListener(
    "focusin",
    (event) => {
      settle(event.target.closest("[data-air-reveal]"));
      if (event.target.matches('[tabindex="-1"]')) afterNavigation();
    },
    options,
  );
  win.addEventListener("hashchange", afterNavigation, options);
  win.addEventListener(
    "pageshow",
    (e) => {
      if (e.persisted) afterNavigation();
    },
    options,
  );
  win.addEventListener("resize", observe, options);
  doc.addEventListener(
    "visibilitychange",
    () => {
      if (doc.hidden) {
        for (const block of starts.keys()) settle(block);
      } else settleViewport();
    },
    options,
  );
  media.addEventListener("change", stop, options);
  return stop;
}
