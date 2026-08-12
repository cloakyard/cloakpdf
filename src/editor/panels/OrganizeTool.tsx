// OrganizeTool.tsx — The unified page-board tool (overview mode). The Board
// renders an editable grid of every page: drag to reorder, rotate, or mark for
// deletion. The Panel summarises the pending plan, offers quick actions, and
// applies it via `assemblePdf` (one pass, all ops). Because every page op
// reduces to a mutation of `order` + `deleted` + `rotations`, this tool absorbs
// what used to be four separate tools:
//   • Reverse      → reverse the `order` array
//   • Remove-blank → auto-detect near-blank pages, mark them deleted
//   • Extract      → "Delete all", then restore the few pages to keep
//   • (rotate/reorder/delete are the board's native gestures)
// N-up stays separate — it composites pages onto new sheets, not a reorder.
// All working state lives in the namespaced tool slice so the Board (center)
// and Panel (right) share it and it survives re-selection. See CLAUDE.md.

import { ChevronDown, ChevronUp, FileX, Repeat2, RotateCw, Trash2, Undo2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { assemblePdf, type AssembleOp } from "../../utils/pdf-operations.ts";
import { renderThumbnailsAndScores, revokeThumbnails } from "../../utils/pdf-renderer.ts";
import { type CanvasObject, docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead, useEditorView, useToolSlice } from "../EditorContext.tsx";
import { PageThumb } from "../PageThumb.tsx";
import { PrimaryAction } from "./PrimaryAction.tsx";

export const ORGANIZE_ID = "organize-pages";

/**
 * True when the Organize slice holds page changes (reorder / rotate / delete)
 * not yet baked into `doc.bytes` — i.e. "Apply changes" hasn't been pressed.
 * The Export modal reads this to warn that a download would otherwise silently
 * drop them (export builds from the committed bytes, not the pending plan).
 */
export function hasPendingPageChanges(slice: Record<string, unknown>): boolean {
  const order = slice.order as number[] | undefined;
  const rotations = (slice.rotations as Record<number, number> | undefined) ?? {};
  const deleted = (slice.deleted as number[] | undefined) ?? [];
  const reordered = !!order && order.some((v, i) => v !== i);
  const rotated = Object.values(rotations).some((d) => d % 360 !== 0);
  return reordered || rotated || deleted.length > 0;
}

// Fraction of near-white pixels above which a page is treated as blank. High so
// a faint header/footer isn't swept up. (Absorbed from the old Remove-blank.)
const BLANK_THRESHOLD = 0.995;

interface OrganizeState {
  /** Original page indices, in display (output) order. */
  order: number[];
  /** Original page index → extra clockwise rotation in degrees. */
  rotations: Record<number, number>;
  /** Original page indices marked for deletion. */
  deleted: number[];
  /** Page count the state was initialised against (drives auto-reset). */
  baseCount: number;
}

function readState(slice: Record<string, unknown>, pageCount: number): OrganizeState {
  const order = (slice.order as number[] | undefined) ?? null;
  if (!order || (slice.baseCount as number | undefined) !== pageCount) {
    return {
      order: Array.from({ length: pageCount }, (_, i) => i),
      rotations: {},
      deleted: [],
      baseCount: pageCount,
    };
  }
  return {
    order,
    rotations: (slice.rotations as Record<number, number>) ?? {},
    deleted: (slice.deleted as number[]) ?? [],
    baseCount: pageCount,
  };
}

// ── Board (center, overview mode) ────────────────────────────────────

export function Board() {
  const { doc, layout } = useEditorRead();
  const view = useEditorView();
  const { patchToolState } = useEditorActions();
  const slice = useToolSlice(ORGANIZE_ID);
  // Drag-to-reorder visual state: the cell being dragged (dim + shrink) and the
  // cell currently hovered as the drop target (accent ring). State, not a ref,
  // so the board re-renders to show the affordance during a desktop drag — the
  // gesture was previously invisible (no grab cursor, no drop indicator).
  const [fromPos, setFromPos] = useState<number | null>(null);
  const [overPos, setOverPos] = useState<number | null>(null);
  const pageCount = doc?.pageCount ?? 0;
  const state = readState(slice, pageCount);

  // Auto-initialise / reset whenever the page count changes (first open, or
  // after an Apply rebuilds the doc).
  useEffect(() => {
    if (!doc) return;
    if ((slice.baseCount as number | undefined) !== doc.pageCount) {
      patchToolState(ORGANIZE_ID, {
        order: Array.from({ length: doc.pageCount }, (_, i) => i),
        rotations: {},
        deleted: [],
        baseCount: doc.pageCount,
      });
    }
  }, [doc, slice.baseCount, patchToolState]);

  if (!doc) return null;

  const rotate = (origIdx: number) => {
    const next = { ...state.rotations, [origIdx]: ((state.rotations[origIdx] ?? 0) + 90) % 360 };
    patchToolState(ORGANIZE_ID, { rotations: next });
  };
  const toggleDelete = (origIdx: number) => {
    const next = state.deleted.includes(origIdx)
      ? state.deleted.filter((i) => i !== origIdx)
      : [...state.deleted, origIdx];
    patchToolState(ORGANIZE_ID, { deleted: next });
  };
  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const order = [...state.order];
    const [moved] = order.splice(from, 1);
    order.splice(to, 0, moved);
    patchToolState(ORGANIZE_ID, { order });
  };

  // Cap the column count on mobile so each cell stays wide enough for the
  // touch-sized reorder / rotate / delete buttons — 3 columns on a phone makes
  // the action row overflow the cell (and a tap lands on the wrong page).
  const cols = layout === "mobile" ? Math.min(view.gridCols, 2) : view.gridCols;

  return (
    <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto bg-slate-100 dark:bg-dark-bg p-4 sm:p-6">
      <div
        className="mx-auto grid max-w-5xl gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {state.order.map((origIdx, pos) => {
          const page = doc.pages[origIdx];
          if (!page) return null;
          const rot = state.rotations[origIdx] ?? 0;
          const del = state.deleted.includes(origIdx);
          return (
            <div
              key={origIdx}
              draggable
              onDragStart={() => setFromPos(pos)}
              onDragOver={(e) => {
                e.preventDefault();
                if (fromPos !== null && pos !== fromPos) setOverPos(pos);
              }}
              onDragLeave={() => setOverPos((p) => (p === pos ? null : p))}
              onDrop={() => {
                if (fromPos !== null) reorder(fromPos, pos);
                setFromPos(null);
                setOverPos(null);
              }}
              onDragEnd={() => {
                setFromPos(null);
                setOverPos(null);
              }}
              className={`page-cell group relative flex cursor-grab flex-col items-center gap-1.5 rounded-lg border bg-white p-2 transition-[opacity,transform] active:cursor-grabbing dark:bg-dark-surface ${
                del ? "opacity-40" : fromPos === pos ? "select-none opacity-50 scale-[0.97]" : ""
              } ${
                overPos === pos
                  ? "border-primary-300 ring-2 ring-primary-500"
                  : "border-slate-200 dark:border-dark-border"
              }`}
            >
              <PageThumb
                page={page}
                alt={`Page ${origIdx + 1}`}
                rotation={rot}
                className="w-full rounded-md ring-1 ring-slate-200/70 dark:ring-dark-border"
                imgClassName="transition-transform"
                loading="lazy"
              />
              <div className="flex w-full items-center justify-between px-0.5">
                <span className="text-xs font-medium tabular-nums text-slate-500 dark:text-dark-text-muted">
                  {origIdx + 1}
                </span>
                <div className="flex flex-wrap items-center justify-end gap-0.5 pointer-coarse:gap-1.5">
                  {pos > 0 && (
                    <button
                      type="button"
                      onClick={() => reorder(pos, pos - 1)}
                      aria-label={`Move page ${origIdx + 1} up`}
                      className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-dark-surface-alt pointer-coarse:min-h-11 pointer-coarse:min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                  {pos < state.order.length - 1 && (
                    <button
                      type="button"
                      onClick={() => reorder(pos, pos + 1)}
                      aria-label={`Move page ${origIdx + 1} down`}
                      className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-dark-surface-alt pointer-coarse:min-h-11 pointer-coarse:min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => rotate(origIdx)}
                    aria-label={`Rotate page ${origIdx + 1}`}
                    className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-dark-surface-alt pointer-coarse:min-h-11 pointer-coarse:min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleDelete(origIdx)}
                    aria-label={`${del ? "Restore" : "Delete"} page ${origIdx + 1}`}
                    aria-pressed={del}
                    className={`flex h-6 w-6 items-center justify-center rounded pointer-coarse:min-h-11 pointer-coarse:min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                      del
                        ? "text-primary-600"
                        : "text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-dark-surface-alt"
                    }`}
                  >
                    {del ? (
                      <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Panel (right) ────────────────────────────────────────────────────

/** A compact secondary action button, on-system (slate border, primary focus). */
function QuickAction({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof Repeat2;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-2 font-mono text-xs font-medium text-slate-600 active:translate-y-px pointer-coarse:min-h-11 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-muted hover:border-primary-300 hover:text-primary-700 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:dark:border-dark-border transition-[color,background-color,border-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

export function Panel() {
  const { doc } = useEditorRead();
  const { patchToolState, applyTransform } = useEditorActions();
  const slice = useToolSlice(ORGANIZE_ID);
  const pageCount = doc?.pageCount ?? 0;
  const state = readState(slice, pageCount);

  const [blanks, setBlanks] = useState<number[] | null>(null);
  const [scanning, setScanning] = useState(false);

  // Latest doc id, read inside the async scan callback to discard a result that
  // resolved after the document was replaced (Apply rebuilds the doc → new id).
  const liveDocId = useRef(doc?.id);
  liveDocId.current = doc?.id;

  // Drop stale blank-scan results whenever the document identity changes (any
  // Apply rebuilds the doc, even when the page count is unchanged).
  useEffect(() => {
    setBlanks(null);
    setScanning(false);
  }, [doc?.id]);

  const kept = state.order.filter((i) => !state.deleted.includes(i));
  const rotatedCount = Object.values(state.rotations).filter((d) => d % 360 !== 0).length;
  const reordered = state.order.some((v, i) => v !== i);
  const dirty = state.deleted.length > 0 || rotatedCount > 0 || reordered;
  const allDeleted = kept.length === 0;

  // ── Absorbed page-ops: reverse / extract / remove-blank ──────────────
  const reverse = () => patchToolState(ORGANIZE_ID, { order: [...state.order].reverse() });
  const deleteAll = () => patchToolState(ORGANIZE_ID, { deleted: [...state.order] });
  const restoreAll = () => patchToolState(ORGANIZE_ID, { deleted: [] });

  const findBlanks = () => {
    if (!doc) return;
    const scanDocId = doc.id;
    setScanning(true);
    void renderThumbnailsAndScores(docToFile(doc)).then(
      ({ thumbnails, scores }) => {
        revokeThumbnails(thumbnails);
        setScanning(false);
        // Discard if the doc was replaced mid-scan — these indices are stale.
        if (liveDocId.current !== scanDocId) return;
        setBlanks(scores.map((s, i) => (s >= BLANK_THRESHOLD ? i : -1)).filter((i) => i >= 0));
      },
      () => {
        setScanning(false);
        if (liveDocId.current !== scanDocId) return;
        setBlanks([]);
      },
    );
  };

  const markBlanks = () => {
    if (!blanks || blanks.length === 0) return;
    patchToolState(ORGANIZE_ID, { deleted: [...new Set([...state.deleted, ...blanks])] });
  };

  const reset = useCallback(() => {
    patchToolState(ORGANIZE_ID, {
      order: Array.from({ length: pageCount }, (_, i) => i),
      rotations: {},
      deleted: [],
      baseCount: pageCount,
    });
  }, [patchToolState, pageCount]);

  const apply = useCallback(() => {
    const order =
      (slice.order as number[] | undefined) ?? Array.from({ length: pageCount }, (_, i) => i);
    const deleted = (slice.deleted as number[] | undefined) ?? [];
    const rotations = (slice.rotations as Record<number, number> | undefined) ?? {};
    const survivors = order.filter((i) => !deleted.includes(i));
    void applyTransform(async (d) => {
      const ops: AssembleOp[] = survivors.map((i) => ({
        kind: "page",
        sourceIndex: 0,
        pageIndex: i,
        rotation: rotations[i] ?? 0,
      }));
      const bytes = await assemblePdf([d.bytes], ops);
      // Remap surviving overlay objects to their new page index; drop objects on
      // deleted or rotated pages (rotation invalidates their fraction coords).
      const newIndex = new Map<number, number>();
      survivors.forEach((origIdx, pos) => newIndex.set(origIdx, pos));
      const objects: CanvasObject[] = d.objects
        .filter((o) => newIndex.has(o.pageIndex) && (rotations[o.pageIndex] ?? 0) % 360 === 0)
        .map((o) => ({ ...o, pageIndex: newIndex.get(o.pageIndex)! }));
      return { bytes, label: "Organize pages", objects };
    }).then(() => {
      // The plan is now baked into the rebuilt doc's bytes. Reset it to a clean
      // identity plan for the new doc — otherwise the board would re-apply the
      // (now-baked) rotation / reorder a SECOND time on the fresh raster (a
      // double-rotated preview), and the tool would read as permanently "dirty"
      // so a second Apply would bake yet another rotation. `doc.id` is preserved
      // across applyTransform and a rotate/reorder keeps the page count, so the
      // auto-init effect (which keys on page count) can't catch this on its own.
      patchToolState(ORGANIZE_ID, {
        order: Array.from({ length: survivors.length }, (_, i) => i),
        rotations: {},
        deleted: [],
        baseCount: survivors.length,
      });
    });
  }, [applyTransform, slice, pageCount, patchToolState]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-slate-500 dark:text-dark-text-muted">
        Drag pages or use the arrow buttons to reorder, rotate, or delete. Changes preview live and
        apply all at once.
      </p>

      <div className="border-y border-[var(--color-rule)] py-3 text-sm text-slate-600 dark:text-dark-text-muted">
        <div className="flex justify-between">
          <span>Output pages</span>
          <span className="font-medium tabular-nums text-slate-800 dark:text-dark-text">
            {kept.length} / {pageCount}
          </span>
        </div>
        {rotatedCount > 0 && (
          <div className="mt-1 flex justify-between">
            <span>Rotated</span>
            <span className="tabular-nums">{rotatedCount}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-mono text-xxs font-medium uppercase tracking-[0.1em] text-slate-600 dark:text-dark-text-muted">
          Quick actions
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          <QuickAction icon={Repeat2} label="Reverse order" onClick={reverse} />
          {allDeleted ? (
            <QuickAction icon={Undo2} label="Restore all" onClick={restoreAll} />
          ) : (
            <QuickAction icon={Trash2} label="Delete all" onClick={deleteAll} />
          )}
        </div>
        {blanks === null ? (
          <QuickAction
            icon={FileX}
            label={scanning ? "Scanning…" : "Find blank pages"}
            onClick={findBlanks}
            disabled={scanning}
          />
        ) : blanks.length === 0 ? (
          <p className="rounded-lg bg-slate-50 dark:bg-dark-bg px-2.5 py-2 text-xs text-slate-500 dark:text-dark-text-muted">
            No blank pages found.
          </p>
        ) : (
          <QuickAction
            icon={FileX}
            label={`Delete ${blanks.length} blank page${blanks.length === 1 ? "" : "s"}`}
            onClick={markBlanks}
          />
        )}
        <p className="text-tag text-slate-500 dark:text-dark-text-muted">
          To keep only a few pages, “Delete all” then restore the ones you want.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <PrimaryAction
          label="Apply changes"
          onApply={apply}
          disabled={!dirty || kept.length === 0}
        />
        {dirty && (
          <button
            type="button"
            onClick={reset}
            className="rounded-sm text-xs text-slate-500 hover:text-slate-700 pointer-coarse:min-h-11 dark:text-dark-text-muted dark:hover:text-dark-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            Reset pending changes
          </button>
        )}
      </div>
    </div>
  );
}
