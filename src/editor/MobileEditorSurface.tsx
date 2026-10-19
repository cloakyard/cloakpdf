// In-flow working sheet: the document stays mounted while controls expand.
import {
  Check,
  ChevronUp,
  Grid2x2,
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useActiveTool, useEditorActions, useEditorRead } from "./EditorContext.tsx";
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
          <mark key={`${part}-${index}`} className="pdf-command-match">
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
  const { pendingApply, canReset } = useEditorRead();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toolQuery, setToolQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const finishing = useRef(false);
  const tool = findEditorTool(activeTool);
  const open = pickerOpen || tool !== null;
  const applyDisabled = pendingApply !== null && !pendingApply.ready;
  // Retain the mounted tool while closed, matching the existing apply lifecycle.
  const viewRef = useRef<SheetView>({ kind: "picker" });
  if (open) viewRef.current = tool ? { kind: "tool", id: tool.id } : { kind: "picker" };
  const view = viewRef.current;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const previousTool = useRef(activeTool);
  useEffect(() => {
    // Reflow may mount this panel while the persistent toolbar owns focus.
    // Move only for a tool change or when the old panel lost its focused node.
    if (
      activeTool &&
      (previousTool.current !== activeTool || document.activeElement === document.body)
    )
      headingRef.current?.focus({ preventScroll: true });
    else if (previousTool.current) toggleRef.current?.focus({ preventScroll: true });
    previousTool.current = activeTool;
  }, [activeTool]);
  useEffect(() => {
    if (open) bodyRef.current?.scrollTo({ top: 0 });
  }, [open, activeTool]);

  const pick = useCallback(
    (id: string) => {
      setActiveTool(id);
      const picked = findEditorTool(id);
      if (picked?.mode === "focus" || picked?.mode === "overview") setViewMode(picked.mode);
      setPickerOpen(false);
      setToolQuery("");
    },
    [setActiveTool, setViewMode],
  );
  const close = () => {
    setPickerOpen(false);
    setExpanded(false);
  };
  const clearSearch = () => {
    setToolQuery("");
    searchRef.current?.focus();
  };
  const activeToolQuery = toolQuery.trim();
  const visibleTools = useMemo(() => {
    if (!activeToolQuery) return EDITOR_TOOLS;
    const normalized = activeToolQuery.toLocaleLowerCase();
    const tokens = mobileSearchTokens(activeToolQuery);
    return EDITOR_TOOLS.flatMap((candidate, order) => {
      const score = scoreEditorTool(candidate, normalized, tokens);
      return score === null ? [] : [{ candidate, score, order }];
    })
      .sort((a, b) => b.score - a.score || a.order - b.order)
      .map(({ candidate }) => candidate);
  }, [activeToolQuery]);

  return (
    <section
      data-testid="mobile-tool-sheet"
      aria-label="Editor tools"
      className="editor-mobile-sheet"
      data-open={open}
      data-expanded={open && expanded}
    >
      <div className="editor-mobile-sheet__header">
        {tool ? (
          <>
            <h2 ref={headingRef} data-dialog-return-focus="editor-tool-picker" tabIndex={-1}>
              {tool.name}
            </h2>
            <div className="editor-mobile-sheet__actions">
              <button
                type="button"
                className="air-icon-button air-button--quiet"
                onClick={() => setExpanded(!expanded)}
                aria-label={expanded ? "Return to split view" : "Expand controls"}
                aria-expanded={expanded}
                title={expanded ? "Return to split view" : "Expand controls"}
              >
                {expanded ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
              </button>
              <button
                type="button"
                className="air-icon-button air-button--quiet"
                onClick={() => {
                  close();
                  void cancelCurrentTool();
                }}
                aria-label="Cancel"
                title="Cancel"
              >
                <X aria-hidden="true" />
              </button>
              <button
                type="button"
                className="air-icon-button air-button--primary"
                onClick={() => {
                  if (finishing.current) return;
                  finishing.current = true;
                  void flushPendingApply()
                    .then(() => {
                      close();
                      setActiveTool(null);
                    })
                    .catch(() => {
                      // Keep the tool and its values available for retry. The
                      // operation reports its failure in the editor/panel.
                    })
                    .finally(() => {
                      finishing.current = false;
                    });
                }}
                disabled={applyDisabled}
                aria-label="Done"
                title="Done"
              >
                <Check aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              ref={toggleRef}
              type="button"
              className="air-button air-button--quiet editor-mobile-sheet__toggle"
              onClick={() => {
                if (pickerOpen) {
                  close();
                  setToolQuery("");
                } else setPickerOpen(true);
              }}
              data-dialog-return-focus="editor-tool-picker"
              aria-expanded={pickerOpen}
              aria-controls="mobile-editor-tool-body"
              aria-label={pickerOpen ? "Close tools" : "Open tools"}
            >
              <Grid2x2 aria-hidden="true" />
              <span>Tools</span>
              <ChevronUp aria-hidden="true" className={pickerOpen ? "rotate-180" : ""} />
            </button>
            {open && (
              <button
                type="button"
                className="air-icon-button air-button--quiet"
                onClick={() => setExpanded(!expanded)}
                aria-label={expanded ? "Return to split view" : "Expand controls"}
                aria-expanded={expanded}
                title={expanded ? "Return to split view" : "Expand controls"}
              >
                {expanded ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
              </button>
            )}
          </>
        )}
      </div>
      <div
        ref={bodyRef}
        id="mobile-editor-tool-body"
        role="region"
        inert={!open ? true : undefined}
        aria-hidden={!open}
        className="editor-mobile-sheet__body thin-scrollbar"
        aria-label={view.kind === "tool" ? "Tool controls" : "Tools"}
      >
        {view.kind === "tool" ? (
          <ToolControls key={view.id} toolId={view.id} />
        ) : (
          <>
            <div role="search" aria-label="Editor tools" className="editor-mobile-search">
              <label htmlFor="mobile-editor-tool-search" className="air-label">
                Search editor tools
              </label>
              <div className="air-field-group">
                <input
                  ref={searchRef}
                  id="mobile-editor-tool-search"
                  name="editor-tool-search"
                  type="search"
                  value={toolQuery}
                  onChange={(event) => setToolQuery(event.target.value)}
                  placeholder="Name or task…"
                  aria-describedby="mobile-editor-tool-search-count"
                  autoComplete="off"
                  spellCheck={false}
                  className="air-field"
                />
                {toolQuery ? (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="air-icon-button air-button--quiet"
                    aria-label="Clear editor tool search"
                  >
                    <X aria-hidden="true" />
                  </button>
                ) : (
                  <Search aria-hidden="true" className="editor-mobile-search__icon" />
                )}
              </div>
              <p id="mobile-editor-tool-search-count" className="air-help" role="status">
                {activeToolQuery
                  ? `${visibleTools.length} matching ${visibleTools.length === 1 ? "tool" : "tools"}`
                  : `${EDITOR_TOOLS.length} editor tools`}
              </p>
            </div>
            {canReset && (
              <button
                type="button"
                className="air-button air-button--quiet editor-mobile-reset"
                onClick={() => {
                  reset();
                  close();
                  toggleRef.current?.focus();
                }}
              >
                <RotateCcw aria-hidden="true" />
                Reset to original
              </button>
            )}
            {visibleTools.length > 0 ? (
              <ul
                className="editor-mobile-tool-list"
                aria-label={activeToolQuery ? "Matching editor tools" : "Available editor tools"}
              >
                {visibleTools.map((candidate) => {
                  const Icon = candidate.icon;
                  return (
                    <li key={candidate.id}>
                      <button
                        type="button"
                        onClick={() => pick(candidate.id)}
                        aria-label={candidate.name}
                      >
                        <Icon aria-hidden="true" />
                        <span>
                          <span className="editor-mobile-tool-list__name">
                            <MobileSearchMatch text={candidate.name} query={activeToolQuery} />
                          </span>
                          <span className="air-help">
                            {activeToolQuery ? (
                              <MobileSearchMatch
                                text={candidate.description}
                                query={activeToolQuery}
                              />
                            ) : (
                              EDITOR_GROUP_LABELS[candidate.group]
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="editor-mobile-empty">
                <p>No tool found</p>
                <p className="air-help">Try “redact”, “crop”, or “page numbers”.</p>
                <button type="button" onClick={clearSearch} className="air-button">
                  Clear search
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
