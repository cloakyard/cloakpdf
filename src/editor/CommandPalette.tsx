// Air quick switcher. Commands follow the tool roster; name matches rank first.
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
      <mark key={`${part}-${index}`} className="pdf-command-match">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pendingCommand = useRef<PaletteCommand | null>(null);
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      onAfterClose={() => {
        const command = pendingCommand.current;
        pendingCommand.current = null;
        if (!command) return;
        command.run();
        // Re-selecting the active tool does not rerun its focus effect.
        if (command.id.startsWith("tool-"))
          document
            .querySelector<HTMLElement>(".editor-properties h2, .editor-mobile-sheet__header h2")
            ?.focus({ preventScroll: true });
      }}
      placement="command"
      labelledBy="command-palette-title"
      describedBy="command-palette-description"
      panelClassName="pdf-dialog--command"
      testId="command-palette"
    >
      <CommandPaletteContent
        onClose={onClose}
        onChoose={(command) => {
          pendingCommand.current = command;
          onClose();
        }}
      />
    </ModalShell>
  );
}

// The modal mounts this content per opening, including the global shortcut toggle.
// Search and selection therefore reset before the first paint, without an effect.
function CommandPaletteContent({
  onClose,
  onChoose,
}: {
  onClose: () => void;
  onChoose: (command: PaletteCommand) => void;
}) {
  const { canUndo, canRedo, canReset } = useEditorRead();
  const { setActiveTool, setViewMode, undo, redo, reset } = useEditorActions();

  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const composing = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

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
    const q = search.trim().toLowerCase();
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
  }, [search, commands]);

  const selected = active < results.length ? active : 0;
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [search]);

  const clearSearch = () => {
    setQuery("");
    setSearch("");
    setActive(0);
    inputRef.current?.focus();
  };

  const choose = (cmd: PaletteCommand | undefined) => {
    if (!cmd) return;
    onChoose(cmd);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Enter confirms an IME candidate before it can run an editor command.
    if (composing.current || e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = results.length
        ? (selected + (e.key === "ArrowDown" ? 1 : -1) + results.length) % results.length
        : 0;
      setActive(next);
      listRef.current?.querySelector<HTMLElement>(`[data-idx="${next}"]`)?.scrollIntoView({
        block: "nearest",
        behavior: "auto",
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[selected]);
    }
  };

  const countLabel = `${results.length} ${results.length === 1 ? "command" : "commands"}`;

  return (
    <>
      <header className="pdf-dialog__header">
        <div>
          <h2 id="command-palette-title" className="pdf-dialog__title">
            Find a tool
          </h2>
          <p id="command-palette-description" className="pdf-dialog__description">
            Jump to a tool or an editor action.
          </p>
        </div>
        <ModalCloseButton onClick={onClose} label="Close command palette" />
      </header>

      <div className="pdf-command-search">
        <label htmlFor="command-palette-query" className="air-label">
          Search tools and actions
        </label>
        <div className="air-field-group">
          <Search
            className="pdf-command-search__icon"
            size={18}
            strokeWidth={1.6}
            aria-hidden="true"
          />
          <input
            id="command-palette-query"
            ref={inputRef}
            data-dialog-initial-focus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!composing.current) {
                setSearch(e.target.value);
                setActive(0);
              }
            }}
            onCompositionStart={() => {
              composing.current = true;
            }}
            onCompositionEnd={(e) => {
              composing.current = false;
              setSearch(e.currentTarget.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            type="search"
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls="command-palette-listbox"
            aria-activedescendant={results.length ? `command-palette-opt-${selected}` : undefined}
            placeholder="Try crop or page numbers…"
            autoComplete="off"
            spellCheck={false}
            className="air-field"
          />
          <span className="air-field-actions">
            <button
              type="button"
              hidden={!query}
              onClick={clearSearch}
              aria-label="Clear command search"
              className="air-icon-button air-button--quiet air-field-clear"
            >
              <X size={18} strokeWidth={1.6} aria-hidden="true" />
            </button>
          </span>
        </div>
        <p id="command-palette-count" className="air-help" role="status" aria-atomic="true">
          {countLabel}
        </p>
      </div>

      <div ref={listRef} className="pdf-command-results thin-scrollbar">
        <div id="command-palette-listbox" role="listbox" aria-label="Tools and actions">
          {results.map((cmd, i) => {
            const Icon = cmd.Icon;
            return (
              <button
                key={cmd.id}
                id={`command-palette-opt-${i}`}
                type="button"
                data-idx={i}
                role="option"
                aria-labelledby={`command-palette-label-${i}`}
                aria-describedby={`command-palette-detail-${i}`}
                aria-selected={i === selected}
                tabIndex={-1}
                onPointerMove={(event) => {
                  if (event.pointerType === "mouse") setActive(i);
                }}
                onClick={() => choose(cmd)}
                className="pdf-command-option"
              >
                <Icon className="pdf-command-option__icon" aria-hidden="true" />
                <span className="pdf-command-option__text">
                  <span id={`command-palette-label-${i}`} className="pdf-command-option__label">
                    <CommandMatch text={cmd.label} query={search} />
                  </span>
                  <span id={`command-palette-detail-${i}`} className="pdf-command-option__detail">
                    {cmd.description && (
                      <span>
                        <CommandMatch text={cmd.description} query={search} />
                      </span>
                    )}
                    <span className="pdf-command-option__group">{cmd.hint}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {results.length === 0 && (
          <div className="pdf-command-empty">
            <p>No matching tools or actions</p>
            <p>Try “redact”, “crop” or “page numbers”.</p>
            <button type="button" onClick={clearSearch} className="air-button">
              Clear search
            </button>
          </div>
        )}
      </div>

      <footer className="pdf-command-hints">
        <span>
          <kbd>↑ ↓</kbd> Navigate
        </span>
        <span>
          <kbd>Enter</kbd> Open
        </span>
        <span>
          <kbd>Esc</kbd> Close
        </span>
      </footer>
    </>
  );
}
