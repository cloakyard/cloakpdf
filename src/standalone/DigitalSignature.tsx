/**
 * Digital Signature tool.
 *
 * Allows users to digitally sign a PDF with a cryptographic certificate.
 * Supports uploading a PKCS#12 (.p12/.pfx) certificate file or generating
 * a self-signed certificate for personal use. The signed PDF embeds a
 * PKCS#7 detached signature that is verifiable by PDF readers.
 *
 * All processing happens entirely in the browser — no files are uploaded.
 */

import { useCallback, useEffect, useState } from "react";
import {
  Award,
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileKey2,
  FolderOpen,
  Globe,
  Hash,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MapPin,
  MessageSquareText,
  ShieldCheck,
  ShieldQuestion,
  User,
} from "lucide-react";
import { ActionButton } from "../components/ActionButton.tsx";
import { AlertBox } from "../components/AlertBox.tsx";
import { FileDropZone } from "../components/FileDropZone.tsx";
import { FileInfoBar } from "../components/FileInfoBar.tsx";
import { InfoCallout } from "../components/InfoCallout.tsx";
import { SegmentedControl } from "../components/SegmentedControl.tsx";
import { useAsyncProcess } from "../hooks/useAsyncProcess.ts";
import { downloadPdf, formatFileSize, pdfFilename } from "../utils/file-helpers.ts";
import { isPdfEncrypted } from "../utils/pdf-security.ts";
import {
  type CertificateInfo,
  type ExistingSignature,
  detectSignatures,
  generateSelfSignedCertAsync,
  parsePkcs12,
  signPdf,
} from "../utils/pdf-signer.ts";
import type forge from "node-forge";

type CertSource = "upload" | "generate";

/** Map raw PDF signature filter/subFilter to a user-friendly label. */
function formatSignatureStandard(filter: string, subFilter: string): string {
  const subFilterMap: Record<string, string> = {
    "adbe.pkcs7.detached": "PKCS#7 Detached Signature",
    "adbe.pkcs7.sha1": "PKCS#7 SHA-1 Signature",
    "adbe.x509.rsa_sha1": "X.509 RSA SHA-1",
    "ETSI.CAdES.detached": "CAdES Advanced Signature",
    "ETSI.RFC3161": "RFC 3161 Timestamp",
  };

  const filterMap: Record<string, string> = {
    "Adobe.PPKLite": "Adobe Standard",
    "Adobe.PPKMS": "Adobe Windows Crypto",
    "Entrust.PPKEF": "Entrust",
  };

  const friendlyType = subFilterMap[subFilter] ?? subFilter;
  const friendlyProvider = filterMap[filter] ?? filter;

  if (friendlyType && friendlyProvider) return `${friendlyType} (${friendlyProvider})`;
  return friendlyType || friendlyProvider || "Unknown";
}

/**
 * Digital Signature tool component.
 *
 * Workflow:
 * 1. User drops a PDF — existing signatures are auto-detected and displayed.
 * 2. User provides a certificate (upload .p12/.pfx or generate self-signed).
 * 3. Optionally fills in reason, location, and contact metadata.
 * 4. Signs the PDF and downloads the result.
 */
export default function DigitalSignature() {
  // PDF state
  const [file, setFile] = useState<File | null>(null);
  const [encryptedFile, setEncryptedFile] = useState<File | null>(null);
  const [existingSignatures, setExistingSignatures] = useState<ExistingSignature[]>([]);
  const [detectingSignatures, setDetectingSignatures] = useState(false);

  // Certificate state
  const [certSource, setCertSource] = useState<CertSource>("upload");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPassword, setCertPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [commonName, setCommonName] = useState("");

  // Parsed certificate
  const [certInfo, setCertInfo] = useState<CertificateInfo | null>(null);
  const [privateKey, setPrivateKey] = useState<forge.pki.PrivateKey | null>(null);
  const [certificate, setCertificate] = useState<forge.pki.Certificate | null>(null);
  const [certChain, setCertChain] = useState<forge.pki.Certificate[]>([]);

  // Signature metadata
  const [reason, setReason] = useState("");
  const [location, setLocation] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  // PDF-signing state is managed by `task`; certificate-loading state stays
  // local because the cert parsing errors use a separate panel from the
  // signing error.
  const task = useAsyncProcess();
  const processing = task.processing;
  const error = task.error;
  const setError = task.setError;
  const [certLoading, setCertLoading] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFile = useCallback(
    async (files: File[]) => {
      const pdf = files[0];
      if (!pdf) return;
      if (await isPdfEncrypted(pdf)) {
        setEncryptedFile(pdf);
        return;
      }
      setEncryptedFile(null);
      setFile(pdf);
      setExistingSignatures([]);
      setError(null);
      setSuccess(false);
    },
    [setError],
  );

  const clearEncrypted = useCallback(() => setEncryptedFile(null), []);

  // Detect existing signatures when a file is loaded
  useEffect(() => {
    if (!file) return;
    const currentFile = file;
    let cancelled = false;

    async function detect() {
      setDetectingSignatures(true);
      try {
        const sigs = await detectSignatures(currentFile);
        if (!cancelled) setExistingSignatures(sigs);
      } catch {
        // Detection failure is non-critical — just skip
      } finally {
        if (!cancelled) setDetectingSignatures(false);
      }
    }

    void detect();
    return () => {
      cancelled = true;
    };
  }, [file]);

  const resetAll = useCallback(() => {
    setFile(null);
    setExistingSignatures([]);
    setCertFile(null);
    setCertPassword("");
    setCertInfo(null);
    setPrivateKey(null);
    setCertificate(null);
    setCertChain([]);
    setCommonName("");
    setReason("");
    setLocation("");
    setContactInfo("");
    setError(null);
    setCertError(null);
    setSuccess(false);
  }, [setError]);

  const handleCertFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      setCertFile(f);
      setCertInfo(null);
      setCertError(null);
      setPrivateKey(null);
      setCertificate(null);
      setCertChain([]);

      // Try to parse immediately if password is provided
      if (certPassword) {
        setCertLoading(true);
        try {
          const bytes = await f.arrayBuffer();
          const result = parsePkcs12(bytes, certPassword);
          setPrivateKey(result.key);
          setCertificate(result.cert);
          setCertChain(result.chain);
          setCertInfo(result.info);
        } catch (err) {
          setCertError(err instanceof Error ? err.message : "Failed to parse certificate.");
        } finally {
          setCertLoading(false);
        }
      }
    },
    [certPassword],
  );

  const handleLoadCert = useCallback(async () => {
    if (!certFile) return;
    setCertLoading(true);
    setCertError(null);
    setCertInfo(null);
    try {
      const bytes = await certFile.arrayBuffer();
      const result = parsePkcs12(bytes, certPassword);
      setPrivateKey(result.key);
      setCertificate(result.cert);
      setCertChain(result.chain);
      setCertInfo(result.info);
    } catch (err) {
      setCertError(
        err instanceof Error ? err.message : "Failed to parse certificate. Check the password.",
      );
    } finally {
      setCertLoading(false);
    }
  }, [certFile, certPassword]);

  const handleGenerateCert = useCallback(async () => {
    if (!commonName.trim()) {
      setCertError("Please enter your name for the certificate.");
      return;
    }
    setCertLoading(true);
    setCertError(null);
    setCertInfo(null);

    // Key generation runs in a Web Worker (generateSelfSignedCertAsync) so the
    // multi-second 2048-bit RSA keygen no longer freezes the UI.
    try {
      const result = await generateSelfSignedCertAsync(commonName.trim());
      setPrivateKey(result.key);
      setCertificate(result.cert);
      setCertChain([]);
      setCertInfo(result.info);
    } catch (err) {
      setCertError(err instanceof Error ? err.message : "Failed to generate certificate.");
    } finally {
      setCertLoading(false);
    }
  }, [commonName]);

  const handleSign = useCallback(async () => {
    if (!file || !privateKey || !certificate) return;
    setSuccess(false);
    const ok = await task.run(async () => {
      const data = await signPdf(file, privateKey, certificate, certChain, {
        reason: reason || undefined,
        location: location || undefined,
        contactInfo: contactInfo || undefined,
      });
      downloadPdf(data, pdfFilename(file, "_signed"));
    }, "Failed to sign PDF.");
    if (ok) setSuccess(true);
  }, [file, privateKey, certificate, certChain, reason, location, contactInfo, task]);

  const canSign = file && privateKey && certificate;

  return (
    <div className="space-y-6">
      {/* Step 1: PDF file */}
      {!file ? (
        <FileDropZone
          accept=".pdf,application/pdf"
          onFiles={handleFile}
          encryptedFile={encryptedFile}
          onClearEncrypted={clearEncrypted}
          label="Drop a PDF file here"
          hint="Digitally sign with a cryptographic certificate"
        />
      ) : (
        <>
          <FileInfoBar
            fileName={file.name}
            details={formatFileSize(file.size)}
            onChangeFile={resetAll}
          />

          {/* Existing signatures */}
          {detectingSignatures && (
            <div
              role="status"
              className="flex items-center gap-2 text-sm text-slate-500 dark:text-dark-text-muted py-2"
            >
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Checking for existing signatures…
            </div>
          )}

          {!detectingSignatures && existingSignatures.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-3)]">
                <BadgeCheck className="h-4 w-4 text-primary-500" aria-hidden="true" />
                Existing Signatures ({existingSignatures.length})
              </h2>
              {existingSignatures.map((sig, idx) => (
                <div
                  key={`sig-${sig.signerName || "unknown"}-${sig.date || "nodate"}-${sig.filter}-${sig.subFilter}`}
                  className="border-y border-[var(--color-rule)] py-4 [&+&]:border-t-0"
                >
                  <div className="flex items-start gap-2 mb-3 min-w-0">
                    <ShieldCheck className="h-4 w-4 text-primary-600" aria-hidden="true" />
                    <span className="min-w-0 break-words font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink)]">
                      Signature {existingSignatures.length > 1 ? `#${idx + 1}` : ""}
                      {sig.signerName ? ` — ${sig.signerName}` : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                    {sig.signerName && (
                      <div className="flex items-start gap-1.5 min-w-0">
                        <User
                          className="h-3.5 w-3.5 shrink-0 text-primary-500"
                          aria-hidden="true"
                        />
                        <span className="text-slate-500 dark:text-dark-text-muted">Signer:</span>
                        <span className="text-slate-700 dark:text-dark-text font-medium min-w-0 break-words">
                          {sig.signerName}
                        </span>
                      </div>
                    )}
                    {sig.date && (
                      <div className="flex items-start gap-1.5 min-w-0">
                        <Clock
                          className="h-3.5 w-3.5 shrink-0 text-primary-500"
                          aria-hidden="true"
                        />
                        <span className="text-slate-500 dark:text-dark-text-muted">Date:</span>
                        <span className="text-slate-700 dark:text-dark-text min-w-0 break-words">
                          {sig.date}
                        </span>
                      </div>
                    )}
                    {sig.reason && (
                      <div className="flex items-start gap-1.5 min-w-0">
                        <MessageSquareText
                          className="h-3.5 w-3.5 shrink-0 text-primary-500"
                          aria-hidden="true"
                        />
                        <span className="text-slate-500 dark:text-dark-text-muted">Reason:</span>
                        <span className="text-slate-700 dark:text-dark-text min-w-0 break-words">
                          {sig.reason}
                        </span>
                      </div>
                    )}
                    {sig.location && (
                      <div className="flex items-start gap-1.5 min-w-0">
                        <MapPin
                          className="h-3.5 w-3.5 shrink-0 text-primary-500"
                          aria-hidden="true"
                        />
                        <span className="text-slate-500 dark:text-dark-text-muted">Location:</span>
                        <span className="text-slate-700 dark:text-dark-text min-w-0 break-words">
                          {sig.location}
                        </span>
                      </div>
                    )}
                    {sig.contactInfo && (
                      <div className="flex items-start gap-1.5 min-w-0">
                        <Mail
                          className="h-3.5 w-3.5 shrink-0 text-primary-500"
                          aria-hidden="true"
                        />
                        <span className="text-slate-500 dark:text-dark-text-muted">Contact:</span>
                        <span className="text-slate-700 dark:text-dark-text min-w-0 break-words">
                          {sig.contactInfo}
                        </span>
                      </div>
                    )}
                    {(sig.filter || sig.subFilter) && (
                      <div className="flex items-start gap-1.5 min-w-0">
                        <ShieldCheck
                          className="h-3.5 w-3.5 shrink-0 text-primary-500"
                          aria-hidden="true"
                        />
                        <span className="text-slate-500 dark:text-dark-text-muted">Standard:</span>
                        <span className="text-slate-700 dark:text-dark-text min-w-0 break-words">
                          {formatSignatureStandard(sig.filter, sig.subFilter)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Certificate details */}
                  {sig.certDetails && (
                    <div className="mt-3 border-t border-[var(--color-rule)] pt-3">
                      <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-primary-600">
                        Certificate Details
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                        <div className="flex items-start gap-1.5 min-w-0">
                          <User
                            className="h-3.5 w-3.5 shrink-0 text-primary-500"
                            aria-hidden="true"
                          />
                          <span className="text-slate-500 dark:text-dark-text-muted">Name:</span>
                          <span className="text-slate-700 dark:text-dark-text font-medium min-w-0 break-words">
                            {sig.certDetails.commonName}
                          </span>
                        </div>
                        {sig.certDetails.organisation && (
                          <div className="flex items-start gap-1.5 min-w-0">
                            <Building2
                              className="h-3.5 w-3.5 shrink-0 text-primary-500"
                              aria-hidden="true"
                            />
                            <span className="text-slate-500 dark:text-dark-text-muted">Org:</span>
                            <span className="text-slate-700 dark:text-dark-text min-w-0 break-words">
                              {sig.certDetails.organisation}
                            </span>
                          </div>
                        )}
                        {sig.certDetails.email && (
                          <div className="flex items-start gap-1.5 min-w-0">
                            <Mail
                              className="h-3.5 w-3.5 shrink-0 text-primary-500"
                              aria-hidden="true"
                            />
                            <span className="text-slate-500 dark:text-dark-text-muted">Email:</span>
                            <span className="text-slate-700 dark:text-dark-text min-w-0 break-words">
                              {sig.certDetails.email}
                            </span>
                          </div>
                        )}
                        {(sig.certDetails.country ||
                          sig.certDetails.state ||
                          sig.certDetails.locality) && (
                          <div className="flex items-start gap-1.5 min-w-0">
                            <Globe
                              className="h-3.5 w-3.5 shrink-0 text-primary-500"
                              aria-hidden="true"
                            />
                            <span className="text-slate-500 dark:text-dark-text-muted">
                              Location:
                            </span>
                            <span className="text-slate-700 dark:text-dark-text min-w-0 break-words">
                              {[
                                sig.certDetails.locality,
                                sig.certDetails.state,
                                sig.certDetails.country,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </div>
                        )}
                        <div className="flex items-start gap-1.5 min-w-0">
                          <ShieldQuestion
                            className="h-3.5 w-3.5 shrink-0 text-primary-500"
                            aria-hidden="true"
                          />
                          <span className="text-slate-500 dark:text-dark-text-muted">Issuer:</span>
                          <span className="text-slate-700 dark:text-dark-text min-w-0 break-words">
                            {sig.certDetails.issuer}
                            {sig.certDetails.issuerOrganisation &&
                              sig.certDetails.issuerOrganisation !== sig.certDetails.organisation &&
                              ` (${sig.certDetails.issuerOrganisation})`}
                          </span>
                          {sig.certDetails.isSelfSigned && (
                            <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                              Self-Signed
                            </span>
                          )}
                        </div>
                        {sig.certDetails.serialNumber && (
                          <div className="flex items-start gap-1.5 min-w-0">
                            <Hash
                              className="h-3.5 w-3.5 shrink-0 text-primary-500"
                              aria-hidden="true"
                            />
                            <span className="text-slate-500 dark:text-dark-text-muted">
                              Serial:
                            </span>
                            <span className="text-slate-700 dark:text-dark-text font-mono text-xs min-w-0 break-all">
                              {sig.certDetails.serialNumber}
                            </span>
                          </div>
                        )}
                        <div className="flex items-start gap-1.5 min-w-0">
                          <Calendar
                            className="h-3.5 w-3.5 shrink-0 text-primary-500"
                            aria-hidden="true"
                          />
                          <span className="text-slate-500 dark:text-dark-text-muted">Valid:</span>
                          <span className="text-slate-700 dark:text-dark-text min-w-0 break-words">
                            {sig.certDetails.validFrom} – {sig.certDetails.validTo}
                          </span>
                        </div>
                        {sig.certDetails.signatureAlgorithm && (
                          <div className="flex items-start gap-1.5 min-w-0">
                            <Lock
                              className="h-3.5 w-3.5 shrink-0 text-primary-500"
                              aria-hidden="true"
                            />
                            <span className="text-slate-500 dark:text-dark-text-muted">
                              Algorithm:
                            </span>
                            <span className="text-slate-700 dark:text-dark-text min-w-0 break-words">
                              {sig.certDetails.signatureAlgorithm}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Warning if already signed */}
          {!detectingSignatures && existingSignatures.length > 0 && (
            <InfoCallout icon={ShieldCheck} title="This PDF is already signed" accent="warning">
              Adding another signature will invalidate the existing{" "}
              {existingSignatures.length === 1 ? "signature" : "signatures"}. Use a different file
              if you want to preserve {existingSignatures.length === 1 ? "it" : "them"}.
            </InfoCallout>
          )}

          {/* Step 2: Certificate source */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-3)]">
              <FileKey2 className="h-4 w-4 text-primary-500" aria-hidden="true" />
              Certificate
            </h2>

            {/* Certificate source */}
            <SegmentedControl
              fullWidth
              ariaLabel="Certificate source"
              value={certSource}
              onChange={(v) => {
                setCertSource(v);
                setCertFile(null);
                setCertPassword("");
                setShowPassword(false);
                setCommonName("");
                setCertInfo(null);
                setCertError(null);
                setPrivateKey(null);
                setCertificate(null);
                setCertChain([]);
              }}
              options={[
                { value: "upload", label: "Choose file", icon: FolderOpen },
                { value: "generate", label: "Generate", icon: KeyRound },
              ]}
            />

            {/* Upload form */}
            {certSource === "upload" && (
              <div className="space-y-4 border-y border-[var(--color-rule)] py-4">
                <div>
                  <label
                    htmlFor="cert-file"
                    className="block text-sm font-medium text-slate-700 dark:text-dark-text mb-1.5"
                  >
                    Certificate file (.p12 / .pfx)
                  </label>
                  <input
                    id="cert-file"
                    name="certificateFile"
                    type="file"
                    accept=".p12,.pfx,application/x-pkcs12"
                    onChange={handleCertFile}
                    className="cloak-focus block w-full rounded-md text-sm text-[var(--color-ink-3)] file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-md file:border file:border-[var(--color-rule-strong)] file:bg-[var(--color-paper)] file:px-4 file:py-2 file:font-mono file:text-[11px] file:font-semibold file:uppercase file:tracking-[0.05em] file:text-[var(--color-ink)] file:transition-colors hover:file:border-primary-400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cert-password"
                    className="block text-sm font-medium text-slate-700 dark:text-dark-text mb-1.5"
                  >
                    Certificate password
                  </label>
                  <div className="relative">
                    <input
                      id="cert-password"
                      name="certificatePassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      spellCheck={false}
                      value={certPassword}
                      onChange={(e) => setCertPassword(e.target.value)}
                      placeholder="Enter certificate password…"
                      className="cloak-focus min-h-11 w-full rounded-md border border-[var(--color-rule-strong)] bg-[var(--color-paper)] px-3 py-2 pr-12 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] transition-[color,background-color,border-color]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="cloak-focus absolute right-1 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded text-slate-500 dark:text-dark-text-muted hover:text-slate-600 dark:hover:text-dark-text transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {certFile && !certInfo && (
                  <button
                    type="button"
                    onClick={handleLoadCert}
                    disabled={certLoading || !certPassword}
                    className="cloak-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-accent-ink)] transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {certLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    )}
                    {certLoading ? "Loading…" : "Load Certificate"}
                  </button>
                )}
              </div>
            )}

            {/* Generate form */}
            {certSource === "generate" && (
              <div className="space-y-4 border-y border-[var(--color-rule)] py-4">
                <InfoCallout icon={ShieldQuestion} title="Self-signed certificate">
                  Suitable for personal use. Recipients will see the signature is not from a trusted
                  certificate authority.
                </InfoCallout>

                <div>
                  <label
                    htmlFor="common-name"
                    className="block text-sm font-medium text-slate-700 dark:text-dark-text mb-1.5"
                  >
                    Your name
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-3)]"
                      aria-hidden="true"
                    />
                    <input
                      id="common-name"
                      type="text"
                      name="commonName"
                      autoComplete="name"
                      value={commonName}
                      onChange={(e) => setCommonName(e.target.value)}
                      placeholder="e.g. Priya Shah…"
                      className="cloak-focus min-h-11 w-full rounded-md border border-[var(--color-rule-strong)] bg-[var(--color-paper)] py-2 pr-3 pl-10 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] transition-[color,background-color,border-color]"
                    />
                  </div>
                </div>

                {!certInfo && (
                  <>
                    <button
                      type="button"
                      onClick={handleGenerateCert}
                      disabled={certLoading || !commonName.trim()}
                      className="cloak-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-accent-ink)] transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {certLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <KeyRound className="h-4 w-4" aria-hidden="true" />
                      )}
                      {certLoading ? "Generating…" : "Generate Certificate"}
                    </button>
                    {certLoading && (
                      <p
                        role="status"
                        aria-live="polite"
                        className="mt-2 text-xs text-slate-500 dark:text-dark-text-muted"
                      >
                        Generating a 2048-bit RSA key in the background — this can take a few
                        seconds. The page stays responsive.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {certError && <AlertBox message={certError} />}

            {/* Certificate info display */}
            {certInfo && (
              <div className="border-y border-[var(--color-rule)] py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-4 w-4 text-primary-600" aria-hidden="true" />
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink)]">
                    Certificate Loaded
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-dark-text-muted">Name: </span>
                    <span className="text-slate-700 dark:text-dark-text font-medium">
                      {certInfo.commonName}
                    </span>
                  </div>
                  {certInfo.organisation && (
                    <div>
                      <span className="text-slate-500 dark:text-dark-text-muted">Org: </span>
                      <span className="text-slate-700 dark:text-dark-text">
                        {certInfo.organisation}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 dark:text-dark-text-muted">Issuer: </span>
                    <span className="text-slate-700 dark:text-dark-text">{certInfo.issuer}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-dark-text-muted">Valid: </span>
                    <span className="text-slate-700 dark:text-dark-text">
                      {certInfo.validFrom.toLocaleDateString()} –{" "}
                      {certInfo.validTo.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Signature details (optional) */}
          {certInfo && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-3)]">
                <MessageSquareText className="h-4 w-4 text-primary-500" aria-hidden="true" />
                Signature Details
                <span className="text-xs font-normal text-slate-500 dark:text-dark-text-muted">
                  (optional)
                </span>
              </h2>

              <div className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
                <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center">
                  <label
                    htmlFor="sig-reason"
                    className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-dark-text sm:w-28 shrink-0"
                  >
                    <MessageSquareText className="h-4 w-4 text-primary-500" aria-hidden="true" />
                    Reason
                  </label>
                  <input
                    id="sig-reason"
                    name="signatureReason"
                    type="text"
                    autoComplete="off"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. I approve this document…"
                    className="cloak-focus min-h-11 w-full rounded-md border border-[var(--color-rule-strong)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] transition-[color,background-color,border-color]"
                  />
                </div>
                <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center">
                  <label
                    htmlFor="sig-location"
                    className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-dark-text sm:w-28 shrink-0"
                  >
                    <MapPin className="h-4 w-4 text-primary-500" aria-hidden="true" />
                    Location
                  </label>
                  <input
                    id="sig-location"
                    name="signatureLocation"
                    type="text"
                    autoComplete="off"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bengaluru, India…"
                    className="cloak-focus min-h-11 w-full rounded-md border border-[var(--color-rule-strong)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] transition-[color,background-color,border-color]"
                  />
                </div>
                <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center">
                  <label
                    htmlFor="sig-contact"
                    className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-dark-text sm:w-28 shrink-0"
                  >
                    <User className="h-4 w-4 text-primary-500" aria-hidden="true" />
                    Contact
                  </label>
                  <input
                    id="sig-contact"
                    type="email"
                    name="contactEmail"
                    autoComplete="email"
                    inputMode="email"
                    spellCheck={false}
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="e.g. priya@example.com…"
                    className="cloak-focus min-h-11 w-full rounded-md border border-[var(--color-rule-strong)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] transition-[color,background-color,border-color]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sign button */}
          <ActionButton
            onClick={handleSign}
            processing={processing}
            disabled={!canSign}
            label="Sign & Download PDF"
            processingLabel="Signing…"
          />

          {success && (
            <InfoCallout icon={CheckCircle2} live>
              PDF signed and downloaded successfully.
            </InfoCallout>
          )}
        </>
      )}

      {error && <AlertBox message={error} />}
    </div>
  );
}
