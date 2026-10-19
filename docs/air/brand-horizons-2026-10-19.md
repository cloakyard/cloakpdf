# App-coloured Air horizon — 2026-10-19

The user requested app colours across all family landing pages. cloakpdf uses its
original logo's blue (#2563EB / #74C7FF), primary stop for light and highlight for dark.
Air 1.0.3 (`abcaee334ca7`) owns the five artwork-only tokens. The wrapper's computed
`color` feeds the existing shader and SVG `currentColor` fallback. Shared focus,
controls, page planes, motion/lifecycle and actual product output retain their rules.

Formatting/lint/types, dead-code check, all 461 unit tests, production build/asset metadata, 95 inventory records and 18 portability checks pass. Horizon acceptance covers 68 responsive/theme/text cases, real GPU lifecycle, editor/standalone teardown and restricted profiles. The complete 16-suite smoke run uses the documented synthetic fixtures (E2E_DEMO_FIXTURES=1); the first invocation without that setting stopped at the missing optional private scanned fixture.

Twelve viewport/theme cases cover 1440×900 desktop, 1280×720 laptop, 768×1024
tablet, 390×844 and 320×568 phones, and 844×390 landscape. Both real GPU themes
render and stop at rest. Desktop/laptop/phone light/dark captures were visually
inspected, including the static fallback. Evidence: `evidence/brand-horizons-2026-10-19/`.
The family runner is `cloakyard/scripts/test-air-brand-horizons.mjs`; it accepts
`AIR_APP`, `AIR_URL`, `AIR_EVIDENCE_DIR`, `CHROME_PATH`, and `PUPPETEER_MODULE`.
It reads original logo stops, checks computed colours and static/GPU parity, and
uses disposable browser profiles. Full temporary captures/logs are under
`/tmp/air-brand-horizons-2026-10-19/`.

Implementation was initially local. The user subsequently authorized deployment;
[PR #203](https://github.com/cloakyard/cloakpdf/pull/203) is merged and the colours are live.
See [production verification](brand-deployment-2026-10-19.md).
Physical GPU/battery/thermal and assistive-device gates remain open; emulation
and desktop Chromium do not establish those results.
