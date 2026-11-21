// The tool picker and active controls share the sheet beside the mounted preview.
import { useAirPresence } from "../../docs/air/presence.tsx";
import { ToolCompletion } from "./ToolCompletion.tsx";
import { ChevronLeft, ChevronUp, Grid2x2, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useActiveTool, useEditorActions, useEditorRead } from "./EditorContext.tsx";
import { ToolControls } from "./ToolControls.tsx";
import { type EditorTool, EDITOR_TOOLS, findEditorTool } from "./tools.ts";

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
  const { setActiveTool, setViewMode } = useEditorActions();
  const { busyLabel } = useEditorRead();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toolQuery, setToolQuery] = useState("");
  // Keep the result list stable while the input method is choosing a candidate.
  const [queryBeforeComposition, setQueryBeforeComposition] = useState<string | null>(null);
  const confirmingCandidate = useRef(false);
  const finishing = useRef(false);
  const tool = findEditorTool(activeTool);
  const open = pickerOpen || tool !== null;
  const presence = useAirPresence(open, "panel");
  const lastTool = useRef(tool);
  if (open) lastTool.current = tool;
  const visibleTool = open ? tool : presence.mounted ? lastTool.current : null;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const bodyRef = presence.ref;
  const previousTool = useRef(activeTool);
  const returnTool = useRef<string | null>(null);
  useEffect(() => {
    // Reflow may mount this panel while the persistent toolbar owns focus.
    // Move only for a tool change or when the old panel lost its focused node.
    if (
      activeTool &&
      (previousTool.current !== activeTool || document.activeElement === document.body)
    )
      headingRef.current?.focus({ preventScroll: true });
    else if (previousTool.current && !returnTool.current)
      toggleRef.current?.focus({ preventScroll: true });
    previousTool.current = activeTool;
  }, [activeTool]);
  useEffect(() => {
    if (!open) return;
    const previous = returnTool.current;
    returnTool.current = null;
    const row =
      previous && bodyRef.current?.querySelector<HTMLButtonElement>(`[data-tool-id="${previous}"]`);
    if (row) {
      row.focus({ preventScroll: true });
      row.scrollIntoView({ block: "nearest" });
    } else {
      bodyRef.current?.scrollTo({ top: 0 });
    }
  }, [open, activeTool]);

  const pick = useCallback(
    (id: string) => {
      setActiveTool(id);
      const picked = findEditorTool(id);
      if (picked?.mode === "focus" || picked?.mode === "overview") setViewMode(picked.mode);
      setPickerOpen(false);
    },
    [setActiveTool, setViewMode],
  );
  const resetQuery = () => {
    confirmingCandidate.current = false;
    setQueryBeforeComposition(null);
    setToolQuery("");
  };
  const close = () => {
    setPickerOpen(false);
    resetQuery();
  };
  const clearSearch = () => {
    resetQuery();
    bodyRef.current?.scrollTo({ top: 0 });
    searchRef.current?.focus();
  };
  const activeToolQuery = (queryBeforeComposition ?? toolQuery).trim();
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
      data-open={open || presence.mounted}
    >
      <div className="editor-mobile-sheet__header air-editor-panel-heading">
        {tool ? (
          <>
            <button
              type="button"
              className="air-icon-button air-button--quiet"
              aria-label="Back to tools"
              title="Back to tools"
              disabled={busyLabel !== null}
              onClick={() => {
                if (finishing.current) return;
                returnTool.current = tool.id;
                setPickerOpen(true);
                setActiveTool(null);
              }}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <h2 ref={headingRef} data-dialog-return-focus="editor-tool-picker" tabIndex={-1}>
              {tool.name}
            </h2>
            <ToolCompletion onClose={close} finishingRef={finishing} />
          </>
        ) : (
          <>
            <button
              ref={toggleRef}
              type="button"
              className={
                pickerOpen
                  ? "air-icon-button air-button--quiet"
                  : "air-button air-button--quiet editor-mobile-sheet__toggle"
              }
              onClick={() => (pickerOpen ? close() : setPickerOpen(true))}
              data-dialog-return-focus="editor-tool-picker"
              aria-expanded={pickerOpen}
              aria-controls="mobile-editor-tool-body"
              aria-label={pickerOpen ? "Close tools" : "Open tools"}
              title={pickerOpen ? "Close tools" : undefined}
            >
              {pickerOpen ? (
                <ChevronLeft aria-hidden="true" />
              ) : (
                <>
                  <Grid2x2 aria-hidden="true" />
                  <span>Tools</span>
                  <ChevronUp aria-hidden="true" />
                </>
              )}
            </button>
            {pickerOpen && (
              <form
                role="search"
                aria-label="Editor tools"
                className="editor-mobile-search"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (queryBeforeComposition !== null || confirmingCandidate.current) return;
                  if (visibleTools.length === 1) pick(visibleTools[0].id);
                  else
                    bodyRef.current
                      ?.querySelector<HTMLButtonElement>(".editor-mobile-tool-list button")
                      ?.focus();
                }}
              >
                <label htmlFor="mobile-editor-tool-search" className="air-label">
                  Search editor tools
                </label>
                <div className="air-field-group">
                  <input
                    ref={searchRef}
                    id="mobile-editor-tool-search"
                    name="editor-tool-search"
                    type="search"
                    enterKeyHint="search"
                    value={toolQuery}
                    onChange={(event) => {
                      setToolQuery(event.currentTarget.value);
                      if (queryBeforeComposition === null) bodyRef.current?.scrollTo({ top: 0 });
                    }}
                    onCompositionStart={() => setQueryBeforeComposition(toolQuery)}
                    onCompositionEnd={(event) => {
                      setQueryBeforeComposition(null);
                      setToolQuery(event.currentTarget.value);
                      bodyRef.current?.scrollTo({ top: 0 });
                    }}
                    onKeyDown={(event) => {
                      // Let the keyboard accept its candidate, including engines that
                      // dispatch compositionend before the confirming Enter submits.
                      confirmingCandidate.current =
                        event.key === "Enter" &&
                        (event.nativeEvent.isComposing ||
                          event.nativeEvent.keyCode === 229 ||
                          queryBeforeComposition !== null);
                    }}
                    onKeyUp={() => {
                      confirmingCandidate.current = false;
                    }}
                    autoCapitalize="none"
                    autoCorrect="off"
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
              </form>
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
        className="editor-mobile-sheet__body air-scroll"
        aria-label={visibleTool ? "Tool controls" : "Tools"}
      >
        {visibleTool ? (
          <ToolControls key={visibleTool.id} toolId={visibleTool.id} />
        ) : (
          <>
            <p id="mobile-editor-tool-search-count" className="air-help" role="status">
              {activeToolQuery
                ? `${visibleTools.length} matching ${visibleTools.length === 1 ? "tool" : "tools"}`
                : `${EDITOR_TOOLS.length} editor tools`}
            </p>

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
                        data-tool-id={candidate.id}
                        aria-label={candidate.name}
                        aria-describedby={`mobile-tool-help-${candidate.id}`}
                      >
                        <Icon aria-hidden="true" />
                        <span>
                          <span className="editor-mobile-tool-list__name">
                            <MobileSearchMatch text={candidate.name} query={activeToolQuery} />
                          </span>
                          <span className="air-help" id={`mobile-tool-help-${candidate.id}`}>
                            <MobileSearchMatch
                              text={candidate.description}
                              query={activeToolQuery}
                            />
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
