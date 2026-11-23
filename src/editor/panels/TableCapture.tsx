import { Copy, Plus, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { readingRect, type FracRect } from "../../utils/text-select.ts";
import {
  spreadsheetText,
  suggestDividers,
  tableCells,
  tableLines,
} from "../../utils/table-capture.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { RegionStage } from "../RegionStage.tsx";
import type { TextPage } from "../usePageText.ts";

const TOOL = "select-text";
interface Capture {
  page: TextPage;
  area: FracRect;
  cuts: number[];
}
function useCapture(page: TextPage) {
  const { patchToolState } = useEditorActions();
  const saved = useToolSlice(TOOL).capture as Capture | undefined;
  const capture = saved?.page === page ? saved : undefined;
  const rotation = page.rotation ?? 0;
  const save = useCallback(
    (next: Capture) => patchToolState(TOOL, { capture: next }),
    [patchToolState],
  );
  return { capture, rotation, save };
}

export function TableStage({ page }: { page: TextPage }) {
  const { capture, rotation, save } = useCapture(page);
  const { busyLabel } = useEditorRead();
  const guides = useMemo(() => {
    if (!capture) return;
    const bounds = readingRect(capture.area, rotation);
    return capture.cuts.map((xPct) => readingRect({ ...bounds, xPct, wPct: 0 }, -rotation));
  }, [capture, rotation]);
  const onBox = useCallback(
    (area: FracRect) => {
      const rows = tableLines(page.touchWords ?? page.words, area, rotation);
      save({ page, area, cuts: suggestDividers(rows, readingRect(area, rotation)) });
    },
    [page, rotation, save],
  );
  const moveDivider = useCallback(
    (i: number, point: Pick<FracRect, "xPct" | "yPct">) => {
      if (!capture) return;
      const bounds = readingRect(capture.area, rotation);
      const x = readingRect({ ...point, wPct: 0, hPct: 0 }, rotation).xPct;
      const left = capture.cuts[i - 1] ?? bounds.xPct,
        right = capture.cuts[i + 1] ?? bounds.xPct + bounds.wPct;
      const margin = (right - left) * 0.01;
      const cut = Math.max(left + margin, Math.min(right - margin, x));
      save({ ...capture, cuts: capture.cuts.map((v, j) => (j === i ? cut : v)) });
    },
    [capture, rotation, save],
  );
  return (
    <RegionStage
      revision={page.bytes}
      area={capture?.area}
      guides={guides}
      onGuideMove={moveDivider}
      onBox={onBox}
      busy={!!busyLabel}
    />
  );
}

export function TablePanel({ page }: { page: TextPage }) {
  const { capture, rotation, save } = useCapture(page);
  const { busyLabel } = useEditorRead();
  const [copyResult, setCopyResult] = useState<{ capture: Capture; ok: boolean }>();
  const lines = useMemo(
    () => (capture ? tableLines(page.touchWords ?? page.words, capture.area, rotation) : []),
    [page, capture?.area, rotation],
  );
  const cells = useMemo(() => (capture ? tableCells(lines, capture.cuts) : []), [lines, capture]);
  const result = capture && copyResult?.capture === capture ? copyResult : undefined;
  if (!capture || !cells.length)
    return (
      <section aria-label="Table capture">
        <p className="air-help" role="status">
          {capture
            ? "No text in this area. Draw around the table again."
            : "Draw around the table, or tap two opposite corners."}
        </p>
        <p className="air-help">
          With a keyboard, focus the page, move with the arrow keys and press Enter at each corner.
        </p>
      </section>
    );
  const bounds = readingRect(capture.area, rotation);
  const edges = [bounds.xPct, ...capture.cuts, bounds.xPct + bounds.wPct];
  const changeCuts = (cuts: number[]) => save({ ...capture, cuts });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(spreadsheetText(cells));
      setCopyResult({ capture, ok: true });
    } catch {
      setCopyResult({ capture, ok: false });
    }
  };
  return (
    <section aria-label="Table capture">
      <p className="air-label" id="capture-size" role="status">
        {cells.length} {cells.length === 1 ? "row" : "rows"} × {edges.length - 1}{" "}
        {edges.length === 2 ? "column" : "columns"}
      </p>
      <div
        className="pdf-table-preview air-scroll"
        tabIndex={0}
        role="region"
        aria-labelledby="capture-size"
      >
        <table aria-label="Captured table">
          <thead>
            <tr>
              {cells[0].map((_, i) => (
                <th scope="col" key={i} aria-label={"Column " + (i + 1)}>
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cells.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="air-button air-button--primary"
        disabled={!!busyLabel}
        onClick={() => void copy()}
      >
        <Copy size={16} aria-hidden="true" />
        Copy table
      </button>
      <p id="capture-copy-status" className={result ? "air-help" : "sr-only"} role="status">
        {result &&
          (result.ok
            ? "Table copied. Paste it into your spreadsheet."
            : "Clipboard unavailable. Select and copy the table manually.")}
      </p>
      {result && !result.ok && (
        <textarea
          className="air-field"
          id="capture-tsv"
          aria-labelledby="capture-copy-status"
          readOnly
          value={spreadsheetText(cells)}
          onFocus={(e) => e.currentTarget.select()}
        />
      )}
      <details className="pdf-selection-help">
        <summary>Adjust columns</summary>
        <div className="pdf-column-controls">
          <p className="air-help">Drag a divider on the page or move its slider.</p>
          {capture.cuts.map((cut, i) => (
            <div className="pdf-column-control" key={i}>
              <label htmlFor={"table-cut-" + i} className="air-label">
                Divider {i + 1}
              </label>
              <input
                id={"table-cut-" + i}
                type="range"
                min={edges[i]}
                max={edges[i + 2]}
                step="any"
                aria-valuetext={
                  Math.round(((cut - bounds.xPct) / bounds.wPct) * 100) + "% across the table"
                }
                value={cut}
                disabled={!!busyLabel}
                onChange={(e) => {
                  const x = e.currentTarget.valueAsNumber;
                  if (x > edges[i] && x < edges[i + 2])
                    changeCuts(capture.cuts.map((old, j) => (j === i ? x : old)));
                }}
              />
              <button
                type="button"
                className="air-button air-icon-button air-button--quiet"
                aria-label={"Remove divider " + (i + 1)}
                disabled={!!busyLabel}
                onClick={() => changeCuts(capture.cuts.filter((_, j) => j !== i))}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="air-button"
            disabled={!!busyLabel}
            onClick={() => {
              let widest = 0;
              for (let i = 1; i < edges.length - 1; i++)
                if (edges[i + 1] - edges[i] > edges[widest + 1] - edges[widest]) widest = i;
              changeCuts([
                ...capture.cuts.slice(0, widest),
                (edges[widest] + edges[widest + 1]) / 2,
                ...capture.cuts.slice(widest),
              ]);
            }}
          >
            <Plus size={16} aria-hidden="true" />
            Add divider
          </button>
        </div>
      </details>
      <p className="air-help">Draw a new box to capture another table.</p>
    </section>
  );
}
