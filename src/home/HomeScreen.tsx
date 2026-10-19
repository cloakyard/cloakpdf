import { ArrowRight, FileArchive, FileImage, Scissors, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileDropZone } from "../components/FileDropZone.tsx";
import { ToolEntry } from "./ToolEntry.tsx";
import { categories, HOME_CARD_TOOLS, type ToolId } from "../config/tool-registry.ts";
import { EDITOR_TOOLS } from "../editor/tools.ts";
import type { Tool } from "../types.ts";
import { isMobileDevice } from "../utils/device-memory.ts";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);

const EDITOR_SEARCH_CARDS: Tool[] = EDITOR_TOOLS.map((t) => ({
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
          <mark key={`${part}-${index}`} className="pdf-search-match">
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
export function HomeScreen({ onSelectTool, onOpenEditor }: HomeScreenProps) {
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
        setSearchQuery("");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  /** Standalone cards available on this device. `desktopOnly` tools
   * (currently Ask PDF) stay out of a phone's resting grid and search index. */
  const visibleHomeTools = useMemo(() => {
    const mobile = isMobileDevice();
    return mobile ? HOME_CARD_TOOLS.filter((tool: Tool) => !tool.desktopOnly) : HOME_CARD_TOOLS;
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
        surface: `${
          categories.find((category) => category.key === tool.category)?.label ?? "Utility"
        }`,
        route: "standalone" as const,
      })),
      ...EDITOR_SEARCH_INDEX.map((tool) => ({
        tool,
        surface: "PDF editor",
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

  const clearSearch = () => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  };

  return (
    <div className="air-page pdf-home">
      <section className="air-page-width pdf-hero" aria-labelledby="home-title">
        <div className="pdf-hero-copy">
          <p className="air-page-eyebrow">A little space for your documents</p>
          <h1 id="home-title">
            Your PDF. <br />
            <span>Your space.</span>
          </h1>
          <p className="air-page-lede">
            Edit, organise, sign, and make it yours. A complete PDF toolkit that keeps your
            documents on your device.
          </p>
          <a className="air-button air-button--quiet" href="#toolkit">
            Explore the tools <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
        <div id="workbench" className="pdf-entry" tabIndex={-1}>
          <FileDropZone
            accept="application/pdf,.pdf"
            size="hero"
            onFiles={(files) => onOpenEditor(files[0] ?? null)}
            label="Drop a PDF to open the editor"
            hint="One PDF. Opened here, on your device."
          />
          <p className="pdf-entry-note">
            <ConnectionStatus /> <span>No account needed.</span>
          </p>
        </div>
      </section>

      <section
        id="toolkit"
        className="air-page-width pdf-toolkit"
        tabIndex={-1}
        aria-labelledby="toolkit-title"
      >
        <div className="pdf-toolkit-head">
          <div>
            <p className="air-page-eyebrow">Find your next step</p>
            <h2 id="toolkit-title">Small tasks. Sorted.</h2>
          </div>
          <div role="search" aria-label="PDF tool search" className="pdf-search-region">
            <label htmlFor="home-tool-search" className="air-label">
              Search PDF tools
            </label>
            <div className="air-field-group pdf-search">
              <Search size={18} aria-hidden="true" />
              <input
                className="air-field"
                id="home-tool-search"
                ref={searchInputRef}
                type="search"
                name="tool-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Try redact, merge, or OCR"
                autoComplete="off"
                spellCheck={false}
                aria-label="Search PDF tools"
                aria-describedby="tool-search-count"
              />
              {searchQuery ? (
                <button
                  className="air-icon-button air-button--quiet air-field-clear"
                  type="button"
                  aria-label="Clear search"
                  onClick={clearSearch}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              ) : (
                <kbd aria-hidden="true">{isMac ? "⌘ K" : "Ctrl K"}</kbd>
              )}
            </div>
          </div>
        </div>
        <p
          id="tool-search-count"
          className="pdf-search-count"
          data-testid="tool-search-count"
          role="status"
        >
          {activeSearchQuery
            ? `${searchResults.length} matching ${searchResults.length === 1 ? "tool" : "tools"}`
            : "Search includes every editor tool and standalone utility."}
        </p>
        {activeSearchQuery ? (
          searchResults.length ? (
            <ol className="pdf-results" aria-label="Matching PDF tools">
              {searchResults.map(({ tool, surface }) => {
                const Icon = tool.icon;
                return (
                  <li key={tool.id}>
                    <button
                      type="button"
                      className="pdf-tool-entry"
                      onClick={() => handleResultSelect(tool.id)}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                      <span className="pdf-tool-entry-copy">
                        <span className="pdf-tool-entry-title">
                          <SearchMatch text={tool.title} query={activeSearchQuery} />
                        </span>
                        <span className="pdf-tool-entry-description">
                          <SearchMatch text={tool.description} query={activeSearchQuery} />
                        </span>
                        <span className="pdf-tool-entry-meta">{surface}</span>
                      </span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="pdf-empty">
              <h3>No tools found</h3>
              <p>Try “redact”, “watermark”, or “merge”.</p>
              <button
                type="button"
                className="air-button"
                data-testid="empty-tool-search-clear"
                onClick={clearSearch}
              >
                Clear search
              </button>
            </div>
          )
        ) : (
          <div className="pdf-categories">
            {categories.map((category) => {
              const categoryTools = visibleHomeTools.filter(
                (tool) => tool.category === category.key,
              );
              if (!categoryTools.length) return null;
              return (
                <section
                  className="pdf-category"
                  key={category.key}
                  aria-labelledby={`category-${category.key}`}
                >
                  <div className="pdf-category-intro">
                    <h3 id={`category-${category.key}`}>{category.label}</h3>
                    <p>{category.description}</p>
                  </div>
                  <div>
                    {categoryTools.map((tool) => (
                      <ToolEntry key={tool.id} tool={tool} onSelect={onSelectTool} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>
      {!activeSearchQuery && (
        <section
          id="privacy-model"
          className="air-page-width pdf-privacy-summary"
          tabIndex={-1}
          aria-labelledby="local-title"
        >
          <div>
            <p className="air-page-eyebrow">Private by design</p>
            <h2 id="local-title">
              Your documents.
              <br />
              Still yours.
            </h2>
          </div>
          <div>
            <p>
              Open a file, work on it here, and save the result to your device. Your PDF content
              stays in your browser.
            </p>
            <p>
              The app may download its code, OCR data, or optional AI models. Your documents aren’t
              sent with those requests.
            </p>
            <a
              className="air-button air-button--quiet"
              href="https://github.com/cloakyard/cloakpdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              Explore the source <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </section>
      )}
    </div>
  );
}

function ConnectionStatus() {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);
  return (
    <span role="status">
      {online ? "Your files stay local." : "Offline. Some tools may need uncached assets."}
    </span>
  );
}
