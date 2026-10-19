# CloakPDF brand-coloured Air deployment — 2026-10-19

The user explicitly authorized deployment. The validated candidate `b67e32d`
was fast-forwarded into dev, then merged through [PR #203](https://github.com/cloakyard/cloakpdf/pull/203)
to main `72f8883`. The production tree matches the validated candidate.
Cloudflare build `3da20ef8-c237-4d1e-b1e7-1b3b218c9583` succeeded; active version
`afe96c45` serves 100% traffic at [CloakPDF](https://pdf.cloakyard.com).

Fresh local checks and production builds pass. All PR and main CI checks pass.
Every deployed build file matches local SHA-256, with no-transform headers:
132 files plus the expected missing-route response (true 404). This includes the
OG artwork and PWA assets, lazy shader. Twelve production viewport/theme cases cover desktop,
laptop, tablet, narrow phones and landscape; both real GPU themes render and
stop at rest. Desktop/laptop/phone light/dark captures were visually inspected.
No browser script errors were observed.

All six standalone tool workflows also pass against production using documented
synthetic fixtures, including actual output validation and independent OpenSSL
signature verification. See `evidence/brand-deployment-2026-10-19/live-outputs.txt`.

Evidence: [deployment record](evidence/brand-deployment-2026-10-19/deployment.json),
[asset hashes](evidence/brand-deployment-2026-10-19/live-assets.json),
[responsive/GPU checks](evidence/brand-deployment-2026-10-19/brand-horizons.json)
and adjacent review/deployment images. Full captures/logs remain at
`/tmp/air-brand-deploy-2026-10-19/cloakpdf/`.

Resume and IMG remain local; full-family migration and physical GPU/battery/thermal
and assistive-device acceptance remain open. No credentials or deployment settings
were changed.
