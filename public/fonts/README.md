# Bundled fonts

Self-hosted so the app stays fully offline (no Google Fonts CDN). Each is a
Latin-subset TTF used for two things: the on-canvas `@font-face` preview in the
Annotate text tool (`src/fonts.css`) and subset-embedding into the exported PDF
(`src/utils/pdf/annotate.ts`).

Files were taken from the [Fontsource](https://fontsource.org/) distributions
(`cdn.jsdelivr.net/fontsource`), `latin-<weight>-<style>.ttf`.

| Family (`/fonts/<dir>/`)     | License            |
| ---------------------------- | ------------------ |
| `InterVariable*` (UI font)   | SIL OFL 1.1        |
| `roboto`                     | Apache License 2.0 |
| `robotomono`                 | Apache License 2.0 |
| `opensans`                   | SIL OFL 1.1        |
| `lato`                       | SIL OFL 1.1        |
| `montserrat`                 | SIL OFL 1.1        |
| `poppins`                    | SIL OFL 1.1        |
| `merriweather`               | SIL OFL 1.1        |
| `lora`                       | SIL OFL 1.1        |
| `playfairdisplay`            | SIL OFL 1.1        |
| `sourcecodepro`              | SIL OFL 1.1        |
| `oswald` (no italic variant) | SIL OFL 1.1        |

Both the SIL Open Font License and Apache 2.0 permit redistribution and
embedding in documents. Each `<dir>/<weight>-<style>.ttf` is named for its CSS
weight (400/700) and style (normal/italic).
