/** Air motion primitives. Native semantics and focus remain with the element. */
const resting = { opacity: 1, transform: "translateY(0) scale(1)" };
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)");
const immediate = (event, preference) => event.detail === 0 || preference.matches;
const snapshot = (element) => {
  const style = getComputedStyle(element);
  return { opacity: style.opacity, transform: style.transform };
};
function timing(element, token, sheet = false) {
  const style = getComputedStyle(element);
  return {
    duration: parseFloat(style.getPropertyValue(`--air-motion-${token}`)),
    easing: style.getPropertyValue(sheet ? "--air-ease-sheet" : "--air-ease-out").trim(),
    fill: "both",
  };
}

export function createDialogMotion(dialog) {
  const preference = reduced();
  let active = null;
  let closingValue = "cancel";
  function cancel() {
    active?.cancel();
    active = null;
  }
  function state(value) {
    dialog.dataset.airMotion = value;
  }
  function reset() {
    cancel();
    state(dialog.open ? "open" : "closed");
  }
  function settle() {
    const closing = dialog.dataset.airMotion === "closing";
    cancel();
    if (closing && dialog.open) dialog.close(closingValue);
    state(dialog.open ? "open" : "closed");
  }
  function preferenceChanged() {
    if (preference.matches) settle();
  }
  function move(enter, from) {
    const sheet = matchMedia("(max-width: 640px)").matches;
    const displaced = {
      opacity: sheet ? 1 : 0,
      transform: sheet ? "translateY(100%)" : "translateY(4px) scale(.98)",
    };
    const animation = dialog.animate(
      [from || displaced, enter ? resting : displaced],
      timing(dialog, enter ? "dialog" : "exit", sheet),
    );
    active = animation;
    state(enter ? "entering" : "closing");
    animation.finished
      .then(() => {
        if (active !== animation) return;
        settle();
      })
      .catch(() => {});
  }
  // Native Escape dismisses immediately. A stale exit callback cannot close a later dialog.
  dialog.addEventListener("cancel", reset);
  dialog.addEventListener("close", reset);
  preference.addEventListener("change", preferenceChanged);
  return {
    enter(event) {
      const from = active ? snapshot(dialog) : null;
      cancel();
      if (immediate(event, preference)) state("open");
      else move(true, from);
    },
    close(event, value = "cancel") {
      closingValue = value;
      if (immediate(event, preference)) {
        cancel();
        dialog.close(value);
        state("closed");
        return;
      }
      if (dialog.dataset.airMotion === "closing") return;
      // Read the current composited pose before cancelling an interrupted entrance.
      const from = snapshot(dialog);
      cancel();
      move(false, from);
    },
    destroy() {
      reset();
      dialog.removeEventListener("cancel", reset);
      dialog.removeEventListener("close", reset);
      preference.removeEventListener("change", preferenceChanged);
      delete dialog.dataset.airMotion;
    },
  };
}

export function createCompletionMotion(element) {
  const preference = reduced();
  let active = null;
  function cancel() {
    active?.cancel();
    active = null;
  }
  function preferenceChanged() {
    if (preference.matches) cancel();
  }
  preference.addEventListener("change", preferenceChanged);
  return {
    play(event) {
      const continuing = active?.playState === "running";
      const from = continuing
        ? snapshot(element)
        : { opacity: 0.3, transform: "translateY(8px) scale(.9)" };
      cancel();
      if (immediate(event, preference)) return;
      const options = timing(element, "dialog");
      if (continuing)
        options.duration *= Math.max(0, Math.min(1, (1 - Number(from.opacity)) / 0.7));
      if (!options.duration) return;
      const animation = element.animate([from, resting], options);
      active = animation;
      animation.finished
        .then(() => {
          if (active === animation) cancel();
        })
        .catch(() => {});
    },
    destroy() {
      cancel();
      preference.removeEventListener("change", preferenceChanged);
    },
  };
}
