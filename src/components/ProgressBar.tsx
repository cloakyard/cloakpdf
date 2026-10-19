interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

/** Measured units only. Unknown totals have no fill or invented percentage. */
export function ProgressBar({ current, total, label = "Processing…" }: ProgressBarProps) {
  const known = Number.isFinite(total) && total > 0;
  const completed = known
    ? Math.min(total, Math.max(0, Number.isFinite(current) ? current : 0))
    : 0;
  return (
    <div className="air-file-progress-region">
      <div className="pdf-progress-label" aria-hidden="true">
        <span>{label}</span>
        <span>{known ? `${completed} / ${total}` : "Working…"}</span>
      </div>
      <div
        className="air-file-progress"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={known ? total : undefined}
        aria-valuenow={known ? completed : undefined}
        aria-valuetext={known ? `${completed} of ${total}` : "Working"}
      >
        {known && <span style={{ transform: `scaleX(${completed / total})` }} />}
      </div>
    </div>
  );
}
