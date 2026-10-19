# Tests

All automated checks live under this directory and are grouped by execution
environment:

- `unit/` — Vitest suites. Files use the `*.test.ts` convention.
- `e2e/` — real-browser Puppeteer specs. Files use the `*.e2e.ts` convention.
- `e2e/tools/` — browser diagnostics and visual-capture utilities; these are not
  part of the automated E2E suites.
- `fixtures/` — local-only PDF inputs documented in
  [`fixtures/README.md`](fixtures/README.md).

Generated browser profiles, retrieval traces, screenshots, and PDF fixtures are
git-ignored. They are runtime artifacts, not test source.

## Commands

| Command                  | Scope                                      |
| ------------------------ | ------------------------------------------ |
| `pnpm test`              | All unit tests                             |
| `pnpm test:unit:watch`   | Unit tests in watch mode                   |
| `pnpm test:e2e:smoke`    | Core non-AI browser smoke suites           |
| `pnpm test:e2e`          | On-device AI browser suite                 |
| `pnpm test:e2e:all`      | Core browser smoke followed by AI          |
| `pnpm test:e2e:extended` | Slower focused editor/browser regressions  |
| `pnpm test:probe`        | Retrieval diagnostics                      |
| `pnpm test:compare`      | Compare configured on-device model tiers   |
| `pnpm test:shot`         | Capture one editor tool at desktop + phone |

The browser commands require `vp dev` and Chrome. See
[`fixtures/README.md`](fixtures/README.md) for fixture requirements.

### Ask PDF recovery and layout

`node tests/e2e/ask-pdf-chat.e2e.ts` starts an isolated Vite server on port 8142
and tests the real UI against a controlled RAG boundary. It covers indexing and
answer errors, retry, draft/focus retention, IME-aware submission, source links,
scroll ownership, replacement/navigation and the Air viewport/theme/text matrix.
The fixture lives only in `tests/e2e/`; no test switch ships in the application.
Set `CHAT_TEST_URL` to reuse an already running fixture server. Real models,
retrieval, caching, tier switching and memory release remain covered by
`tests/e2e/ai-tools.e2e.ts` against the normal production or development server.
