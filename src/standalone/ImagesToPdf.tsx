/**
 * Images to PDF tool.
 *
 * Accepts multiple image files (JPEG, PNG, WebP) via drag-and-drop, shows
 * previews with drag-to-reorder controls, and converts them into a single PDF.
 * Supports three page-size options: A4, Letter, and Fit-to-Image.
 * Object URLs for image previews are revoked on removal to avoid memory leaks.
 */

import { GripVertical, X } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActionButton } from "../components/ActionButton.tsx";
import { AlertBox } from "../components/AlertBox.tsx";
import { FileDropZone } from "../components/FileDropZone.tsx";
import { ProgressBar } from "../components/ProgressBar.tsx";
import { SegmentedControl } from "../components/SegmentedControl.tsx";
import { type SortMode, SortByNameButton } from "../components/SortByNameButton.tsx";
import { TouchDragOverlay } from "../components/TouchDragOverlay.tsx";
import { categoryAccent, categoryGlow } from "../config/theme.ts";
import { useAsyncProcess } from "../hooks/useAsyncProcess.ts";
import { type SortableDrag, useSortableDrag } from "../hooks/useSortableDrag.ts";
import { downloadPdf, formatFileSize, naturalCompare } from "../utils/file-helpers.ts";
import { openEditorWithFile } from "../utils/nav.ts";
import { imagesToPdf } from "../utils/pdf-operations.ts";

/** Internal representation of a queued image with its preview URL. */
interface ImageItem {
  file: File;
  id: string;
  /** Object URL for the image preview thumbnail. */
  preview: string;
}

interface ImageRowProps {
  item: ImageItem;
  slot: number;
  total: number;
  isSortActive: boolean;
  isSource: boolean;
  getItemProps: SortableDrag["getItemProps"];
  getKeyboardProps: SortableDrag["getKeyboardProps"];
  onRemove: (id: string) => void;
}

const ImageRow = memo(function ImageRow({
  item,
  slot,
  total,
  isSortActive,
  isSource,
  getItemProps,
  getKeyboardProps,
  onRemove,
}: ImageRowProps) {
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
      <img
        src={item.preview}
        alt={item.file.name}
        loading="lazy"
        decoding="async"
        className="w-12 h-12 object-cover rounded border border-slate-200 dark:border-dark-border"
        draggable={false}
      />
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

export default function ImagesToPdf() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<"a4" | "letter" | "fit">("a4");
  const [sortMode, setSortMode] = useState<SortMode>("off");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const task = useAsyncProcess();

  const displayedImages = useMemo(() => {
    if (sortMode === "off") return images;
    const sorted = [...images].sort((a, b) => naturalCompare(a.file.name, b.file.name));
    return sortMode === "desc" ? sorted.reverse() : sorted;
  }, [images, sortMode]);

  const isSortActive = sortMode !== "off";

  // Revoke all preview object URLs when the component unmounts (incl. after a
  // successful convert, which navigates to the editor). A ref holds the latest
  // images so this empty-dep cleanup doesn't capture the first-render (empty)
  // array; per-item revocation still happens in removeImage.
  const imagesRef = useRef(images);
  imagesRef.current = images;
  useEffect(
    () => () => {
      for (const item of imagesRef.current) URL.revokeObjectURL(item.preview);
    },
    [],
  );

  const handleFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    const items: ImageItem[] = imageFiles.map((f) => ({
      file: f,
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(f),
    }));
    setImages((prev) => [...prev, ...items]);
  }, []);

  /** Remove an image from the queue and revoke its object URL to free memory. */
  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const handleMove = useCallback((fromIndex: number, toSlot: number) => {
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      const adjustedSlot = fromIndex < toSlot ? toSlot - 1 : toSlot;
      next.splice(adjustedSlot, 0, moved);
      return next;
    });
  }, []);

  const drag = useSortableDrag(handleMove);

  /** Build the PDF, then hand the bytes to the chosen delivery (download
   *  for the primary CTA, the unified editor for the secondary "& edit"). */
  const runConvert = useCallback(
    async (deliver: (bytes: Uint8Array) => void) => {
      if (displayedImages.length === 0) return;
      setProgress({ done: 0, total: displayedImages.length });
      await task.run(async () => {
        const result = await imagesToPdf(
          displayedImages.map((i) => i.file),
          pageSize,
          (done, total) => setProgress({ done, total }),
        );
        deliver(result);
      }, "Failed to create PDF from images. Please try again.");
    },
    [displayedImages, pageSize, task],
  );

  const handleConvert = useCallback(
    () => runConvert((b) => downloadPdf(b, "images.pdf")),
    [runConvert],
  );

  const handleConvertAndEdit = useCallback(
    () =>
      runConvert((b) =>
        openEditorWithFile(new File([b.slice()], "images.pdf", { type: "application/pdf" })),
      ),
    [runConvert],
  );

  const isDragging = drag.dragIndex !== null;
  const dragged = drag.dragIndex !== null ? displayedImages[drag.dragIndex] : null;

  const rows: React.ReactNode[] = [];
  for (let slot = 0; slot <= displayedImages.length; slot++) {
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

    if (slot < displayedImages.length) {
      const item = displayedImages[slot];
      rows.push(
        <ImageRow
          key={item.id}
          item={item}
          slot={slot}
          total={displayedImages.length}
          isSortActive={isSortActive}
          isSource={drag.dragIndex === slot}
          getItemProps={drag.getItemProps}
          getKeyboardProps={drag.getKeyboardProps}
          onRemove={removeImage}
        />,
      );
    }
  }

  return (
    <div className="space-y-6">
      <FileDropZone
        glowColor={categoryGlow.transform}
        iconColor={categoryAccent.transform}
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        multiple
        onFiles={handleFiles}
        label="Drop images here or click to browse"
        hint="Supports JPEG, PNG, and WebP images"
      />

      {images.length > 0 && (
        <>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-dark-text-muted mb-2">
              Page Size
            </p>
            <SegmentedControl
              fullWidth
              ariaLabel="Page size"
              value={pageSize}
              onChange={setPageSize}
              options={[
                { value: "a4", label: "A4" },
                { value: "letter", label: "Letter" },
                { value: "fit", label: "Fit to Image" },
              ]}
            />
          </div>

          {images.length > 1 && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm font-medium text-slate-700 dark:text-dark-text">
                {isSortActive
                  ? "Sorted by file name"
                  : isDragging
                    ? "Drop the image at its new position"
                    : "Drag images to rearrange them"}
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
                <img
                  src={dragged.preview}
                  alt=""
                  className="w-12 h-12 object-cover rounded border border-slate-200 dark:border-dark-border"
                  draggable={false}
                />
                <p className="text-sm font-medium text-slate-700 dark:text-dark-text truncate">
                  {dragged.file.name}
                </p>
              </div>
            </TouchDragOverlay>
          )}

          {task.processing && progress.total > 1 && (
            <ProgressBar current={progress.done} total={progress.total} label="Creating PDF…" />
          )}

          <ActionButton
            onClick={handleConvert}
            processing={task.processing}
            label={
              images.length === 1
                ? "Create PDF & Download"
                : `Combine ${images.length} images & Download`
            }
            secondaryLabel={images.length === 1 ? "Create & edit" : "Combine & edit"}
            onSecondaryClick={handleConvertAndEdit}
            processingLabel="Creating PDF…"
          />
        </>
      )}

      {task.error && <AlertBox message={task.error} />}
    </div>
  );
}
