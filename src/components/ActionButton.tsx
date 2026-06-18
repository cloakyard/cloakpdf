import { Download, Loader2, SquarePen } from "lucide-react";
import { useState } from "react";

interface ActionButtonProps {
  onClick: () => void;
  processing: boolean;
  label: string;
  processingLabel: string;
  disabled?: boolean;
  color?: string;
  /**
   * Optional secondary action rendered beside the primary (stacked above
   * sm). Used by tools whose output is a single PDF to offer "& edit" —
   * run the same operation but hand the result to the unified editor
   * instead of downloading, saving the download-then-re-upload round trip.
   */
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
  /** Shown on the secondary while it is the in-flight action. Defaults to `processingLabel`. */
  secondaryProcessingLabel?: string;
}

export function ActionButton({
  onClick,
  processing,
  label,
  processingLabel,
  disabled,
  color = "bg-primary-600 hover:bg-primary-700",
  secondaryLabel,
  onSecondaryClick,
  secondaryProcessingLabel,
}: ActionButtonProps) {
  // Which button kicked off the current run — the spinner and processing
  // label follow the clicked button, not always the primary.
  const [active, setActive] = useState<"primary" | "secondary">("primary");

  // Tools whose label explicitly says "Download" (e.g. "Unlock & Download")
  // get a trailing download glyph; tools that show a result panel first
  // (e.g. Compare) use a different label and stay icon-less.
  const showDownload = !processing && /download/i.test(label);
  const hasSecondary = Boolean(secondaryLabel && onSecondaryClick);
  const isDisabled = disabled ?? processing;

  return (
    <div className="pt-6 sm:pt-8 flex justify-center">
      {/* When a secondary is present, both buttons live in equal 1fr grid
          columns — under shrink-to-fit the columns resolve to the widest
          label, so the pair always renders at matching widths. */}
      <div
        className={`grid w-full grid-cols-1 gap-3 sm:w-auto ${hasSecondary ? "sm:grid-cols-2" : ""}`}
      >
        <button
          type="button"
          onClick={() => {
            setActive("primary");
            onClick();
          }}
          disabled={isDisabled}
          aria-busy={processing && active === "primary"}
          className={`inline-flex items-center justify-center gap-1.5 w-full sm:min-w-55 ${color} text-white text-sm py-3 px-5 sm:px-8 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg`}
        >
          {/* nowrap: a primary CTA must never wrap to two lines (320px guard). */}
          <span className="whitespace-nowrap">
            {processing && active === "primary" ? processingLabel : label}
          </span>
          {processing && active === "primary" && (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          )}
          {showDownload && <Download className="w-4 h-4" aria-hidden="true" />}
        </button>

        {hasSecondary && (
          <button
            type="button"
            onClick={() => {
              setActive("secondary");
              onSecondaryClick?.();
            }}
            disabled={isDisabled}
            aria-busy={processing && active === "secondary"}
            className="inline-flex items-center justify-center gap-1.5 w-full bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-700 dark:text-dark-text text-sm py-3 px-5 sm:px-8 rounded-xl font-medium hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-700 dark:hover:text-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg"
          >
            <span className="whitespace-nowrap">
              {processing && active === "secondary"
                ? (secondaryProcessingLabel ?? processingLabel)
                : secondaryLabel}
            </span>
            {processing && active === "secondary" ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <SquarePen className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
