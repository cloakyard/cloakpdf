# Air 1.3.0 — deliberate artwork replay, 29 October 2026

The completed landing artwork now accepts click/tap or explicit Enter/Space to
repeat its finite illustration. Presses begun while running, rapid activation and
held keys cannot interrupt or queue playback. A transparent native button covers
only the illustration; the shared inset focus outline and ready cursor are the
only affordances. No separate playback controls or runtime dependencies are added.
Static/accessibility/resource/no-JS fallbacks expose no replay action.

PDF: 461 units, check/dead-code/build/assets and 68 artwork layouts with real file entry pass.

Both Chrome and WebKit pass 110 family layouts, with actual initial/replay movement,
20 fallback profiles and five lifecycle journeys per engine. The final focus-only
selector refinement receives an additional phone/lifecycle pass and light/dark
focus inspection. All portable bundles pass. Detailed evidence, early failures,
visual comparison and rollout ledger are in the
[canonical audit](https://github.com/cloakyard/cloakyard/blob/dev/docs/air/artwork-replay-2026-10-29.md).

The linked canonical ledger records the individual dev → main PR, live asset/replay
verification and dev synchronization. Physical iPhone/assistive acceptance and existing
product/export/security/runtime exceptions remain separate; IMG stays parked.
