// controls.tsx — Small shared form controls for the option-bearing overlay
// tools (page numbers, Bates and other overlay panels). Designed to read well
// in the narrow right panel AND the mobile bottom sheet: large tap targets,
// one accent, no cramped rows.

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

// 3 columns × 2 rows — the cells map spatially to the page corners, so the
// layout itself communicates the position.
const POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const;

export function PositionGrid<T extends string>({
  value,
  onChange,
}: {
  value: T;
  onChange: (p: T) => void;
}) {
  return (
    <div className="pdf-property-field">
      <span className="air-label">Position</span>
      <div className="pdf-position-grid" role="group" aria-label="Position">
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            type="button"
            className="air-icon-button"
            onClick={() => onChange(pos as T)}
            aria-label={pos.replace("-", " ")}
            title={pos.replace("-", " ")}
            aria-pressed={value === pos}
          >
            <svg width="22" height="28" viewBox="0 0 22 28" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="20" height="26" stroke="currentColor" opacity="0.45" />
              <path
                d={`M${pos.endsWith("left") ? 4 : pos.endsWith("right") ? 12 : 8} ${pos.startsWith("top") ? 6 : 22}h6`}
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

/** A checkerboard CSS background so a transparent image reads as "no background"
 *  in a preview swatch (instead of an opaque white card that misrepresents it). */
export const TRANSPARENCY_CHECKER: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg,#e2e8f0 25%,transparent 25%),linear-gradient(-45deg,#e2e8f0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e2e8f0 75%),linear-gradient(-45deg,transparent 75%,#e2e8f0 75%)",
  backgroundSize: "12px 12px",
  backgroundPosition: "0 0,0 6px,6px -6px,-6px 0",
  backgroundColor: "#f8fafc",
};
