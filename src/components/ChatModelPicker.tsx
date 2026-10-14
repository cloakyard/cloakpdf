/** Native radios share Air geometry in both setup and the model-switch dialog. */
import { useId } from "react";
import {
  AI_MODELS,
  CHAT_VARIANT_IDS,
  CHAT_VARIANT_TIER_LABEL,
  type ChatVariantId,
  formatApproxSize,
  getChatModelId,
} from "../utils/ai-models.ts";

interface ChatModelPickerProps {
  value: ChatVariantId;
  onChange: (next: ChatVariantId) => void;
  disabled?: boolean;
  initialFocus?: boolean;
}

export function ChatModelPicker({ value, onChange, disabled, initialFocus }: ChatModelPickerProps) {
  const id = useId();
  return (
    <fieldset
      className="air-choice-group pdf-ai-tiers"
      disabled={disabled}
      aria-describedby={`${id}-help`}
      onKeyDown={(event) => {
        // Arrows/Space are native. Retain the existing Home/End shortcuts.
        if (disabled || (event.key !== "Home" && event.key !== "End")) return;
        event.preventDefault();
        const index = event.key === "Home" ? 0 : CHAT_VARIANT_IDS.length - 1;
        onChange(CHAT_VARIANT_IDS[index]);
        event.currentTarget
          .querySelectorAll<HTMLInputElement>('input[type="radio"]')
          [index]?.focus();
      }}
    >
      <legend>Choose a chat model</legend>
      <div className="pdf-ai-tier-options">
        {CHAT_VARIANT_IDS.map((variant) => {
          const info = AI_MODELS[getChatModelId(variant)];
          return (
            <label className="air-check-label pdf-ai-tier" key={variant}>
              <input
                type="radio"
                className="air-check"
                name={id}
                value={variant}
                checked={variant === value}
                onChange={() => onChange(variant)}
                aria-labelledby={`${id}-${variant}-name`}
                aria-describedby={`${id}-${variant}-details`}
                data-dialog-initial-focus={initialFocus && variant === value ? "true" : undefined}
              />
              <span className="pdf-ai-tier-copy">
                <span id={`${id}-${variant}-name`} className="pdf-ai-tier-name">
                  {CHAT_VARIANT_TIER_LABEL[variant]}
                </span>
                <span id={`${id}-${variant}-details`} className="pdf-ai-tier-copy">
                  <span className="pdf-ai-tier-description">
                    {variant === CHAT_VARIANT_IDS[0]
                      ? "Lower memory use for everyday questions."
                      : "More capacity for detailed answers and harder questions."}
                  </span>
                  <span className="pdf-ai-tier-model">{info.displayName}</span>
                  <span className="pdf-ai-tier-metrics">
                    <span>{formatApproxSize(info.approxSizeBytes)} download</span>
                    <span>{formatApproxSize(info.approxPeakRamBytes)} peak RAM</span>
                  </span>
                </span>
              </span>
            </label>
          );
        })}
      </div>
      <p id={`${id}-help`} className="air-help">
        These estimates cover the chat model. Both tiers also use the same retrieval and reranking
        models. You can change tiers later.
      </p>
    </fieldset>
  );
}
