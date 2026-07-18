// CommandPalette.tsx — ⌘K / Ctrl-K quick switcher for the editor. With 23 tools
// across six families on the rail, scanning icons to find one is slow; this is
// the keyboard-first way to jump straight to any tool by name (or its
// description — "watermark" finds Stamp). It also exposes the handful of global
// actions that aren't a tool (undo / redo / reset) so the palette is the one
// place to drive the editor without reaching for the mouse.
//
// Mirrors the app's modal idiom (ExportModal): portal to <body>, scroll-lock,
// Escape / backdrop to close, one Ocean-Blue accent on the active row.

import { Redo2, RotateCcw, Search, Undo2, X } from "lucide-react";
import { type ComponentType, useEffect, useMemo, useRef, useState } from "react";
import { ModalCloseButton, ModalShell } from "../components/ModalShell.tsx";
import { useEditorActions, useEditorRead } from "./EditorContext.tsx";
import { EDITOR_GROUP_LABELS, EDITOR_TOOLS } from "./tools.ts";

interface PaletteCommand {
  id: string;
  label: string;
  /** Right-aligned muted tag — the tool's family, or "Action" for globals. */
  hint: string;
  description?: string;
  Icon: ComponentType<{ className?: string }>;
  run: () => void;
  /** Lower-cased haystack (label + hint + description) for substring matching. */
  search: string;
}

/** Relevance of a command to a query, name-first: a match in the tool NAME
 *  always outranks one only in the description, so typing "attach" surfaces the
 *  Attach tool above Scrub (whose blurb merely mentions "attachments"). An exact
 *  / prefix name hit ranks highest; per-token, name beats hint beats
 *  description. Returns 0 for non-matches (filtered out by the caller). */
function scoreCommand(cmd: PaletteCommand, q: string, tokens: string[]): number {
  const label = cmd.label.toLowerCase();
  const hint = cmd.hint.toLowerCase();
  const desc = (cmd.description ?? "").toLowerCase();
  let score = 0;
  if (label === q) score += 1000;
  else if (label.startsWith(q)) score += 500;
  else if (label.includes(q)) score += 250;
  for (const t of tokens) {
    if (label.includes(t)) score += 100;
    else if (hint.includes(t)) score += 20;
    else if (desc.includes(t)) score += 10;
  }
  return score;
}

function CommandMatch({ text, query }: { text: string; query: string }) {
  const tokens = [...new Set(query.trim().split(/\s+/).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
  if (tokens.length === 0) return text;
  const escaped = tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "gi"));
  const needles = new Set(tokens.map((token) => token.toLocaleLowerCase()));
  return parts.map((part, index) =>
    needles.has(part.toLocaleLowerCase()) ? (
      <mark key={`${part}-${index}`} className="bg-transparent font-bold text-primary-600">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { canUndo, canRedo, canReset } = useEditorRead();
  const { setActiveTool, setViewMode, undo, redo, reset } = useEditorActions();

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset the query + selection every time the palette opens, so it never
  // reopens onto a stale search from a previous invocation.
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  // Full command list. Global actions lead (only when they can run), then the
  // tools in rail order. Rebuilt when the can-* flags flip so a disabled action
  // simply drops out rather than rendering an inert row.
  const commands = useMemo<PaletteCommand[]>(() => {
    const make = (
      id: string,
      label: string,
      hint: string,
      Icon: ComponentType<{ className?: string }>,
      run: () => void,
      description?: string,
    ): PaletteCommand => ({
      id,
      label,
      hint,
      description,
      Icon,
      run,
      search: `${label} ${hint} ${description ?? ""}`.toLowerCase(),
    });

    const actions: PaletteCommand[] = [];
    if (canUndo) actions.push(make("act-undo", "Undo", "Action", Undo2, undo));
    if (canRedo) actions.push(make("act-redo", "Redo", "Action", Redo2, redo));
    if (canReset) actions.push(make("act-reset", "Reset to original", "Action", RotateCcw, reset));

    const tools = EDITOR_TOOLS.map((t) =>
      make(
        `tool-${t.id}`,
        t.name,
        EDITOR_GROUP_LABELS[t.group],
        t.icon,
        () => {
          setActiveTool(t.id);
          if (t.mode === "focus") setViewMode("focus");
          else if (t.mode === "overview") setViewMode("overview");
        },
        t.description,
      ),
    );

    return [...actions, ...tools];
  }, [canUndo, canRedo, canReset, undo, redo, reset, setActiveTool, setViewMode]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    // Each whitespace-separated token must appear somewhere in the haystack, so
    // "page num" matches "Page numbers" without caring about token order.
    const tokens = q.split(/\s+/);
    return (
      commands
        .map((c, i) => ({ c, i, score: scoreCommand(c, q, tokens) }))
        .filter((r) => tokens.every((tok) => r.c.search.includes(tok)))
        // Rank by relevance (name matches first); keep the roster order on ties.
        .sort((a, b) => b.score - a.score || a.i - b.i)
        .map((r) => r.c)
    );
  }, [query, commands]);

  // Clamp the highlight whenever the result set shrinks past it.
  useEffect(() => {
    setActive((a) => (a >= results.length ? 0 : a));
  }, [results.length]);

  // Keep the highlighted row in view as the user arrows through a long list.
  // Command navigation is an instant, utilitarian state change — animating the
  // list itself makes rapid keyboard travel feel laggy.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({
      block: "nearest",
      behavior: "auto",
    });
  }, [active]);

  const closePalette = () => {
    setQuery("");
    setActive(0);
    onClose();
  };

  const choose = (cmd: PaletteCommand | undefined) => {
    if (!cmd) return;
    closePalette();
    cmd.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (results.length ? (a + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (results.length ? (a - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[active]);
    }
  };

  const countLabel = `${results.length} ${results.length === 1 ? "command" : "commands"}`;

  return (
    <ModalShell
      open={open}
      onClose={closePalette}
      placement="command"
      labelledBy="command-palette-title"
      describedBy="command-palette-count"
      panelClassName="cloak-dialog--command max-h-[calc(100svh-2rem)] sm:max-h-[min(640px,80svh)] sm:w-[min(680px,100%)]"
      testId="command-palette"
    >
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--color-rule)] px-4 py-3">
        <div className="min-w-0">
          <p className="cloak-dialog__eyebrow">Workbench / navigation</p>
          <h2 id="command-palette-title" className="cloak-dialog__title">
            Command index
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            id="command-palette-count"
            className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-ink-3)]"
            aria-live="polite"
            aria-atomic="true"
          >
            {countLabel}
          </span>
          <ModalCloseButton onClick={closePalette} label="Close command palette" />
        </div>
      </header>

      <div className="flex min-h-12 shrink-0 items-center gap-2.5 border-b border-[var(--color-rule-strong)] bg-[var(--color-paper)] px-4 focus-within:z-10 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-[var(--color-focus)]">
        <Search className="h-4.5 w-4.5 shrink-0 text-[var(--color-ink-3)]" aria-hidden="true" />
        <input
          ref={inputRef}
          data-dialog-initial-focus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          type="search"
          role="combobox"
          aria-expanded="true"
          aria-autocomplete="list"
          aria-controls="command-palette-listbox"
          aria-activedescendant={results.length ? `command-palette-opt-${active}` : undefined}
          placeholder="Search tools and actions…"
          aria-label="Search tools and actions"
          autoComplete="off"
          spellCheck={false}
          className="h-12 min-w-0 flex-1 appearance-none bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActive(0);
              inputRef.current?.focus();
            }}
            aria-label="Clear command search"
            className="cloak-focus grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-input)] text-[var(--color-ink-3)] hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-ink)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div
        ref={listRef}
        id="command-palette-listbox"
        role="listbox"
        aria-label="Tools and actions"
        className="thin-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {results.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-semibold text-[var(--color-ink)]">No command found</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-3)]">
              Try a tool name such as “redact”, “crop”, or “page numbers”.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="cloak-focus mt-4 min-h-11 rounded-[var(--radius-input)] border border-[var(--color-rule)] px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-primary-600 hover:border-primary-500"
            >
              Clear search
            </button>
          </div>
        ) : (
          results.map((cmd, i) => {
            const on = i === active;
            const Icon = cmd.Icon;
            return (
              <button
                key={cmd.id}
                id={`command-palette-opt-${i}`}
                type="button"
                data-idx={i}
                role="option"
                aria-selected={on}
                tabIndex={-1}
                onPointerMove={() => setActive(i)}
                onClick={() => choose(cmd)}
                className={`relative grid min-h-[3.75rem] w-full grid-cols-[2rem_1.25rem_minmax(0,1fr)] items-center gap-2.5 border-b border-[var(--color-rule)] px-4 py-2.5 text-left transition-[color,background-color,box-shadow] focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-focus)] sm:grid-cols-[2rem_1.25rem_minmax(0,1fr)_auto] ${
                  on
                    ? "bg-[var(--color-accent-soft)] shadow-[inset_2px_0_0_var(--color-accent)]"
                    : "hover:bg-[var(--color-paper)]"
                }`}
              >
                <span className="font-mono text-[10px] tabular-nums text-[var(--color-ink-3)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Icon
                  className={`h-4 w-4 ${on ? "text-primary-600" : "text-[var(--color-ink-3)]"}`}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[var(--color-ink)]">
                    <CommandMatch text={cmd.label} query={query} />
                  </span>
                  {cmd.description && (
                    <span className="mt-0.5 block line-clamp-2 text-xs leading-snug text-[var(--color-ink-2)] sm:truncate">
                      <CommandMatch text={cmd.description} query={query} />
                    </span>
                  )}
                </span>
                <span className="col-start-3 mt-0.5 font-mono text-[9px] uppercase tracking-[0.05em] text-[var(--color-ink-3)] sm:col-start-auto sm:mt-0 sm:shrink-0">
                  {cmd.hint}
                </span>
              </button>
            );
          })
        )}
      </div>

      <footer className="hidden shrink-0 items-center justify-between gap-4 border-t border-[var(--color-rule-strong)] bg-[var(--color-paper)] px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.05em] text-[var(--color-ink-3)] sm:flex">
        <span>↑↓ Navigate</span>
        <span>Enter Open</span>
        <span>Esc Close</span>
      </footer>
    </ModalShell>
  );
}
