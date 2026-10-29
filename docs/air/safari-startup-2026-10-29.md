# Air 1.2.7 — Safari artwork startup, 29 October 2026

WebKit rounds the reported CPU count to four on devices with fewer than eight
cores. The shared artwork lifecycle incorrectly treated that value as a reason
to disable finite transform/opacity animations. A WebKit reproduction against
all five live sites produced `constrained`, zero animations and no console errors.

The canonical lifecycle now ignores CPU count for this lightweight artwork.
Reduced motion, forced colours, Save-Data, reported memory at or below 4 GiB,
missing animation APIs, offscreen/hidden suspension and finite cleanup remain.
No user-agent detection, new dependency, timing, artwork, CSS, task UI or output
change. The heavier reference shader keeps its existing resource policy.

[WebKit implementation](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/NavigatorBase.cpp#L172-L182)
explains why CPU count cannot serve as this device-performance test.

Verification passes: 44 moving layouts for this app across WebKit/Chrome,
including all eleven required sizes in both themes, eight fallback visits and
two lifecycle journeys. The shared matrix proves progressing timelines, changing
composited artwork, finite completion, offscreen suspension and immediate preference
changes. Product checks/build/provenance and the applicable artwork suites pass.
PDF passes 461 units plus real upload/merge entry; Resume passes all 373 production
tests with zero skips on the complete rerun. Initial harness failures and the
previously observed Resume contact-node test race are retained in the family audit.

See the [full audit and evidence](https://github.com/cloakyard/cloakyard/blob/dev/docs/air/safari-startup-2026-10-29.md).
Individual dev → main PR rollout follows these passing checks. Desktop WebKit with a mobile viewport
and four-thread/no-memory hints is browser-engine evidence, not a physical iPhone
or Low Power Mode acceptance result. CloakIMG remains parked; native apps and
KERR are unchanged. Existing full-product and device gates remain open.
