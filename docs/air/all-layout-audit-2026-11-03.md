# Inspector layout follow-up — 2026-11-03

Visual review found the inspector's Cancel button shrinking until its label split
as “Can / cel” at 768px. Reserve the button's intrinsic width with `flex-shrink: 0`;
the adjacent description keeps its normal wrapping. No transaction, history,
processing, export, mobile action or dependency changes.

The existing responsive-motion E2E suite now measures the actual action text at
16px and 32px root fonts on desktop and both tablet orientations. It requires one
contained line. The corrected build passes the suite and the collection suite's
88 layouts, staged edits, actual PDF output and keyboard-ownership checks.

The all-panel audit passes 616 observations per engine in Chromium and WebKit:
22 tools at all eleven required viewport sizes, both themes, plus enlarged-text
profiles at 390, 1024 and 1440. It waits for document-field loading, checks action
labels, control targets/containment, reachable scrolling and page overflow. No
failures or browser errors. The preliminary geometry-only run missed the split
word; visual inspection and the new assertion close that gap.

Required gates pass: `vp check`, `pnpm check:dead`, 461 unit tests in 48 files,
production build/deployment size, 96-source Air inventory and standalone
portability. The modal suite also passed during the initial family pass.
Before/after tablet captures, compressed final reports and gate logs are in
`evidence/all-layouts-2026-11-03/`.

The canonical six-app record is Cloakyard's
`docs/air/all-layout-audit-2026-11-03.md`. Enlarged-text evidence uses a 32px root
font, not actual browser zoom. Physical iPhone/software-keyboard, OS IME, spoken
assistive acceptance and the approved existing Compact beta long-document
limitation remain separate. The dev → main PR records exact-main checks and live
asset verification for this bounded CSS change.
