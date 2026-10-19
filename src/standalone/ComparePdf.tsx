/** Local visual comparison with cancellable rendering and owned preview URLs. */
import { useEffect, useRef, useState } from "react";
import { ActionButton } from "../components/ActionButton.tsx";
import { AlertBox } from "../components/AlertBox.tsx";
import { FileDropZone } from "../components/FileDropZone.tsx";
import { FileInfoBar } from "../components/FileInfoBar.tsx";
import { PagePreviewNav } from "../components/PagePreviewNav.tsx";
import { ProgressBar } from "../components/ProgressBar.tsx";
import { SegmentedControl } from "../components/SegmentedControl.tsx";
import { canvas as canvasColors } from "../config/theme.ts";
import { formatFileSize } from "../utils/file-helpers.ts";
import { isPdfEncrypted } from "../utils/pdf-security.ts";
import { type PageComparison, comparePdfFiles, releaseComparisons } from "../utils/pdf-compare.ts";

type FileSlot = { file: File; state: "checking" | "ready" | "encrypted" | "error" } | null;
type Side = 0 | 1;
type ViewMode = "side-by-side" | "diff-overlay";
const names = ["Original", "Modified"] as const;
function pageStatus(page: PageComparison) {
  if (!page.thumbA) return "Only in modified PDF";
  if (!page.thumbB) return "Only in original PDF";
  return page.diffPercent === 0 ? "Identical" : `${page.diffPercent.toFixed(1)}% changed`;
}

export default function ComparePdf() {
  const [files, setFiles] = useState<[FileSlot, FileSlot]>([null, null]);
  const [comparisons, setComparisons] = useState<PageComparison[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("side-by-side");
  const [currentPage, setCurrentPage] = useState(0);
  const [showDiff, setShowDiff] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const generation = useRef([0, 0]);
  const operation = useRef<AbortController | null>(null);
  const ownedResults = useRef<PageComparison[]>([]);
  const focusRequest = useRef<string | null>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      generation.current[0]++;
      generation.current[1]++;
      operation.current?.abort();
      operation.current = null;
      releaseComparisons(ownedResults.current);
      ownedResults.current = [];
    };
  }, []);
  useEffect(() => {
    if (!focusRequest.current) return;
    const target = root.current?.querySelector<HTMLElement>(focusRequest.current);
    if (target) {
      target.focus();
      focusRequest.current = null;
    }
  });

  useEffect(() => {
    const strip = root.current?.querySelector<HTMLElement>(".pdf-compare-pages");
    if (!strip) return;
    // Keep the current thumbnail visible without moving the document vertically.
    const revealCurrent = () => {
      const selected = strip.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (!selected) return;
      const area = strip.getBoundingClientRect();
      const item = selected.getBoundingClientRect();
      const inset = parseFloat(getComputedStyle(strip).paddingInlineStart);
      if (item.left < area.left + inset) strip.scrollLeft += item.left - area.left - inset;
      else if (item.right > area.right - inset) strip.scrollLeft += item.right - area.right + inset;
    };
    revealCurrent();
    const observer = new ResizeObserver(revealCurrent);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [currentPage, comparisons.length]);

  const clearResults = () => {
    releaseComparisons(ownedResults.current);
    ownedResults.current = [];
    setComparisons([]);
    setCurrentPage(0);
    setError(null);
    setNotice("");
  };
  const putFile = (side: Side, value: FileSlot) =>
    setFiles((previous) => {
      const next: [FileSlot, FileSlot] = [...previous];
      next[side] = value;
      return next;
    });
  const changeFile = (side: Side) => {
    if (operation.current) return;
    generation.current[side]++;
    clearResults();
    putFile(side, null);
    focusRequest.current = `[data-compare-side="${side}"] input[type="file"]`;
  };
  const selectFile = async (side: Side, incoming: File[]) => {
    const file = incoming[0];
    if (!file || operation.current) return;
    const request = ++generation.current[side];
    clearResults();
    putFile(side, { file, state: "checking" });
    focusRequest.current = `[data-compare-side="${side}"] button`;
    try {
      const encrypted = await isPdfEncrypted(file);
      if (!alive.current || request !== generation.current[side]) return;
      putFile(side, { file, state: encrypted ? "encrypted" : "ready" });
      if (encrypted) focusRequest.current = `[data-compare-side="${side}"] button`;
    } catch {
      if (!alive.current || request !== generation.current[side]) return;
      putFile(side, { file, state: "error" });
      focusRequest.current = `[data-compare-side="${side}"] .pdf-compare-read-error`;
    }
  };
  const handleCompare = async () => {
    if (operation.current || files[0]?.state !== "ready" || files[1]?.state !== "ready") return;
    const controller = new AbortController();
    operation.current = controller;
    clearResults();
    setBusy(true);
    setProgress(null);
    const current = () => alive.current && operation.current === controller;
    try {
      const results = await comparePdfFiles(
        [files[0].file, files[1].file],
        controller.signal,
        (done, total) => {
          if (current()) setProgress({ done, total });
        },
      );
      if (!current()) {
        releaseComparisons(results);
        return;
      }
      ownedResults.current = results;
      setComparisons(results);
      focusRequest.current = "#comparison-heading";
    } catch {
      if (current() && !controller.signal.aborted) {
        setError(
          "Could not compare these PDFs. Your files are still here. Try again, or choose a different file.",
        );
        focusRequest.current = "#comparison-error";
      }
    } finally {
      if (current()) {
        operation.current = null;
        setBusy(false);
        setProgress(null);
      }
    }
  };
  const cancel = () => {
    operation.current?.abort();
    operation.current = null;
    setBusy(false);
    setProgress(null);
    setNotice("Comparison cancelled. Your files are ready to try again.");
    focusRequest.current = ".pdf-operation-actions button";
  };
  const reset = () => {
    cancel();
    generation.current[0]++;
    generation.current[1]++;
    clearResults();
    setFiles([null, null]);
    setViewMode("side-by-side");
    setShowDiff(true);
    focusRequest.current = '[data-compare-side="0"] input[type="file"]';
  };
  const identical = comparisons.filter((page) => page.diffPercent === 0).length;
  const current = comparisons[currentPage];
  const base = current?.thumbA ?? current?.thumbB;
  const ready = files.every((file) => file?.state === "ready");

  return (
    <div ref={root} className="pdf-compare">
      <div className="pdf-compare-pair">
        {([0, 1] as const).map((side) => {
          const slot = files[side];
          return (
            <section
              key={side}
              data-compare-side={side}
              className="pdf-compare-file"
              aria-labelledby={`compare-file-${side}`}
            >
              <h2 id={`compare-file-${side}`}>{names[side]} PDF</h2>
              {slot && slot.state !== "encrypted" ? (
                <>
                  <FileInfoBar
                    fileName={slot.file.name}
                    details={formatFileSize(slot.file.size)}
                    status={slot.state === "checking" ? "Checking PDF…" : undefined}
                    disabled={busy}
                    onChangeFile={() => changeFile(side)}
                    changeLabel={slot.state === "checking" ? "Cancel check" : "Change file"}
                  />
                  {slot.state === "error" && (
                    <div className="pdf-compare-read-error" tabIndex={-1}>
                      <AlertBox message="Could not read this PDF. Choose a valid, unprotected PDF and try again." />
                    </div>
                  )}
                </>
              ) : (
                <FileDropZone
                  accept=".pdf,application/pdf"
                  onFiles={(incoming) => void selectFile(side, incoming)}
                  disabled={busy}
                  encryptedFile={slot?.state === "encrypted" ? slot.file : null}
                  onClearEncrypted={() => changeFile(side)}
                  label={`Drop the ${names[side].toLowerCase()} PDF`}
                  hint={
                    side === 0 ? "The version you started with" : "The version you want to check"
                  }
                />
              )}
            </section>
          );
        })}
      </div>
      {!current && (
        <>
          <p className="air-help">
            Compare visible page content locally. Text, images and page sizes are checked; hidden
            metadata is not compared.
          </p>
          {ready && (
            <div className="pdf-compare-actions">
              <ActionButton
                onClick={() => void handleCompare()}
                processing={busy}
                label="Compare PDFs"
                processingLabel="Comparing…"
              />
              {busy && (
                <button type="button" className="air-button" onClick={cancel}>
                  Cancel comparison
                </button>
              )}
            </div>
          )}
          {busy && (
            <ProgressBar
              current={progress?.done ?? 0}
              total={progress?.total ?? 0}
              label="Comparing pages…"
            />
          )}
          {error && (
            <div id="comparison-error" tabIndex={-1}>
              <AlertBox message={error} />
            </div>
          )}
          <p className="air-help" role="status">
            {notice}
          </p>
        </>
      )}
      {current && (
        <section className="pdf-compare-results" aria-labelledby="comparison-heading">
          <div className="air-collection-heading">
            <div>
              <h2 id="comparison-heading" tabIndex={-1}>
                {comparisons.length} {comparisons.length === 1 ? "page" : "pages"} compared
              </h2>
              <p className="air-help">
                {identical} identical · {comparisons.length - identical} changed
              </p>
            </div>
            <button type="button" className="air-button" onClick={reset}>
              New comparison
            </button>
          </div>
          <div className="pdf-compare-toolbar">
            <SegmentedControl
              value={viewMode}
              onChange={setViewMode}
              ariaLabel="Comparison view"
              options={[
                { value: "side-by-side", label: "Side by side" },
                { value: "diff-overlay", label: "Difference overlay" },
              ]}
            />
            <PagePreviewNav
              page={currentPage}
              total={comparisons.length}
              onChange={setCurrentPage}
            />
          </div>
          <div className="pdf-compare-page-status">
            <p role="status">
              <span>Page {current.page}</span>
              <span>{pageStatus(current)}</span>
            </p>
            {viewMode === "diff-overlay" && current.diffThumb && (
              <label className="air-check-label">
                <input
                  type="checkbox"
                  className="air-check"
                  checked={showDiff}
                  onChange={(event) => setShowDiff(event.target.checked)}
                />
                Show differences
              </label>
            )}
          </div>
          {viewMode === "side-by-side" ? (
            <div className="pdf-compare-pair">
              {([current.thumbA, current.thumbB] as const).map((url, side) => (
                <figure key={side} className="pdf-compare-preview">
                  <figcaption>
                    {names[side]} · Page {current.page}
                  </figcaption>
                  {url ? (
                    <img src={url} alt={`${names[side]} — page ${current.page}`} />
                  ) : (
                    <div className="pdf-compare-missing">
                      No page {current.page} in the {names[side].toLowerCase()} PDF
                    </div>
                  )}
                </figure>
              ))}
            </div>
          ) : (
            <figure className="pdf-compare-overlay">
              <figcaption>
                {current.thumbA ? "Original" : "Modified"} · Page {current.page}
                {showDiff && current.diffThumb ? " · Differences in red" : ""}
              </figcaption>
              <div
                className="pdf-compare-plane"
                style={{
                  aspectRatio: `${current.width} / ${current.height}`,
                  background: canvasColors.background,
                }}
              >
                {base && (
                  <img
                    src={base}
                    alt={`${current.thumbA ? "Original" : "Modified"} — page ${current.page}`}
                    style={{
                      width: `${((current.thumbA ? current.widthA : current.widthB) / current.width) * 100}%`,
                      height: `${((current.thumbA ? current.heightA : current.heightB) / current.height) * 100}%`,
                    }}
                  />
                )}
                {showDiff && current.diffThumb && (
                  <img src={current.diffThumb} alt={`Differences — page ${current.page}`} />
                )}
              </div>
            </figure>
          )}
          {comparisons.length > 1 && (
            <div
              className="air-segments pdf-compare-pages"
              role="group"
              aria-label="Compared pages"
            >
              {comparisons.map((page, index) => (
                <button
                  type="button"
                  key={page.page}
                  aria-pressed={index === currentPage}
                  aria-label={`Page ${page.page}: ${pageStatus(page)}`}
                  onClick={() => setCurrentPage(index)}
                >
                  <span className="pdf-compare-thumbnail">
                    <img src={(page.thumbA ?? page.thumbB)!} alt="" />
                  </span>
                  <span>Page {page.page}</span>
                  <span className="air-help">{pageStatus(page)}</span>
                </button>
              ))}
            </div>
          )}
          <p className="air-help">Visual comparison only. Your original PDFs are unchanged.</p>
        </section>
      )}
    </div>
  );
}
