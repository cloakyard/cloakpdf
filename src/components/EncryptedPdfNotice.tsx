/**
 * Inline notice shown when a tool that requires an unencrypted PDF is
 * fed a password-protected one.
 *
 * Replaces the file dropzone (and any error alert) so the user lands on
 * actionable copy instead of a raw "No password given" / "EncryptedPDFError"
 * line. The primary CTA deep-links into the PDF Password tool — that's the
 * one tool in the app that can strip the password — and a secondary
 * "Choose another file" returns the user to the dropzone.
 */
import { Lock } from "lucide-react";
import { formatFileSize } from "../utils/file-helpers.ts";
import { navigateToTool } from "../utils/nav.ts";

interface EncryptedPdfNoticeProps {
  /** The encrypted PDF the user just tried to upload. */
  file: File;
  /** Clear the encrypted-file state and return the dropzone. */
  onChangeFile: () => void;
}

export function EncryptedPdfNotice({ file, onChangeFile }: EncryptedPdfNoticeProps) {
  return (
    <div className="pdf-encrypted" role="status">
      <Lock size={20} aria-hidden="true" />
      <div>
        <p className="pdf-encrypted-title">This PDF is password-protected</p>
        <p>
          <span>{file.name}</span> ({formatFileSize(file.size)}) is encrypted and can't be processed
          by this tool. Remove the password first with PDF Password, then come back and open the
          unlocked copy.
        </p>
        <div className="pdf-actions">
          <button
            type="button"
            onClick={() => navigateToTool("pdf-password")}
            className="air-button air-button--primary"
          >
            Open PDF Password
          </button>
          <button type="button" onClick={onChangeFile} className="air-button">
            Choose another file
          </button>
        </div>
      </div>
    </div>
  );
}
