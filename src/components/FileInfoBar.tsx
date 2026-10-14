interface FileInfoBarProps {
  fileName: string;
  details: string;
  status?: string;
  onChangeFile?: () => void;
  changeLabel?: string;
  disabled?: boolean;
}

/** Shared selected-file identity; file names remain readable at every width. */
export function FileInfoBar({
  fileName,
  details,
  status,
  onChangeFile,
  changeLabel = "Change file",
  disabled = false,
}: FileInfoBarProps) {
  return (
    <div className="air-file-selection pdf-file-info">
      <div>
        <p className="pdf-file-info-name">{fileName}</p>
        <p className="air-help">{details}</p>
        <p className="air-help" role="status">
          {status}
        </p>
      </div>
      {onChangeFile && (
        <button
          type="button"
          className="air-button"
          aria-disabled={disabled || undefined}
          onClick={() => {
            if (!disabled) onChangeFile();
          }}
        >
          {changeLabel}
        </button>
      )}
    </div>
  );
}
