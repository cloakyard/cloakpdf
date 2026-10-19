/** Loaded-model actions share the same metadata dialog as the setup gate. */
import { MemoryStick, RefreshCcw, ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";
import type { AiModelInfo } from "../utils/ai-models.ts";

interface ActiveModelBarProps {
  models: AiModelInfo[];
  onChange: () => void;
  onViewDetails: () => void;
  disabled?: boolean;
  onFreeMemory: () => Promise<void>;
  canFreeMemory: boolean;
}

export function ActiveModelBar({
  models,
  onChange,
  onViewDetails,
  disabled,
  onFreeMemory,
  canFreeMemory,
}: ActiveModelBarProps) {
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function release() {
    if (busy.current || disabled) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      await onFreeMemory();
    } catch {
      setError("Could not release the models. Try again.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <div className="pdf-active-models">
      <p>
        <ShieldCheck size={18} strokeWidth={1.6} aria-hidden="true" />
        {models.length} AI models running on your device
      </p>
      <div className="pdf-ai-actions">
        <button
          type="button"
          className="air-button air-button--quiet"
          onClick={(event) => {
            event.currentTarget.focus();
            onViewDetails();
          }}
          data-dialog-return-focus="ai-model-details"
        >
          View details
        </button>
        {canFreeMemory && (
          <button
            type="button"
            className="air-button"
            onClick={() => void release()}
            disabled={disabled || pending}
            aria-label="Free memory"
          >
            <MemoryStick size={18} strokeWidth={1.6} aria-hidden="true" />
            {pending ? "Freeing memory…" : "Free memory"}
          </button>
        )}
        <button
          type="button"
          className="air-button"
          onClick={(event) => {
            event.currentTarget.focus();
            onChange();
          }}
          disabled={disabled || pending}
          aria-label="Change model"
        >
          <RefreshCcw size={18} strokeWidth={1.6} aria-hidden="true" />
          Change model
        </button>
      </div>
      {error && (
        <p className="air-help air-help--error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
