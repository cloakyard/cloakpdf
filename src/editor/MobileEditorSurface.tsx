// MobileEditorSurface.tsx — The phone tool surface: an in-flow bottom sheet
// whose body opens and closes. It is deliberately IN-FLOW (a `shrink-0` sibling
// below the stage, not a fixed overlay) so the canvas above reflows and stays
// fully visible AND tappable while the panel is open — the canvas-dominance
// trick that canvas-placement tools (annotate/sign/crop/redact) rely on.
//
// 60:40 split: the open sheet is capped at `max-h-[40%]` of the editor content
// column so the canvas always keeps ≥60% of the vertical space; the header is
// pinned (`shrink-0`) and the body fills the rest and SCROLLS (`flex-1 min-h-0`
// + `overflow-y-auto`), so long tool panels (OCR, Bookmarks) are always
// reachable. Closed, the sheet shrinks to just its header. The open/close is a
// `max-height` transition (instant under reduced motion).
//
// The body view is latched so its content keeps rendering through the close —
// the active tool clears the moment Done/Cancel is tapped, so ToolControls is
// fed the just-closed tool's id explicitly. Tool selection mirrors the desktop
// rail; the body reuses the same ToolControls the right panel renders.
//
// Apply: each tool's primary "apply" CTA is hidden on mobile (PrimaryAction) and
// routed to the global ✓ in this header, which flushes the registered apply via
// flushPendingApply, then closes the tool. ✗ rolls the tool back (cancel).

import { Check, ChevronUp, Grid2x2, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useActiveTool, useEditorActions, useEditorRead } from "./EditorContext.tsx";
import { ToolControls } from "./ToolControls.tsx";
import { type EditorTool, EDITOR_TOOLS, findEditorTool } from "./tools.ts";

/** What the body shows. Latched (held through the slide-down) so the content
 *  doesn't blank out as the tool deactivates on close. */
type SheetView = { kind: "picker" } | { kind: "tool"; id: string };

export function MobileEditorSurface() {
  const activeTool = useActiveTool();
  const { setActiveTool, setViewMode, cancelCurrentTool, flushPendingApply, reset } =
    useEditorActions();
  const { pendingApply, canReset } = useEditorRead();
  const [pickerOpen, setPickerOpen] = useState(false);
  // Grey out ✓ only when the active tool registered a primary apply that isn't
  // ready (no input yet / busy) — parity with the desktop Apply button. Deferred
  // / multi-action tools register nothing, so ✓ stays enabled to close.
  const applyDisabled = pendingApply !== null && !pendingApply.ready;

  const tool = findEditorTool(activeTool);
  const open = pickerOpen || tool !== null;

  // Latch the body view so its content (and height) persist through the
  // slide-down when the active tool clears on Done/Cancel. Updated only while
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
  const headingRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (activeTool) headingRef.current?.focus({ preventScroll: true });
  }, [activeTool]);

  return (
    <div
      data-testid="mobile-tool-sheet"
      className={`flex shrink-0 flex-col overflow-hidden border-t border-slate-200/70 dark:border-dark-border bg-white dark:bg-dark-surface pb-[max(env(safe-area-inset-bottom),0.5rem)] ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:transition-[max-height] motion-safe:duration-300 ${
        open ? "max-h-[40%]" : "max-h-16"
      }`}
    >
      {/* Header — always visible (pinned). The active tool shows its name +
          Cancel/Done; otherwise a full-width "Tools" toggle opens the picker. */}
      <div className="shrink-0">
        {tool ? (
          <div className="flex items-start justify-between gap-2 px-4 py-2.5">
            <div className="min-w-0">
              <span
                ref={headingRef}
                tabIndex={-1}
                className="block text-sm font-semibold text-slate-800 dark:text-dark-text focus-visible:outline-none"
              >
                {tool.name}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-dark-text-muted">
                {tool.description}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={cancel}
                className="flex h-11 w-11 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
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
                <Check className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            aria-expanded={pickerOpen}
            className="flex w-full items-center justify-center gap-2 px-4 py-3 text-slate-700 dark:text-dark-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
            aria-label={pickerOpen ? "Close tools" : "Open tools"}
          >
            <Grid2x2 className="h-4.5 w-4.5" />
            <span className="text-card-desc font-semibold">Tools</span>
            <ChevronUp
              className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${
                pickerOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {/* Body — fills the space under the header inside the 40% cap and scrolls,
          so long panels stay reachable. Hidden scrollbar (gesture/wheel scroll);
          collapses with the sheet when closed. */}
      <div
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-2 pt-1"
        aria-label={view.kind === "tool" ? "Tool controls" : "Tools"}
      >
        {view.kind === "tool" ? (
          <ToolControls toolId={view.id} />
        ) : (
          <div className="pt-1">
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
                className="mb-3 flex w-full items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-dark-border dark:text-dark-text dark:hover:bg-dark-surface-alt"
              >
                <RotateCcw className="h-4 w-4 shrink-0 text-slate-400" />
                Reset to original
              </button>
            )}
            {/* 3-up on ~320px phones (each cell ~85px wide — fits the longest
                label on one line), stepping to 4-up at ≥380px where there's
                room. Labels truncate to keep rows uniform regardless of word
                length; full name stays available via title + aria-label. */}
            <div className="grid grid-cols-3 min-[380px]:grid-cols-4 gap-x-1 gap-y-3">
              {EDITOR_TOOLS.map((t: EditorTool) => {
                const Icon = t.icon;
                const on = t.id === activeTool;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => pick(t.id)}
                    aria-label={t.name}
                    aria-pressed={on}
                    className={`flex min-w-0 flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                      on
                        ? "border-primary-200 bg-primary-50 text-primary-600 dark:border-primary-900/40 dark:bg-primary-900/30 dark:text-primary-300"
                        : "border-transparent text-slate-700 hover:bg-slate-50 dark:text-dark-text dark:hover:bg-dark-surface-alt"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span
                      className="block w-full truncate text-center text-tag font-medium leading-tight"
                      title={t.name}
                    >
                      {t.railLabel ?? t.name.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
