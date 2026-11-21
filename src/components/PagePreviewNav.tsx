/** Controlled page navigation; moving the preview never changes page selection. */
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useId, useRef, useState } from "react";
import { ModalCloseButton, ModalShell } from "./ModalShell.tsx";

interface PagePreviewNavProps {
  /** Zero-based preview index. */
  page: number;
  total: number;
  onChange: (next: number) => void;
  /** Interactive page count for constrained editor chrome. */
  compact?: boolean;
}

function PageJump({ page, total, onChange }: PagePreviewNavProps) {
  const [open, setOpen] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  const id = useId();
  const status = `Page ${page + 1} of ${total}`;
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        className="air-button air-button--quiet pdf-page-jump"
        aria-label="Go to page"
        aria-describedby={id}
        aria-haspopup="dialog"
        title="Go to page"
        onClick={(event) => {
          event.currentTarget.focus();
          setInvalid(false);
          setOpen(true);
        }}
      >
        {page + 1}/{total}
        <ChevronDown aria-hidden="true" />
      </button>
      <span id={id} className="sr-only" role="status" aria-label={status}>
        {status}
      </span>
      <ModalShell
        open={open}
        onClose={close}
        labelledBy={`${id}-title`}
        panelClassName="pdf-page-jump-dialog"
      >
        <header className="pdf-dialog__header">
          <h2 id={`${id}-title`} className="pdf-dialog__title">
            Go to page
          </h2>
          <ModalCloseButton onClick={close} label="Close page navigation" />
        </header>
        <form
          className="pdf-dialog__body"
          aria-labelledby={`${id}-title`}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const input = field.current;
            if (!input) return;
            if (!input.validity.valid) {
              setInvalid(true);
              input.focus();
              return;
            }
            onChange(input.valueAsNumber - 1);
            close();
          }}
        >
          <label className="air-label" htmlFor={`${id}-number`}>
            Page number (1–{total})
          </label>
          <div className="pdf-page-jump-fields">
            <div className="air-field-group">
              <input
                ref={field}
                id={`${id}-number`}
                className="air-field"
                type="number"
                name="page"
                min={1}
                max={total}
                step={1}
                required
                inputMode="numeric"
                enterKeyHint="go"
                autoComplete="off"
                placeholder={`Current page ${page + 1}`}
                data-dialog-initial-focus
                aria-invalid={invalid || undefined}
                aria-describedby={invalid ? `${id}-error` : undefined}
                onChange={(event) => {
                  if (invalid && event.currentTarget.validity.valid) setInvalid(false);
                }}
              />
            </div>
            <button type="submit" className="air-button air-button--primary">
              Go
            </button>
          </div>
          {invalid && (
            <p id={`${id}-error`} role="alert" className="air-help air-help--error">
              Enter a whole page number from 1 to {total}.
            </p>
          )}
        </form>
      </ModalShell>
    </>
  );
}

export function PagePreviewNav({ page, total, onChange, compact = false }: PagePreviewNavProps) {
  if (total <= 1) return null;
  return (
    <nav className="pdf-page-nav" aria-label="Preview pages">
      <button
        type="button"
        className="air-icon-button air-button--quiet"
        aria-label="Previous page"
        disabled={page <= 0}
        onClick={() => onChange(Math.max(0, page - 1))}
      >
        <ChevronLeft size={18} strokeWidth={1.6} aria-hidden="true" />
      </button>
      {compact ? (
        <PageJump page={page} total={total} onChange={onChange} />
      ) : (
        <span role="status" aria-label={`Page ${page + 1} of ${total}`}>
          Page {page + 1} of {total}
        </span>
      )}
      <button
        type="button"
        className="air-icon-button air-button--quiet"
        aria-label="Next page"
        disabled={page >= total - 1}
        onClick={() => onChange(Math.min(total - 1, page + 1))}
      >
        <ChevronRight size={18} strokeWidth={1.6} aria-hidden="true" />
      </button>
    </nav>
  );
}
