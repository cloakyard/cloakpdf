/** Reference controls around the same lifecycle used by the production homepage. */
import { mountAirLight } from "./light-runtime.mjs";
const field = document.querySelector("#air-light");
const status = document.querySelector("#light-status");
const replay = document.querySelector("#light-replay");
const still = document.querySelector("#light-still");
const metrics = document.querySelector("#light-metrics");
let frozen = false;
const light = mountAirLight(field, {
  onState({ state, fine, firstDraw, frames, averageCPU }) {
    const description = {
      loading: "Preparing the light. The still artwork stays visible.",
      live: fine ? "Move across the light to explore." : "A soft arrival, then stillness.",
      idle: fine ? "Move across the light to explore." : "A soft arrival, then stillness.",
      reduced: "Still artwork · reduced motion.",
      still: "Still artwork selected.",
      constrained: "Still artwork · conserving device resources.",
      unsupported: "Still artwork · WebGPU isn’t available here.",
      forced: "Still artwork · system colours.",
      hidden: "Light rests while this tab is hidden.",
      offscreen: "Light rests outside the viewport.",
      failed: "Still artwork · the light couldn’t start. You can retry.",
    }[state];
    if (description && status.textContent !== description) status.textContent = description;
    replay.disabled = [
      "reduced",
      "still",
      "constrained",
      "unsupported",
      "forced",
      "loading",
    ].includes(state);
    replay.textContent = state === "failed" ? "Retry light" : "Replay arrival";
    metrics.textContent = firstDraw
      ? `Local Shaders 4.0.5 · first draw ${Math.round(firstDraw)} ms · ${frames} submitted frames · ${averageCPU.toFixed(2)} ms average CPU submission. GPU time and battery cost are separate checks.`
      : "The renderer loads only when the artwork is visible. No remote assets or telemetry.";
  },
});
still.addEventListener("click", () => {
  frozen = !frozen;
  still.setAttribute("aria-pressed", String(frozen));
  light.setFrozen(frozen);
});
replay.addEventListener("click", (event) => {
  field.scrollIntoView({ block: "center", behavior: "instant" });
  void light.replay(event.detail !== 0);
});
