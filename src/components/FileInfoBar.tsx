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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <p className="text-sm text-slate-600 dark:text-dark-text-muted wrap-anywhere min-w-0">
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
          className="inline-flex items-center min-h-11 px-2 -mx-2 rounded text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          Change file
        </button>
      )}
    </div>
  );
}
