# Test fixtures

The PDF fixtures in this directory are local-only. `*.pdf` is ignored by
`tests/fixtures/.gitignore`; the names may appear in source and documentation,
but the documents themselves are not committed.

## Current local fixture set

These are the files against which the browser suites are currently calibrated.
The hashes make an accidental replacement obvious.

| Filename                                | Document / shape                                                                      | Primary test roles                                                                                    | SHA-256                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `sample.pdf`                            | 4-page A4 résumé with selectable text, contact details, and PII                       | Default Ask PDF extraction; standalone password, compare, and signature workflows; editor smoke flows | `3f5a978da4109c430dcea470030d3e5b5588923ed6c90f038febd9da78c2494b` |
| `multipage.pdf`                         | 40-page US Letter “Claude Certified Architect – Foundations Certification Exam Guide” | Optional long-document Ask PDF retrieval; editor/page interaction tests; standalone merge             | `af3988a41eed982cf370d20bb076aba7b93c1824133e69a1e5eacfac98607a47` |
| `Sample Scanned Doc.pdf`                | 7-page US Letter scanned/image-rich document with very little extractable text        | Positive Extract Images path; image-dominant compression; standalone merge                            | `ef1340fcbb99bdb25e74c524072d72eaa99502fb215d20f1d8c124e91bda721f` |
| `The Complete Generative AI Leader.pdf` | 16-page US Letter text-heavy guide                                                    | Text-dominant compression; standalone merge                                                           | `08a4b489b67b58a82155f9bf22516a8f75fa19e20c11e0a450c09210e1b2fc05` |

The standalone suite also uses the tracked bitmap assets
`public/icons/apple-touch-icon.png` and `public/icons/og-image.png` for the
Images to PDF workflow, so no separate image fixture is required here.

## Which suites require what

- `tests/e2e/standalone-tools.e2e.ts` requires all four PDFs above. It uploads
  every PDF to Merge, uses the scanned document for extraction, and uses
  `sample.pdf` for the security tools plus a temporary first-page derivative
  for the pixel comparison.
- `tests/e2e/ai-tools.e2e.ts` uses `sample.pdf` by default. Run with
  `FIXTURE=multipage` to exercise retrieval over the 40-page certification
  guide.
- Most editor browser tests use `multipage.pdf`; compression uses all four.

## Optional extended editor probes

With `vp dev` running, `pnpm test:e2e:extended` runs the slower, focused
regressions that are intentionally kept out of the regular E2E aggregate:
rotation state/export, compression quality, pen and palm-rejection input,
annotation font embedding, live stamp preview, and desktop/mobile placement
resize. These probes use the same `CHROME_PATH` and `E2E_URL` overrides as the
regular browser suites and write any visual artifacts to a temporary directory.

Run `shasum -a 256 tests/fixtures/*.pdf` to verify the local copies.

## Privacy

Use disposable or explicitly approved documents. The app processes these PDFs
inside the local browser and the tests do not upload their bytes, but ignored
files can still be read by anyone or anything with access to your working copy.
