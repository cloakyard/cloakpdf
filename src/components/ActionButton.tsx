import { Download, SquarePen } from "lucide-react";
import { useRef, useState } from "react";

interface ActionButtonProps {
  onClick: () => void | Promise<unknown>;
  processing: boolean;
  label: string;
  processingLabel: string;
  disabled?: boolean;
  secondaryLabel?: string;
  onSecondaryClick?: () => void | Promise<unknown>;
  secondaryProcessingLabel?: string;
}

/** Utility actions keep their size and focus while the real operation runs. */
export function ActionButton({
  onClick,
  processing,
  label,
  processingLabel,
  disabled,
  secondaryLabel,
  onSecondaryClick,
  secondaryProcessingLabel,
}: ActionButtonProps) {
  const [active, setActive] = useState<"primary" | "secondary">("primary");
  const pending = useRef(false);
  const blocked = Boolean(disabled) || processing;
  const activate = async (which: "primary" | "secondary") => {
    if (blocked || pending.current) return;
    pending.current = true;
    setActive(which);
    try {
      await (which === "primary" ? onClick() : onSecondaryClick?.());
    } finally {
      pending.current = false;
    }
  };
  const labels = (ready: string, busy: string, isBusy: boolean) => (
    <span className="air-action-labels">
      <span data-active={!isBusy || undefined} aria-hidden={isBusy}>
        {ready}
      </span>
      <span data-active={isBusy || undefined} aria-hidden={!isBusy}>
        {busy}
      </span>
    </span>
  );
  return (
    <div className="pdf-operation-actions">
      <div className="air-page-actions">
        <button
          type="button"
          onClick={() => void activate("primary")}
          aria-disabled={blocked || undefined}
          aria-busy={processing && active === "primary"}
          className="air-button air-button--primary"
        >
          {/download/i.test(label) && <Download size={16} strokeWidth={1.6} aria-hidden="true" />}
          {labels(label, processingLabel, processing && active === "primary")}
        </button>
        {secondaryLabel && onSecondaryClick && (
          <button
            type="button"
            onClick={() => void activate("secondary")}
            aria-disabled={blocked || undefined}
            aria-busy={processing && active === "secondary"}
            className="air-button"
          >
            <SquarePen size={16} strokeWidth={1.6} aria-hidden="true" />
            {labels(
              secondaryLabel,
              secondaryProcessingLabel ?? processingLabel,
              processing && active === "secondary",
            )}
          </button>
        )}
      </div>
      <span className="sr-only" role="status">
        {processing
          ? active === "secondary"
            ? (secondaryProcessingLabel ?? processingLabel)
            : processingLabel
          : ""}
      </span>
    </div>
  );
}
