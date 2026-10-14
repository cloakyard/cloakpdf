import { Select } from "../../components/Select.tsx";
import { type NupLayout, nupPages } from "../../utils/pdf-operations.ts";
import { bookletOrder } from "../../utils/pdf/transform.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { PageThumb } from "../PageThumb.tsx";
import { WholeDocPanel } from "./WholeDocPanel.tsx";

const NUP_OPTIONS: { value: NupLayout; label: string }[] = [
  { value: "2x1", label: "2-up · side by side" },
  { value: "1x2", label: "2-up · stacked" },
  { value: "2x2", label: "4-up · grid" },
  { value: "3x3", label: "9-up · grid" },
  { value: "booklet", label: "Booklet · fold in half" },
];
const PENDING_TOOLS = [
  { kind: "annotation", id: "annotate-pdf", label: "Review annotations" },
  { kind: "signature", id: "signature", label: "Review signatures" },
  { kind: "stamp", id: "qr-stamp", label: "Review codes" },
];

/** Thumbnails are fitted into the same gapless, physical sheet as the writer. */
function NupPreview({ layout, cropMarks }: { layout: NupLayout; cropMarks: boolean }) {
  const { doc } = useEditorRead();
  const pages = doc?.pages ?? [];
  const first = pages[0];
  if (!first) return null;
  const isBooklet = layout === "booklet";
  const [cols, rows] = isBooklet ? [2, 1] : layout.split("x").map(Number);
  const perSheet = cols * rows;
  const order = isBooklet ? bookletOrder(pages.length) : pages.map((_, i) => i);
  const cellPages = Array.from({ length: perSheet }, (_, i) => pages[order[i]]);
  const width = first.widthPt,
    height = first.heightPt;
  const sheets = Math.ceil(pages.length / (isBooklet ? 4 : perSheet));
  const cellDescription = cellPages.map((p) => (p ? `page ${p.index + 1}` : "blank")).join(", ");
  return (
    <figure className="pdf-nup-preview">
      <figcaption className="air-label">
        {isBooklet ? "First printed side" : "First sheet"}
      </figcaption>
      <div className="pdf-nup-preview__surround">
        <div
          className="pdf-nup-preview__paper"
          role="group"
          aria-label={`Print preview: ${cellDescription}`}
        >
          <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {cellPages.map((page, i) =>
              page ? (
                <PageThumb key={i} page={page} alt="" aspect={(width * rows) / (height * cols)} />
              ) : (
                <div key={i} style={{ aspectRatio: String((width * rows) / (height * cols)) }} />
              ),
            )}
          </div>
          {isBooklet && cropMarks && (
            <svg
              aria-hidden="true"
              className="pdf-nup-preview__marks"
              viewBox={`0 0 ${width} ${height}`}
              fill="none"
              stroke="#8c8c8c"
              strokeWidth="0.5"
            >
              <path d={`M${width / 2} 0V${height}`} strokeDasharray="3 3" />
              <path
                d={`M0 12V0H12 M${width - 12} 0H${width}V12 M0 ${height - 12}V${height}H12 M${width - 12} ${height}H${width}V${height - 12}`}
              />
            </svg>
          )}
        </div>
      </div>
      <p className="air-help" aria-live="polite">
        {sheets} {sheets === 1 ? "sheet" : "sheets"}
        {isBooklet ? ", double-sided" : ` · ${perSheet} pages per sheet`}
        {isBooklet && <>. Print with short-edge flipping, then fold in half.</>}
      </p>
    </figure>
  );
}

export function NupPanel() {
  const { doc, busyLabel } = useEditorRead();
  const { applyTransform, patchToolState, setActiveTool } = useEditorActions();
  const slice = useToolSlice("nup-pages");
  const layout = (slice.layout as NupLayout) ?? "2x2";
  const cropMarks = (slice.cropMarks as boolean) ?? true;
  const busy = busyLabel !== null;
  const isBooklet = layout === "booklet";
  // Destructive marks are baked by applyTransform first. Other tool drafts must
  // be applied through their owning tool (which also owns options such as backing).
  const pending = doc?.objects.filter((o) => o.kind !== "erase" && o.kind !== "redaction") ?? [];
  return (
    <WholeDocPanel
      blurb="Arrange pages for compact printing or a folded booklet."
      applyLabel={isBooklet ? "Make booklet" : "Apply N-up layout"}
      disabled={!doc || pending.length > 0}
      onApply={() =>
        applyTransform(async (d) => {
          if (d.objects.length) throw new Error("Apply pending marks before arranging pages.");
          return {
            bytes: await nupPages(docToFile(d), layout, { cropMarks }),
            label: isBooklet ? "Booklet" : `N-up ${layout}`,
            objects: [],
          };
        })
      }
      note="Creates a print layout. Form fields become fixed; document links and bookmarks are not retained."
    >
      <div>
        <label htmlFor="nup-layout" className="air-label">
          Layout
        </label>
        <Select
          id="nup-layout"
          value={layout}
          options={NUP_OPTIONS}
          disabled={busy}
          onChange={(value) => patchToolState("nup-pages", { layout: value })}
        />
      </div>
      <NupPreview layout={layout} cropMarks={cropMarks} />
      {isBooklet && (
        <label className="air-switch-row">
          <span>Fold & trim marks</span>
          <input
            className="air-switch"
            type="checkbox"
            role="switch"
            checked={cropMarks}
            disabled={busy}
            onChange={(event) => patchToolState("nup-pages", { cropMarks: event.target.checked })}
          />
        </label>
      )}
      {pending.length > 0 && (
        <div className="air-notice pdf-nup-pending" role="status">
          <p>Apply your pending marks before arranging pages.</p>
          {PENDING_TOOLS.filter((tool) => pending.some((o) => o.kind === tool.kind)).map((tool) => (
            <button
              key={tool.id}
              type="button"
              className="air-button"
              disabled={busy}
              onClick={() => setActiveTool(tool.id)}
            >
              {tool.label}
            </button>
          ))}
        </div>
      )}
    </WholeDocPanel>
  );
}
