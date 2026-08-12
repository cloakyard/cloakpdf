/**
 * PDF Password tool.
 *
 * Uploads a PDF, auto-detects whether it is encrypted, then shows the
 * appropriate form:
 *   - Unencrypted PDF → Add Password (protects with AES-256) with optional
 *     permission restrictions (print, copy, modify, annotate, fill forms).
 *   - Encrypted PDF   → Remove Password (decrypts using the supplied password)
 *
 * All processing happens entirely in the browser — no files are uploaded.
 */

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Copy,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  type LucideIcon,
  MessageSquare,
  Pencil,
  Printer,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { ActionButton } from "../components/ActionButton.tsx";
import { AlertBox } from "../components/AlertBox.tsx";
import { FileDropZone } from "../components/FileDropZone.tsx";
import { FileInfoBar } from "../components/FileInfoBar.tsx";
import { InfoCallout } from "../components/InfoCallout.tsx";
import { useAsyncProcess } from "../hooks/useAsyncProcess.ts";
import { downloadPdf, errorMessage, formatFileSize, pdfFilename } from "../utils/file-helpers.ts";
import { openEditorWithFile } from "../utils/nav.ts";
import { isPdfEncrypted, protectPdf, unlockPdf } from "../utils/pdf-security.ts";

type PdfState = "idle" | "detecting" | "unencrypted" | "encrypted";

// PDF permission bit masks (§7.6.3.2 Table 22)
const PERM_PRINT = 0x004;
const PERM_MODIFY = 0x008;
const PERM_COPY = 0x010;
const PERM_ANNOTATE = 0x020;
const PERM_FILL_FORMS = 0x100;
const PERM_PRINT_HQ = 0x800;

interface Permissions {
  print: boolean;
  printHighQuality: boolean;
  modify: boolean;
  copy: boolean;
  annotate: boolean;
  fillForms: boolean;
}

function buildPermissionsMask(p: Permissions): number {
  let mask = -4; // ALL_PERMS = 0xFFFFFFFC
  if (!p.print) mask &= ~PERM_PRINT;
  if (!p.printHighQuality) mask &= ~PERM_PRINT_HQ;
  if (!p.modify) mask &= ~PERM_MODIFY;
  if (!p.copy) mask &= ~PERM_COPY;
  if (!p.annotate) mask &= ~PERM_ANNOTATE;
  if (!p.fillForms) mask &= ~PERM_FILL_FORMS;
  return mask;
}

const PERMISSION_ROWS: {
  key: keyof Permissions;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  { key: "print", icon: Printer, label: "Print", description: "Allow printing the document" },
  {
    key: "printHighQuality",
    icon: Printer,
    label: "Print (high quality)",
    description: "Allow high-resolution printing",
  },
  {
    key: "copy",
    icon: Copy,
    label: "Copy text & images",
    description: "Allow selecting and copying content",
  },
  {
    key: "modify",
    icon: Pencil,
    label: "Modify content",
    description: "Allow editing document content",
  },
  {
    key: "annotate",
    icon: MessageSquare,
    label: "Add / edit annotations",
    description: "Allow adding comments and annotations",
  },
  {
    key: "fillForms",
    icon: ClipboardList,
    label: "Fill form fields",
    description: "Allow filling interactive form fields",
  },
];

interface PasswordFieldProps {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  invalid?: boolean;
  show: boolean;
  onToggleShow: () => void;
}

function PasswordField({
  id,
  label,
  hint,
  value,
  onChange,
  placeholder = "Enter password",
  autoComplete = "off",
  invalid = false,
  show,
  onToggleShow,
}: PasswordFieldProps) {
  const hintId = `${id}-hint`;

  return (
    <div className="space-y-2 py-4">
      <label htmlFor={id} className="block text-sm font-medium text-[var(--color-ink)]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-describedby={hintId}
          aria-invalid={invalid || undefined}
          className="cloak-focus min-h-11 w-full rounded-md border border-[var(--color-rule-strong)] bg-[var(--color-paper)] px-3 py-2 pr-12 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] transition-[color,background-color,border-color]"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="cloak-focus absolute right-1 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded text-slate-400 hover:text-slate-600 dark:hover:text-dark-text transition-colors"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      <p
        id={hintId}
        role={invalid ? "alert" : undefined}
        className={`min-h-[1lh] text-xs ${invalid ? "text-red-600 dark:text-red-400" : "text-[var(--color-ink-3)]"}`}
      >
        {hint ?? "\u00a0"}
      </p>
    </div>
  );
}

export default function PdfPassword() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfState, setPdfState] = useState<PdfState>("idle");

  // Add-password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Remove-password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);

  // Permissions state (only used when adding a password)
  const [showPerms, setShowPerms] = useState(false);
  const [permissions, setPermissions] = useState<Permissions>({
    print: true,
    printHighQuality: true,
    modify: false,
    copy: false,
    annotate: false,
    fillForms: true,
  });

  // Shared operation state — uses useAsyncProcess for the processing/error
  // machine. `success` stays local because it's a boolean, not a message.
  const task = useAsyncProcess();
  const processing = task.processing;
  const error = task.error;
  const setError = task.setError;
  const [success, setSuccess] = useState(false);

  // The unlock path can't use task.run (it needs to rewrite the error message
  // per failure mode), so it carries its own processing flag + re-entrancy
  // guard — otherwise both unlock buttons stay enabled and spinner-less while
  // a decrypt is in flight, letting a user fire "& Download" and "& edit"
  // concurrently. `busy` folds both paths into one signal for the buttons.
  const [unlocking, setUnlocking] = useState(false);
  const unlockInFlight = useRef(false);
  const busy = processing || unlocking;

  const handleFile = useCallback(
    async (files: File[]) => {
      const pdf = files[0];
      if (!pdf) return;
      setFile(pdf);
      setError(null);
      setSuccess(false);
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
      setPdfState("detecting");
      try {
        const encrypted = await isPdfEncrypted(pdf);
        setPdfState(encrypted ? "encrypted" : "unencrypted");
      } catch {
        setPdfState("unencrypted"); // fallback: let the operation surface the real error
      }
    },
    [setError],
  );

  const reset = useCallback(() => {
    setFile(null);
    setPdfState("idle");
    setError(null);
    setSuccess(false);
    setNewPassword("");
    setConfirmPassword("");
    setCurrentPassword("");
    setShowPerms(false);
  }, [setError]);

  const togglePermission = useCallback((key: keyof Permissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleAddPassword = useCallback(async () => {
    if (!file) return;
    if (!newPassword) {
      setError("Please enter a password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSuccess(false);
    const ok = await task.run(async () => {
      const permMask = showPerms ? buildPermissionsMask(permissions) : undefined;
      const bytes = await protectPdf(file, newPassword, undefined, permMask);
      downloadPdf(bytes, pdfFilename(file, "_protected"));
    }, "Failed to add password.");
    if (ok) setSuccess(true);
  }, [file, newPassword, confirmPassword, showPerms, permissions, task, setError]);

  /**
   * Unlock the PDF and hand the bytes to the chosen delivery (download for
   * the primary CTA, the unified editor for the secondary "Unlock & edit").
   * Doesn't use task.run — this handler needs to rewrite the error message
   * based on the failure mode (incorrect password vs. missing password vs.
   * generic), which run()'s fallback-string contract can't express.
   */
  const runUnlock = useCallback(
    async (deliver: (bytes: Uint8Array) => void) => {
      if (!file) return;
      if (unlockInFlight.current) return; // mirror task.run's double-click guard
      unlockInFlight.current = true;
      setUnlocking(true);
      setSuccess(false);
      try {
        const bytes = await unlockPdf(file, currentPassword);
        deliver(bytes);
        setError(null);
      } catch (e) {
        const msg = errorMessage(e, "Failed to unlock PDF.");
        if (msg.toLowerCase().includes("incorrect") || msg.toLowerCase().includes("invalid")) {
          setError("Incorrect password. Please check and try again.");
        } else if (
          msg.toLowerCase().includes("password") ||
          msg.toLowerCase().includes("encrypt")
        ) {
          setError("A password is required to open this PDF. Please enter the current password.");
        } else {
          setError(msg);
        }
      } finally {
        unlockInFlight.current = false;
        setUnlocking(false);
      }
    },
    [file, currentPassword, setError],
  );

  const handleRemovePassword = useCallback(
    () =>
      runUnlock((bytes) => {
        if (!file) return;
        downloadPdf(bytes, pdfFilename(file, "_unlocked"));
        setSuccess(true);
      }),
    [runUnlock, file],
  );

  const handleUnlockAndEdit = useCallback(
    () =>
      runUnlock((bytes) => {
        if (!file) return;
        openEditorWithFile(
          new File([bytes.slice()], pdfFilename(file, "_unlocked"), { type: "application/pdf" }),
        );
      }),
    [runUnlock, file],
  );

  const passwordsMatch = newPassword === confirmPassword;
  const canSubmitAdd = !!file && !!newPassword && passwordsMatch && !busy;
  const canSubmitRemove = !!file && !busy;

  return (
    <div className="space-y-6">
      {/* File picker */}
      {!file ? (
        <FileDropZone
          accept=".pdf,application/pdf"
          onFiles={handleFile}
          label="Drop a PDF file here"
          hint="Select a PDF to add or remove a password"
        />
      ) : (
        <FileInfoBar
          fileName={file.name}
          details={formatFileSize(file.size)}
          onChangeFile={reset}
          extra={
            pdfState === "detecting" ? (
              <span className="ml-2 animate-pulse font-mono text-[10px] uppercase tracking-[0.05em] text-[var(--color-ink-3)]">
                Detecting…
              </span>
            ) : pdfState === "encrypted" ? (
              <span className="ml-2 rounded-sm border border-primary-200 bg-primary-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-primary-600 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                Password protected
              </span>
            ) : undefined
          }
        />
      )}

      {/* Panel: Add Password (unencrypted PDF) */}
      {pdfState === "unencrypted" && (
        <div className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
          <div className="flex items-center gap-3 py-3">
            <Lock className="h-4 w-4 text-primary-600" aria-hidden="true" />
            <div>
              <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink)]">
                Add Password
              </h2>
              <p className="mt-0.5 text-xs text-[var(--color-ink-3)]">Encrypt with AES-256</p>
            </div>
          </div>
          <PasswordField
            id="new-password"
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Enter new password…"
            autoComplete="new-password"
            show={showNewPw}
            onToggleShow={() => setShowNewPw((v) => !v)}
          />
          <PasswordField
            id="confirm-password"
            label="Confirm password"
            hint={confirmPassword && !passwordsMatch ? "Passwords do not match" : undefined}
            invalid={Boolean(confirmPassword && !passwordsMatch)}
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter new password…"
            autoComplete="new-password"
            show={showConfirmPw}
            onToggleShow={() => setShowConfirmPw((v) => !v)}
          />
        </div>
      )}

      {/* Collapsible permissions section (only for Add Password) */}
      {pdfState === "unencrypted" && (
        <>
          <button
            type="button"
            onClick={() => setShowPerms((v) => !v)}
            aria-expanded={showPerms}
            aria-controls="perm-panel"
            className="-mx-2 flex min-h-11 items-center gap-2 rounded-sm px-2 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <ChevronRight
              className={`cloak-disclosure-icon w-4 h-4 ${showPerms ? "rotate-90" : ""}`}
              aria-hidden="true"
            />
            Restrict permissions
          </button>

          {showPerms && (
            <div id="perm-panel" className="space-y-6">
              <div className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
                <div className="py-2.5">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-3)]">
                    Allowed Operations
                  </p>
                </div>
                {PERMISSION_ROWS.map(({ key, icon: Icon, label, description }) => (
                  <label
                    key={key}
                    className="flex min-h-14 cursor-pointer items-center justify-between gap-3 py-3 transition-colors hover:bg-[var(--color-paper)]"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0 text-primary-500" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-medium text-[var(--color-ink)]">{label}</p>
                        <p className="text-xs text-[var(--color-ink-3)]">{description}</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={permissions[key]}
                      onChange={() => togglePermission(key)}
                      className="accent-primary-600 w-4 h-4 rounded shrink-0"
                    />
                  </label>
                ))}
              </div>

              <InfoCallout icon={AlertTriangle} title="Viewer compatibility" accent="warning">
                Permission restrictions are enforced by Adobe Acrobat/Reader. Other viewers such as
                macOS Preview and Chrome may ignore them and allow all operations regardless.
              </InfoCallout>
            </div>
          )}
        </>
      )}

      {/* Panel: Remove Password (encrypted PDF) */}
      {pdfState === "encrypted" && (
        <div className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
          <div className="flex items-center gap-3 py-3">
            <LockOpen className="h-4 w-4 text-primary-600" aria-hidden="true" />
            <div>
              <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink)]">
                Remove Password
              </h2>
              <p className="mt-0.5 text-xs text-[var(--color-ink-3)]">
                Decrypt and save an unlocked copy
              </p>
            </div>
          </div>
          <PasswordField
            id="current-password"
            label="Current password"
            hint="Leave blank if the PDF uses an empty password."
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="Enter current password…"
            autoComplete="current-password"
            show={showCurrentPw}
            onToggleShow={() => setShowCurrentPw((v) => !v)}
          />
        </div>
      )}

      {/* Action button. Labels budgeted for the 320px CTA (ActionButton
          labels never wrap): "Remove Password & Download" overflowed the pill.
          The secondary "& edit" exists only on the unlock path — the protect
          path's output is encrypted, which the editor can't open. */}
      {(pdfState === "unencrypted" || pdfState === "encrypted") && (
        <ActionButton
          onClick={pdfState === "unencrypted" ? handleAddPassword : handleRemovePassword}
          processing={busy}
          disabled={pdfState === "unencrypted" ? !canSubmitAdd : !canSubmitRemove}
          label={pdfState === "unencrypted" ? "Protect & Download" : "Unlock & Download"}
          processingLabel={pdfState === "unencrypted" ? "Protecting…" : "Unlocking…"}
          secondaryLabel={pdfState === "encrypted" ? "Unlock & edit" : undefined}
          onSecondaryClick={pdfState === "encrypted" ? handleUnlockAndEdit : undefined}
        />
      )}

      {/* Success */}
      {success && (
        <InfoCallout icon={CheckCircle2} live>
          {pdfState === "unencrypted"
            ? "Password added successfully. The protected PDF has been downloaded."
            : "Password removed successfully. The unlocked PDF has been downloaded."}
        </InfoCallout>
      )}

      {/* Error */}
      {error && <AlertBox message={error} />}
    </div>
  );
}
