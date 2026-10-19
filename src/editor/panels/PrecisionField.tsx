/** Air's precise numeric entry, optionally paired with a continuous preview slider.
 * The caller owns raw drafts and validation, so reflow never discards an edit. */
export function PrecisionField({
  id,
  label,
  unit = "",
  min,
  max,
  step = 1,
  raw,
  value,
  slider = true,
  error,
  onChange,
  onBlur,
}: {
  id: string;
  label: string;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  raw: string;
  value: number;
  slider?: boolean;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  return (
    <div className="pdf-precision">
      <div className="pdf-precision__heading">
        <label className="air-label" htmlFor={id}>
          {label}
        </label>
        <div className="pdf-precision__value">
          <input
            id={id}
            name={id}
            className="air-field"
            type="number"
            inputMode={step >= 1 ? "numeric" : "decimal"}
            min={min}
            max={max}
            step={step}
            value={raw}
            aria-label={unit ? `${label} (${unit})` : label}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
          />
          {unit && <span aria-hidden="true">{unit}</span>}
        </div>
      </div>
      {slider && (
        <div className="pdf-precision-track">
          {min < 0 && <span className="pdf-precision-neutral" aria-hidden="true" />}
          <input
            className="pdf-precision-range"
            type="range"
            aria-label={`${label} slider`}
            aria-valuetext={`${value} ${unit}`.trim()}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )}
      {error && (
        <p id={`${id}-error`} className="air-help air-help--error">
          {error}
        </p>
      )}
    </div>
  );
}
