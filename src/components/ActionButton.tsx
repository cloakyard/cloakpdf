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
  // Processing always wins. Callers often pass their own validity predicate
  // (`disabled={!canSubmit}`); nullish coalescing would let an explicit `false`
  // keep the button clickable while the operation is already in flight.
  const isDisabled = Boolean(disabled) || processing;

  return (
    <div className="cloak-action-row flex justify-center">
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
          className={`cloak-action-button cloak-focus inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-[var(--color-accent-ink)] transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-55 sm:px-8 ${color}`}
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
            className="cloak-action-button cloak-focus inline-flex w-full items-center justify-center gap-2 border border-[var(--color-rule-strong)] bg-[var(--color-surface)] px-5 py-3 text-[var(--color-ink)] transition-colors hover:border-primary-500 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-8"
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
