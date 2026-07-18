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
    <div className="cloak-notice border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-900/20">
      <Lock
        className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400"
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0 text-sm leading-relaxed">
        <p className="font-semibold mb-0.5 text-amber-800 dark:text-amber-200">
          This PDF is password-protected
        </p>
        <p className="text-amber-700/90 dark:text-amber-300/90">
          <span className="font-medium">{file.name}</span> ({formatFileSize(file.size)}) is
          encrypted and can't be processed by this tool. Remove the password first with{" "}
          <span className="font-medium">PDF Password</span>, then come back and open the unlocked
          copy.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigateToTool("pdf-password")}
            className="cloak-focus inline-flex min-h-10 items-center gap-2 rounded-md bg-primary-600 px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-primary-700 pointer-coarse:min-h-11"
          >
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            Open PDF Password
          </button>
          <button
            type="button"
            onClick={onChangeFile}
            className="cloak-focus min-h-10 rounded-md px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide text-amber-800 transition-colors hover:bg-amber-100 pointer-coarse:min-h-11 dark:text-amber-200 dark:hover:bg-amber-900/40"
          >
            Choose another file
          </button>
        </div>
      </div>
    </div>
  );
}
