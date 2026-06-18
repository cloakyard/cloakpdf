// draft-store.ts — Crash/navigation-safe autosave for the canvas editor.
//
// The editor is non-destructive: edits live as `bytes` + overlay `objects` in
// memory and are gone the moment the tab closes or the user navigates home —
// the classic unsaved-work-on-unmount risk. This store persists the LIVE document (current bytes +
// overlay objects) to IndexedDB, debounced, so an accidental unmount doesn't
// destroy unsaved work. On reopening the same source PDF — or landing on the
// empty editor — the draft is offered back.
//
// Keyed by the SHA-256 of the ORIGINAL loaded bytes (stable across transforms),
// so re-dropping the same file finds its draft. Mirrors the RAG index cache
// idiom in src/rag/persistence.ts: singleton connection, readwrite tx wrapped
// in a Promise, LRU eviction by `savedAt`, best-effort writes, graceful null
// when IndexedDB is unavailable (Safari private mode).

import type { CanvasObject } from "./doc.ts";

const DB_NAME = "cloakpdf-editor";
//   v1: initial editor draft autosave store.
const DB_VERSION = 1;
const STORE_NAME = "drafts";
// Keep a few recent drafts so switching between a couple of files doesn't lose
// either; small because each holds full PDF bytes.
const MAX_DRAFTS = 5;

/** A persisted snapshot of the live editor document. */
export interface EditorDraft {
  /** SHA-256 of the ORIGINAL loaded bytes — stable across byte transforms. */
  key: string;
  fileName: string;
  /** Live (possibly transformed) document bytes. */
  bytes: Uint8Array;
  /** Non-destructive overlay marks not yet burned into the bytes. */
  objects: CanvasObject[];
  /** Epoch millis of the save — drives the LRU index and the restore label. */
  savedAt: number;
}

let _dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME);
      }
      const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
      store.createIndex("savedAt", "savedAt");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
  return _dbPromise;
}

/** Persist (or overwrite) a draft. Best-effort; failures are swallowed so a
 *  full disk never breaks editing. Evicts the oldest drafts past the cap. */
export async function saveDraft(draft: EditorDraft): Promise<void> {
  const db = await openDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(draft);
      tx.oncomplete = () => {
        void evictOld();
        resolve();
      };
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/** Fetch the draft for `key`, or null on miss / when IDB is unavailable. */
export async function loadDraft(key: string): Promise<EditorDraft | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve((req.result as EditorDraft | undefined) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** Drop the draft for `key` (after it's been restored or explicitly discarded). */
export async function deleteDraft(key: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function evictOld(): Promise<void> {
  const db = await openDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const os = tx.objectStore(STORE_NAME);
      const countReq = os.count();
      countReq.onsuccess = () => {
        const excess = countReq.result - MAX_DRAFTS;
        if (excess <= 0) {
          resolve();
          return;
        }
        // Oldest-first cursor on savedAt; delete until back under the cap.
        const cursorReq = os.index("savedAt").openCursor();
        let removed = 0;
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (!cursor || removed >= excess) {
            resolve();
            return;
          }
          cursor.delete();
          removed += 1;
          cursor.continue();
        };
        cursorReq.onerror = () => resolve();
      };
      countReq.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/** Hex SHA-256 of the bytes — the draft key. Copies into a tight ArrayBuffer so
 *  a typed-array view (non-zero byteOffset) never reaches SubtleCrypto. */
export async function hashDocBytes(bytes: Uint8Array): Promise<string> {
  const buf = bytes.slice().buffer;
  const hash = await crypto.subtle.digest("SHA-256", buf);
  const view = new Uint8Array(hash);
  let hex = "";
  for (let i = 0; i < view.length; i++) hex += view[i].toString(16).padStart(2, "0");
  return hex;
}
