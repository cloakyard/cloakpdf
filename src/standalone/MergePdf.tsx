/**
 * Merge PDFs tool.
 *
 * Lets the user drop multiple PDF files, reorder them by drag-and-drop
 * (pointer + touch, with a keyboard-accessible grip handle), and merge them
 * into a single downloaded PDF. Files are stored locally with unique IDs for
 * stable list keys. The drag interaction mirrors the Images→PDF tool via the
 * shared `useSortableDrag` hook.
 */

import { GripVertical, X } from "lucide-react";
import { memo, type ReactNode, useCallback, useMemo, useState } from "react";
import { ActionButton } from "../components/ActionButton.tsx";
import { AlertBox } from "../components/AlertBox.tsx";
import { FileDropZone } from "../components/FileDropZone.tsx";
import { type SortMode, SortByNameButton } from "../components/SortByNameButton.tsx";
import { TouchDragOverlay } from "../components/TouchDragOverlay.tsx";
import { categoryAccent, categoryGlow } from "../config/theme.ts";
import { useAsyncProcess } from "../hooks/useAsyncProcess.ts";
import { type SortableDrag, useSortableDrag } from "../hooks/useSortableDrag.ts";
import { downloadPdf, formatFileSize, naturalCompare } from "../utils/file-helpers.ts";
import { openEditorWithFile } from "../utils/nav.ts";
import { mergePdfs } from "../utils/pdf-operations.ts";
import { isPdfEncrypted } from "../utils/pdf-security.ts";

/** Internal representation of a queued PDF file. */
interface FileItem {
  file: File;
  id: string;
}

interface FileRowProps {
  item: FileItem;
  slot: number;
  total: number;
  isSortActive: boolean;
  isSource: boolean;
  getItemProps: SortableDrag["getItemProps"];
  getKeyboardProps: SortableDrag["getKeyboardProps"];
  onRemove: (id: string) => void;
}

const FileRow = memo(function FileRow({
  item,
  slot,
  total,
  isSortActive,
  isSource,
  getItemProps,
  getKeyboardProps,
  onRemove,
}: FileRowProps) {
  return (
    <div
      {...(isSortActive ? {} : getItemProps(slot))}
      className={`flex items-center gap-3 px-4 py-3 select-none transition-[transform,opacity,color,background-color,border-color,box-shadow] duration-200 ${
        isSortActive ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      } ${isSource ? "scale-95 opacity-30" : "scale-100 opacity-100"}`}
    >
      {isSortActive ? (
        <GripVertical className="w-4 h-4 shrink-0 text-slate-200 dark:text-dark-border opacity-50" />
      ) : (
        // Keyboard-accessible reorder handle (drag alone has no keyboard path).
        // The grip is its own button so the row's nested Remove button isn't
        // wrapped in a second interactive element.
        <button
          type="button"
          {...getKeyboardProps(slot, total, item.file.name)}
          className="shrink-0 -m-1 p-1 rounded text-slate-300 dark:text-dark-text-muted cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <GripVertical className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
      <span className="w-7 h-7 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium shrink-0 tabular-nums">
        {slot + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 dark:text-dark-text truncate">
          {item.file.name}
        </p>
        <p className="text-xs text-slate-500 dark:text-dark-text-muted tabular-nums">
          {formatFileSize(item.file.size)}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.id);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="p-2.5 min-w-11 min-h-11 flex items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        aria-label={`Remove ${item.file.name}`}
      >
        <X className="w-4 h-4 text-slate-500 dark:text-dark-text-muted hover:text-red-500" />
      </button>
    </div>
  );
});

export default function MergePdf() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("off");
  const [encryptedFile, setEncryptedFile] = useState<File | null>(null);
  const task = useAsyncProcess();

  /**
   * Files in the order shown to the user. Sorting derives a view without
   * mutating `files`, so toggling the sort back to "off" restores the
   * original drop order.
   */
  const displayedFiles = useMemo(() => {
    if (sortMode === "off") return files;
    const sorted = [...files].sort((a, b) => naturalCompare(a.file.name, b.file.name));
    return sortMode === "desc" ? sorted.reverse() : sorted;
  }, [files, sortMode]);

  const isSortActive = sortMode !== "off";

  const handleFiles = useCallback(async (newFiles: File[]) => {
    const pdfs = newFiles.filter((f) => f.type === "application/pdf");
    // Surface the first encrypted file as the blocker — mirroring how
    // each single-PDF tool gates on encryption. The user fixes that one
    // with PDF Password, then re-drops it alongside the rest.
    for (const pdf of pdfs) {
      if (await isPdfEncrypted(pdf)) {
        setEncryptedFile(pdf);
        return;
      }
    }
    setEncryptedFile(null);
    const items = pdfs.map((f) => ({ file: f, id: crypto.randomUUID() }));
    setFiles((prev) => [...prev, ...items]);
  }, []);

  const clearEncrypted = useCallback(() => setEncryptedFile(null), []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  /** Reorder a file from `fromIndex` to the drop `toSlot` (insertion index). */
  const handleMove = useCallback((fromIndex: number, toSlot: number) => {
    setFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      const adjustedSlot = fromIndex < toSlot ? toSlot - 1 : toSlot;
      next.splice(adjustedSlot, 0, moved);
      return next;
    });
  }, []);

  const drag = useSortableDrag(handleMove);

  /** Run the merge, then hand the bytes to the chosen delivery (download
   *  for the primary CTA, the unified editor for the secondary "& edit"). */
  const runMerge = useCallback(
    async (deliver: (bytes: Uint8Array) => void) => {
      if (displayedFiles.length < 2) return;
      await task.run(async () => {
        const result = await mergePdfs(displayedFiles.map((f) => f.file));
        deliver(result);
      }, "Failed to merge PDFs. Please check your files and try again.");
    },
    [displayedFiles, task],
  );

  const handleMerge = useCallback(() => runMerge((b) => downloadPdf(b, "merged.pdf")), [runMerge]);

  const handleMergeAndEdit = useCallback(
    () =>
      runMerge((b) =>
        openEditorWithFile(new File([b.slice()], "merged.pdf", { type: "application/pdf" })),
      ),
    [runMerge],
  );

  const isDragging = drag.dragIndex !== null;
  const dragged = drag.dragIndex !== null ? displayedFiles[drag.dragIndex] : null;

  // Interleave drop-zone slots with the rows: slot N sits above row N, and a
  // trailing slot sits after the last row. Slots collapse to 0 height unless a
  // drag is active, then they open to receive the dropped file.
  const rows: ReactNode[] = [];
  for (let slot = 0; slot <= displayedFiles.length; slot++) {
    const isAdjacentToDrag =
      drag.dragIndex !== null && (slot === drag.dragIndex || slot === drag.dragIndex + 1);
    const isActiveDrop = drag.dragOverSlot === slot;

    rows.push(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- HTML5 drop target
      <div
        key={`drop-${slot}`}
        data-drop-slot={slot}
        onDragOver={(e) => {
          if (isAdjacentToDrag || isSortActive) return;
          e.preventDefault();
          drag.setDragOverSlot(slot);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            if (drag.dragOverSlot === slot) drag.setDragOverSlot(null);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (drag.dragIndex === null || isAdjacentToDrag || isSortActive) return;
          handleMove(drag.dragIndex, slot);
          drag.setDragIndex(null);
          drag.setDragOverSlot(null);
        }}
        className={`flex items-center px-4 transition-[transform,opacity,color,background-color,border-color,box-shadow] duration-200 ${
          isDragging && !isAdjacentToDrag ? (isActiveDrop ? "h-10" : "h-2") : "h-0"
        }`}
      >
        {isDragging && !isAdjacentToDrag && (
          <div
            className={`w-full rounded-full transition-[transform,opacity,color,background-color,border-color,box-shadow] duration-200 ${
              isActiveDrop ? "h-1 bg-primary-500" : "h-0.5 bg-primary-200 dark:bg-primary-800"
            }`}
          />
        )}
      </div>,
    );

    if (slot < displayedFiles.length) {
      const item = displayedFiles[slot];
      rows.push(
        <FileRow
          key={item.id}
          item={item}
          slot={slot}
          total={displayedFiles.length}
          isSortActive={isSortActive}
          isSource={drag.dragIndex === slot}
          getItemProps={drag.getItemProps}
          getKeyboardProps={drag.getKeyboardProps}
          onRemove={removeFile}
        />,
      );
    }
  }

  return (
    <div className="space-y-6">
      <FileDropZone
        glowColor={categoryGlow.organise}
        iconColor={categoryAccent.organise}
        accept=".pdf,application/pdf"
        multiple
        onFiles={handleFiles}
        encryptedFile={encryptedFile}
        onClearEncrypted={clearEncrypted}
        label="Drop PDF files here or click to browse"
        hint="Select 2 or more PDF files to merge"
      />

      {files.length > 0 && (
        <>
          {files.length > 1 && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm font-medium text-slate-700 dark:text-dark-text">
                {isSortActive
                  ? "Sorted by file name"
                  : isDragging
                    ? "Drop the file at its new position"
                    : "Drag files to rearrange them"}
              </p>
              <SortByNameButton mode={sortMode} onChange={setSortMode} />
            </div>
          )}

          <div className="bg-white dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border overflow-hidden">
            {rows}
          </div>

          <div aria-live="polite" className="sr-only">
            {drag.liveMessage}
          </div>

          {dragged && drag.dragIndex !== null && drag.touchPos !== null && (
            <TouchDragOverlay touchPos={drag.touchPos}>
              <div className="bg-white dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border shadow-lg px-4 py-3 flex items-center gap-3 min-w-65 max-w-80">
                <span className="w-7 h-7 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                  {drag.dragIndex + 1}
                </span>
                <p className="text-sm font-medium text-slate-700 dark:text-dark-text truncate">
                  {dragged.file.name}
                </p>
              </div>
            </TouchDragOverlay>
          )}
        </>
      )}

      {displayedFiles.length >= 2 && (
        <ActionButton
          onClick={handleMerge}
          processing={task.processing}
          label={`Merge ${displayedFiles.length} files & Download`}
          processingLabel="Merging…"
          secondaryLabel="Merge & edit"
          onSecondaryClick={handleMergeAndEdit}
        />
      )}

      {task.error && <AlertBox message={task.error} />}
    </div>
  );
}
