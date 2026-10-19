import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Minus, Plus, Trash2 } from "lucide-react";

/** Shared keyboard alternatives to dragging a placed code or signature. */
export function PlacementActions({
  noun,
  disabled,
  onAdjust,
  onRemove,
}: {
  noun: "code" | "signature";
  disabled: boolean;
  onAdjust: (dx: number, dy: number, scale?: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="pdf-placement-actions" role="group" aria-label={`Adjust selected ${noun}`}>
      {[
        { label: "Move left", Icon: ArrowLeft, dx: -0.01, dy: 0 },
        { label: "Move up", Icon: ArrowUp, dx: 0, dy: -0.01 },
        { label: "Move down", Icon: ArrowDown, dx: 0, dy: 0.01 },
        { label: "Move right", Icon: ArrowRight, dx: 0.01, dy: 0 },
        { label: `Smaller ${noun}`, Icon: Minus, dx: 0, dy: 0, scale: 0.9 },
        { label: `Larger ${noun}`, Icon: Plus, dx: 0, dy: 0, scale: 1.1 },
      ].map(({ label, Icon, dx, dy, scale }) => (
        <button
          key={label}
          type="button"
          className="air-button air-icon-button air-button--quiet"
          aria-label={label}
          title={label}
          disabled={disabled}
          onClick={() => onAdjust(dx, dy, scale)}
        >
          <Icon className="size-4" aria-hidden="true" />
        </button>
      ))}
      <button
        type="button"
        className="air-button air-icon-button air-button--quiet"
        aria-label={`Remove selected ${noun}`}
        title={`Remove selected ${noun}`}
        disabled={disabled}
        onClick={onRemove}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
