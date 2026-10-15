// Shared options body for whole-document tools. PrimaryAction handles busy
// state and routes Apply through the mobile sheet when appropriate.

import { type ReactNode } from "react";
import { PrimaryAction } from "./PrimaryAction.tsx";

interface Props {
  /** One-line explanation of what Apply does. */
  blurb: string;
  /** Optional controls (segmented options, etc.) shown above the button. */
  children?: ReactNode;
  /** Label for the primary action. */
  applyLabel: string;
  onApply: () => void;
  /** Extra caveat shown under the button (e.g. "text is rasterised"). */
  note?: string;
  /** Render the action in the destructive (red) treatment. */
  danger?: boolean;
  disabled?: boolean;
}

export function WholeDocPanel({
  blurb,
  children,
  applyLabel,
  onApply,
  note,
  danger,
  disabled,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[var(--air-ink-secondary)]">{blurb}</p>
      {children}
      {/* On mobile this renders nothing and routes to the sheet's global ✓; on
          desktop it's the panel's own Apply button (see PrimaryAction). */}
      <PrimaryAction label={applyLabel} onApply={onApply} disabled={disabled} danger={danger} />
      {note && <p className="air-help">{note}</p>}
    </div>
  );
}
