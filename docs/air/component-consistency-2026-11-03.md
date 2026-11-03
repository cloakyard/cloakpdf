# CloakPDF component consistency — 2026-11-03

The custom select now uses Air's 8px trigger gap instead of 4px.
`pnpm test:air-selects` (external `PLAYWRIGHT_MODULE`, `BASE_URL`,
`AIR_EVIDENCE_DIR`) checks 44 Chrome/WebKit layouts, keyboard selection, Escape,
focus return and viewport containment. No model or document processing changes.

The visual comparison also found that an 18rem minimum on the mobile tool panel
left only 64px for the document on a 390px-high screen. Below 500px height the
normal split now retains half the column for the preview. Expand remains
available; returning to split preserves the tool values. Both browsers pass
88 landscape/enlarged-text tool observations each, 16 action journeys and actual
PDF downloads. The action regression verifies the short-screen split.

Validation: 461 unit tests; all 16 smoke suites; 616 all-tool layouts per browser;
44 select journeys; build, check, Knip and Air checks. The separately approved
existing Compact beta model-quality limitation is unchanged.

The family audit includes all six public/privacy/recovery surfaces, all three
working editors and their actual dialogs. Air remains 1.6.0. Raw evidence is in
`/tmp/air-components-2026-11-03`; selected evidence is retained by the canonical
Cloakyard audit of this date. Existing approved editor compositions remain.
Physical Windows/iPhone, software keyboard, OS IME, real browser zoom and spoken
assistive acceptance remain open; automated WebKit does not close them.

Release follows passing local checks through dev → main. Unrelated work is excluded.
