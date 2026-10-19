import { ArrowDown, ArrowUp, ChevronsDown, ChevronsUp, GripVertical, Undo2, X } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { type QueuedFile, type useFileQueue } from "../hooks/useFileQueue.ts";
import { useSortableDrag } from "../hooks/useSortableDrag.ts";
import { formatFileSize } from "../utils/file-helpers.ts";
import { SortByNameButton } from "./SortByNameButton.tsx";
import { TouchDragOverlay } from "./TouchDragOverlay.tsx";

type Queue = ReturnType<typeof useFileQueue>;

function FilePreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return (
    <img
      className="pdf-queue-preview"
      src={url}
      alt=""
      width={48}
      height={48}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}

/** One queue for both PDF constructors; gestures are optional, not required. */
export function FileQueue({
  queue,
  disabled = false,
  previews = false,
}: {
  queue: Queue;
  disabled?: boolean;
  previews?: boolean;
}) {
  const { displayed: items, sortMode, removed } = queue;
  const sorted = sortMode !== "off";
  const locked = disabled || sorted;
  const root = useRef<HTMLDivElement>(null);
  const undo = useRef<HTMLButtonElement>(null);
  const focusAfterChange = useRef<string | null>(null);
  const drag = useSortableDrag((from, to) => {
    if (!locked) queue.move(from, to);
  });
  const dragging = !locked && drag.dragIndex !== null;
  const dragged = dragging ? items[drag.dragIndex!] : null;
  useEffect(() => {
    const target = focusAfterChange.current;
    if (!target) return;
    if (target === "undo") undo.current?.focus();
    else
      root.current
        ?.querySelector<HTMLButtonElement>(
          `[data-file-id="${target}"] button:not(:disabled):not([aria-disabled="true"])`,
        )
        ?.focus();
    focusAfterChange.current = null;
  }, [items, removed]);
  const move = (item: QueuedFile, from: number, to: number) => {
    if (locked) return;
    queue.move(from, to);
    drag.setLiveMessage(
      `${item.file.name} moved to position ${to > from ? to : to + 1} of ${items.length}.`,
    );
  };
  const slot = (index: number) => {
    const adjacent = index === drag.dragIndex || index === (drag.dragIndex ?? -2) + 1;
    return (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- optional drag target; explicit moves below
      <div
        data-drop-slot={index}
        className="pdf-queue-slot"
        data-open={(dragging && !adjacent) || undefined}
        data-active={(dragging && drag.dragOverSlot === index) || undefined}
        onDragOver={(event) => {
          if (locked || adjacent || drag.dragIndex === null) return;
          event.preventDefault();
          drag.setDragOverSlot(index);
        }}
        onDragLeave={() => {
          if (drag.dragOverSlot === index) drag.setDragOverSlot(null);
        }}
        onDrop={(event) => {
          if (locked || adjacent || drag.dragIndex === null) return;
          event.preventDefault();
          move(items[drag.dragIndex], drag.dragIndex, index);
          drag.setDragIndex(null);
          drag.setDragOverSlot(null);
        }}
      >
        <span />
      </div>
    );
  };
  return (
    <div className="pdf-file-queue" ref={root}>
      {items.length > 0 && (
        <>
          <div className="air-collection-heading">
            <h2>
              File order <span className="air-collection-count">{items.length}</span>
            </h2>
            {items.length > 1 && (
              <SortByNameButton mode={sortMode} onChange={queue.setSortMode} disabled={disabled} />
            )}
          </div>
          <p className="air-help">
            {sorted
              ? "Sorted by file name. Choose None to rearrange files manually."
              : "Use the move buttons or drag the handle. Files are combined in this order."}
          </p>
          <div className="air-collection-list" role="list" aria-label="Files to combine">
            {items.map((item, index) => (
              <Fragment key={item.id}>
                {slot(index)}
                <div
                  role="listitem"
                  className="pdf-queue-row"
                  data-file-id={item.id}
                  data-dragging={(dragging && drag.dragIndex === index) || undefined}
                >
                  <div className="pdf-queue-identity">
                    <button
                      type="button"
                      className="air-icon-button air-button--quiet pdf-queue-grip"
                      {...(!locked ? drag.getItemProps(index) : {})}
                      {...(!locked
                        ? drag.getKeyboardProps(index, items.length, item.file.name)
                        : {})}
                      disabled={locked}
                      aria-label={
                        locked
                          ? `Reorder ${item.file.name}`
                          : `${item.file.name}. Position ${index + 1} of ${items.length}. Use arrow keys, Home or End to move.`
                      }
                    >
                      <GripVertical size={18} strokeWidth={1.6} aria-hidden="true" />
                    </button>
                    <span className="pdf-queue-number" aria-hidden="true">
                      {index + 1}
                    </span>
                    {previews && <FilePreview file={item.file} />}
                    <div className="air-collection-name">
                      <p>{item.file.name}</p>
                      <span className="air-help">{formatFileSize(item.file.size)}</span>
                    </div>
                  </div>
                  <div className="air-collection-row-actions pdf-queue-row-actions">
                    {(
                      [
                        [ChevronsUp, "Move to start", 0, index === 0],
                        [ArrowUp, "Move up", index - 1, index === 0],
                        [ArrowDown, "Move down", index + 2, index === items.length - 1],
                        [ChevronsDown, "Move to end", items.length, index === items.length - 1],
                      ] as const
                    ).map(([Icon, label, to, boundary]) => (
                      <button
                        key={label}
                        type="button"
                        className="air-icon-button air-button--quiet"
                        aria-label={`${label}: ${item.file.name}`}
                        aria-disabled={locked || boundary || undefined}
                        onClick={() => {
                          if (!locked && !boundary) move(item, index, to);
                        }}
                      >
                        <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
                      </button>
                    ))}
                    <button
                      type="button"
                      className="air-icon-button air-button--quiet"
                      disabled={disabled}
                      aria-label={`Remove ${item.file.name}`}
                      onClick={() => {
                        focusAfterChange.current = "undo";
                        queue.remove(item.id);
                        drag.setLiveMessage(`${item.file.name} removed. Undo is available.`);
                      }}
                    >
                      <X size={18} strokeWidth={1.6} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </Fragment>
            ))}
            {slot(items.length)}
          </div>
        </>
      )}
      {removed && (
        <div className="air-file-selection pdf-queue-undo">
          <div>
            <p>Removed {removed.item.file.name}</p>
          </div>
          <button
            ref={undo}
            type="button"
            className="air-button"
            disabled={disabled}
            onClick={() => {
              focusAfterChange.current = removed.item.id;
              drag.setLiveMessage(`${removed.item.file.name} restored.`);
              queue.restore();
            }}
          >
            <Undo2 size={16} strokeWidth={1.6} aria-hidden="true" />
            Undo removal
          </button>
        </div>
      )}
      <span className="sr-only" role="status">
        {drag.liveMessage}
      </span>
      {dragged && drag.touchPos && (
        <TouchDragOverlay touchPos={drag.touchPos}>
          <div className="pdf-queue-ghost">{dragged.file.name}</div>
        </TouchDragOverlay>
      )}
    </div>
  );
}
