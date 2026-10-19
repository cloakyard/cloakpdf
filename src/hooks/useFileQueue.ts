import { useCallback, useMemo, useState } from "react";
import { type SortMode } from "../components/SortByNameButton.tsx";
import { naturalCompare } from "../utils/file-helpers.ts";

export interface QueuedFile {
  id: string;
  file: File;
}

/** Domain files and their manual order survive sorting and undoing a removal. */
export function useFileQueue() {
  const [items, setItems] = useState<QueuedFile[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("off");
  const [removed, setRemoved] = useState<{ item: QueuedFile; index: number } | null>(null);
  const displayed = useMemo(() => {
    if (sortMode === "off") return items;
    const sorted = [...items].sort((a, b) => naturalCompare(a.file.name, b.file.name));
    return sortMode === "desc" ? sorted.reverse() : sorted;
  }, [items, sortMode]);
  const append = useCallback((files: File[]) => {
    setItems((previous) => [
      ...previous,
      ...files.map((file) => ({ file, id: crypto.randomUUID() })),
    ]);
  }, []);
  const remove = (id: string) => {
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return;
    setRemoved({ item: items[index], index });
    setItems((previous) => previous.filter((item) => item.id !== id));
  };
  const restore = () => {
    if (!removed) return;
    setItems((previous) => {
      const next = [...previous];
      next.splice(Math.min(removed.index, next.length), 0, removed.item);
      return next;
    });
    setRemoved(null);
  };
  const move = useCallback((from: number, toSlot: number) => {
    setItems((previous) => {
      if (from < 0 || from >= previous.length || toSlot < 0 || toSlot > previous.length)
        return previous;
      const next = [...previous];
      const [item] = next.splice(from, 1);
      next.splice(from < toSlot ? toSlot - 1 : toSlot, 0, item);
      return next;
    });
  }, []);
  return { items, displayed, sortMode, setSortMode, removed, append, remove, restore, move };
}
