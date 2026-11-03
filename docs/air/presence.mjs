/** Air surface presence. Focus, transactions and positioning stay with the caller. */
import { motionMilliseconds } from "./motion.mjs";

export function createPresenceMotion(element, kind = "dialog", onExit = () => {}) {
  const reduced = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
  const narrow = globalThis.matchMedia?.("(max-width: 640px)");
  const surface = element.querySelector("[data-air-surface]") || element;
  const backdrop = element.querySelector("[data-air-backdrop]");
  let animations = [];
  let target;
  let disposed = false;

  function cancel() {
    for (const animation of animations) animation.cancel();
    animations = [];
  }
  function settle() {
    const alreadyClosed = element.dataset.airPresence === "closed";
    cancel();
    element.dataset.airPresence = target ? "open" : "closed";
    if (!target && !disposed && !alreadyClosed) onExit();
  }
  function update(open) {
    if (disposed || target === open) return;
    const continuing = animations.length > 0;
    const current = getComputedStyle(surface);
    const from = { opacity: current.opacity, transform: current.transform };
    const scrimOpacity = backdrop ? getComputedStyle(backdrop).opacity : "1";
    cancel();
    target = open;
    const sheet = kind === "sheet" || (kind === "dialog" && narrow?.matches);
    const displaced = {
      opacity: sheet ? 1 : 0,
      transform:
        kind === "fade"
          ? "none"
          : sheet
            ? "translateY(100%)"
            : kind === "panel"
              ? "translateY(12px)"
              : kind === "notice"
                ? "translateY(-4px)"
                : surface.dataset.placement === "above"
                  ? "translateY(-4px) scale(.98)"
                  : "translateY(4px) scale(.98)",
    };
    const rest = { opacity: 1, transform: "none" };
    const token = open
      ? kind === "popover" || kind === "notice" || kind === "fade"
        ? "popover"
        : "dialog"
      : "exit";
    const duration = motionMilliseconds(current.getPropertyValue(`--air-motion-${token}`));
    if (
      kind === "none" ||
      !reduced ||
      reduced?.matches ||
      !surface.animate ||
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      settle();
      return;
    }
    const options = {
      duration,
      easing: current
        .getPropertyValue(sheet || kind === "panel" ? "--air-ease-sheet" : "--air-ease-out")
        .trim(),
      fill: "both",
    };
    element.dataset.airPresence = open ? "entering" : "closing";
    const animation = surface.animate(
      [continuing || !open ? from : displaced, open ? rest : displaced].map((pose) =>
        kind === "fade" ? { opacity: pose.opacity } : pose,
      ),
      options,
    );
    animations.push(animation);
    if (backdrop)
      animations.push(
        backdrop.animate(
          [{ opacity: continuing || !open ? scrimOpacity : 0 }, { opacity: open ? 1 : 0 }],
          { ...options, easing: current.getPropertyValue("--air-ease-out").trim() },
        ),
      );
    animation.finished
      .then(() => {
        if (animations[0] === animation) settle();
      })
      .catch(() => {});
  }
  const preferenceChanged = () => {
    if (reduced?.matches && target !== undefined) settle();
  };
  // A changed sheet composition settles the current pose rather than moving in the wrong direction.
  const resized = () => {
    if (target !== undefined) settle();
  };
  reduced?.addEventListener("change", preferenceChanged);
  narrow?.addEventListener("change", resized);
  return {
    update,
    destroy() {
      disposed = true;
      cancel();
      reduced?.removeEventListener("change", preferenceChanged);
      narrow?.removeEventListener("change", resized);
      delete element.dataset.airPresence;
    },
  };
}
