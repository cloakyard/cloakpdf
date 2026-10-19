# Neutral hyperlinks — 2026-10-19

The user identified blue content links after the earlier navigation-only fix,
explicitly included Cloakyard, required a design-system rule, and confirmed that
hover must not turn text blue. Air **1.0.6** (`e7c8a4bcfbc5`) supersedes the blue
body-link permission in 1.0.5. The canonical contract's “Landing navigation and
text resilience” section owns the rule; generated DESIGN.md and local bundles
carry it without requiring a sibling checkout.

- Public-page hyperlink text is neutral in default, visited, hover, focus and
  active states. Standalone links use ink; supporting navigation uses secondary
  ink; inline links inherit prose, with a 1px underline and 3px offset.
- Preserve angled ↗ destination cues, original destinations and button hierarchy.
  Same-page/forward actions retain their meaningful arrow. Hover may underline or
  strengthen neutral ink. Keyboard focus keeps its 2px blue outline; active
  indicators and system forced colours remain accessible. Author output is unchanged.
- The shared `test:air-links` browser command examines all visible anchors and
  nested text at required viewports, compact menus, 200% text, hover and keyboard
  focus. It ships in each repo. Supply SITE_URL, AIR_ROUTES, AIR_EVIDENCE_DIR and
  an external PUPPETEER_MODULE. For state-routed privacy pages, set AIR_OPEN_LABEL
  and AIR_OPEN_TARGET so the checker verifies the actual opened surface.

The PDF privacy page inherits neutral prose instead of forcing accent text.
Shared reading/recovery prose adopts the same treatment. Format/lint/types,
dead-code, 461 unit tests, build/assets, 95-surface integrity and 18 portability
checks pass. The actual footer button opens the verified state-routed policy; all policy links
pass neutral resting/hover text and visible keyboard-focus checks.

Evidence: `evidence/neutral-links-2026-10-19/`; full captures, raw browser results
and command logs are in `/tmp/air-neutral-links-2026-10-19/`. Final visual review is complete. Production publication is recorded below when
complete. No native code, release
tags, installer assets, document/image output or link destinations changed.

Local all-link checks pass: 116 layout/state cases and 34 keyboard focus checks. Desktop/laptop/phone light/dark captures were visually inspected, including page content and policy text.
