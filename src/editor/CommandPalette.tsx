// CommandPalette.tsx — ⌘K / Ctrl-K quick switcher for the editor. With 23 tools
// across six families on the rail, scanning icons to find one is slow; this is
// the keyboard-first way to jump straight to any tool by name (or its
// description — "watermark" finds Stamp). It also exposes the handful of global
// actions that aren't a tool (undo / redo / reset) so the palette is the one
// place to drive the editor without reaching for the mouse.
//
// Mirrors the app's modal idiom (ExportModal): portal to <body>, scroll-lock,
// Escape / backdrop to close, one Ocean-Blue accent on the active row.

import { Redo2, RotateCcw, Search, Undo2 } from "lucide-react";
import { type ComponentType, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
    return commands.filter((c) => tokens.every((tok) => c.search.includes(tok)));
  }, [query, commands]);

  // Clamp the highlight whenever the result set shrinks past it.
  useEffect(() => {
    setActive((a) => (a >= results.length ? 0 : a));
  }, [results.length]);

  // Scroll-lock + focus the input while open. Mirrors ExportModal's idiom.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Keep the highlighted row in view as the user arrows through a long list.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({
      block: "nearest",
    });
  }, [active]);

  if (!open) return null;

  const choose = (cmd: PaletteCommand | undefined) => {
    if (!cmd) return;
    onClose();
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
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-200 flex items-start justify-center px-3 pt-[12vh] sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <button
        type="button"
        aria-label="Close command palette"
        onClick={onClose}
        className="absolute inset-0 cursor-default border-none bg-slate-900/30 backdrop-blur-sm"
      />

      <div className="relative flex max-h-[70svh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-xl sm:w-[min(560px,100%)] dark:border-dark-border dark:bg-dark-surface/95">
        <div className="flex items-center gap-2.5 border-b border-slate-200/70 px-4 dark:border-dark-border">
          <Search className="h-4.5 w-4.5 shrink-0 text-slate-400 dark:text-dark-text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            type="text"
            placeholder="Search tools and actions…"
            aria-label="Search tools and actions"
            className="h-12 min-w-0 flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-dark-text dark:placeholder:text-dark-text-muted"
          />
          <kbd className="hidden shrink-0 rounded border border-slate-200 px-1.5 py-0.5 text-xxs font-medium text-slate-400 sm:inline dark:border-dark-border dark:text-dark-text-muted">
            ESC
          </kbd>
        </div>

        <div
          ref={listRef}
          role="listbox"
          className="thin-scrollbar min-h-0 flex-1 overflow-y-auto p-1.5"
        >
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-400 dark:text-dark-text-muted">
              No matches
            </p>
          ) : (
            results.map((cmd, i) => {
              const on = i === active;
              const Icon = cmd.Icon;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  data-idx={i}
                  role="option"
                  aria-selected={on}
                  onMouseMove={() => setActive(i)}
                  onClick={() => choose(cmd)}
                  className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                    on
                      ? "bg-primary-50 dark:bg-primary-900/20"
                      : "hover:bg-slate-50 dark:hover:bg-dark-surface-alt"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      on
                        ? "bg-primary-600 text-white"
                        : "bg-slate-100 text-slate-500 dark:bg-dark-surface-alt dark:text-dark-text-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800 dark:text-dark-text">
                      {cmd.label}
                    </span>
                    {cmd.description && (
                      <span className="block truncate text-xs text-slate-500 dark:text-dark-text-muted">
                        {cmd.description}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xxs font-medium text-slate-400 dark:text-dark-text-muted">
                    {cmd.hint}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
