/** Shared lifecycle for small, local landing illustrations. No rendering dependency. */
export function mountAirArtwork(root, { run, settle, control = null }) {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const reduced = win.matchMedia("(prefers-reduced-motion: reduce)");
  const forced = win.matchMedia("(forced-colors: active)");
  const connection = win.navigator.connection;
  const active = new Set();
  let visible = false;
  let pageHidden = false;
  let paused = false;
  let started = false;
  let complete = false;
  let destroyed = false;
  let revision = 0;

  function restriction() {
    if (reduced.matches) return "reduced";
    if (forced.matches) return "forced";
    if (connection?.saveData) return "save-data";
    if (win.navigator.deviceMemory <= 4 || win.navigator.hardwareConcurrency <= 4)
      return "constrained";
    if (!root.animate || !win.IntersectionObserver) return "unsupported";
    return null;
  }
  function suspension() {
    if (doc.hidden || pageHidden) return "hidden";
    if (!visible) return "offscreen";
    return paused ? "paused" : null;
  }
  function cancel() {
    revision++;
    active.forEach((animation) => animation.cancel());
    active.clear();
    started = false;
    settle();
  }
  async function begin() {
    started = true;
    const current = ++revision;
    const animate = async (entries) => {
      if (destroyed || current !== revision) throw new Error("Artwork cancelled");
      const animations = entries.map(({ element, keyframes, options }) => {
        const animation = element.animate(keyframes, { fill: "both", ...options });
        active.add(animation);
        if (suspension()) animation.pause();
        return animation;
      });
      try {
        await Promise.all(animations.map((animation) => animation.finished));
        if (destroyed || current !== revision) throw new Error("Artwork cancelled");
      } finally {
        animations.forEach((animation) => {
          active.delete(animation);
          animation.cancel();
        });
      }
    };
    try {
      await run(animate);
      if (destroyed || current !== revision) return;
      started = false;
      complete = true;
      settle();
      sync();
    } catch {
      if (destroyed || current !== revision) return;
      cancel();
      complete = true;
      root.dataset.artState = "static";
      if (control) control.hidden = true;
    }
  }
  function sync() {
    if (destroyed) return;
    const blocked = restriction();
    if (blocked) {
      if (started) complete = true;
      cancel();
      root.dataset.artState = blocked;
      if (control) control.hidden = true;
      return;
    }
    if (control) {
      control.hidden = false;
      control.textContent = complete
        ? "Replay animation"
        : paused
          ? "Play animation"
          : "Pause animation";
    }
    if (complete) {
      root.dataset.artState = "complete";
      return;
    }
    if (!started) void begin();
    const suspended = suspension();
    active.forEach((animation) => (suspended ? animation.pause() : animation.play()));
    root.dataset.artState = suspended ?? "playing";
  }
  function toggle() {
    if (complete) {
      complete = false;
      paused = false;
    } else paused = !paused;
    sync();
  }
  function hide() {
    pageHidden = true;
    sync();
  }
  function show() {
    pageHidden = false;
    sync();
  }
  const observer = win.IntersectionObserver
    ? new win.IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          sync();
        },
        { threshold: 0 },
      )
    : null;
  observer?.observe(root);
  reduced.addEventListener("change", sync);
  forced.addEventListener("change", sync);
  connection?.addEventListener?.("change", sync);
  doc.addEventListener("visibilitychange", sync);
  win.addEventListener("pagehide", hide);
  win.addEventListener("pageshow", show);
  control?.addEventListener("click", toggle);
  sync();
  return {
    destroy() {
      destroyed = true;
      cancel();
      observer?.disconnect();
      reduced.removeEventListener("change", sync);
      forced.removeEventListener("change", sync);
      connection?.removeEventListener?.("change", sync);
      doc.removeEventListener("visibilitychange", sync);
      win.removeEventListener("pagehide", hide);
      win.removeEventListener("pageshow", show);
      control?.removeEventListener("click", toggle);
      if (control) control.hidden = true;
      root.dataset.artState = "destroyed";
    },
  };
}
