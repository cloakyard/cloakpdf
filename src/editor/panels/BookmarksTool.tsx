// Outline drafts survive tool/viewport changes and belong to one byte revision.
import { AlertTriangle, ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Select } from "../../components/Select.tsx";
import { addPdfBookmarks } from "../../utils/pdf-operations.ts";
import { detectHeadings, extractLayout } from "../../utils/layout-extract.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { PrimaryAction } from "./PrimaryAction.tsx";

const TOOL_ID = "add-bookmarks";
interface Row {
  id: string;
  title: string;
  page: string;
  level: string;
}
const newRow = (page: number): Row => ({
  id: crypto.randomUUID(),
  title: "",
  page: String(page),
  level: "1",
});
const LEVELS = [
  { value: "1", label: "Level 1" },
  { value: "2", label: "Level 2" },
  { value: "3", label: "Level 3" },
];

export function Panel() {
  const { doc, selectedPage, busyLabel } = useEditorRead();
  const { applyTransform, patchToolState } = useEditorActions();
  const slice = useToolSlice(TOOL_ID);
  const [initial] = useState(() => [newRow(1)]);
  const currentDraft = slice.sourceBytes === doc?.bytes;
  const rows = currentDraft ? ((slice.rows as Row[]) ?? initial) : initial;
  const contentsPage = currentDraft && slice.contentsPage === true;
  const restoreRows = currentDraft ? (slice.restoreRows as Row[] | undefined) : undefined;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [note, setNote] = useState({ text: "", failed: false });
  const [detecting, setDetecting] = useState(false);
  const [progress, setProgress] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);
  const request = useRef<AbortController | null>(null);
  const applying = useRef(false);
  const current = useRef(doc);
  current.current = doc;
  const panel = useRef<HTMLDivElement>(null);
  const detectButton = useRef<HTMLButtonElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const focusRow = useRef<string | null>(null);
  const busy = !!busyLabel;
  const blocked = busy || detecting;
  const pageCount = doc?.pageCount ?? 1;
  const pendingObjects = doc?.objects.some((o) => o.kind !== "redaction" && o.kind !== "erase");
  const blockedContents = contentsPage && pendingObjects;
  const setDraft = (
    next: Partial<{ rows: Row[]; contentsPage: boolean; restoreRows: Row[] | undefined }>,
  ) => {
    setSaveFailed(false);
    patchToolState(TOOL_ID, { sourceBytes: doc?.bytes, rows, contentsPage, restoreRows, ...next });
  };
  const update = (id: string, patch: Partial<Row>) =>
    setDraft({ rows: rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const pageError = (value: string) => {
    const n = Number(value);
    return !value.trim() || !Number.isInteger(n) || n < 1 || n > pageCount
      ? `Enter a whole page number from 1 to ${pageCount}.`
      : "";
  };
  useLayoutEffect(() => {
    if (!focusRow.current) return;
    panel.current
      ?.querySelector<HTMLInputElement>(`[id="bookmark-title-${focusRow.current}"]`)
      ?.focus();
    focusRow.current = null;
  }, [rows]);
  useEffect(() => {
    setDetecting(false);
    setProgress("");
    setNote({ text: "", failed: false });
    setErrors({});
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [doc?.id, doc?.bytes, doc?.objects, busyLabel]);

  const autoDetect = async () => {
    if (!doc || busy || request.current || doc.objects.length) return;
    const controller = new AbortController();
    request.current = controller;
    setDetecting(true);
    setNote({ text: "", failed: false });
    setProgress("Reading document headings…");
    const ownsRequest = () =>
      !controller.signal.aborted &&
      request.current === controller &&
      current.current?.id === doc.id &&
      current.current?.bytes === doc.bytes &&
      current.current?.objects === doc.objects;
    try {
      const pages = await extractLayout(docToFile(doc), {
        ocr: true,
        signal: controller.signal,
        onOcrPage: (done, total) => {
          if (ownsRequest()) setProgress(`Reading scanned pages… (${done}/${total})`);
        },
      });
      if (!ownsRequest()) return;
      const headings = detectHeadings(pages);
      if (headings.length) {
        setDraft({
          restoreRows: rows,
          rows: headings.map((h) => ({
            ...newRow(h.pageNumber),
            title: h.text,
            level: String(h.level),
          })),
        });
        setErrors({});
      }
      setNote({
        text: headings.length
          ? `Found ${headings.length} headings. Review their titles, pages and nesting before applying.`
          : "No headings found. Your draft is unchanged; add bookmarks manually.",
        failed: false,
      });
    } catch {
      if (ownsRequest())
        setNote({
          text: "Couldn't detect headings. Your draft is unchanged. Try again or add bookmarks manually.",
          failed: true,
        });
    } finally {
      if (ownsRequest()) {
        request.current = null;
        setDetecting(false);
        setProgress("");
      }
    }
  };

  const apply = async () => {
    if (!doc || blocked || blockedContents || applying.current || !rows.length) return;
    const nextErrors: Record<string, string> = {};
    for (const row of rows) {
      if (!row.title.trim())
        nextErrors[`title-${row.id}`] = "Enter a bookmark title or remove this row.";
      const error = pageError(row.page);
      if (error) nextErrors[`page-${row.id}`] = error;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      panel.current
        ?.querySelector<HTMLInputElement>(`[id="bookmark-${Object.keys(nextErrors)[0]}"]`)
        ?.focus();
      throw new Error("Review the highlighted bookmark fields.");
    }
    applying.current = true;
    setSaveFailed(false);
    try {
      await applyTransform(async (d) => {
        if (contentsPage && d.objects.length)
          throw new Error("Apply pending marks before adding contents pages.");
        return {
          bytes: await addPdfBookmarks(
            docToFile(d),
            rows.map((r) => ({
              title: r.title.trim(),
              pageIndex: Number(r.page) - 1,
              level: Number(r.level),
            })),
            { contentsPage },
          ),
          label: contentsPage ? "Add bookmarks and contents pages" : "Add bookmarks",
        };
      });
      // Retire the applied draft so Undo cannot resurrect and reapply it.
      patchToolState(TOOL_ID, {
        sourceBytes: undefined,
        rows: undefined,
        contentsPage: undefined,
        restoreRows: undefined,
      });
    } catch (error) {
      setSaveFailed(true);
      throw error;
    } finally {
      applying.current = false;
    }
  };

  return (
    <div ref={panel} className="pdf-mark-panel pdf-bookmarks-panel">
      <section aria-label="Find headings">
        <p>Add named bookmarks that show in the viewer's outline.</p>
        <button
          type="button"
          className="air-button"
          aria-disabled={busy || detecting || !!doc?.objects.length}
          aria-busy={detecting}
          ref={detectButton}
          onClick={() => void autoDetect()}
        >
          <span className="air-action-labels">
            <span data-active={!detecting || undefined} aria-hidden={detecting}>
              Auto-detect headings
            </span>
            <span data-active={detecting || undefined} aria-hidden={!detecting}>
              Detecting headings…
            </span>
          </span>
        </button>
        <p className="air-help">
          Replaces this draft. Layout and OCR data may download on first use; your PDF stays local.
        </p>
        {!!doc?.objects.length && (
          <p className="air-help">Apply pending marks in their tools before detecting headings.</p>
        )}
        {detecting && (
          <button
            type="button"
            className="air-button air-button--quiet"
            onClick={() => {
              request.current?.abort();
              request.current = null;
              setDetecting(false);
              setProgress("");
              setNote({ text: "Detection cancelled. Your draft is unchanged.", failed: false });
              detectButton.current?.focus();
            }}
          >
            Cancel detection
          </button>
        )}
        <p
          role={note.failed ? "alert" : "status"}
          className={note.failed ? "air-notice air-notice--error" : "air-help"}
        >
          {note.failed && <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />}
          <span>{progress || note.text}</span>
        </p>
      </section>
      <section aria-label="Bookmark draft">
        {!rows.length && (
          <p className="air-help">
            No bookmarks in this draft. Add a page or detect headings to begin.
          </p>
        )}
        {rows.map((row, index) => (
          <fieldset
            className="pdf-bookmark-row"
            aria-label={`Bookmark ${index + 1}`}
            key={row.id}
            disabled={blocked}
          >
            <legend>
              <span>Bookmark {index + 1}</span>
              <span className="pdf-bookmark-actions">
                {(
                  [
                    [-1, ArrowUp, "up"],
                    [1, ArrowDown, "down"],
                  ] as const
                ).map(([direction, Icon, label]) => (
                  <button
                    key={direction}
                    type="button"
                    className="air-button air-icon-button air-button--quiet"
                    disabled={blocked}
                    aria-label={`Move bookmark ${index + 1} ${label}`}
                    aria-disabled={index + direction < 0 || index + direction >= rows.length}
                    onClick={() => {
                      const to = index + direction;
                      if (to < 0 || to >= rows.length) return;
                      const next = [...rows];
                      [next[index], next[to]] = [next[to], next[index]];
                      setDraft({ rows: next });
                      setNote({ text: `Moved bookmark to position ${to + 1}.`, failed: false });
                    }}
                  >
                    <Icon size={16} aria-hidden="true" />
                  </button>
                ))}
                <button
                  type="button"
                  className="air-button air-icon-button air-button--quiet"
                  disabled={blocked}
                  aria-label={`Remove bookmark ${index + 1}`}
                  onClick={() => {
                    setDraft({ restoreRows: rows, rows: rows.filter((r) => r.id !== row.id) });
                    addButton.current?.focus();
                    setNote({
                      text: "Bookmark removed from the draft. Restore previous list to undo.",
                      failed: false,
                    });
                  }}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </span>
            </legend>
            <div className="pdf-property-field">
              <label className="air-label" htmlFor={`bookmark-title-${row.id}`}>
                Title
              </label>
              <input
                className="air-field"
                id={`bookmark-title-${row.id}`}
                aria-label="Bookmark title"
                placeholder="Bookmark title"
                autoComplete="off"
                value={row.title}
                onChange={(e) => update(row.id, { title: e.target.value })}
                onBlur={() =>
                  setErrors((s) => ({
                    ...s,
                    [`title-${row.id}`]: row.title.trim()
                      ? ""
                      : "Enter a bookmark title or remove this row.",
                  }))
                }
                aria-invalid={!!errors[`title-${row.id}`]}
                aria-describedby={errors[`title-${row.id}`] ? `title-error-${row.id}` : undefined}
              />
              {errors[`title-${row.id}`] && (
                <p className="air-help air-help--error" id={`title-error-${row.id}`}>
                  {errors[`title-${row.id}`]}
                </p>
              )}
            </div>
            <div className="pdf-bookmark-target">
              <div className="pdf-property-field">
                <label className="air-label" htmlFor={`bookmark-page-${row.id}`}>
                  Target page
                </label>
                <input
                  className="air-field"
                  id={`bookmark-page-${row.id}`}
                  aria-label="Target page"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={pageCount}
                  step={1}
                  value={row.page}
                  onChange={(e) => update(row.id, { page: e.target.value })}
                  onBlur={() =>
                    setErrors((s) => ({ ...s, [`page-${row.id}`]: pageError(row.page) }))
                  }
                  aria-invalid={!!errors[`page-${row.id}`]}
                  aria-describedby={errors[`page-${row.id}`] ? `page-error-${row.id}` : undefined}
                />
                {errors[`page-${row.id}`] && (
                  <p className="air-help air-help--error" id={`page-error-${row.id}`}>
                    {errors[`page-${row.id}`]}
                  </p>
                )}
              </div>
              <div className="pdf-property-field">
                <label className="air-label" htmlFor={`bookmark-level-${row.id}`}>
                  Nesting
                </label>
                <Select
                  id={`bookmark-level-${row.id}`}
                  ariaLabel={`Nesting for bookmark ${index + 1}`}
                  value={row.level}
                  options={LEVELS}
                  disabled={blocked}
                  onChange={(level) => update(row.id, { level })}
                />
              </div>
            </div>
          </fieldset>
        ))}
        <button
          ref={addButton}
          type="button"
          className="air-button"
          disabled={blocked}
          onClick={() => {
            const row = newRow(selectedPage + 1);
            focusRow.current = row.id;
            setDraft({ rows: [...rows, row] });
          }}
        >
          <Plus size={16} aria-hidden="true" />
          Add current page (page {selectedPage + 1})
        </button>
        {restoreRows && (
          <button
            type="button"
            className="air-button air-button--quiet"
            disabled={blocked}
            onClick={() => {
              setDraft({ rows: restoreRows, restoreRows: rows });
              setErrors({});
              setNote({ text: "Previous bookmark list restored.", failed: false });
            }}
          >
            Restore previous list
          </button>
        )}
        <p className="air-help">
          Levels 2 and 3 nest beneath the preceding higher level. Targets use current PDF page
          numbers.
        </p>
      </section>
      <section aria-label="Apply bookmarks">
        <label className="air-check-label">
          <input
            className="air-check"
            type="checkbox"
            checked={contentsPage}
            disabled={blocked}
            onChange={(e) => setDraft({ contentsPage: e.target.checked })}
          />
          <span>Add a contents page</span>
        </label>
        <p className="air-help">
          Adds linked pages at the front. Printed titles may be shortened or use “?” for unsupported
          characters; outline titles stay complete.
        </p>
        {blockedContents && (
          <p className="air-notice air-notice--warning">
            <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />
            Apply pending annotations, signatures or codes in their tools before adding contents
            pages. Your draft will stay here.
          </p>
        )}
        <p
          role={saveFailed ? "alert" : "status"}
          className={saveFailed ? "air-notice air-notice--error" : "air-help"}
        >
          {saveFailed && <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />}
          <span>
            {saveFailed
              ? "Couldn't add bookmarks. Your PDF and draft are unchanged. Try applying again."
              : ""}
          </span>
        </p>
        <p className="air-help">
          Applying replaces existing bookmarks. Undo restores the previous PDF.
        </p>
        <PrimaryAction
          label={`Add ${rows.length} bookmark${rows.length === 1 ? "" : "s"}`}
          onApply={apply}
          disabled={
            detecting || !rows.length || !rows.some((r) => r.title.trim()) || blockedContents
          }
        />
      </section>
    </div>
  );
}
