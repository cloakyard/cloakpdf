// history.ts — Linear undo/redo for the canvas editor.
//
// CRITICAL DIVERGENCE FROM CLOAKIMG: entries are NOT rendered page rasters.
// CloakIMG snapshots a full canvas bitmap per commit, which is fine for one
// image but would blow memory on a 50-page PDF. Each entry here holds the
// cheap, serializable doc state — `bytes` (by reference for overlay-only
// edits, a fresh array only after a true byte transform), the page-meta list,
// and the overlay objects. Rasters are re-derived from the renderer on demand.

import type { CanvasObject, PageMeta } from "./doc.ts";

export interface HistoryEntry {
  label: string;
  bytes: Uint8Array;
  pages: PageMeta[];
  objects: CanvasObject[];
}

/** Ref-held by EditorContext so commits don't trigger re-renders directly; a
 *  version counter notifies subscribers instead (mirrors CloakIMG's pattern). */
export class EditorHistory {
  private stack: HistoryEntry[] = [];
  private cursor = -1;
  private readonly cap: number;
  private onEvict: ((entries: HistoryEntry[]) => void) | null = null;

  constructor(cap = 40) {
    this.cap = cap;
  }

  /** Register a sink for entries that drop off the stack (redo-tail discard,
   *  cap-trim, clear). Entries hold page thumbnails as blob: URLs; the sink
   *  revokes the ones no longer reachable. It MUST diff against {@link thumbUrls}
   *  — overlay-only commits share one `pages` array by reference, so a dropped
   *  entry's URL may still belong to a surviving one. */
  setOnEvict(fn: (entries: HistoryEntry[]) => void): void {
    this.onEvict = fn;
  }

  private emitEvict(entries: HistoryEntry[]): void {
    if (entries.length > 0) this.onEvict?.(entries);
  }

  /** Distinct, non-null page thumbnail URLs referenced by entries currently on
   *  the stack — the live set the evict sink keeps; everything else is freeable. */
  thumbUrls(): string[] {
    const urls = new Set<string>();
    for (const e of this.stack) for (const p of e.pages) if (p.thumbUrl) urls.add(p.thumbUrl);
    return [...urls];
  }

  clear(): void {
    const dropped = this.stack;
    this.stack = [];
    this.cursor = -1;
    this.emitEvict(dropped);
  }

  /** Push a new entry, discarding any redo tail above the cursor and trimming
   *  the oldest entries past the cap (cursor follows the trim). Dropped entries
   *  are handed to the evict sink so their thumbnails can be revoked. */
  push(entry: HistoryEntry): void {
    const redoTail = this.stack.slice(this.cursor + 1);
    this.stack = this.stack.slice(0, this.cursor + 1);
    this.stack.push(entry);
    let trimmed: HistoryEntry[] = [];
    if (this.stack.length > this.cap) {
      const overflow = this.stack.length - this.cap;
      trimmed = this.stack.slice(0, overflow);
      this.stack = this.stack.slice(overflow);
    }
    this.cursor = this.stack.length - 1;
    this.emitEvict([...redoTail, ...trimmed]);
  }

  current(): HistoryEntry | null {
    return this.stack[this.cursor] ?? null;
  }

  base(): HistoryEntry | null {
    return this.stack[0] ?? null;
  }

  index(): number {
    return this.cursor;
  }

  size(): number {
    return this.stack.length;
  }

  canUndo(): boolean {
    return this.cursor > 0;
  }

  canRedo(): boolean {
    return this.cursor < this.stack.length - 1;
  }

  undo(): HistoryEntry | null {
    if (!this.canUndo()) return null;
    this.cursor -= 1;
    return this.current();
  }

  redo(): HistoryEntry | null {
    if (!this.canRedo()) return null;
    this.cursor += 1;
    return this.current();
  }

  /** Hard reset: discard every entry except the base (index 0) and park the
   *  cursor there, so there's no undo/redo back to the discarded edits. Only the
   *  dropped entries are evicted, so the base's thumbnails survive (they'd be
   *  wrongly revoked if we `clear()`-then-re-pushed the base). */
  resetToBase(): HistoryEntry | null {
    if (this.stack.length === 0) return null;
    const base = this.stack[0];
    const dropped = this.stack.slice(1);
    this.stack = [base];
    this.cursor = 0;
    this.emitEvict(dropped);
    return base;
  }

  /** Move the cursor to an absolute index (clamped) and return that entry. */
  jumpTo(index: number): HistoryEntry | null {
    if (this.stack.length === 0) return null;
    this.cursor = Math.max(0, Math.min(index, this.stack.length - 1));
    return this.current();
  }

  labels(): string[] {
    return this.stack.map((e) => e.label);
  }
}
