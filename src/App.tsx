/**
 * Root application module.
 *
 * Manages which view is active (home / tool / editor / privacy) and delegates
 * rendering to the matching child component. The home page is editor-first:
 * dropping a PDF opens the unified editor; only multi-input + special tools
 * remain as standalone cards.
 *
 * Tool metadata and lazy components live in `config/tool-registry.ts`.
 */

import { ArrowRight, FileArchive, FileImage, Scissors, Search, X } from "lucide-react";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileDropZone } from "./components/FileDropZone.tsx";
import { Layout } from "./components/Layout.tsx";
import { AnimatePresence, m, variants } from "./components/motion.tsx";
import { OrientationLock } from "./components/OrientationLock.tsx";
import { PrivacyPolicy } from "./components/PrivacyPolicy.tsx";
import { ReloadPrompt } from "./components/ReloadPrompt.tsx";
import { ToolCard } from "./components/ToolCard.tsx";
import {
  categories,
  findTool,
  findToolComponent,
  HOME_CARD_TOOLS,
  tools,
  type ToolId,
} from "./config/tool-registry.ts";
// Plain metadata (no editor component graph) — safe on the home critical path.
import { EDITOR_TOOL_IDS, EDITOR_TOOLS } from "./editor/tools.ts";
import type { Tool } from "./types.ts";
import { isMobileDevice } from "./utils/device-memory.ts";
import { NAVIGATE_TOOL_EVENT, OPEN_EDITOR_EVENT } from "./utils/nav.ts";
// The canvas editor is the primary single-PDF surface (editor-first redesign).
// Lazy-loaded so its pdf-lib / PDF.js graph stays off the home critical path,
// and rendered full-screen outside <Layout> (it owns its own chrome).
const EditorView = lazy(() => import("./editor/EditorView.tsx"));

// ── Platform detection (module-level, computed once) ──────────────

/** `true` when the client runs on an Apple platform (used for ⌘ vs Ctrl hints). */
const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);

// ═══════════════════════════════════════════════════════════════════
//  Sub-components (defined at module level per rerender-no-inline-
//  components best practice)
// ═══════════════════════════════════════════════════════════════════

/** Full-screen centred spinner shown while a tool chunk is loading. */
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20" role="status" aria-live="polite">
      <div
        className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"
        aria-hidden="true"
      />
      <span className="sr-only">Loading tool…</span>
    </div>
  );
}

/** Loading fallback for the editor route. Deliberately mirrors EditorShell's own
 *  centred "Opening PDF…" spinner (same size, same viewport-centred position) so
 *  the chunk-load → PDF-parse handoff shows ONE loader in ONE place — never a
 *  top-anchored spinner followed by a centred one. */
function EditorLoadingFallback() {
  return (
    <div
      className="fixed inset-0 z-[var(--z-editor)] flex items-center justify-center bg-[var(--color-paper-2)]"
      role="status"
      aria-live="polite"
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600"
        aria-hidden="true"
      />
      <span className="sr-only">Opening the PDF editor…</span>
    </div>
  );
}

// ── ToolView ─────────────────────────────────────────────────────

interface ToolViewProps {
  /** Metadata for the currently active tool. */
  tool: Tool;
  /** The lazy-loaded component to render. */
  Component: React.LazyExoticComponent<React.ComponentType>;
}

/**
 * Renders the active tool's header (title + description) and its
 * lazily-loaded component wrapped in a `Suspense` boundary. For
 * `desktopOnly` tools on a mobile UA, renders a placeholder explaining
 * why the tool isn't available instead of mounting it — the home grid
 * already hides the card, but a saved URL / shared link could still
 * land a phone user here directly.
 *
 * No width wrapper here: every tool spans the same responsive shell as
 * the home page (one container, uniform edges). Content-intrinsic caps
 * (chat-bubble measure, diff-image width) live inside the tools.
 */
function ToolView({ tool, Component }: ToolViewProps) {
  const Icon = tool.icon;
  const blockedOnMobile = tool.desktopOnly && isMobileDevice();
  return (
    <div className="cloak-tool-page">
      <div className="mb-5 flex items-center gap-2 text-primary-600">
        <Icon className="size-4" aria-hidden="true" />
        <span className="cloak-mono-label">Standalone utility / local execution</span>
        {tool.beta && (
          <span className="rounded-sm border border-primary-200 bg-primary-50 px-2 py-1 font-mono text-[9px] font-semibold tracking-[0.08em] text-primary-700 uppercase dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
            Beta
          </span>
        )}
      </div>
      <header className="cloak-tool-page__head">
        <div>
          <h1 className="cloak-tool-page__title">{tool.title}</h1>
        </div>
        <div className="cloak-tool-page__aside">
          <p className="m-0 text-lg leading-relaxed text-[var(--color-ink-2)]">
            {tool.description}
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-[10px] uppercase tracking-[0.05em]">
            <div>
              <dt className="text-[var(--color-ink-3)]">Execution</dt>
              <dd className="mt-1 text-[var(--color-ink)]">In browser</dd>
            </div>
            <div>
              <dt className="text-[var(--color-ink-3)]">Document transfer</dt>
              <dd className="mt-1 text-[var(--color-ink)]">None</dd>
            </div>
            {tool.requirements && (
              <div className="col-span-2 border-t border-[var(--color-rule)] pt-3">
                <dt className="text-[var(--color-ink-3)]">Requirement</dt>
                <dd className="mt-1 normal-case tracking-normal text-[var(--color-ink)]">
                  {tool.requirements}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </header>

      <section className="cloak-tool-instrument" aria-label={`${tool.title} workspace`}>
        <div className="cloak-instrument-bar">
          <span>CloakPDF / {tool.title}</span>
          <span className="inline-flex items-center gap-2">
            <span className="cloak-status-dot" aria-hidden="true" /> Local execution
          </span>
        </div>
        <div className="cloak-tool-instrument__body">
          {blockedOnMobile ? (
            <DesktopOnlyNotice tool={tool} />
          ) : (
            <Suspense fallback={<LoadingSpinner />}>
              <Component />
            </Suspense>
          )}
        </div>
      </section>
    </div>
  );
}

/**
 * Calm placeholder shown when a `desktopOnly` tool is opened on a
 * mobile device. Says *why* (mobile WebGPU / RAM ceilings make the
 * on-device AI tools unreliable) so the user understands this isn't
 * a generic "feature unavailable" message but a deliberate gate.
 */
function DesktopOnlyNotice({ tool }: { tool: Tool }) {
  return (
    <div className="rounded-md border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-6 text-[var(--color-ink)] sm:p-8">
      <h2 className="text-lg font-semibold tracking-[-0.01em] mb-2">
        {tool.title} runs only on desktop
      </h2>
      <p className="leading-relaxed text-[var(--color-ink-2)]">
        On-device AI loads large model files into memory and pushes the GPU hard during inference.
        On phones this reliably causes the browser tab to crash or the GPU device to be lost
        mid-question, so we've disabled the tool on mobile rather than ship a broken experience.
      </p>
      <p className="mt-3 leading-relaxed text-[var(--color-ink-2)]">
        Open this page on a laptop or desktop with at least 16 GB of RAM to use it. Every other
        CloakPDF tool runs fine on this device.
      </p>
    </div>
  );
}

// ── Home search index ────────────────────────────────────────────

/**
 * Editor tools mapped to the home-card shape so the ⌘K search reaches the
 * whole product, not just the 7 standalone cards. Clicking one routes through
 * the existing editor path in `handleSelectTool` (opens the editor with the
 * tool preselected). Derived from the same `EDITOR_TOOLS` constant the
 * editor's rail renders from, so search can never drift from the product.
 */
const EDITOR_SEARCH_CARDS: Tool[] = EDITOR_TOOLS.filter((t) => t.status === "ready").map((t) => ({
  id: t.id,
  title: t.name,
  description: t.description,
  icon: t.icon,
}));

/**
 * Export-dialog flows (compress / split / PDF→images) live in the editor's
 * Export modal, not in `EDITOR_TOOLS` — without these aliases, "compress"
 * and "split" would still dead-end in search. Their ids carry an `export-`
 * prefix; clicking one opens the editor plain (the Export dialog isn't
 * tool-addressable).
 */
const EXPORT_FLOW_CARDS: Tool[] = [
  {
    id: "export-compress",
    title: "Compress PDF",
    description: "Shrink the file size — open the editor and export with compression",
    icon: FileArchive,
  },
  {
    id: "export-split",
    title: "Split PDF",
    description: "Split into separate PDFs — via the editor's Export dialog",
    icon: Scissors,
  },
  {
    id: "export-images",
    title: "PDF to images",
    description: "Export pages as PNG or JPEG images — via the editor's Export dialog",
    icon: FileImage,
  },
];

const EDITOR_SEARCH_INDEX: Tool[] = [...EDITOR_SEARCH_CARDS, ...EXPORT_FLOW_CARDS];

/** Normalize a user's query once, then use the same tokens for matching,
 * ranking, and visible highlighting. De-duplicating tokens keeps a repeated
 * word from artificially boosting a result. */
function searchTokens(query: string): string[] {
  return [...new Set(query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean))];
}

/** Name-first ranking for the toolkit index. A description-only match remains
 * discoverable, but an exact or prefix title match always reads first. */
function scoreToolSearch(tool: Tool, normalizedQuery: string, tokens: string[]): number | null {
  const title = tool.title.toLocaleLowerCase();
  const description = tool.description.toLocaleLowerCase();
  const haystack = `${title} ${description}`;
  if (!tokens.every((token) => haystack.includes(token))) return null;

  let score = 0;
  if (title === normalizedQuery) score += 1_200;
  else if (title.startsWith(normalizedQuery)) score += 900;
  else if (title.includes(normalizedQuery)) score += 700;
  if (description.includes(normalizedQuery)) score += 180;

  for (const token of tokens) {
    if (title === token) score += 180;
    else if (title.startsWith(token)) score += 140;
    else if (title.includes(token)) score += 100;
    else if (description.includes(token)) score += 20;
  }
  return score;
}

function SearchMatch({ text, query }: { text: string; query: string }) {
  const tokens = searchTokens(query).sort((a, b) => b.length - a.length);
  if (tokens.length === 0) return text;

  const escapedTokens = tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${escapedTokens.join("|")})`, "gi"));
  return (
    <>
      {parts.map((part, index) =>
        tokens.includes(part.toLocaleLowerCase()) ? (
          <mark key={`${part}-${index}`} className="bg-transparent font-semibold text-primary-600">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

type HomeSearchResult = {
  tool: Tool;
  surface: string;
  route: "standalone" | "editor";
};

// ── HomeScreen ───────────────────────────────────────────────────

interface HomeScreenProps {
  /** Stable callback invoked with a tool ID when the user picks a tool. */
  onSelectTool: (id: ToolId) => void;
  /** Open the canvas editor (optionally with a file). The primary entry. */
  onOpenEditor: (file?: File | null) => void;
}

/**
 * Landing page showing the hero headline, an editor drop zone, a live-search
 * bar with ⌘K / Ctrl+K shortcut, and a categorised grid of the standalone
 * tool cards (multi-input + special tools; everything else opens via the
 * editor).
 *
 * Search state is local to this component so that typing never
 * re-renders the parent `App` or the `Layout` shell. When the user
 * navigates to a tool this component unmounts, naturally discarding
 * the query; returning to the home screen starts with a fresh search.
 */
function HomeScreen({ onSelectTool, onOpenEditor }: HomeScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const activeSearchQuery = searchQuery.trim();

  // ⌘K / Ctrl+K → focus search; Escape → clear search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setSearchQuery((current) => {
          if (!current) return current;
          searchInputRef.current?.blur();
          return "";
        });
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  /** Standalone cards available on this device. `desktopOnly` tools
   * (currently Ask PDF) stay out of a phone's resting grid and search index. */
  const visibleHomeTools = useMemo(() => {
    const mobile = isMobileDevice();
    return mobile ? HOME_CARD_TOOLS.filter((tool) => !tool.desktopOnly) : HOME_CARD_TOOLS;
  }, []);

  /**
   * One ranked index spanning standalone utilities, editor tools, and export
   * flows. Every token must match somewhere; title matches outrank descriptive
   * matches, and source order is the stable tie-breaker.
   */
  const searchResults = useMemo(() => {
    if (!activeSearchQuery) return [];
    const normalizedQuery = activeSearchQuery.toLocaleLowerCase();
    const tokens = searchTokens(activeSearchQuery);
    const index: HomeSearchResult[] = [
      ...visibleHomeTools.map((tool) => ({
        tool,
        surface: `Standalone / ${
          categories.find((category) => category.key === tool.category)?.label ?? "Utility"
        }`,
        route: "standalone" as const,
      })),
      ...EDITOR_SEARCH_INDEX.map((tool) => ({
        tool,
        surface: "Canvas editor / Local workflow",
        route: "editor" as const,
      })),
    ];

    return index
      .flatMap((result, order) => {
        const score = scoreToolSearch(result.tool, normalizedQuery, tokens);
        return score === null ? [] : [{ ...result, score, order }];
      })
      .sort((a, b) => b.score - a.score || a.order - b.order);
  }, [activeSearchQuery, visibleHomeTools]);

  /** Route a search-result card: `export-*` aliases open the editor plain;
   *  everything else goes through the normal tool routing. */
  const handleResultSelect = useCallback(
    (id: string) => {
      if (id.startsWith("export-")) onOpenEditor();
      else onSelectTool(id as ToolId);
    },
    [onOpenEditor, onSelectTool],
  );

  return (
    <div className="cloak-home">
      <>
        <m.section
          className="site-frame cloak-hero"
          aria-labelledby="home-title"
          variants={variants.stagger}
          initial="initial"
          animate="animate"
        >
          <m.p variants={variants.revealItem} className="cloak-mono-label mb-5 text-primary-600">
            Open-source / advanced PDF toolkit / browser-native
          </m.p>
          <m.div variants={variants.revealItem} className="cloak-hero__intro">
            <div>
              <h1 id="home-title" className="cloak-display">
                A complete PDF workbench.{" "}
                <span className="cloak-display__accent">Nothing uploaded.</span>
              </h1>
            </div>

            <div className="cloak-hero__aside">
              <p className="cloak-hero__lede">
                Edit, organise, redact, sign, OCR, compare, and ask questions of PDFs in one capable
                web app. Your document bytes stay inside your browser.
              </p>
              <a
                className="cloak-link-motion mt-6 inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.04em] text-primary-600 hover:text-primary-700"
                href="#workbench"
              >
                Open the workbench
                <ArrowRight className="cloak-link-arrow size-4" aria-hidden="true" />
              </a>
            </div>
          </m.div>

          <m.div
            id="workbench"
            variants={variants.revealItem}
            className="cloak-workbench scroll-mt-24"
          >
            <div className="cloak-instrument-bar">
              <span>Live web app / local document pipeline</span>
              <ConnectionStatus />
            </div>

            <div className="cloak-workbench__body">
              <ol className="cloak-workbench__steps m-0 list-none">
                {[
                  {
                    number: "01",
                    title: "Open",
                    copy: "Choose one PDF. The browser reads it directly from your device.",
                  },
                  {
                    number: "02",
                    title: "Work",
                    copy: `Use ${EDITOR_TOOL_IDS.size} editor tools without handing the file to a server.`,
                  },
                  {
                    number: "03",
                    title: "Export",
                    copy: "Export a new PDF directly to your device.",
                  },
                ].map((step) => (
                  <li key={step.number} className="cloak-workbench__step">
                    <span className="cloak-workbench__step-number">{step.number}</span>
                    <div>
                      <p className="cloak-workbench__step-title">{step.title}</p>
                      <p className="cloak-workbench__step-copy">{step.copy}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="cloak-workbench__drop">
                <FileDropZone
                  size="hero"
                  accept="application/pdf,.pdf"
                  onFiles={(files) => files[0] && onOpenEditor(files[0])}
                  label="Drop a PDF to open the editor"
                  hint="Or browse your device. The file opens locally in the canvas workbench."
                />
              </div>
            </div>

            <div className="cloak-workbench__footer" aria-label="Workbench architecture">
              {[
                ["Browser", "Execution"],
                ["PDF.js", "Preview"],
                ["pdf-lib", "Document edits"],
                ["IndexedDB", "Local drafts"],
              ].map(([value, label]) => (
                <div key={value} className="cloak-workbench__metric">
                  <span className="cloak-workbench__metric-value">{value}</span>
                  <span className="cloak-workbench__metric-label">{label}</span>
                </div>
              ))}
            </div>
          </m.div>
        </m.section>

        <section className="cloak-stat-strip" aria-label="CloakPDF facts">
          <m.div
            className="site-frame cloak-stat-strip__inner"
            variants={variants.reveal}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.35 }}
          >
            <div className="cloak-stat">
              <span className="cloak-stat__value">{EDITOR_TOOL_IDS.size}</span>
              <span className="cloak-stat__label">Editor tools</span>
            </div>
            <div className="cloak-stat">
              <span className="cloak-stat__value">{tools.length}</span>
              <span className="cloak-stat__label">Standalone utilities</span>
            </div>
            <div className="cloak-stat">
              <span className="cloak-stat__value">0</span>
              <span className="cloak-stat__label">Document uploads</span>
            </div>
            <div className="cloak-stat">
              <span className="cloak-stat__value">MIT</span>
              <span className="cloak-stat__label">Open-source license</span>
            </div>
          </m.div>
        </section>
      </>

      <section id="toolkit" className="site-frame cloak-toolkit scroll-mt-20">
        <p className="cloak-mono-label mb-5 text-primary-600">
          {activeSearchQuery ? "Search / Toolkit index" : "02 / Focused utilities"}
        </p>
        <m.div
          className="cloak-toolkit__head"
          variants={variants.reveal}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div>
            <h2 className="cloak-section-title">One family. Every serious PDF job.</h2>
          </div>

          <div>
            <div className="cloak-search" role="search" aria-label="PDF tool search">
              <label htmlFor="home-tool-search" className="sr-only">
                Search PDF tools
              </label>
              <Search
                className="ml-1 size-4.5 shrink-0 text-[var(--color-ink-3)]"
                aria-hidden="true"
              />
              <input
                id="home-tool-search"
                ref={searchInputRef}
                name="tool-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search redact, merge, OCR…"
                autoComplete="off"
                spellCheck={false}
                className="min-w-0 flex-1 appearance-none bg-transparent px-3 py-4 text-base text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] focus-visible:outline-none [&::-webkit-search-cancel-button]:appearance-none"
                aria-label="Search PDF tools"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-[var(--color-ink-3)] hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  aria-label="Clear search"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              ) : (
                <kbd className="mr-1 hidden border border-[var(--color-rule)] px-2 py-1 font-mono text-[10px] text-[var(--color-ink-3)] sm:inline-flex">
                  {isMac ? "⌘ K" : "Ctrl K"}
                </kbd>
              )}
            </div>
            <p
              data-testid="tool-search-count"
              className="mt-3 font-mono text-[10px] uppercase tracking-[0.05em] text-[var(--color-ink-3)]"
              aria-live="polite"
            >
              {activeSearchQuery
                ? `${searchResults.length} matching ${searchResults.length === 1 ? "tool" : "tools"}`
                : "Search spans standalone utilities and the canvas editor"}
            </p>
          </div>
        </m.div>

        {activeSearchQuery && searchResults.length === 0 ? (
          <div className="border-y border-[var(--color-rule-strong)] py-14">
            <h3 className="text-xl font-semibold text-[var(--color-ink)]">No tools found</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--color-ink-3)]">
              Try a different term such as “redact”, “watermark”, or “merge”.
            </p>
            <button
              type="button"
              data-testid="empty-tool-search-clear"
              onClick={() => {
                setSearchQuery("");
                searchInputRef.current?.focus();
              }}
              className="mt-5 inline-flex min-h-11 items-center gap-2 border border-[var(--color-rule)] px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-primary-600 hover:border-primary-500 active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
            >
              <X className="size-4" aria-hidden="true" />
              Clear search
            </button>
          </div>
        ) : activeSearchQuery ? (
          <ol className="cloak-ledger m-0 list-none p-0" aria-label="Matching PDF tools">
            {searchResults.map(({ tool, surface, route }, index) => {
              const Icon = tool.icon;
              return (
                <li key={tool.id}>
                  <button
                    type="button"
                    onClick={() =>
                      route === "standalone"
                        ? onSelectTool(tool.id as ToolId)
                        : handleResultSelect(tool.id)
                    }
                    className="group grid min-h-[5rem] w-full grid-cols-[2rem_1.25rem_minmax(0,1fr)_auto] items-start gap-3 px-4 py-4 text-left transition-[background-color,box-shadow] hover:bg-[var(--color-accent-soft)] hover:shadow-[inset_2px_0_0_var(--color-accent)] active:translate-y-px focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-focus)] sm:grid-cols-[2.5rem_1.5rem_minmax(0,1fr)_auto]"
                  >
                    <span className="pt-0.5 font-mono text-[10px] tabular-nums text-[var(--color-ink-3)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Icon
                      className="cloak-ledger__icon mt-0.5 h-4 w-4 text-primary-600"
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[var(--color-ink)] sm:text-base">
                        <SearchMatch text={tool.title} query={activeSearchQuery} />
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-[var(--color-ink-2)] sm:text-sm">
                        <SearchMatch text={tool.description} query={activeSearchQuery} />
                      </span>
                      <span className="mt-2 block font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--color-ink-3)] sm:hidden">
                        {surface}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="hidden font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--color-ink-3)] sm:inline">
                        {surface}
                      </span>
                      <ArrowRight
                        className="cloak-ledger__arrow h-4 w-4 text-[var(--color-ink-3)] group-hover:text-primary-600"
                        aria-hidden="true"
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="space-y-14 sm:space-y-20">
            {categories.map((category) => {
              const categoryTools = visibleHomeTools.filter(
                (tool) => tool.category === category.key,
              );
              if (categoryTools.length === 0) return null;
              return (
                <m.section
                  key={category.key}
                  variants={variants.reveal}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true, amount: 0.16 }}
                  className="cloak-category grid gap-6 lg:grid-cols-12 lg:gap-10"
                >
                  <div className="lg:col-span-3">
                    <h3 className="cloak-mono-label text-primary-600">
                      {category.label} / {categoryTools.length}
                    </h3>
                    <p className="mt-3 max-w-xs text-xl font-semibold leading-tight tracking-[-0.025em] text-[var(--color-ink)]">
                      {category.description}.
                    </p>
                  </div>
                  <div
                    className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-9 ${
                      categoryTools.length > 2 ? "2xl:grid-cols-3" : ""
                    }`}
                  >
                    {categoryTools.map((tool) => (
                      <ToolCard key={tool.id} tool={tool} onSelect={onSelectTool} />
                    ))}
                  </div>
                </m.section>
              );
            })}
          </div>
        )}
      </section>

      {!activeSearchQuery && <WhyCloakPdfSection />}
    </div>
  );
}

function ConnectionStatus() {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <span className="inline-flex items-center gap-2" aria-live="polite">
      <span className="cloak-status-dot" aria-hidden="true" />
      {online ? "Local execution" : "Offline / network unavailable"}
    </span>
  );
}

function WhyCloakPdfSection() {
  const receipt = [
    {
      number: "01",
      title: "PDF bytes enter browser memory",
      meta: "Input / local file handle",
    },
    {
      number: "02",
      title: "PDF.js, pdf-lib, and WASM do the work",
      meta: "Process / this tab",
    },
    {
      number: "03",
      title: "A new result is exported to your device",
      meta: "Output / browser download",
    },
  ];

  return (
    <section id="privacy-model" className="cloak-proof-band scroll-mt-20">
      <m.div
        className="site-frame cloak-proof-band__frame"
        variants={variants.reveal}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.16 }}
      >
        <p className="cloak-mono-label mb-5 text-primary-400">03 / Local processing receipt</p>
        <div className="cloak-proof-band__inner">
          <div>
            <h2 className="cloak-section-title">The privacy promise has an architecture.</h2>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-[var(--color-night-muted)]">
              CloakPDF is a static, client-side web app. It can download its own code, OCR data, or
              on-device model weights when a tool needs them; your PDF content is not sent with
              those requests.
            </p>
            <a
              className="cloak-link-motion mt-8 inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.04em] text-primary-400 hover:text-primary-300"
              href="https://github.com/cloakyard/cloakpdf"
              target="_blank"
              rel="noreferrer"
            >
              Audit the source
              <ArrowRight className="cloak-link-arrow size-4" aria-hidden="true" />
            </a>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4 pb-4 font-mono text-[10px] uppercase tracking-[0.07em] text-[var(--color-night-muted)]">
              <span>Document path</span>
              <span>Verified by design</span>
            </div>
            <div className="cloak-receipt">
              {receipt.map((item) => (
                <div key={item.number} className="cloak-receipt__row">
                  <span className="font-mono text-xs text-primary-400">{item.number}</span>
                  <div>
                    <p className="m-0 text-base font-semibold leading-snug text-[var(--color-night-ink)]">
                      {item.title}
                    </p>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.05em] text-[var(--color-night-muted)]">
                      {item.meta}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-primary-400">
                    Local
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-[var(--color-night-rule)] pt-5">
              <p className="cloak-mono-label text-[var(--color-night-muted)]">Routes not present</p>
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-xs text-[var(--color-night-ink)] sm:grid-cols-3">
                <span>Upload server — none</span>
                <span>User account — none</span>
                <span>Analytics — none</span>
              </div>
            </div>
          </div>
        </div>
      </m.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  Root component
// ═══════════════════════════════════════════════════════════════════

/**
 * View state for the app — discriminated union so the active payload
 * (active tool id, edited file) lives next to the view tag.
 *
 * Kept here at module scope rather than as a `type View = ...` inside
 * `App` so the union is easier to read in isolation.
 */
type View =
  | { kind: "home" }
  | { kind: "tool"; toolId: ToolId }
  | { kind: "editor"; file: File | null; tool?: string | null }
  | { kind: "privacy" };

/**
 * Root application component.
 *
 * Manages which view is active and delegates rendering to the matching
 * child component. Keeps its own state minimal so that child-local
 * state (e.g. search) doesn't bubble up unnecessarily.
 */
export function App() {
  const [view, setView] = useState<View>({ kind: "home" });

  // Every view transition routes through navigate() so scroll-to-top happens
  // synchronously in the click/event path (before paint — no post-render scroll
  // jump) instead of as a [view] effect that also re-ran on same-view setView.
  const navigate = useCallback((next: View) => {
    setView(next);
    window.scrollTo(0, 0);
  }, []);

  const goHome = useCallback(() => navigate({ kind: "home" }), [navigate]);

  // Editor-first routing: single-PDF tools that live in the editor open it (with
  // that tool preselected); multi-file / terminal / AI surfaces stay standalone.
  const handleSelectTool = useCallback(
    (id: ToolId) => {
      if (EDITOR_TOOL_IDS.has(id)) navigate({ kind: "editor", file: null, tool: id });
      else navigate({ kind: "tool", toolId: id });
    },
    [navigate],
  );

  const openEditor = useCallback(
    (file: File | null = null, tool: string | null = null) => {
      navigate({ kind: "editor", file, tool });
    },
    [navigate],
  );

  const handlePrivacy = useCallback(() => {
    navigate({ kind: "privacy" });
  }, [navigate]);

  // Cross-component deep-link: a tool fires `navigateToTool(id)` and we
  // route to it. Currently used by the encrypted-PDF notice in
  // `usePdfFile` to deep-link into the PDF Password tool.
  useEffect(() => {
    function onNavigate(event: Event) {
      const id = (event as CustomEvent<ToolId>).detail;
      if (findTool(id)) navigate({ kind: "tool", toolId: id });
    }
    // A tool's secondary "& edit" action finished and handed its output PDF
    // to the editor (Merge / Images-to-PDF / PDF Password unlock).
    function onOpenEditor(event: Event) {
      const file = (event as CustomEvent<File>).detail;
      navigate({ kind: "editor", file, tool: null });
    }
    window.addEventListener(NAVIGATE_TOOL_EVENT, onNavigate);
    window.addEventListener(OPEN_EDITOR_EVENT, onOpenEditor);
    return () => {
      window.removeEventListener(NAVIGATE_TOOL_EVENT, onNavigate);
      window.removeEventListener(OPEN_EDITOR_EVENT, onOpenEditor);
    };
  }, [navigate]);

  // The editor owns the full viewport and its own chrome, so it renders
  // outside <Layout> (no centered max-width, no app header/footer). Orientation
  // is intentionally unlocked here — the editor adapts to landscape the way
  // CloakIMG's does, rather than forcing portrait like the standalone tools.
  if (view.kind === "editor") {
    return (
      <>
        <Suspense fallback={<EditorLoadingFallback />}>
          <EditorView initialFile={view.file} initialTool={view.tool ?? null} onExit={goHome} />
        </Suspense>
        <ReloadPrompt />
      </>
    );
  }

  const showBack = view.kind !== "home";
  // Key the view transition by identity — switching between two tools should
  // cross-fade too, not just home↔tool. `initial={false}` suppresses the very
  // first mount so the home hero's own entrance animation isn't doubled.
  const viewKey = view.kind === "tool" ? `tool:${view.toolId}` : view.kind;

  return (
    <>
      <Layout
        onHome={goHome}
        showBack={showBack}
        onPrivacy={handlePrivacy}
        footerVariant={view.kind === "home" || view.kind === "privacy" ? "statement" : "compact"}
      >
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={viewKey}
            variants={variants.view}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <ViewContent
              view={view}
              onSelectTool={handleSelectTool}
              onOpenEditor={openEditor}
              onGoHome={goHome}
            />
          </m.div>
        </AnimatePresence>
      </Layout>
      <ReloadPrompt />
      {view.kind === "tool" && <OrientationLock />}
    </>
  );
}

interface ViewContentProps {
  view: View;
  onSelectTool: (id: ToolId) => void;
  onOpenEditor: (file?: File | null) => void;
  onGoHome: () => void;
}

function ViewContent({ view, onSelectTool, onOpenEditor, onGoHome }: ViewContentProps) {
  switch (view.kind) {
    case "home":
      return <HomeScreen onSelectTool={onSelectTool} onOpenEditor={onOpenEditor} />;
    case "tool": {
      const meta = findTool(view.toolId);
      const Component = findToolComponent(view.toolId);
      if (!meta || !Component)
        return <HomeScreen onSelectTool={onSelectTool} onOpenEditor={onOpenEditor} />;
      return <ToolView tool={meta} Component={Component} />;
    }
    case "editor":
      // Rendered full-screen in App before <Layout>; never reached here. The
      // case satisfies the exhaustiveness check below.
      return null;
    case "privacy":
      return <PrivacyPolicy />;
    default: {
      // Exhaustiveness check — TypeScript will flag missing cases.
      const _exhaustive: never = view;
      void _exhaustive;
      void onGoHome;
      return null;
    }
  }
}
