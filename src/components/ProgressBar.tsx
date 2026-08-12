/**
 * Determinate progress bar with an optional label above it.
 *
 * Used by any tool that processes pages sequentially (Compress,
 * PdfToImage, Grayscale, ContactSheet, OCR). The bar reflects the
 * `current / total` ratio; if `total` is 0 the bar is rendered empty
 * rather than NaN-filled.
 *
 * Styling follows the app's primary accent by default; override via
 * the `color` prop (a Tailwind background class).
 */
interface ProgressBarProps {
  /** Completed units (e.g. rendered page count). */
  current: number;
  /** Total units of work. Must be ≥ `current`. A `total` of 0 renders an empty bar. */
  total: number;
  /** Left-hand label above the bar. Defaults to "Processing…". */
  label?: string;
  /**
   * Tailwind background class for the filled portion of the bar.
   * Defaults to the app's primary accent.
   */
  color?: string;
}

export function ProgressBar({
  current,
  total,
  label = "Processing…",
  color = "bg-primary-600",
}: ProgressBarProps) {
  const percent = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
  return (
    <div
      className="space-y-2"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total > 0 ? total : undefined}
      aria-valuenow={total > 0 ? current : undefined}
      aria-valuetext={total > 0 ? `${current} of ${total}` : undefined}
    >
      <div className="flex justify-between font-mono text-xs text-slate-600 dark:text-dark-text-muted">
        <span>{label}</span>
        <span className="tabular-nums">
          {current} / {total}
        </span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-dark-border rounded-full h-2 overflow-hidden">
        <div
          className={`${color} cloak-progress-fill h-2 origin-left rounded-full`}
          style={{ transform: `scaleX(${percent / 100})` }}
        />
      </div>
    </div>
  );
}
