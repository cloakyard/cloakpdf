// The tool picker and active controls share the sheet beside the mounted preview.
import { useAirPresence } from "../../docs/air/presence.tsx";
import { ToolCompletion } from "./ToolCompletion.tsx";
import { ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useActiveTool, useEditorActions, useEditorRead } from "./EditorContext.tsx";
import { ToolControls } from "./ToolControls.tsx";
import { type EditorTool, EDITOR_TOOLS, editorToolGroups, findEditorTool } from "./tools.ts";

const toolGroups = editorToolGroups();
const shortcuts: EditorTool[] = EDITOR_TOOLS.filter(
  ({ id }) => id === "annotate-pdf" || id === "signature" || id === "fill-pdf-form",
);

function MobileQuickToolbar({
  onPick,
  onOpen,
}: {
  onPick: (id: string) => void;
  onOpen: () => void;
}) {
  const nativeFocus = "focusGroup" in HTMLElement.prototype;
  const [tabStop, setTabStop] = useState(shortcuts[0].id);
  return (
    <div
      className="editor-mobile-dock"
      role="toolbar"
      aria-label="Quick tools"
      {...{ focusgroup: "toolbar wrap" }}
      onFocus={
        nativeFocus
          ? undefined
          : (event) => {
              const key = (event.target as HTMLElement).closest("button")?.dataset.entry;
              if (key) setTabStop(key);
            }
      }
      onKeyDown={
        nativeFocus
          ? undefined
          : (event) => {
              if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
              const buttons = Array.from(event.currentTarget.querySelectorAll("button"));
              const index = buttons.indexOf(event.target as HTMLButtonElement);
              if (index < 0) return;
              const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
              let next: number;
              switch (event.key) {
                case "Home":
                  next = 0;
                  break;
                case "End":
                  next = buttons.length - 1;
                  break;
                case "ArrowLeft":
                  next = index + (rtl ? 1 : -1);
                  break;
                case "ArrowRight":
                  next = index + (rtl ? -1 : 1);
                  break;
                default:
                  return;
              }
              event.preventDefault();
              event.stopPropagation();
              buttons[(next + buttons.length) % buttons.length].focus();
            }
      }
    >
      <div role="group" aria-label="Editing shortcuts" className="editor-mobile-dock__shortcuts">
        {shortcuts.map(({ id, railLabel, name, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className="air-button air-button--quiet"
            data-entry={id}
            tabIndex={nativeFocus ? undefined : tabStop === id ? 0 : -1}
            onClick={() => onPick(id)}
          >
            <Icon aria-hidden="true" />
            <span>{railLabel ?? name}</span>
          </button>
        ))}
      </div>
      <span
        role="separator"
        aria-orientation="vertical"
        className="editor-mobile-dock__separator"
      />
      <button
        type="button"
        className="air-button air-button--quiet"
        data-entry="all"
        data-dialog-return-focus="editor-tool-picker"
        aria-label="All tools"
        aria-controls="mobile-editor-tool-body"
        aria-expanded={false}
        tabIndex={nativeFocus ? undefined : tabStop === "all" ? 0 : -1}
        onClick={onOpen}
      >
        <LayoutGrid aria-hidden="true" />
        <span>All tools</span>
      </button>
    </div>
  );
}

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
  const sheetRef = useRef<HTMLElement>(null);
  const entry = useRef("all");
  const wasOpen = useRef(open);
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
    else if (pickerOpen && !activeTool && !returnTool.current && !wasOpen.current)
      headingRef.current?.focus({ preventScroll: true });
    else if (!open && wasOpen.current) {
      sheetRef.current
        ?.querySelector<HTMLButtonElement>(`[data-entry="${entry.current}"]`)
        ?.focus({ preventScroll: true });
      entry.current = "all";
    }
    previousTool.current = activeTool;
    wasOpen.current = open;
  }, [activeTool, open, pickerOpen]);
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
      ref={sheetRef}
      data-testid="mobile-tool-sheet"
      data-picker={(pickerOpen && !tool) || undefined}
      aria-label="Editor tools"
      className="editor-mobile-sheet"
      data-open={open || (presence.mounted && !!visibleTool)}
      onKeyDown={(event) => {
        if (
          !pickerOpen ||
          tool ||
          event.key !== "Escape" ||
          event.nativeEvent.isComposing ||
          event.nativeEvent.keyCode === 229 ||
          queryBeforeComposition !== null
        )
          return;
        event.preventDefault();
        event.stopPropagation();
        if (toolQuery) clearSearch();
        else close();
      }}
    >
      {!open && (
        <MobileQuickToolbar
          onPick={(id) => {
            entry.current = id;
            pick(id);
          }}
          onOpen={() => {
            entry.current = "all";
            setPickerOpen(true);
          }}
        />
      )}
      {open && (
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
                  entry.current = "all";
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
              <h2 ref={headingRef} data-dialog-return-focus="editor-tool-picker" tabIndex={-1}>
                Tools
              </h2>
              <button
                type="button"
                className="air-icon-button air-button--quiet"
                onClick={close}
                aria-expanded={true}
                aria-controls="mobile-editor-tool-body"
                aria-label="Close tools"
              >
                <ChevronDown aria-hidden="true" />
              </button>
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
                <label htmlFor="mobile-editor-tool-search" className="sr-only">
                  Search editor tools
                </label>
                <div className="air-field-group">
                  <Search aria-hidden="true" className="editor-mobile-search__icon" />
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
                    placeholder="Search tools"
                    aria-describedby="mobile-editor-tool-search-count"
                    autoComplete="off"
                    spellCheck={false}
                    className="air-field"
                  />
                  {toolQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="air-icon-button air-button--quiet"
                      aria-label="Clear editor tool search"
                    >
                      <X aria-hidden="true" />
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      )}
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
        ) : presence.mounted ? (
          <>
            <p
              id="mobile-editor-tool-search-count"
              className={activeToolQuery ? "air-help" : "sr-only"}
              role="status"
            >
              {activeToolQuery
                ? `${visibleTools.length} matching ${visibleTools.length === 1 ? "tool" : "tools"}`
                : `${EDITOR_TOOLS.length} editor tools`}
            </p>

            {visibleTools.length > 0 ? (
              (activeToolQuery
                ? [{ label: "Matching editor tools", tools: visibleTools }]
                : toolGroups
              ).map(({ label, tools }) => (
                <div key={label} className="editor-mobile-tool-group">
                  {!activeToolQuery && <h3>{label}</h3>}
                  <ul className="editor-mobile-tool-list" aria-label={label}>
                    {tools.map((candidate) => {
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
                              <span
                                className={activeToolQuery ? "air-help" : "sr-only"}
                                id={`mobile-tool-help-${candidate.id}`}
                              >
                                <MobileSearchMatch
                                  text={candidate.description}
                                  query={activeToolQuery}
                                />
                              </span>
                            </span>
                            <ChevronRight
                              aria-hidden="true"
                              className="editor-mobile-tool-list__arrow"
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
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
        ) : null}
      </div>
    </section>
  );
}
