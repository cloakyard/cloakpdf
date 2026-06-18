# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This project uses **Vite+** (`vp`) — a unified toolchain wrapping Vite, Rolldown, Vitest, tsdown, Oxlint, and Oxfmt. Install globally with `npm i -g vite-plus`. Run `vp help` / `vp <command> --help` for any command. Docs live at `node_modules/vite-plus/docs` or https://viteplus.dev/guide/.

| Command                                      | Purpose                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vp install`                                 | Install dependencies (run after pulling).                                                                                                                                                                                                                                                                     |
| `vp dev`                                     | Dev server on http://localhost:5173.                                                                                                                                                                                                                                                                          |
| `vp build`                                   | TypeScript check + production build to `dist/`.                                                                                                                                                                                                                                                               |
| `vp check`                                   | Format + lint + type-check. Must pass before commit.                                                                                                                                                                                                                                                          |
| `vp test`                                    | Unit tests via Vitest (`tests/unit/`).                                                                                                                                                                                                                                                                        |
| `vp test run tests/unit/rag-bm25.test.ts`    | Run a single file.                                                                                                                                                                                                                                                                                            |
| `pnpm test:e2e`                              | Real-browser smoke (puppeteer-core) that uploads `tests/fixtures/sample.pdf` and drives Ask PDF end-to-end. Requires `vp dev` running and a Chrome binary at `CHROME_PATH` (default macOS path). First cold run downloads ~275 MB of model weights into the puppeteer profile at `tests/.puppeteer-profile/`. |
| `pnpm exec tsx tests/e2e/retrieval-probe.ts` | Dumps per-retriever hits + relevance scores per question to `tests/retrieval-debug/<timestamp>.json` for tuning the RAG pipeline.                                                                                                                                                                             |

Pre-commit testing rule: run `vp check` + `vp test` + (for UI/RAG changes) `pnpm test:e2e` **before** `git commit`. There is a lint-staged hook that runs `vp check --fix` on staged files, but unit/e2e are not enforced by the hook.

## Architecture

CloakPDF is a **100% client-side** React 19 + TypeScript 6 single-page app served as static assets via Cloudflare Workers (`wrangler.jsonc`). Every PDF operation runs in the browser; no file ever crosses the network.

### View routing

There is no router library. [src/App.tsx](src/App.tsx) is a state machine over four views: home grid, standalone tool view, the unified **editor**, and privacy. The active view is plain `useState` — no URL hash (cross-component navigation goes through `CustomEvent`s in [src/utils/nav.ts](src/utils/nav.ts)). The home is **editor-first**: dropping a PDF on the home drop zone opens the canvas editor. Standalone tools and the editor each render as a top-level lazy chunk under a `Suspense` boundary.

### Two tool surfaces, one derived id

There are two places a tool can live:

- **Standalone home cards** — [src/config/tool-registry.ts](src/config/tool-registry.ts) exports `tools`, `categories`, `findTool`, `findToolComponent`, and `HOME_CARD_TOOLS`; the card components live in [src/standalone/](src/standalone/). Only tools that **can't** be a single-PDF "edit then export" flow stay as cards (`standaloneOnly: true`): the multi-input constructors (merge, images→PDF), the dual-input compare, terminal-output extract-images, the security flows (password, digital signature), the read-only inspector, and on-device AI chat.
- **Editor panels** — every other single-PDF tool lives inside the editor. Its rail metadata is in [src/editor/tools.ts](src/editor/tools.ts) (`EDITOR_TOOLS`) and its `{ Stage?, Panel }` implementation is bound by id in [src/editor/registry.tsx](src/editor/registry.tsx), with the panels under [src/editor/panels/](src/editor/panels/).

The app-wide `ToolId` union is **derived from both rosters** in tool-registry.ts (`(typeof tools)[number]["id"] | EditorToolId`) — it is not hand-maintained, so it can't drift. Adding a tool means adding it to exactly one roster.

Tool metadata flags worth knowing:

- `standaloneOnly` — keep the tool as a home card rather than an editor flow (see above).
- `desktopOnly` — hides the card on mobile and shows a "desktop only" placeholder if a phone hits the URL directly. Used for on-device AI tools (RAM/WebGPU constraints).
- `beta` — renders a beta chip next to the title.
- `requirements` — free-form note (e.g. "Requires ≥ 4 GB free RAM") shown on the card and inside the tool.

### The unified editor

The primary surface is the canvas editor ([src/editor/](src/editor/)) — a Photoshop-like single-PDF workspace. [EditorShell.tsx](src/editor/EditorShell.tsx) hosts a persistent [PdfStage.tsx](src/editor/PdfStage.tsx) that never tears down on tool switch; the active tool registers its overlay paint + pointer handlers (incl. `onPointerCancel`) through the `useStageProps` seam in [src/editor/stage.tsx](src/editor/stage.tsx). [EditorContext.tsx](src/editor/EditorContext.tsx) owns the `CanvasDoc`, history (byte + object snapshots, not rasters), and view state. The Export menu ([src/editor/ExportMenu.tsx](src/editor/ExportMenu.tsx)) covers PDF / images / contact-sheet / split and the Organize panel covers reverse / extract / remove-blank — which is why those have no standalone cards.

### Two PDF libraries, two jobs

- **`@pdfme/pdf-lib`** — every structural manipulation (merge, split, rotate, redact, sign, metadata, watermark, form-fill). Lives in [src/utils/pdf/](src/utils/pdf/): cohesive modules (`pages`, `forms`, `transform`, `stamps`, `metadata`, `ocr`, `redact`, `scrub`, `annotate`, `bookmarks`, `attachments`) plus a shared `raster` PDF.js/canvas layer, all re-exported through the [src/utils/pdf-operations.ts](src/utils/pdf-operations.ts) barrel (the stable import path every tool uses).
- **`pdfjs-dist`** (PDF.js) — rendering pages to canvas for previews and thumbnails. Plus the raster path of Compress PDF. Lives in [src/utils/pdf-renderer.ts](src/utils/pdf-renderer.ts).

These never get conflated. Adding a "modify the bytes" tool → use pdf-lib. Adding a "show me the page" UI → use PDF.js.

### Layout-aware extraction & smart redaction

[src/utils/layout-extract.ts](src/utils/layout-extract.ts) turns a PDF into positioned text — per-page `items` with `{text, x, y, width, height}` in top-left point space — which powers two features. Two extraction entry points exist on purpose:

- **`extractLayout`** (LlamaParse Lite / `@llamaindex/liteparse-wasm`) — used by the **OCR PDF** tool for layout-aware reading-order text and a correctly positioned searchable-PDF layer (`createSearchablePdfFromLayout` in pdf-operations). liteparse is a ~4 MB Rust→WASM module, loaded lazily via a Vite `?url` import; it needs **no COOP/COEP headers** (single-threaded, verified). **Caveat, do not relitigate:** liteparse's _in-browser OCR/rasterisation_ path traps (`RuntimeError: unreachable`) and hangs the parse on the published 2.0.4 wasm — so we always call it with `ocrEnabled:false` and OCR scanned pages ourselves with PDF.js + Tesseract (`ocrScannedPages`), guarded by a parse timeout.
- **`extractTextGeometry`** (PDF.js `getTextContent`) — used by **smart redaction**. liteparse merges runs and occasionally reports a bogus item width (e.g. 29 pt for a 69-char line), which throws a sub-line redaction box to the wrong place; PDF.js gives trustworthy per-run widths, so redaction geometry comes from there.

**PII detection** lives in [src/utils/pii.ts](src/utils/pii.ts) — the single source of truth for email/url/phone/SSN/card(Luhn)/IBAN/IP/date patterns. `EMAIL_RE`/`PHONE_RE` are imported by the RAG fast-paths (relocated, behaviour unchanged); `detectPii` is the broader page-sweep. `detectPiiRects` (layout-extract) maps each PII span to a fraction rect via `substringFractionRect`. **Names are not auto-detected** (would need an NER model → desktop-only); users box those by hand.

**Redaction is destructive.** `redactPdf` rasterises every page that carries a box and burns the boxes into the pixels, rebuilding those pages as image-only — the underlying text is physically gone, not just covered (verified by OCR'ing the output). Untouched pages are copied through as vectors. The trade-off (redacted pages lose selectable text, file grows) is surfaced in the UI.

### On-device AI (Ask PDF)

The only feature heavier than vanilla PDF tooling. Two on-device models load together via Transformers.js:

- **SmolLM2-1.7B-Instruct** (q4f16, ~1 GB on disk, ~2.5 GB peak RAM) — chat model.
- **EmbeddingGemma-300M** (q8, WASM, ~309 MB) — sentence embeddings for retrieval.

Model metadata lives in [src/utils/ai-models.ts](src/utils/ai-models.ts) — both entries carry long history-of-swaps comments explaining why current settings are what they are. **Read those before swapping a model.** The chat slot has burned Qwen / Llama 3.2 / Gemma / SmolLM2-360M / SmolLM3 — every swap regressed extraction quality. Memory: don't propose Qwen as a drop-in (gibberish in-browser); SmolLM3 is rejected.

The RAG pipeline ([src/rag/](src/rag/)) is a LangGraph state machine — see [src/rag/graph.ts](src/rag/graph.ts) for the full diagram. Per question:

1. **`classify`** — small-talk regex routes greetings to a `chitchat` reply without retrieval.
2. **`retrieve`** — hybrid BM25 + dense retrieval fused via Reciprocal Rank Fusion ([src/rag/retrievers/hybrid.ts](src/rag/retrievers/hybrid.ts)). The first chunk of the document is always merged in as an "anchor" so identity questions ("whose résumé is this?") can use the header. A dense-cosine relevance gate (`scoreRelevance`) flags off-topic queries; below threshold (0.5) the graph routes to `refuse` with a canned message.
3. **`generate`** — three deterministic fast-paths run first ([src/rag/fast-paths.ts](src/rag/fast-paths.ts)): verbatim contact extraction (phone/email regex), document-type identification ("This appears to be X's résumé."), and topic-absence refusal ("The document doesn't mention X."). On a miss, the chat model streams a grounded answer with header + excerpts as context.

The fast-paths exist because SmolLM2-1.7B mis-extracts digits, mislabels résumés as "technical specs", and hallucinates content for topics not in the corpus. Each function has a header comment listing the exact failure mode it guards against — read it before loosening or removing a fast-path.

Index caching: chunks + embeddings are persisted in IndexedDB keyed by SHA-256 of the PDF bytes ([src/rag/persistence.ts](src/rag/persistence.ts)) so re-opening the same file is instant. The packed Float32 vector store lives in [src/rag/vector-store.ts](src/rag/vector-store.ts).

Generation sampling defaults ([src/rag/chat-model.ts](src/rag/chat-model.ts)): `temperature: 0.2`, `top_p: 0.85`, `max_new_tokens: 256`, `repetition_penalty: 1.15`, `no_repeat_ngram_size: 6`. The tuning history comment in the constructor body explains every step — keep it updated when changing defaults.

### Design system

[DESIGN.md](DESIGN.md) is the design spec — a YAML front-matter token system plus prose explaining the visual language. Two invariants explicitly called out:

1. **One accent.** Per-tool / per-category colour stays out of interactive surfaces. The Ocean-Blue primary is the only accent on CTAs, focus rings, hover borders.
2. **Slate-200 borders, no resting shadow.** Cards earn elevation on hover, not at rest.

Read DESIGN.md before adding new UI surfaces — the design system is doing real work and ad-hoc colour/shadow choices break the calm tone.

### Deployment

Cloudflare Workers + Static Assets (`wrangler.jsonc`). Auto-deploys on push to `main` via Workers Builds. Preview deploys per PR. The static `dist/` directory is served from the Worker — no SSR.
