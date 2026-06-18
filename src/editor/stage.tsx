// stage.tsx — The persistent-canvas registration seam, ported from CloakIMG's
// StageHost/useStageProps. The single <PdfStage> mounts once in EditorShell and
// never tears down on tool switch; the active tool registers its overlay paint
// + pointer handlers + cursor here via `useStageProps`, and they auto-clear on
// unmount so a stale overlay never bleeds into the next tool. This is what
// keeps the page raster from flashing when the user changes tools.

import {
  createContext,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

/** A pointer position in page-fraction space (0–1, top-left origin) plus the
 *  0-based page it landed on. The canonical coordinate the overlay tools store. */
export interface StagePoint {
  /** 0–1 across the page width. */
  xPct: number;
  /** 0–1 down the page height. */
  yPct: number;
  /** Page the pointer is over (the focused page in focus mode). */
  pageIndex: number;
}

export interface PdfStageProps {
  /** Paint the active tool's overlay for `pageIndex` onto the overlay canvas.
   *  `w`/`h` are the overlay canvas's device-pixel dimensions. */
  paintOverlay?: (ctx: CanvasRenderingContext2D, w: number, h: number, pageIndex: number) => void;
  onPointerDown?: (p: StagePoint, e: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove?: (p: StagePoint, e: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp?: (p: StagePoint, e: ReactPointerEvent<HTMLElement>) => void;
  /** Discard any in-flight draft without committing it. PdfStage fires this
   *  when a one-finger draw is interrupted by a second finger (pinch-zoom), so
   *  a half-drawn box/line/stroke never gets stuck on the overlay. */
  onPointerCancel?: () => void;
  cursor?: CSSProperties["cursor"];
}

const EMPTY: PdfStageProps = {};

/** An in-place text-editing box anchored on the focused page. Lives on its own
 *  context channel (NOT a PdfStageProps field) so its fresh `onCommit` closure
 *  — rebuilt every keystroke/render of the owning tool — doesn't break the
 *  shallowEqual bail that keeps the stage-props registration cheap. PdfStage is
 *  kept decoupled from the annotation font model: it receives resolved CSS, not
 *  font ids. */
export interface InlineEditorDescriptor {
  /** Identity of this edit session. PdfStage re-seeds the input value only when
   *  it changes, so a style-only update (e.g. a font-size auto-suggest snap)
   *  keeps the text the user has already typed. */
  editorId: string;
  /** Page the editor is anchored to; PdfStage renders it only when this is the
   *  focused page. */
  pageIndex: number;
  /** Top-left anchor in page fractions (0–1), matching the text-annotation anchor. */
  xPct: number;
  yPct: number;
  /** Seed text — empty for a fresh placement, the object's text when editing. */
  initialText: string;
  /** Resolved CSS family stack, weight, and slant for a WYSIWYG box. */
  fontCss: string;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  colorHex: string;
  /** Text height as a fraction of page height; editor font-size = sizeFrac·fit.h. */
  sizeFrac: number;
  /** Text-box size in page fractions. When set, the editor is a multi-line,
   *  word-wrapping textarea filling the box; absent → a single-line auto-width
   *  input (legacy point-anchored labels). */
  boxWFrac?: number;
  boxHFrac?: number;
  /** Commit the typed text (the owner trims + discards empties). */
  onCommit: (text: string) => void;
  /** Abandon the edit (Escape, or a page switch with empty text). */
  onCancel: () => void;
}

// Value context (changes per tool render) + setter context (stable). Tools
// consume only the setter, so they don't re-render on sibling stage churn.
const StagePropsCtx = createContext<PdfStageProps>(EMPTY);
const StageSetCtx = createContext<(p: PdfStageProps) => void>(() => {});

// The inline editor rides a parallel channel for the reasons above: a stable
// setter the owning tool calls imperatively on open/close, and a value context
// PdfStage subscribes to. Mirrors the StageProps value/setter split.
const InlineEditorCtx = createContext<InlineEditorDescriptor | null>(null);
const InlineEditorSetCtx = createContext<(d: InlineEditorDescriptor | null) => void>(() => {});

export function StageProvider({ children }: { children: ReactNode }) {
  const [props, setProps] = useState<PdfStageProps>(EMPTY);
  const set = useCallback((next: PdfStageProps) => {
    setProps((prev) => (shallowEqual(prev, next) ? prev : next));
  }, []);
  const [inlineEditor, setInlineEditor] = useState<InlineEditorDescriptor | null>(null);
  return (
    <StageSetCtx.Provider value={set}>
      <StagePropsCtx.Provider value={props}>
        <InlineEditorSetCtx.Provider value={setInlineEditor}>
          <InlineEditorCtx.Provider value={inlineEditor}>{children}</InlineEditorCtx.Provider>
        </InlineEditorSetCtx.Provider>
      </StagePropsCtx.Provider>
    </StageSetCtx.Provider>
  );
}

/** Imperative setter for the inline text editor (pass `null` to close it). The
 *  setter identity is stable (useState), so calling it never re-renders the caller. */
export function useInlineEditor(): (d: InlineEditorDescriptor | null) => void {
  return useContext(InlineEditorSetCtx);
}

/** The active inline editor descriptor, or null. Consumed by PdfStage. */
export function useActiveInlineEditor(): InlineEditorDescriptor | null {
  return useContext(InlineEditorCtx);
}

/** Tool components call this each render to register their stage props. The
 *  setter shallow-bails on unchanged props; registration clears on unmount. */
export function useStageProps(props: PdfStageProps): void {
  const set = useContext(StageSetCtx);
  useLayoutEffect(() => {
    set(props);
  });
  useEffect(() => {
    return () => set(EMPTY);
  }, [set]);
}

/** Read the currently-registered stage props. Consumed by PdfStage. */
export function useActiveStageProps(): PdfStageProps {
  return useContext(StagePropsCtx);
}

function shallowEqual(a: PdfStageProps, b: PdfStageProps): boolean {
  return (
    a.paintOverlay === b.paintOverlay &&
    a.onPointerDown === b.onPointerDown &&
    a.onPointerMove === b.onPointerMove &&
    a.onPointerUp === b.onPointerUp &&
    a.onPointerCancel === b.onPointerCancel &&
    a.cursor === b.cursor
  );
}
