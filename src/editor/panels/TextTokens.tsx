import { STAMP_TOKENS } from "../../utils/pdf-operations.ts";

/** Shared Air insertion choices; each editor owns its value, selection and caret. */
export function TextTokens({
  disabled,
  onInsert,
}: {
  disabled: boolean;
  onInsert: (token: string) => void;
}) {
  return (
    <div className="pdf-property-field">
      <span className="air-label">Insert field</span>
      <div className="pdf-text-tokens" role="group" aria-label="Insert field">
        {STAMP_TOKENS.map((t) => (
          <button
            type="button"
            key={t.token}
            className="air-button"
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onInsert(t.token)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
