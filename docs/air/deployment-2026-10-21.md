# Dependency and Air deployment — 2026-10-21

Deploy the validated dependency upgrade and reduced-motion media-query snapshot
fix through an individual dev → main PR. All 496 source/config/test/build hashes
match the prior acceptance candidate, including all 133 deployment files.
Format/lint/types, dead-code, 461 units, 16 smoke suites, seven extended suites,
real PWA/output, responsive themes, neutral links and GPU checks pass.

## Explicitly accepted existing limitation

The Compact beta model misses facts on the original long-document grounded-answer
check. It fails in both the upgraded and pre-upgrade builds; rebuilding the derived
PDF index with default RAG flags reproduces it. Quality passes both fixtures and
Compact passes the short document. No assertion, model, prompt or retrieval logic
is changed. A diagnostic relevance-order experiment was removed because it did
not resolve the failure.

The user explicitly approved this release on 2026-10-21: “Deploy PDF with the
documented existing limitation”. This is a release exception, not a passing test.
Track a separate AI quality fix and retain the original fixture/assertion. Raw
private document logs stay outside Git; sanitized results and hashes are in the
dependency evidence. The existing node-forge GHSA-86w9-cpqp-85rv exception remains
unchanged and expires 2026-11-06. No additional security exception is introduced.

Evidence: `docs/air/evidence/dependencies-2026-10-21.json`.

## Production verification and test readiness

PR #207 merged at `f3a231d`; dev was synchronized to main. The live site serves
132 exact deployed asset hashes with `no-transform` and no injected scripts.
All six real standalone output workflows, 68 horizon layouts with GPU/fallbacks,
and 60 neutral link states / 18 keyboard checks pass. Desktop/laptop/phone light
and dark landing captures were reviewed.

The live smoke run exposed a test-only readiness race: `networkidle2` permits
two pending requests and can return before the remote entry module renders the
home cards. Wait for the requested card before the existing click/assertions.
No feature assertion is weakened and no application bytes change. Code checks,
dead-code and all 461 units pass; all six real production workflows pass with
the readiness correction. See `evidence/deployment-2026-10-21.json`.
