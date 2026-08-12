/**
 * Tier-selector for the on-device chat model.
 *
 * Two tiers, each backed by an entry in `src/utils/ai-models.ts`:
 *
 *   - Compact  → LFM2.5-1.2B-Instruct (~810 MB / ~2 GB peak)
 *   - Quality  → LFM2-2.6B  (~1.55 GB / ~3.5 GB peak)
 *
 * The picker shows download size and peak RAM so users can see what
 * they're committing to. We deliberately do **not** auto-recommend a
 * tier based on `navigator.deviceMemory` — Chrome caps the reading at
 * 8 GB for privacy (a 32 GB desktop reports identical to an 8 GB
 * laptop) and Firefox / Safari don't ship the API at all. Surfacing a
 * misleading "Recommended for your device" badge from a broken signal
 * would be worse than letting the user pick. The choice persists in
 * localStorage so it's a one-time decision per browser.
 *
 * Pure presentational — no localStorage / state. Caller (the gate or
 * the swap dialog) owns the selection and persistence.
 */
import { Check, Cpu, Download, MemoryStick } from "lucide-react";
import { useRef } from "react";
import {
  AI_MODELS,
  CHAT_VARIANT_IDS,
  CHAT_VARIANT_TIER_LABEL,
  type ChatVariantId,
  formatApproxSize,
  getChatModelId,
} from "../utils/ai-models.ts";

interface ChatModelPickerProps {
  /** Currently-selected tier. */
  value: ChatVariantId;
  /** Fires when the user picks a different tier. */
  onChange: (next: ChatVariantId) => void;
  /** Disable interaction (e.g. while a download is in flight). */
  disabled?: boolean;
  /** Marks the checked tier as the owning dialog's initial focus target. */
  initialFocus?: boolean;
}

export function ChatModelPicker({ value, onChange, disabled, initialFocus }: ChatModelPickerProps) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const move = (direction: 1 | -1 | "home" | "end") => {
    const current = CHAT_VARIANT_IDS.indexOf(value);
    const next =
      direction === "home"
        ? 0
        : direction === "end"
          ? CHAT_VARIANT_IDS.length - 1
          : (current + direction + CHAT_VARIANT_IDS.length) % CHAT_VARIANT_IDS.length;
    const variant = CHAT_VARIANT_IDS[next];
    onChange(variant);
    optionRefs.current[next]?.focus();
  };

  return (
    <fieldset
      className="cloak-ledger p-0"
      aria-label="Chat model tier"
      disabled={disabled}
      role="radiogroup"
      onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowRight") {
          event.preventDefault();
          move(1);
        } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
          event.preventDefault();
          move(-1);
        } else if (event.key === "Home") {
          event.preventDefault();
          move("home");
        } else if (event.key === "End") {
          event.preventDefault();
          move("end");
        }
      }}
    >
      <legend className="sr-only">Chat model tier</legend>
      {CHAT_VARIANT_IDS.map((variant, index) => {
        const info = AI_MODELS[getChatModelId(variant)];
        const selected = variant === value;
        return (
          <button
            key={variant}
            type="button"
            ref={(element) => {
              optionRefs.current[index] = element;
            }}
            onClick={() => onChange(variant)}
            disabled={disabled}
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            data-dialog-initial-focus={selected && initialFocus ? "true" : undefined}
            className={[
              "relative grid min-h-11 w-full grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-3 px-3 py-3 text-left transition-colors focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-focus)]",
              selected
                ? "bg-[var(--color-accent-soft)] shadow-[inset_2px_0_0_var(--color-accent)]"
                : "bg-[var(--color-surface)] hover:bg-[var(--color-paper)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 grid h-5 w-5 place-items-center ${
                selected ? "text-primary-600" : "text-[var(--color-rule-strong)]"
              }`}
            >
              {selected ? <Check className="h-4 w-4" /> : <span className="h-px w-2 bg-current" />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-[var(--color-ink)]">
                  {CHAT_VARIANT_TIER_LABEL[variant]}
                </span>
                <span className="text-xs text-[var(--color-ink-3)]">· {info.displayName}</span>
              </span>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-ink-2)]">
                {info.description}
              </p>
              {/*
                Size + RAM strip. Earlier rev used a `·` between the
                two values; against the muted-ink token the dot
                disappeared into the line and users couldn't see where
                one metric ended and the next began. Icons fix it two
                ways: (a) they create a clear visual gap on their own,
                so no fragile mid-sentence separator is needed, and
                (b) each metric self-labels via its icon (download
                arrow vs memory stick) so a user can parse the line
                at a glance without reading the suffix word.
              */}
              <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xxs tabular-nums text-[var(--color-ink-3)]">
                <span className="inline-flex items-center gap-1">
                  <Download className="w-3 h-3" aria-hidden="true" />
                  {formatApproxSize(info.approxSizeBytes)} download
                </span>
                <span className="inline-flex items-center gap-1">
                  <MemoryStick className="w-3 h-3" aria-hidden="true" />
                  {formatApproxSize(info.approxPeakRamBytes)} RAM
                </span>
              </span>
            </span>
          </button>
        );
      })}
      <p className="flex items-start gap-1.5 px-3 py-2.5 text-xxs leading-relaxed text-[var(--color-ink-3)]">
        <Cpu className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          Pick the tier that matches your RAM headroom. You can switch anytime — previously
          downloaded models stay cached, so re-selecting one loads in seconds.
        </span>
      </p>
    </fieldset>
  );
}
