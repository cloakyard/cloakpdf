interface FileInfoBarProps {
  fileName: string;
  details: string;
  /**
   * Click handler for the "Change file" link. When omitted the link is
   * hidden — useful for read-only contexts where the displayed file is an
   * intermediate result rather than a user choice.
   */
  onChangeFile?: () => void;
  extra?: React.ReactNode;
}

/** Standard "selected file" header shown by every tool. */
export function FileInfoBar({ fileName, details, onChangeFile, extra }: FileInfoBarProps) {
  return (
    <div className="cloak-file-info flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
      <p className="min-w-0 wrap-anywhere font-mono text-xs text-[var(--color-ink-2)]">
        <span className="font-medium">{fileName}</span> —{" "}
        <span className="tabular-nums">{details}</span>
        {extra}
      </p>
      {onChangeFile && (
        <button
          type="button"
          onClick={onChangeFile}
          // inline-flex + min-h-11 + the negative margin mirror ComparePdf's
          // "Change" buttons: a 44px tap target on touch with desktop spacing
          // unchanged (the -mx-2 cancels the px-2 so the resting layout matches
          // the old bare link).
          className="-mx-2 inline-flex min-h-11 items-center rounded-sm px-2 font-mono text-[11px] uppercase tracking-[0.04em] text-primary-600 transition-colors hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          Change file
        </button>
      )}
    </div>
  );
}
