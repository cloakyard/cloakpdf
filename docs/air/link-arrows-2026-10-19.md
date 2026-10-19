# Consistent landing navigation arrows — 2026-10-19

Superseded by [the user-confirmed angled hyperlink treatment](hyperlinks-2026-10-19.md).
This is historical evidence; the straight-link rule is no longer authoritative.

The user identified diagonal link arrows in Cloakyard and CloakPDF. Air 1.0.4
(`0f6ea38f83a9`) now requires a straight right arrow for forward landing links,
including outbound header/content/footer links. Back, download and disclosure
icons retain their meaning; plain text links need no extra decoration.

The shared home/privacy/standalone header and recovery header use ArrowRight, matching the existing body actions. Link destinations, targets, labels and geometry are unchanged. Check/types, dead-code, 461 unit tests, production build/assets, landing search and real home/merge-to-editor routing pass; 95-source integrity and 18 portability checks pass. Document arrow annotation and citation controls are outside this landing-navigation change.

Each family landing passes 22 required viewport/theme cases (11 sizes, both
appearances), plus 320px at 200% text in both themes. Compact menus open and
close with Escape/focus restoration. Decorative arrows remain hidden from
assistive technology; no diagonal navigation glyph or horizontal overflow remains.
Desktop/laptop/phone light/dark navigation captures were visually inspected.
The generated gallery, horizontal-only hover, static keyboard focus and reduced
motion pass separately. This does not close full product or physical-device gates.

Evidence: `evidence/link-arrows-2026-10-19/`. Full captures and verification
commands are retained in `/tmp/air-link-arrows-2026-10-19/`. Root/PDF publication is a
follow-up to the authorized website release; Resume/IMG remain local.

## Production verification

[PR #204](https://github.com/cloakyard/cloakpdf/pull/204) merged the tested
`bf8d1a4` candidate to main `d9ba375`. Cloudflare build
`7fb3d0a2-151d-4e29-86da-9bc771ac9f5a` deployed version `4a482d95` at 100% traffic.
All remote checks pass, including CodeQL, dependency audit and Scorecard. All 132
production files match local SHA-256, retain no-transform and preserve missing-route
behavior. The 24 live layout/text cases pass, and live desktop/laptop/phone
light/dark navigation captures were inspected. Evidence:
`evidence/link-arrows-2026-10-19/production/`. Release tags are unchanged.
