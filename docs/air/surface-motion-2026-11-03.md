# Air 1.5.0 — surface motion, 2026-11-03

Shared dialog and picker presence, compact tool controls, quiet dialog dismissal and retained PWA notices. Document editing, redaction and export remain unchanged.

Dialogs use 240ms entry/160ms exit; small surfaces use 180ms/160ms. Reduced motion is immediate. No animation dependency was added. Typing and selection remain immediate.

## Verification

- 461 unit tests passed.
- 12 normal-motion phone action journeys and actual PDF downloads passed.
- Modal, responsive motion, keyboard interactions, command palette and export suites passed.
- 44 deferred-update layouts and real-worker lifecycle/race checks passed.
- Dead-code, type/build and deployment asset gates passed.

The six-site comparison passes 648 home/288 secondary layouts, 408 privacy layouts and 22 navigation journeys. The three PWAs match in 396 real-worker notice layouts. Shared presence passed 170 Chrome/WebKit observations plus the focused final regression pass.

See [the family audit](https://github.com/cloakyard/cloakyard/blob/main/docs/air/family-motion-2026-11-03.md) and local evidence. Physical iPhone/software-keyboard, OS IME and spoken assistive acceptance remain open; automated WebKit does not close them. The recorded product backlog is unchanged.

## Rollout

Passing local piece prepared for an individual dev → main PR; production verification is recorded in the central handoff after merge.
