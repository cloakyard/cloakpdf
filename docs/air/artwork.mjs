/** Shared lifecycle for small, local landing illustrations. No rendering dependency. */
export function mountAirArtwork(root, { run, settle }) {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const reduced = win.matchMedia("(prefers-reduced-motion: reduce)");
  const forced = win.matchMedia("(forced-colors: active)");
  const connection = win.navigator.connection;
  const replay = root.querySelector(".air-artwork-replay");
  const active = new Set();
  let visible = false;
  let pageHidden = false;
  let started = false;
  let complete = false;
  let destroyed = false;
  let failed = false;
  let pointerReady = false;
  let revision = 0;

  function restriction() {
    if (reduced.matches) return "reduced";
    if (forced.matches) return "forced";
    if (connection?.saveData) return "save-data";
    // WebKit rounds CPU counts down to four on many capable iPhones. That
    // privacy hint cannot decide whether this finite transform/opacity work runs.
    if (win.navigator.deviceMemory <= 4) return "constrained";
    if (!root.animate || !win.IntersectionObserver) return "unsupported";
    return null;
  }
  function suspension() {
    if (doc.hidden || pageHidden) return "hidden";
    if (!visible) return "offscreen";
    return null;
  }
  function canReplay() {
    return complete && !destroyed && !failed && !restriction() && !suspension();
  }
  function setState(state) {
    root.dataset.artState = state;
    if (!replay) return;
    const ready = canReplay();
    replay.hidden = Boolean(destroyed || failed || restriction());
    replay.setAttribute("aria-disabled", String(!ready));
    replay.tabIndex = ready ? 0 : -1;
  }
  function pointerDown() {
    pointerReady = canReplay();
  }
  function keyDown(event) {
    if ((event.key === "Enter" || event.key === " ") && (event.repeat || !canReplay()))
      event.preventDefault();
  }
  function playAgain(event) {
    const allowed = canReplay() && (event.detail === 0 || pointerReady);
    pointerReady = false;
    if (!allowed) return;
    complete = false;
    sync();
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
      failed = true;
      setState("static");
    }
  }
  function sync() {
    if (destroyed) return;
    const blocked = restriction();
    if (blocked) {
      if (started) complete = true;
      cancel();
      setState(blocked);
      return;
    }
    if (complete) {
      setState("complete");
      return;
    }
    if (!started) void begin();
    const suspended = suspension();
    active.forEach((animation) => (suspended ? animation.pause() : animation.play()));
    setState(suspended ?? "playing");
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
  replay?.addEventListener("pointerdown", pointerDown);
  replay?.addEventListener("keydown", keyDown);
  replay?.addEventListener("click", playAgain);
  sync();
  return {
    finish() {
      if (destroyed) return;
      cancel();
      complete = true;
      sync();
    },
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
      replay?.removeEventListener("pointerdown", pointerDown);
      replay?.removeEventListener("keydown", keyDown);
      replay?.removeEventListener("click", playAgain);
      setState("destroyed");
    },
  };
}
