/** Local PDF protection/removal; document security stays in pdf-security.ts. */
import { AlertTriangle, Check, Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ActionButton } from "../components/ActionButton.tsx";
import { AlertBox } from "../components/AlertBox.tsx";
import { FileDropZone } from "../components/FileDropZone.tsx";
import { FileInfoBar } from "../components/FileInfoBar.tsx";
import { LoadingState } from "../components/LoadingState.tsx";
import { downloadPdf, errorMessage, formatFileSize, pdfFilename } from "../utils/file-helpers.ts";
import { openEditorWithFile } from "../utils/nav.ts";
import { isPdfEncrypted, protectPdf, unlockPdf } from "../utils/pdf-security.ts";

type PdfState = "idle" | "detecting" | "unencrypted" | "encrypted" | "error";
const PERMISSION_ROWS = [
  { key: "print", bit: 0x004, label: "Print", description: "Allow printing the document" },
  {
    key: "printHighQuality",
    bit: 0x800,
    label: "Print (high quality)",
    description: "Allow high-resolution printing",
  },
  {
    key: "copy",
    bit: 0x010,
    label: "Copy text & images",
    description: "Allow selecting and copying content",
  },
  {
    key: "modify",
    bit: 0x008,
    label: "Modify content",
    description: "Allow editing document content",
  },
  {
    key: "annotate",
    bit: 0x020,
    label: "Add / edit annotations",
    description: "Allow adding comments and annotations",
  },
  {
    key: "fillForms",
    bit: 0x100,
    label: "Fill form fields",
    description: "Allow filling interactive form fields",
  },
] as const;
type Permissions = Record<(typeof PERMISSION_ROWS)[number]["key"], boolean>;
const DEFAULT_PERMISSIONS: Permissions = {
  print: true,
  printHighQuality: true,
  modify: false,
  copy: false,
  annotate: false,
  fillForms: true,
};
function buildPermissionsMask(permissions: Permissions): number {
  return PERMISSION_ROWS.reduce((mask, row) => (permissions[row.key] ? mask : mask & ~row.bit), -4);
}

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  hint?: string;
  invalid?: boolean;
  show: boolean;
  onToggleShow: () => void;
  busy: boolean;
  autoComplete: string;
}
function PasswordField({
  id,
  label,
  value,
  onChange,
  onBlur,
  hint,
  invalid,
  show,
  onToggleShow,
  busy,
  autoComplete,
}: PasswordFieldProps) {
  return (
    <div>
      <label className="air-label" htmlFor={id}>
        {label}
      </label>
      <div className="air-field-group">
        <input
          id={id}
          name={id}
          className="air-field"
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          readOnly={busy}
          aria-invalid={invalid || undefined}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
        <span className="air-field-actions">
          <button
            type="button"
            className="air-icon-button air-button--quiet air-field-clear"
            aria-label={`${show ? "Hide" : "Show"} ${label.toLowerCase()}`}
            disabled={busy}
            onClick={onToggleShow}
          >
            {show ? (
              <EyeOff size={18} strokeWidth={1.6} aria-hidden="true" />
            ) : (
              <Eye size={18} strokeWidth={1.6} aria-hidden="true" />
            )}
          </button>
        </span>
      </div>
      {hint && (
        <p
          id={`${id}-hint`}
          className={`air-help${invalid ? " air-help--error" : ""}`}
          role={invalid ? "alert" : undefined}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export default function PdfPassword() {
  const root = useRef<HTMLDivElement>(null);
  const generation = useRef(0);
  const alive = useRef(true);
  const inFlight = useRef(false);
  const focusRequest = useRef<"intake" | "result" | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pdfState, setPdfState] = useState<PdfState>("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmInvalid, setConfirmInvalid] = useState(false);
  const [currentInvalid, setCurrentInvalid] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [restrictPermissions, setRestrictPermissions] = useState(false);
  const [permissions, setPermissions] = useState<Permissions>(DEFAULT_PERMISSIONS);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      generation.current++;
    };
  }, []);
  useEffect(() => {
    if (!focusRequest.current) return;
    const selector =
      pdfState === "detecting"
        ? ".pdf-file-info button"
        : focusRequest.current === "intake"
          ? 'input[type="file"]'
          : "[data-password-heading]";
    const target = root.current?.querySelector<HTMLElement>(selector);
    if (target) {
      target.focus();
      if (pdfState !== "detecting") focusRequest.current = null;
    }
  }, [pdfState, file]);

  const clearDraft = () => {
    setNewPassword("");
    setConfirmPassword("");
    setCurrentPassword("");
    setShowNewPw(false);
    setShowConfirmPw(false);
    setShowCurrentPw(false);
    setConfirmInvalid(false);
    setCurrentInvalid(false);
    setRestrictPermissions(false);
    setPermissions(DEFAULT_PERMISSIONS);
    setError(null);
    setSuccess(null);
  };
  const reset = () => {
    if (inFlight.current) return;
    generation.current++;
    focusRequest.current = "intake";
    setFile(null);
    setPdfState("idle");
    clearDraft();
  };
  const handleFile = async (files: File[]) => {
    if (inFlight.current || !files.length) return;
    const pdf = files[0];
    if (pdf.type !== "application/pdf" && !/\.pdf$/i.test(pdf.name)) {
      setError("Choose a PDF file to add or remove its password.");
      return;
    }
    const request = ++generation.current;
    focusRequest.current = "result";
    clearDraft();
    setFile(pdf);
    setPdfState("detecting");
    try {
      const encrypted = await isPdfEncrypted(pdf);
      if (alive.current && request === generation.current)
        setPdfState(encrypted ? "encrypted" : "unencrypted");
    } catch {
      if (alive.current && request === generation.current) setPdfState("error");
    }
  };
  const changeValue = (set: (value: string) => void, value: string) => {
    if (inFlight.current) return;
    set(value);
    setSuccess(null);
    setError(null);
  };
  const run = async (delivery: "download" | "editor" = "download") => {
    if (!file || inFlight.current || !["encrypted", "unencrypted"].includes(pdfState)) return;
    if (pdfState === "unencrypted" && (!newPassword || newPassword !== confirmPassword)) {
      setConfirmInvalid(Boolean(newPassword));
      root.current
        ?.querySelector<HTMLInputElement>(newPassword ? "#confirm-password" : "#new-password")
        ?.focus();
      return;
    }
    inFlight.current = true;
    const request = generation.current;
    setBusy(true);
    setError(null);
    setCurrentInvalid(false);
    setSuccess(null);
    try {
      const protect = pdfState === "unencrypted";
      const bytes = protect
        ? await protectPdf(
            file,
            newPassword,
            undefined,
            restrictPermissions ? buildPermissionsMask(permissions) : undefined,
          )
        : await unlockPdf(file, currentPassword);
      if (!alive.current || request !== generation.current) return;
      const name = pdfFilename(file, protect ? "_protected" : "_unlocked");
      if (delivery === "editor" && !protect) {
        openEditorWithFile(new File([bytes.slice()], name, { type: "application/pdf" }));
      } else {
        downloadPdf(bytes, name);
        setSuccess(
          `${protect ? "Password added successfully." : "Password removed successfully."} ${name} is ready. Download requested. Your source file is unchanged.`,
        );
      }
    } catch (cause) {
      if (!alive.current || request !== generation.current) return;
      const incorrect =
        pdfState === "encrypted" &&
        /incorrect|invalid password|password is incorrect/i.test(errorMessage(cause, ""));
      setCurrentInvalid(incorrect);
      setError(
        incorrect
          ? null
          : pdfState === "encrypted"
            ? "Couldn’t unlock this PDF. Your file and password are still here. Check the password or choose another PDF."
            : "Couldn’t protect this PDF. Your file and settings are still here. Try again or choose another PDF.",
      );
      if (incorrect) root.current?.querySelector<HTMLInputElement>("#current-password")?.focus();
    } finally {
      inFlight.current = false;
      if (alive.current && request === generation.current) setBusy(false);
    }
  };
  const ready = pdfState === "unencrypted" || pdfState === "encrypted";
  const passwordsMatch = newPassword === confirmPassword;
  const confirmMismatch = confirmInvalid && !passwordsMatch;

  return (
    <div className="pdf-password" ref={root}>
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
          disabled={busy}
          changeLabel={pdfState === "detecting" ? "Cancel check" : "Change file"}
          status={pdfState === "encrypted" ? "Password protected" : undefined}
        />
      )}
      {pdfState === "detecting" && <LoadingState label="Checking PDF security…" />}
      {pdfState === "error" && (
        <div className="pdf-password-recovery">
          <h2 data-password-heading tabIndex={-1}>
            Couldn’t read this PDF
          </h2>
          <p className="air-help">
            Choose a valid PDF, or try reading this file again. Your source file is unchanged.
          </p>
          <button
            type="button"
            className="air-button"
            onClick={() => file && void handleFile([file])}
          >
            Try again
          </button>
        </div>
      )}
      {ready && (
        <>
          <div className="pdf-password-heading">
            <h2 data-password-heading tabIndex={-1}>
              {pdfState === "unencrypted" ? "Add password" : "Remove password"}
            </h2>
            <p className="air-help">
              {pdfState === "unencrypted"
                ? "Encrypt a copy with AES-256. Keep your password somewhere safe."
                : "Decrypt and save an unlocked copy, or continue in the editor."}
            </p>
          </div>
          <div className="pdf-password-fields">
            {pdfState === "unencrypted" ? (
              <>
                <PasswordField
                  id="new-password"
                  label="New password"
                  value={newPassword}
                  onChange={(value) => changeValue(setNewPassword, value)}
                  hint="Required to open the protected copy."
                  autoComplete="new-password"
                  show={showNewPw}
                  onToggleShow={() => setShowNewPw(!showNewPw)}
                  busy={busy}
                />
                <PasswordField
                  id="confirm-password"
                  label="Confirm password"
                  value={confirmPassword}
                  onChange={(value) => changeValue(setConfirmPassword, value)}
                  onBlur={() => setConfirmInvalid(Boolean(confirmPassword) && !passwordsMatch)}
                  invalid={confirmMismatch}
                  hint={
                    confirmMismatch
                      ? "Passwords do not match. Enter the same password in both fields."
                      : "Enter the new password again."
                  }
                  autoComplete="new-password"
                  show={showConfirmPw}
                  onToggleShow={() => setShowConfirmPw(!showConfirmPw)}
                  busy={busy}
                />
              </>
            ) : (
              <PasswordField
                id="current-password"
                label="Current password"
                value={currentPassword}
                onChange={(value) => changeValue(setCurrentPassword, value)}
                invalid={currentInvalid}
                hint={
                  currentInvalid
                    ? "Incorrect password. Check it and try again."
                    : "Leave blank if the PDF uses an empty password."
                }
                autoComplete="current-password"
                show={showCurrentPw}
                onToggleShow={() => setShowCurrentPw(!showCurrentPw)}
                busy={busy}
              />
            )}
          </div>
          {pdfState === "unencrypted" && (
            <div className="pdf-password-permissions">
              <label className="air-check-label">
                <input
                  type="checkbox"
                  className="air-check"
                  checked={restrictPermissions}
                  disabled={busy}
                  aria-controls="perm-panel"
                  onChange={(event) => {
                    setRestrictPermissions(event.target.checked);
                    setSuccess(null);
                  }}
                />
                <span>
                  Restrict permissions
                  <span className="air-help">
                    {restrictPermissions
                      ? "Only the selected operations will be allowed in compatible viewers."
                      : "All operations are allowed unless you turn on restrictions."}
                  </span>
                </span>
              </label>
              <div id="perm-panel" hidden={!restrictPermissions}>
                <fieldset className="air-choice-group" disabled={busy}>
                  <legend>Allowed operations</legend>
                  {PERMISSION_ROWS.map(({ key, label, description }) => (
                    <label key={key} className="air-check-label pdf-permission-row">
                      <input
                        className="air-check"
                        type="checkbox"
                        checked={permissions[key]}
                        aria-label={label}
                        aria-describedby={`permission-${key}-help`}
                        onChange={() => {
                          setPermissions((previous) => ({ ...previous, [key]: !previous[key] }));
                          setSuccess(null);
                        }}
                      />
                      <span>
                        {label}
                        <span id={`permission-${key}-help`} className="air-help">
                          {description}
                        </span>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <div className="air-notice air-notice--warning pdf-result">
                  <AlertTriangle size={18} strokeWidth={1.6} aria-hidden="true" />
                  <div>
                    <p className="pdf-password-notice-title">Viewer compatibility</p>
                    <p>
                      Permission restrictions depend on the PDF viewer. Some viewers may ignore them
                      and allow all operations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <ActionButton
            onClick={() => run()}
            processing={busy}
            disabled={pdfState === "unencrypted" && (!newPassword || !passwordsMatch)}
            label={pdfState === "unencrypted" ? "Protect & Download" : "Unlock & Download"}
            processingLabel={pdfState === "unencrypted" ? "Protecting…" : "Unlocking…"}
            secondaryLabel={pdfState === "encrypted" ? "Unlock & edit" : undefined}
            onSecondaryClick={pdfState === "encrypted" ? () => run("editor") : undefined}
          />
          {busy && (
            <p className="air-help">
              Keep this tool open until it finishes. Your source file is unchanged.
            </p>
          )}
        </>
      )}
      {success && (
        <div className="air-notice air-notice--success pdf-result" role="status">
          <Check size={18} strokeWidth={1.6} aria-hidden="true" />
          <p>{success}</p>
        </div>
      )}
      {error && <AlertBox message={error} />}
    </div>
  );
}
