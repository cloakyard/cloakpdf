import { type ComponentType, type ReactNode } from "react";

export interface SegmentedOption<T extends string | number | boolean> {
  value: T;
  label: ReactNode;
  icon?: ComponentType<{ className?: string }>;
}
interface SegmentedControlProps<T extends string | number | boolean> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  fullWidth?: boolean;
  ariaLabel?: string;
  disabled?: boolean;
}

/** Preserve the established pressed-button semantics with the shared Air skin. */
export function SegmentedControl<T extends string | number | boolean>({
  value,
  onChange,
  options,
  fullWidth = false,
  ariaLabel,
  disabled,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`air-segments pdf-segments${fullWidth ? " pdf-segments--full" : ""}`}
    >
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={option.value === value}
            disabled={disabled}
            onClick={() => onChange(option.value)}
          >
            {Icon && (
              <span aria-hidden="true">
                <Icon className="size-4" />
              </span>
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
