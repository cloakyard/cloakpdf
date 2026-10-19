# Approved hyperlink treatment — 2026-10-19

The user reconfirmed angled hyperlinks and asked to preserve the approved Air design.
Air 1.0.5 (`94c5e537752f`) supersedes the straight-link rule introduced in 1.0.4.
Hyperlinks with a cue use ArrowUpRight; forward app actions and same-page jumps
retain ArrowRight. Header/footer navigation and credits keep neutral ink, while
meaningful body links, focus and active indicators retain the existing blue.
Destinations, new-tab behavior and product features are preserved.

Restores the angled Source cue in the shared and recovery headers, and corrects the lower Explore the source link. Forward editor/tool actions are unchanged. Check/lint/types, dead-code, 461 unit tests, production build/assets, landing search and real home/merge-to-editor routing pass; 95-surface integrity and 18 portability checks pass.

The family link review covers 22 required viewport/theme cases per app plus two
320px/200% text cases (120 total), compact-menu opening/Escape/focus restoration,
neutral Source colour and decorative icon hiding. Desktop/laptop/phone light/dark
navigation captures were visually inspected. This bounded correction does not
complete the unfinished Resume/IMG migrations or physical/assistive acceptance.

Evidence: `evidence/hyperlinks-2026-10-19/`; full captures and command logs remain
in `/tmp/air-hyperlinks-2026-10-19/`. Root/PDF/Drop are deployed and production-verified;
Resume/IMG remain local.

## Production verification

[PR #205](https://github.com/cloakyard/cloakpdf/pull/205) merged candidate `350efbb`
to main `8f801c3`. Cloudflare build `f9470d64-5084-4d3f-bd7f-047e0b0d716e`
deployed version `5f3bbb89` at 100% traffic. All remote checks pass.
All 132 production files match the tested SHA-256 bytes; no-transform and
missing-route behavior pass. All 24 live viewport/theme/text cases pass, including
angled hyperlinks, neutral Source/credits and responsive navigation. Live desktop/laptop/
phone light/dark captures were inspected. Evidence is in
`evidence/hyperlinks-2026-10-19/production/`. Release tags, native apps and published
installer assets are unchanged.
