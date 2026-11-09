# Compact editor simplicity and library audit — 2026-11-09

Air 1.7.0 keeps phone controls on the canvas plane: home, page navigation, Export
and More actions. The Actions sheet retains full filename, history, zoom and reset.
Removed the old hover document popover and redundant Expand/Split controls. Tool
bodies scroll beneath fixed 48px X/tick actions; inspection/deferred-mark tools
retain Close. At least 40% of the mobile working region remains document preview.

Tool completion is shared across phone/tablet and registered before paint, fixing
a fast-tap Close→Apply race. History guards retain focus at boundaries and transfer
it into Actions when layout changes. Duplicate actions are guarded, failed work
retains its draft, and deferred redaction/erase still apply through export.

Stable web dependencies are upgraded, including Vite+ 1.5.0, pnpm 12.18.0,
Transformers 4.3.2, PDF.js 6.5.438, LangChain core 1.3.5, LangGraph 1.7.2,
LiteParse 2.18, Motion 14.11, Tailwind 4.3.5 and Lucide 1.70.0. Security audit:
zero known vulnerabilities. Obsolete package-age exclusions and document-popover
skins are removed. The dead-code gate passes.

Validation: check/types/build, 461 unit tests, the complete 16-suite browser smoke
chain and seven extended suites. Coverage includes six standalone workflows,
22 tools, 176 registry selections and 148 navigation layouts; 88 collection and
68 canvas cases; all six export formats with actual redaction/output verification;
64-case export/AI edge-state matrices; 16 Chromium/WebKit mobile transaction flows.
Standalone/compression probes use documented synthetic demo fixtures; the editor
and real-model probes additionally use the original local PDFs, kept private.

The updated model runtime passes Quality/Compact inference, exact fixture contact
extraction, warm reload, model swap and memory release/reload. The previously
approved Compact beta long-document limitation remains documented; this short
fixture run does not assert a fix or universal model accuracy.

The family canonical-control, privacy/recovery, real-worker notice, native scrollbar,
finite-artwork and surface-motion matrices also pass across phone/tablet/laptop/
desktop and both themes. The full portable contract remains bundled here. Family
receipts are in Cloakyard's `docs/air/evidence/mobile-simplicity-2026-11-09`.
The preceding release is deployed through #232; exact-main checks and production verification are recorded in that PR. Physical Windows/iPhone, real software
keyboards/IME, browser zoom and spoken assistive acceptance remain open.
