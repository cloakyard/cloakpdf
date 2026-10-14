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
import { type CanvasDoc, type CanvasObject, docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead, useEditorView, useToolSlice } from "../EditorContext.tsx";
import { PageCollection } from "../PageCollection.tsx";
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
}

function readState(slice: Record<string, unknown>, pages: CanvasDoc["pages"]): OrganizeState {
  const pageCount = pages.length;
  const order = (slice.order as number[] | undefined) ?? null;
  if (!order || slice.basePages !== pages) {
    return {
      order: Array.from({ length: pageCount }, (_, i) => i),
      rotations: {},
      deleted: [],
    };
  }
  return {
    order,
    rotations: (slice.rotations as Record<number, number>) ?? {},
    deleted: (slice.deleted as number[]) ?? [],
  };
}

// ── Board (center, overview mode) ────────────────────────────────────

export function Board() {
  const { doc } = useEditorRead();
  const view = useEditorView();
  const { patchToolState } = useEditorActions();
  const slice = useToolSlice(ORGANIZE_ID);
  // Drag-to-reorder visual state: the cell being dragged (dim) and the
  // cell currently hovered as the drop target (accent ring). State, not a ref,
  // so the board re-renders to show the affordance during a desktop drag — the
  // gesture was previously invisible (no grab cursor, no drop indicator).
  const [fromPos, setFromPos] = useState<number | null>(null);
  const [overPos, setOverPos] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const state = readState(slice, doc?.pages ?? []);

  // New page geometry (Apply or history) invalidates the staged plan, even when
  // the count is unchanged. Overlay-only edits keep the same pages reference.
  useEffect(() => {
    if (!doc) return;
    if (slice.basePages !== doc.pages) {
      patchToolState(ORGANIZE_ID, {
        order: Array.from({ length: doc.pageCount }, (_, i) => i),
        rotations: {},
        deleted: [],
        basePages: doc.pages,
      });
    }
  }, [doc, slice.basePages, patchToolState]);

  if (!doc) return null;

  const rotate = (origIdx: number) => {
    const next = { ...state.rotations, [origIdx]: ((state.rotations[origIdx] ?? 0) + 90) % 360 };
    patchToolState(ORGANIZE_ID, { rotations: next });
    setAnnouncement(`Page ${origIdx + 1} rotated to ${next[origIdx]} degrees.`);
  };
  const toggleDelete = (origIdx: number) => {
    const next = state.deleted.includes(origIdx)
      ? state.deleted.filter((i) => i !== origIdx)
      : [...state.deleted, origIdx];
    patchToolState(ORGANIZE_ID, { deleted: next });
    setAnnouncement(
      `Page ${origIdx + 1} ${next.includes(origIdx) ? "marked for deletion" : "restored"}.`,
    );
  };
  const reorder = (from: number, to: number, trigger?: HTMLButtonElement) => {
    if (from === to || to < 0 || to >= state.order.length) return;
    const order = [...state.order];
    const [moved] = order.splice(from, 1);
    order.splice(to, 0, moved);
    patchToolState(ORGANIZE_ID, { order });
    setAnnouncement(`Page ${moved + 1} moved to position ${to + 1} of ${order.length}.`);
    // React may move the focused DOM node. Keep keyboard ownership on the same
    // named action, including at the boundary where it becomes unavailable.
    if (trigger)
      requestAnimationFrame(() => {
        if (trigger.isConnected) {
          trigger.focus({ preventScroll: true });
          trigger.scrollIntoView({ block: "nearest", behavior: "instant" });
        }
      });
  };

  return (
    <>
      <span className="sr-only" role="status">
        {announcement}
      </span>
      <PageCollection columns={view.gridCols} label="Organize pages">
        {state.order.map((origIdx, pos) => {
          const page = doc.pages[origIdx];
          if (!page) return null;
          const rot = state.rotations[origIdx] ?? 0;
          const del = state.deleted.includes(origIdx);
          return (
            <li
              key={origIdx}
              aria-label={`Page ${origIdx + 1}, position ${pos + 1} of ${state.order.length}`}
              draggable
              onDragStart={() => setFromPos(pos)}
              onDragOver={(e) => {
                e.preventDefault();
                if (fromPos !== null && pos !== fromPos) setOverPos(pos);
              }}
              onDragLeave={() => setOverPos((p) => (p === pos ? null : p))}
              onDrop={(event) => {
                event.preventDefault();
                if (fromPos !== null) reorder(fromPos, pos);
                setFromPos(null);
                setOverPos(null);
              }}
              onDragEnd={() => {
                setFromPos(null);
                setOverPos(null);
              }}
              className="page-cell editor-page-card editor-page-organize"
              data-deleted={del || undefined}
              data-dragging={fromPos === pos || undefined}
              data-drop-target={overPos === pos || undefined}
            >
              <PageThumb page={page} alt={`Page ${origIdx + 1}`} rotation={rot} loading="lazy" />
              <div className="editor-page-caption">
                <span>Page {origIdx + 1}</span>
                {del && <span className="editor-page-deleted">Removed</span>}
              </div>
              <div
                className="editor-page-actions"
                role="group"
                aria-label={`Page ${origIdx + 1} actions`}
              >
                <button
                  type="button"
                  onClick={(event) => reorder(pos, pos - 1, event.currentTarget)}
                  aria-label={`Move page ${origIdx + 1} up`}
                  aria-disabled={pos === 0 || undefined}
                  className="air-icon-button air-button--quiet"
                >
                  <ChevronUp aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={(event) => reorder(pos, pos + 1, event.currentTarget)}
                  aria-label={`Move page ${origIdx + 1} down`}
                  aria-disabled={pos === state.order.length - 1 || undefined}
                  className="air-icon-button air-button--quiet"
                >
                  <ChevronDown aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => rotate(origIdx)}
                  aria-label={`Rotate page ${origIdx + 1}`}
                  className="air-icon-button air-button--quiet"
                >
                  <RotateCw aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleDelete(origIdx)}
                  aria-label={`${del ? "Restore" : "Delete"} page ${origIdx + 1}`}
                  aria-pressed={del}
                  className="air-icon-button air-button--quiet editor-page-delete"
                >
                  {del ? <Undo2 aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
                </button>
              </div>
            </li>
          );
        })}
      </PageCollection>
    </>
  );
}

// ── Panel (right) ────────────────────────────────────────────────────

/** Shared family secondary action; labels may wrap with enlarged text. */
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
    <button type="button" onClick={onClick} disabled={disabled} className="air-button">
      <Icon size={16} aria-hidden="true" />
      {label}
    </button>
  );
}

export function Panel() {
  const { doc } = useEditorRead();
  const { patchToolState, applyTransform } = useEditorActions();
  const slice = useToolSlice(ORGANIZE_ID);
  const pageCount = doc?.pageCount ?? 0;
  const state = readState(slice, doc?.pages ?? []);

  const [blanks, setBlanks] = useState<number[] | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(false);

  // Apply preserves doc.id. Compare the actual bytes so a previous scan cannot
  // overwrite newer page geometry, including a same-count rotation/reorder.
  const liveBytes = useRef(doc?.bytes);
  liveBytes.current = doc?.bytes;
  useEffect(() => {
    liveBytes.current = doc?.bytes;
    setBlanks(null);
    setScanning(false);
    setScanError(false);
    return () => {
      liveBytes.current = undefined;
    };
  }, [doc?.bytes]);

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
    const scanBytes = doc.bytes;
    setScanning(true);
    setScanError(false);
    void renderThumbnailsAndScores(docToFile(doc)).then(
      ({ thumbnails, scores }) => {
        revokeThumbnails(thumbnails);
        if (liveBytes.current !== scanBytes) return;
        setScanning(false);
        setBlanks(scores.map((s, i) => (s >= BLANK_THRESHOLD ? i : -1)).filter((i) => i >= 0));
      },
      () => {
        if (liveBytes.current !== scanBytes) return;
        setScanning(false);
        setScanError(true);
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
      basePages: doc?.pages,
    });
  }, [patchToolState, pageCount, doc?.pages]);

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
    });
  }, [applyTransform, slice, pageCount]);

  return (
    <div className="editor-organize-panel">
      <p>
        Drag pages or use their arrow buttons to reorder. Your changes stay pending until you apply
        them.
      </p>

      <dl className="editor-organize-summary" aria-live="polite">
        <div>
          <dt>Pages to keep</dt>
          <dd>
            {kept.length} of {pageCount}
          </dd>
        </div>
        {rotatedCount > 0 && (
          <div>
            <dt>Rotated</dt>
            <dd>{rotatedCount}</dd>
          </div>
        )}
        {reordered && (
          <div>
            <dt>Order</dt>
            <dd>Changed</dd>
          </div>
        )}
      </dl>
      {allDeleted && (
        <p className="editor-organize-warning" role="status">
          Restore at least one page to apply your changes.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <h3>Quick actions</h3>
        <div className="editor-organize-quick">
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
          <p className="editor-organize-note" role="status">
            No blank pages found.
          </p>
        ) : (
          <QuickAction
            icon={FileX}
            label={`Delete ${blanks.length} blank page${blanks.length === 1 ? "" : "s"}`}
            onClick={markBlanks}
          />
        )}
        {scanError && (
          <p className="editor-organize-warning" role="alert">
            Could not scan these pages. Try again; your pending changes are safe.
          </p>
        )}
        <p className="editor-organize-note">
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
          <button type="button" onClick={reset} className="air-button air-button--quiet">
            Reset pending changes
          </button>
        )}
      </div>
    </div>
  );
}
