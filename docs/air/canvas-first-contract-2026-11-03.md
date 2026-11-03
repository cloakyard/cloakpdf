# Air 1.4.0 portable contract — 3 November 2026

The local bundle now includes Air's approved canvas-first touch-editor pattern:
at least 40% photo viewport, a fixed tool-header Cancel / Apply X / tick pair with
48px targets and accessible names/tooltips, independently scrolling controls and
separate global canvas actions. The interactive reference offers both compact and
labelled variants. The compact modifier is opt-in; this product retains its
existing labelled action and completion semantics.

The family comparison passes 648 home layouts, 288 secondary layouts and 390
navigation/link interactions with no deviations or browser errors. Phone light/dark
captures of all six sites were visually compared for header/footer rhythm and
neutral hyperlinks. Shared reference validation/cancel/apply journeys pass in
Chrome and WebKit at 320px/1280px in both themes (eight journeys).

Formatting, lint, types, dead-code check, production build and 461 unit tests pass. Design and independent
portability checks pass. No runtime dependency, native app or output change is part
of this synchronization. Physical device, OS IME and spoken assistive acceptance
remain separate open gates. See the canonical
[implementation and rollout record](https://github.com/cloakyard/cloakyard/blob/main/docs/air/cloakimg-canvas-first-2026-11-03.md).
