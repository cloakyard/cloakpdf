/**
 * Modal wrapper around {@link ChatModelPicker} for the
 * mid-session swap path.
 *
 * Used when the user clicks "Change model" in the active-model bar
 * — the consent dialog is reserved for download flow, so this
 * dialog handles the pure "which tier?" decision and hands off
 * back to the gate / consent flow once the user confirms.
 *
 * Visually matches `AiConsentModal` — same named scrim, solid paper,
 * compact corners, and slide-up animation — so swap and
 * consent read as one system.
 */
import { Cpu } from "lucide-react";
import { useEffect, useState } from "react";
import type { ChatVariantId } from "../utils/ai-models.ts";
import { ChatModelPicker } from "./ChatModelPicker.tsx";
import { ModalCloseButton, ModalShell } from "./ModalShell.tsx";

interface ChatModelPickerModalProps {
  open: boolean;
  /** The variant that's currently active — pre-selects it in the picker. */
  current: ChatVariantId;
  /** Fires when the user confirms a different tier; closes the dialog. */
  onConfirm: (next: ChatVariantId) => void;
  /** Fires when the user dismisses without changing. */
  onCancel: () => void;
}

export function ChatModelPickerModal({
  open,
  current,
  onConfirm,
  onCancel,
}: ChatModelPickerModalProps) {
  // Pending selection — only persisted via `onConfirm`. Re-init when the
  // dialog reopens so a cancel followed by a re-open shows the active
  // tier highlighted (not whatever the user was about to pick last time).
  const [pending, setPending] = useState<ChatVariantId>(current);
  useEffect(() => {
    if (open) setPending(current);
  }, [open, current]);

  const changed = pending !== current;

  return (
    <ModalShell
      open={open}
      onClose={onCancel}
      labelledBy="chat-model-picker-title"
      describedBy="chat-model-picker-description"
      panelClassName="max-h-[88svh] sm:max-h-[min(640px,calc(100svh-64px))] sm:w-[min(540px,100%)]"
      testId="chat-model-picker-dialog"
    >
      <header className="cloak-dialog__header">
        <Cpu className="mt-1 h-5 w-5 shrink-0 text-primary-600" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="cloak-dialog__eyebrow">Model runtime / chat tier</p>
          <h2 id="chat-model-picker-title" className="cloak-dialog__title">
            Pick a chat model
          </h2>
          <p id="chat-model-picker-description" className="cloak-dialog__description">
            Match the tier to your device. Switching unloads the current model; a new tier downloads
            only if it is not already cached.
          </p>
        </div>
        <ModalCloseButton onClick={onCancel} />
      </header>

      <div className="cloak-dialog__body thin-scrollbar">
        <ChatModelPicker value={pending} onChange={setPending} initialFocus />
      </div>

      <footer className="cloak-dialog__footer">
        <button
          type="button"
          onClick={onCancel}
          className="cloak-focus min-h-11 rounded-md border border-[var(--color-rule)] bg-[var(--color-surface)] px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-2)] transition-colors hover:border-[var(--color-rule-strong)] hover:bg-[var(--color-paper)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(pending)}
          disabled={!changed}
          className="cloak-focus min-h-11 rounded-md bg-primary-600 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-[var(--color-accent-ink)] transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Switch model
        </button>
      </footer>
    </ModalShell>
  );
}
