import { SegmentedControl, type SegmentedOption } from "./SegmentedControl.tsx";

export type SortMode = "off" | "asc" | "desc";

interface SortByNameButtonProps {
  mode: SortMode;
  onChange: (mode: SortMode) => void;
  disabled?: boolean;
}

const OPTIONS: readonly SegmentedOption<SortMode>[] = [
  { value: "off", label: "None" },
  { value: "asc", label: "A → Z" },
  { value: "desc", label: "Z → A" },
];

export function SortByNameButton({ mode, onChange, disabled }: SortByNameButtonProps) {
  return (
    <div className="pdf-queue-sort">
      <span className="air-label">Sort</span>
      <SegmentedControl
        disabled={disabled}
        ariaLabel="Sort by file name"
        value={mode}
        onChange={onChange}
        options={OPTIONS}
      />
    </div>
  );
}
