/** Tier changes stay pending until the user confirms the switch. */
import { useState } from "react";
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
  const [pending, setPending] = useState<ChatVariantId>(current);
  const [wasOpen, setWasOpen] = useState(open);
  // Reset before the reopened dialog commits or takes focus, not one paint later.
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setPending(current);
  }

  const changed = pending !== current;

  return (
    <ModalShell
      open={open}
      onClose={onCancel}
      labelledBy="chat-model-picker-title"
      describedBy="chat-model-picker-description"
      testId="chat-model-picker-dialog"
    >
      <header className="pdf-dialog__header">
        <div className="min-w-0 flex-1">
          <h2 id="chat-model-picker-title" className="pdf-dialog__title">
            Pick a chat model
          </h2>
          <p id="chat-model-picker-description" className="pdf-dialog__description">
            Match the tier to your device. Switching unloads the current model; a new tier downloads
            only if it is not already cached.
          </p>
        </div>
        <ModalCloseButton onClick={onCancel} />
      </header>

      <div className="pdf-dialog__body thin-scrollbar">
        <ChatModelPicker value={pending} onChange={setPending} initialFocus />
      </div>

      <footer className="pdf-dialog__footer">
        <button type="button" onClick={onCancel} className="air-button">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(pending)}
          disabled={!changed}
          className="air-button air-button--primary"
        >
          Switch model
        </button>
      </footer>
    </ModalShell>
  );
}
