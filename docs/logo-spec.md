# CloakPDF logo assets

A folded white report sits on the blue enamel disc. Three printed lines sit above a two-column table.

| Asset                                | Use                                                                         |
| ------------------------------------ | --------------------------------------------------------------------------- |
| `public/cloakpdf-mark.svg`           | 64×64 circular mark for page headers, the family directory and social cards |
| `public/icons/favicon.svg`           | Simplified 16×16 browser-tab drawing                                        |
| `public/icons/safari-pinned-tab.svg` | Monochrome silhouette for Safari                                            |
| `public/icons/cloakpdf-app-icon.svg` | Opaque launcher master for PWA, Apple touch and legacy ICO files            |

The web mark has a 60-unit disc on a 64-unit canvas, a raised rim and light from the upper left. Its embedded dark appearance follows the system theme. Keep the page, fold and table together when placing the mark in headers.

The launcher extends the enamel to all four corners. Its foreground fits inside the 40%-radius maskable safe zone. Run `vp run generate-icons` to rebuild the install assets. After a production build, run `vp run generate-og` and rebuild to include the new social card.
