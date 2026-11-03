# Full-view editor comparison — 2026-11-03

The PDF/IMG/Resume comparison includes actual working editors, tool controls,
keyboard focus, dialogs, pickers and secondary flows. A landing-page pass alone
is not whole-product acceptance.

PDF now uses Air's 20px regular inspector heading and 14px compact heading,
with body-size supporting text. The remaining obsolete model-picker scrollbar
class is replaced by `air-scroll`. Document composition and output are unchanged.

Validation: `vp check`, Knip, all 461 units and build pass; 616 all-panel layouts
per Chrome/WebKit engine pass across all eleven required sizes, both themes and
enlarged text. The non-AI smoke suites pass, including six standalone workflows,
all 22 editor tools, AI modal state simulations, export, navigation, 88 collection
layouts and 68 canvas layouts. Test drivers now wait for retained motion and
explicitly dismiss a cache notice before tapping an obscured mobile toolbar.
Cross-editor field/font/focus/dialog comparisons pass in both engines.

Evidence and full family coverage ledger are maintained in Cloakyard's
`docs/air/editor-comparison-2026-11-03.md`; raw test output is retained at
`/tmp/air-editor-comparison-2026-11-03`. The approved existing Compact-model
limitation and physical-device/assistive acceptance remain separate. No AI
implementation or output-processing code changes in this piece.
