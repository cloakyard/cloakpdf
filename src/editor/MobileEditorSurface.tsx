// MobileEditorSurface.tsx — The phone tool surface: an in-flow bottom sheet
// whose body opens and closes. It is deliberately IN-FLOW (a `shrink-0` sibling
// below the stage, not a fixed overlay) so the canvas above reflows and stays
// fully visible AND tappable while the panel is open — essential for the
// canvas-placement tools (annotate/sign/crop/redact).
//
// 50:50 split: the open sheet has an exact half-height so the canvas and tool
// controls share the editor content column equally. The header is pinned
// (`shrink-0`) and the body fills the rest and SCROLLS (`flex-1 min-h-0` +
// `overflow-y-auto`), so long tool panels (OCR, Bookmarks) are always reachable.
// Closed, the sheet shrinks to just its header.
//
// The body view is latched so its content keeps rendering through the close —
// the active tool clears the moment Done/Cancel is tapped, so ToolControls is
// fed the just-closed tool's id explicitly. Tool selection mirrors the desktop
// rail; the body reuses the same ToolControls the right panel renders.
//
// Apply: each tool's primary "apply" CTA is hidden on mobile (PrimaryAction) and
// routed to the global ✓ in this header, which flushes the registered apply via
// flushPendingApply, then closes the tool. ✗ rolls the tool back (cancel).

import { Check, ChevronUp, Grid2x2, RotateCcw, Search, ShieldAlert, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useActiveTool, useEditorActions, useEditorRead } from "./EditorContext.tsx";
import { countPendingDestructive } from "./doc.ts";
import { ToolControls } from "./ToolControls.tsx";
import { EDITOR_GROUP_LABELS, type EditorTool, EDITOR_TOOLS, findEditorTool } from "./tools.ts";

/** What the body shows. Latched while closing so the content
 *  doesn't blank out as the tool deactivates on close. */
type SheetView = { kind: "picker" } | { kind: "tool"; id: string };

function mobileSearchTokens(query: string): string[] {
  return [...new Set(query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean))];
}

function scoreEditorTool(
  tool: EditorTool,
  normalizedQuery: string,
  tokens: string[],
): number | null {
  const name = tool.name.toLocaleLowerCase();
  const description = tool.description.toLocaleLowerCase();
  const haystack = `${name} ${description}`;
  if (!tokens.every((token) => haystack.includes(token))) return null;

  let score = 0;
  if (name === normalizedQuery) score += 1_200;
  else if (name.startsWith(normalizedQuery)) score += 900;
  else if (name.includes(normalizedQuery)) score += 700;
  if (description.includes(normalizedQuery)) score += 180;
  for (const token of tokens) {
    if (name === token) score += 180;
    else if (name.startsWith(token)) score += 140;
    else if (name.includes(token)) score += 100;
    else if (description.includes(token)) score += 20;
  }
  return score;
}

function MobileSearchMatch({ text, query }: { text: string; query: string }) {
  const tokens = mobileSearchTokens(query).sort((a, b) => b.length - a.length);
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

export function MobileEditorSurface() {
  const activeTool = useActiveTool();
  const { setActiveTool, setViewMode, cancelCurrentTool, flushPendingApply, reset } =
    useEditorActions();
  const { doc, pendingApply, canReset } = useEditorRead();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toolQuery, setToolQuery] = useState("");
  // Grey out ✓ only when the active tool registered a primary apply that isn't
  // ready (no input yet / busy) — parity with the desktop Apply button. Deferred
  // / multi-action tools register nothing, so ✓ stays enabled to close.
  const applyDisabled = pendingApply !== null && !pendingApply.ready;

  const tool = findEditorTool(activeTool);
  const open = pickerOpen || tool !== null;
  const pendingMarks = countPendingDestructive(doc);

  // Latch the body view so its content (and height) persist through the
  // remains stable when the active tool clears on Done/Cancel. Updated only while
  // open, read while closing.
  const viewRef = useRef<SheetView>({ kind: "picker" });
  if (open) viewRef.current = tool ? { kind: "tool", id: tool.id } : { kind: "picker" };
  const view = viewRef.current;

  const pick = useCallback(
    (id: string) => {
      setActiveTool(id);
      const picked = findEditorTool(id);
      if (picked?.mode === "focus") setViewMode("focus");
      else if (picked?.mode === "overview") setViewMode("overview");
      setPickerOpen(false); // the sheet stays open via the now-active tool
      setToolQuery("");
    },
    [setActiveTool, setViewMode],
  );

  // The global ✓ is the tool's Apply on mobile: flush whatever primary action
  // the active panel registered (PrimaryAction), then close. A no-op flush (a
  // tool with nothing to apply, or marks that defer to export) just closes.
  const done = useCallback(() => {
    setPickerOpen(false);
    void flushPendingApply();
    setActiveTool(null);
  }, [flushPendingApply, setActiveTool]);

  const cancel = useCallback(() => {
    setPickerOpen(false);
    void cancelCurrentTool();
  }, [cancelCurrentTool]);

  // Mirror the desktop PropertiesPanel: when a tool activates, move focus onto
  // the (pinned, non-scrolling) tool-name heading so keyboard/AT users land on
  // the sheet that just became the primary surface instead of a removed picker
  // button. The effect runs after the header swaps to the tool view, so focus
  // lands on the live heading. preventScroll keeps the canvas from jumping.
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (activeTool) headingRef.current?.focus({ preventScroll: true });
  }, [activeTool]);

  // The body is a single persistent scroll box reused across every view, so a
  // scroll offset left over from one panel survives into the next — which would
  // open the next tool (or the picker, hiding its "Reset to original" top row)
  // mid-scrolled. Snap it back to the top on any view change: when the sheet
  // opens and whenever the active tool switches.
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) bodyRef.current?.scrollTo({ top: 0 });
  }, [open, activeTool]);

  const activeToolQuery = toolQuery.trim();
  const visibleTools = useMemo(() => {
    if (!activeToolQuery) return EDITOR_TOOLS;
    const normalizedQuery = activeToolQuery.toLocaleLowerCase();
    const tokens = mobileSearchTokens(activeToolQuery);
    return EDITOR_TOOLS.flatMap((candidate, order) => {
      const score = scoreEditorTool(candidate, normalizedQuery, tokens);
      return score === null ? [] : [{ candidate, score, order }];
    })
      .sort((a, b) => b.score - a.score || a.order - b.order)
      .map(({ candidate }) => candidate);
  }, [activeToolQuery]);

  return (
    <section
      data-testid="mobile-tool-sheet"
      aria-label="Editor tools"
      className={`editor-mobile-sheet flex shrink-0 flex-col overflow-hidden border-t border-[var(--color-rule)] bg-[var(--color-surface)] pb-[max(env(safe-area-inset-bottom),0.5rem)] ${
        open ? "h-1/2" : "max-h-16"
      }`}
    >
      {/* Header — always visible (pinned). The active tool shows its name +
          Cancel/Done; otherwise a full-width "Tools" toggle opens the picker. */}
      <div className="editor-mobile-sheet__header relative shrink-0">
        {tool ? (
          <div className="flex items-start justify-between gap-2 px-4 py-2.5">
            <div className="min-w-0">
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="block text-sm font-semibold text-slate-800 outline-none dark:text-dark-text"
              >
                {tool.name}
              </h2>
              <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-slate-500 dark:text-dark-text-muted">
                {tool.description}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={cancel}
                className="flex h-11 w-11 items-center justify-center rounded-md text-slate-400 hover:bg-white active:bg-slate-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:bg-dark-surface-alt"
                aria-label="Cancel"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={done}
                disabled={applyDisabled}
                className={`flex h-11 w-11 items-center justify-center rounded-md text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                  applyDisabled
                    ? "cursor-not-allowed bg-primary-300 dark:bg-primary-900/50"
                    : "bg-primary-600 hover:bg-primary-700"
                }`}
                aria-label="Done"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() =>
              setPickerOpen((current) => {
                if (current) setToolQuery("");
                return !current;
              })
            }
            aria-expanded={pickerOpen}
            className="flex w-full items-center justify-center gap-2 px-4 py-3 text-slate-700 dark:text-dark-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
            aria-label={pickerOpen ? "Close tools" : "Open tools"}
          >
            <Grid2x2 className="h-4.5 w-4.5" aria-hidden="true" />
            <span className="font-mono text-card-desc font-semibold uppercase tracking-[0.08em]">
              Tools
            </span>
            <ChevronUp
              className={`cloak-disclosure-icon h-4 w-4 text-slate-400 ${
                pickerOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>
        )}
        {!tool && pendingMarks > 0 && (
          <span
            data-testid="mobile-pending-marks"
            role="status"
            aria-label={`${pendingMarks} ${pendingMarks === 1 ? "mark" : "marks"} pending, applied when you export`}
            title={`${pendingMarks} redaction/erase ${pendingMarks === 1 ? "mark" : "marks"} pending`}
            className="pointer-events-none absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-sm border border-amber-300 bg-amber-50 px-1.5 py-1 font-mono text-[9px] font-semibold text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300"
          >
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="tabular-nums">{pendingMarks}</span>
          </span>
        )}
      </div>

      {/* Body — fills the space under the header inside the 50% sheet and scrolls,
          so long panels stay reachable. Hidden scrollbar (gesture/wheel scroll).
          Closed, its max-height collapses to 0 so
          nothing peeks below the pinned header — the outer's 64px cap alone left
          a gap that clipped the first body row (e.g. the "Reset to original"
          label). The vertical padding is open-only: with border-box, pt/pb would
          hold the body open to ~12px even at max-h-0, re-exposing the peek. flex-1
          fills the open sheet; the max-h-screen cap never binds (outer is capped). */}
      <div
        ref={bodyRef}
        role="region"
        inert={!open ? true : undefined}
        aria-hidden={!open}
        className={`editor-mobile-sheet__body no-scrollbar min-h-0 overflow-y-auto overscroll-contain px-4 ${
          open ? "max-h-screen flex-1 pb-2 pt-1" : "max-h-0"
        }`}
        aria-label={view.kind === "tool" ? "Tool controls" : "Tools"}
      >
        <div
          key={view.kind === "tool" ? view.id : "picker"}
          className="cloak-panel-enter min-h-full"
        >
          {view.kind === "tool" ? (
            <ToolControls toolId={view.id} />
          ) : (
            <div className="pt-1">
              <div className="mb-3">
                <div className="cloak-search-field px-2.5" role="search" aria-label="Editor tools">
                  <label htmlFor="mobile-editor-tool-search" className="sr-only">
                    Search editor tools
                  </label>
                  <Search className="h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
                  <input
                    id="mobile-editor-tool-search"
                    name="editor-tool-search"
                    type="search"
                    value={toolQuery}
                    onChange={(event) => setToolQuery(event.target.value)}
                    placeholder="Search editor tools…"
                    aria-label="Search editor tools"
                    aria-describedby="mobile-editor-tool-search-count"
                    autoComplete="off"
                    spellCheck={false}
                    className="h-11 appearance-none px-2 text-sm placeholder:text-[var(--color-ink-3)] [&::-webkit-search-cancel-button]:appearance-none"
                  />
                  {toolQuery && (
                    <button
                      type="button"
                      onClick={() => setToolQuery("")}
                      className="cloak-focus -mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-input)] text-[var(--color-ink-3)] hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-ink)]"
                      aria-label="Clear editor tool search"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <p
                  id="mobile-editor-tool-search-count"
                  className="mt-2 font-mono text-[9px] uppercase tracking-[0.05em] text-[var(--color-ink-3)]"
                  aria-live="polite"
                >
                  {activeToolQuery
                    ? `${visibleTools.length} matching ${visibleTools.length === 1 ? "tool" : "tools"}`
                    : `${EDITOR_TOOLS.length} editor tools`}
                </p>
              </div>

              {/* Reset-to-original lives here on mobile: the top bar's Reset
                button is desktop-only (no room in the dense right cluster), so
                without this a phone user could only step back one undo at a
                time. Shown only when there's something to revert. */}
              {canReset && (
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setPickerOpen(false);
                  }}
                  className="mb-3 flex w-full items-center gap-2 border-y border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-3 text-left text-sm font-medium text-[var(--color-ink-2)] hover:bg-[var(--color-accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                >
                  <RotateCcw className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  Reset to original
                </button>
              )}
              {activeToolQuery && visibleTools.length > 0 ? (
                <ol className="cloak-ledger m-0 list-none p-0" aria-label="Matching editor tools">
                  {visibleTools.map((candidate, index) => {
                    const Icon = candidate.icon;
                    return (
                      <li key={candidate.id}>
                        <button
                          type="button"
                          onClick={() => pick(candidate.id)}
                          className="grid min-h-[4.75rem] w-full grid-cols-[1.5rem_1.25rem_minmax(0,1fr)] items-start gap-2.5 px-3 py-3 text-left transition-colors hover:bg-[var(--color-accent-soft)] hover:shadow-[inset_2px_0_0_var(--color-accent)] active:translate-y-px focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                        >
                          <span className="pt-0.5 font-mono text-[9px] tabular-nums text-[var(--color-ink-3)]">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <Icon className="mt-0.5 h-4 w-4 text-primary-600" aria-hidden="true" />
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-[var(--color-ink)]">
                              <MobileSearchMatch text={candidate.name} query={activeToolQuery} />
                            </span>
                            <span className="mt-0.5 block text-xs leading-snug text-[var(--color-ink-2)]">
                              <MobileSearchMatch
                                text={candidate.description}
                                query={activeToolQuery}
                              />
                            </span>
                            <span className="mt-1.5 block font-mono text-[8px] uppercase tracking-[0.05em] text-[var(--color-ink-3)]">
                              {EDITOR_GROUP_LABELS[candidate.group]}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              ) : activeToolQuery ? (
                <div className="border-y border-[var(--color-rule)] px-3 py-6 text-center">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">No tool found</p>
                  <p className="mt-1 text-xs text-[var(--color-ink-3)]">
                    Try “redact”, “crop”, or “page numbers”.
                  </p>
                  <button
                    type="button"
                    onClick={() => setToolQuery("")}
                    className="cloak-focus mt-4 inline-flex min-h-11 items-center gap-2 border border-[var(--color-rule)] px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-primary-600 hover:border-primary-500 active:translate-y-px"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Clear search
                  </button>
                </div>
              ) : (
                /* 3-up on ~320px phones, stepping to 4-up at ≥380px. The
                 resting picker stays compact; filtered results switch to the
                 descriptive ledger above so every match explains itself. */
                <div className="grid grid-cols-3 gap-x-1 gap-y-3 min-[380px]:grid-cols-4">
                  {EDITOR_TOOLS.map((candidate: EditorTool) => {
                    const Icon = candidate.icon;
                    const on = candidate.id === activeTool;
                    return (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => pick(candidate.id)}
                        aria-label={candidate.name}
                        aria-pressed={on}
                        className={`flex min-w-0 flex-col items-center gap-1.5 rounded-md border px-1 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                          on
                            ? "border-primary-200 bg-primary-50 text-primary-600 dark:border-primary-900/40 dark:bg-primary-900/30 dark:text-primary-300"
                            : "border-transparent text-slate-700 hover:bg-slate-50 dark:text-dark-text dark:hover:bg-dark-surface-alt"
                        }`}
                      >
                        <Icon className="h-6 w-6" aria-hidden="true" />
                        <span
                          className="block w-full truncate text-center font-mono text-tag font-medium leading-tight"
                          title={candidate.name}
                        >
                          {candidate.railLabel ?? candidate.name.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
