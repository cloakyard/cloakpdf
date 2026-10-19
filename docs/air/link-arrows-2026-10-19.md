# Consistent landing navigation arrows — 2026-10-19

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
