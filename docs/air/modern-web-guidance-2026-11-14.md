# Modern Web Guidance — 14 November 2026

Portable Air 1.7.4 and increased-contrast scroll thumb. Editor/output/PWA behavior unchanged; the original unrelated AI checkout remains separate.

The upstream skill is installed for Codex and Claude Code. See
[provenance, licenses and update instructions](../../.agents/MODERN_WEB_GUIDANCE.md)
and [the installed skill](../../.agents/skills/modern-web-guidance/SKILL.md).
All six repositories share upstream revision
`4dd968349e54ca45a05dd5c818fb035c9054b022`; the skill is development-only and is
not included in the app bundle. CLI telemetry was disabled.

The [family audit](https://github.com/cloakyard/cloakyard/blob/main/docs/air/modern-web-guidance-audit-2026-11-14.md)
records guidance, findings, exceptions, per-view coverage and reproducible evidence.
This repository's final legacy scan reports **0 matches**, which is not a
whole-app conformance score. IMG retains two radio-selector false positives and a
Crop handler that already excludes text fields; Resume retains document-output
styling. Other initial findings were corrected. No safe fallback was removed to
force a zero score.

All six web check/build gates, portable Air checks and the family README check
pass. Fresh comparisons cover public pages and all three editors in both themes
and every viewport class; changed IMG tools have targeted composition, recovery,
output and keyboard coverage. Unchanged tools and other secondary/edge flows retain
the same-day maintenance audit's detailed coverage rather than a new unqualified
whole-app claim. Physical-device/IME/assistive acceptance remains open.

No drastic visual or architectural change was made. The explicit user-review rule
for such changes is now part of Air's portable contract.
