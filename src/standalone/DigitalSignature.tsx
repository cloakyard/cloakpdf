/** Local certificate signing. Cryptographic operations live in pdf-signer.ts. */
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Eye, EyeOff, ShieldQuestion } from "lucide-react";
import { ActionButton } from "../components/ActionButton.tsx";
import { AlertBox } from "../components/AlertBox.tsx";
import { FileDropZone } from "../components/FileDropZone.tsx";
import { FileInfoBar } from "../components/FileInfoBar.tsx";
import { LoadingState } from "../components/LoadingState.tsx";
import { SegmentedControl } from "../components/SegmentedControl.tsx";
import { downloadPdf, formatFileSize, pdfFilename } from "../utils/file-helpers.ts";
import { isPdfEncrypted } from "../utils/pdf-security.ts";
import {
  type ExistingSignature,
  detectSignatures,
  generateSelfSignedCertAsync,
  parsePkcs12,
  signPdf,
} from "../utils/pdf-signer.ts";

type CertSource = "upload" | "generate";
type Identity = ReturnType<typeof parsePkcs12>;
type PdfState = "idle" | "detecting" | "ready" | "error";

function formatSignatureStandard(filter: string, subFilter: string): string {
  const types: Record<string, string> = {
    "adbe.pkcs7.detached": "PKCS#7 Detached Signature",
    "adbe.pkcs7.sha1": "PKCS#7 SHA-1 Signature",
    "adbe.x509.rsa_sha1": "X.509 RSA SHA-1",
    "ETSI.CAdES.detached": "CAdES Advanced Signature",
    "ETSI.RFC3161": "RFC 3161 Timestamp",
  };
  const providers: Record<string, string> = {
    "Adobe.PPKLite": "Adobe Standard",
    "Adobe.PPKMS": "Adobe Windows Crypto",
    "Entrust.PPKEF": "Entrust",
  };
  return (
    [types[subFilter] ?? subFilter, providers[filter] ?? filter].filter(Boolean).join(" · ") ||
    "Unknown"
  );
}

function Details({ rows }: { rows: [string, string | undefined][] }) {
  return (
    <dl className="pdf-signature-details">
      {rows
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
    </dl>
  );
}
function ExistingSignatures({ signatures }: { signatures: ExistingSignature[] }) {
  if (!signatures.length) return null;
  return (
    <section className="pdf-signature-section" aria-labelledby="existing-signatures">
      <h2 id="existing-signatures">Existing signatures ({signatures.length})</h2>
      <p className="air-help">
        These are embedded signature details. Their validity and trust have not been verified here.
      </p>
      {signatures.map((sig, index) => (
        <div className="pdf-signature-record" key={index}>
          <h3>
            Signature {index + 1}
            {sig.signerName ? ` — ${sig.signerName}` : ""}
          </h3>
          <Details
            rows={[
              ["Signer", sig.signerName],
              ["Date", sig.date],
              ["Reason", sig.reason],
              ["Location", sig.location],
              ["Contact", sig.contactInfo],
              ["Standard", formatSignatureStandard(sig.filter, sig.subFilter)],
            ]}
          />
          {sig.certDetails && (
            <>
              <h3>Certificate details</h3>
              <Details
                rows={[
                  ["Name", sig.certDetails.commonName],
                  ["Organisation", sig.certDetails.organisation],
                  ["Email", sig.certDetails.email],
                  [
                    "Location",
                    [sig.certDetails.locality, sig.certDetails.state, sig.certDetails.country]
                      .filter(Boolean)
                      .join(", "),
                  ],
                  [
                    "Issuer",
                    [sig.certDetails.issuer, sig.certDetails.issuerOrganisation]
                      .filter(Boolean)
                      .join(" · "),
                  ],
                  ["Certificate type", sig.certDetails.isSelfSigned ? "Self-signed" : undefined],
                  ["Serial number", sig.certDetails.serialNumber],
                  ["Validity period", `${sig.certDetails.validFrom} – ${sig.certDetails.validTo}`],
                  ["Algorithm", sig.certDetails.signatureAlgorithm],
                ]}
              />
            </>
          )}
        </div>
      ))}
      <div className="air-notice air-notice--warning pdf-result">
        <AlertTriangle size={18} strokeWidth={1.6} aria-hidden="true" />
        <div>
          <p className="pdf-signature-notice-title">This PDF is already signed</p>
          <p>
            Adding another signature will invalidate the existing{" "}
            {signatures.length === 1 ? "signature" : "signatures"}. Use a different file to preserve
            them.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function DigitalSignature() {
  const root = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const generation = useRef(0);
  const certGeneration = useRef(0);
  const operation = useRef<"certificate" | "sign" | null>(null);
  const certAbort = useRef<AbortController | null>(null);
  const focusRequest = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [encryptedFile, setEncryptedFile] = useState<File | null>(null);
  const [pdfState, setPdfState] = useState<PdfState>("idle");
  const [signatures, setSignatures] = useState<ExistingSignature[]>([]);
  const [certSource, setCertSource] = useState<CertSource>("upload");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPassword, setCertPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [commonName, setCommonName] = useState("");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [certLoading, setCertLoading] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [location, setLocation] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const busy = certLoading || signing;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      generation.current++;
      certGeneration.current++;
      certAbort.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (!focusRequest.current) return;
    const target = root.current?.querySelector<HTMLElement>(focusRequest.current);
    if (target) {
      target.focus();
      focusRequest.current = null;
    }
  }, [file, pdfState, encryptedFile, identity, certFile, certLoading, certError]);

  const clearIdentity = () => {
    setIdentity(null);
    setCertError(null);
    setSuccess(null);
    setError(null);
  };
  const clearCertificate = () => {
    certGeneration.current++;
    certAbort.current?.abort();
    certAbort.current = null;
    setCertLoading(false);
    setCertFile(null);
    setCertPassword("");
    setShowPassword(false);
    setCommonName("");
    clearIdentity();
  };
  const reset = () => {
    if (operation.current) return;
    generation.current++;
    focusRequest.current = '.pdf-signature-intake input[type="file"]';
    setFile(null);
    setEncryptedFile(null);
    setPdfState("idle");
    setSignatures([]);
    clearCertificate();
    setCertSource("upload");
    setReason("");
    setLocation("");
    setContactInfo("");
  };
  const handleFile = async (files: File[]) => {
    if (!files.length || operation.current) return;
    const pdf = files[0];
    if (pdf.type !== "application/pdf" && !/\.pdf$/i.test(pdf.name)) {
      setError("Choose a PDF to sign.");
      return;
    }
    const request = ++generation.current;
    clearCertificate();
    setReason("");
    setLocation("");
    setContactInfo("");
    setSignatures([]);
    setFile(pdf);
    setEncryptedFile(null);
    setPdfState("detecting");
    focusRequest.current = ".pdf-signature-file button";
    try {
      const encrypted = await isPdfEncrypted(pdf);
      if (!alive.current || request !== generation.current) return;
      if (encrypted) {
        focusRequest.current = ".pdf-encrypted button";
        setFile(null);
        setEncryptedFile(pdf);
        setPdfState("idle");
        return;
      }
      const found = await detectSignatures(pdf);
      if (!alive.current || request !== generation.current) return;
      setSignatures(found);
      setPdfState("ready");
      focusRequest.current = "#certificate-heading";
    } catch {
      if (!alive.current || request !== generation.current) return;
      setPdfState("error");
      focusRequest.current = "#signature-read-error";
    }
  };
  const changeCertSource = (value: CertSource) => {
    if (operation.current || certSource === value) return;
    clearCertificate();
    setCertSource(value);
  };
  const handleCertFile = (files: File[]) => {
    if (operation.current || !files.length) return;
    clearIdentity();
    if (!/\.(p12|pfx)$/i.test(files[0].name)) {
      setCertError("Choose a .p12 or .pfx certificate file.");
      return;
    }
    setCertFile(files[0]);
    setCertPassword("");
    setShowPassword(false);
    focusRequest.current = "#cert-password";
  };
  const cancelCertificate = () => {
    if (operation.current !== "certificate") return;
    certGeneration.current++;
    certAbort.current?.abort();
    certAbort.current = null;
    operation.current = null;
    setCertLoading(false);
    focusRequest.current = certSource === "upload" ? "#cert-password" : "#common-name";
  };
  const loadCertificate = async () => {
    if (operation.current || (certSource === "upload" ? !certFile : !commonName.trim())) return;
    operation.current = "certificate";
    const request = ++certGeneration.current;
    const controller = new AbortController();
    certAbort.current = controller;
    clearIdentity();
    setCertLoading(true);
    try {
      let next: Identity;
      if (certSource === "upload") {
        const bytes = await certFile!.arrayBuffer();
        if (!alive.current || request !== certGeneration.current) return;
        next = parsePkcs12(bytes, certPassword);
      } else {
        next = {
          ...(await generateSelfSignedCertAsync(commonName.trim(), controller.signal)),
          chain: [],
        };
      }
      if (!alive.current || request !== certGeneration.current) return;
      setIdentity(next);
      focusRequest.current = "#certificate-loaded";
    } catch {
      if (!alive.current || request !== certGeneration.current) return;
      setCertError(
        certSource === "upload"
          ? "Couldn’t load this certificate. Your file is still here. Check its password, or choose another .p12 or .pfx file."
          : "Couldn’t generate a certificate. Your name is still here. Try again.",
      );
      focusRequest.current = certSource === "upload" ? "#cert-password" : "#common-name";
    } finally {
      if (alive.current && request === certGeneration.current) {
        operation.current = null;
        certAbort.current = null;
        setCertLoading(false);
      }
    }
  };
  const handleSign = async () => {
    if (operation.current || !file || !identity || pdfState !== "ready") return;
    operation.current = "sign";
    const request = generation.current;
    setSigning(true);
    setError(null);
    setSuccess(null);
    try {
      const bytes = await signPdf(file, identity.key, identity.cert, identity.chain, {
        reason: reason || undefined,
        location: location || undefined,
        contactInfo: contactInfo || undefined,
      });
      if (!alive.current || request !== generation.current) return;
      const name = pdfFilename(file, "_signed");
      downloadPdf(bytes, name);
      setSuccess(`${name} is ready. Download requested. Your source file is unchanged.`);
    } catch {
      if (alive.current && request === generation.current)
        setError(
          "Couldn’t sign this PDF. Your file, certificate and details are still here. Try again or choose another PDF.",
        );
    } finally {
      operation.current = null;
      if (alive.current && request === generation.current) setSigning(false);
    }
  };

  return (
    <div className="pdf-signature" ref={root}>
      {!file ? (
        <div className="pdf-signature-intake">
          <FileDropZone
            accept=".pdf,application/pdf"
            onFiles={handleFile}
            encryptedFile={encryptedFile}
            onClearEncrypted={reset}
            label="Drop a PDF file here"
            hint="Digitally sign with a cryptographic certificate"
          />
        </div>
      ) : (
        <div className="pdf-signature-file">
          <FileInfoBar
            fileName={file.name}
            details={formatFileSize(file.size)}
            onChangeFile={reset}
            disabled={busy}
            changeLabel={pdfState === "detecting" ? "Cancel check" : "Change file"}
          />
        </div>
      )}
      {pdfState === "detecting" && <LoadingState label="Checking PDF and existing signatures…" />}
      {pdfState === "error" && (
        <div className="pdf-signature-section">
          <h2 id="signature-read-error" tabIndex={-1}>
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
      {pdfState === "ready" && (
        <>
          <ExistingSignatures signatures={signatures} />
          <section className="pdf-signature-section" aria-labelledby="certificate-heading">
            <h2 id="certificate-heading" tabIndex={-1}>
              Certificate
            </h2>
            <div className="pdf-signature-fields">
              <SegmentedControl
                fullWidth
                ariaLabel="Certificate source"
                value={certSource}
                onChange={changeCertSource}
                disabled={busy}
                options={[
                  { value: "upload", label: "Choose file" },
                  { value: "generate", label: "Generate" },
                ]}
              />
              {certSource === "upload" ? (
                <>
                  {!certFile ? (
                    <FileDropZone
                      accept=".p12,.pfx,application/x-pkcs12"
                      onFiles={handleCertFile}
                      label="Choose a certificate file"
                      hint="PKCS#12 certificate (.p12 or .pfx). Opened only on your device."
                      disabled={busy}
                    />
                  ) : (
                    <FileInfoBar
                      fileName={certFile.name}
                      details={formatFileSize(certFile.size)}
                      disabled={busy}
                      changeLabel="Change certificate"
                      onChangeFile={() => {
                        clearCertificate();
                        focusRequest.current = 'input[accept=".p12,.pfx,application/x-pkcs12"]';
                      }}
                    />
                  )}
                  {certFile && (
                    <div>
                      <label className="air-label" htmlFor="cert-password">
                        Certificate password
                      </label>
                      <div className="air-field-group">
                        <input
                          id="cert-password"
                          name="certificatePassword"
                          className="air-field"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          autoCapitalize="none"
                          spellCheck={false}
                          readOnly={busy}
                          value={certPassword}
                          onChange={(event) => {
                            setCertPassword(event.target.value);
                            clearIdentity();
                          }}
                          aria-describedby="cert-password-help"
                        />
                        <span className="air-field-actions">
                          <button
                            type="button"
                            className="air-icon-button air-button--quiet air-field-clear"
                            aria-label={
                              showPassword
                                ? "Hide certificate password"
                                : "Show certificate password"
                            }
                            disabled={busy}
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff size={18} strokeWidth={1.6} aria-hidden="true" />
                            ) : (
                              <Eye size={18} strokeWidth={1.6} aria-hidden="true" />
                            )}
                          </button>
                        </span>
                      </div>
                      <p id="cert-password-help" className="air-help">
                        Leave blank if the certificate has no password.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="air-notice pdf-result">
                    <ShieldQuestion size={18} strokeWidth={1.6} aria-hidden="true" />
                    <div>
                      <p className="pdf-signature-notice-title">Self-signed certificate</p>
                      <p>
                        Suitable for personal use. Recipients will see that the signature is not
                        from a trusted certificate authority.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="air-label" htmlFor="common-name">
                      Your name
                    </label>
                    <input
                      id="common-name"
                      name="commonName"
                      className="air-field"
                      autoComplete="name"
                      value={commonName}
                      readOnly={busy}
                      onChange={(event) => {
                        setCommonName(event.target.value);
                        clearIdentity();
                      }}
                    />
                  </div>
                </>
              )}
              {!identity && (
                <ActionButton
                  // This cancellable task owns its guard; an obsolete file read
                  // must not keep ActionButton pending after cancellation.
                  onClick={() => void loadCertificate()}
                  processing={certLoading}
                  disabled={signing || (certSource === "upload" ? !certFile : !commonName.trim())}
                  label={certSource === "upload" ? "Load certificate" : "Generate certificate"}
                  processingLabel={certSource === "upload" ? "Loading…" : "Generating…"}
                />
              )}
              {certLoading && (
                <div className="pdf-signature-section">
                  <p className="air-help">
                    {certSource === "generate"
                      ? "Creating a 2048-bit RSA certificate. This can take a few seconds."
                      : "Reading this certificate on your device."}
                  </p>
                  <button type="button" className="air-button" onClick={cancelCertificate}>
                    Cancel certificate {certSource === "upload" ? "load" : "generation"}
                  </button>
                </div>
              )}
              {certError && <AlertBox message={certError} />}
              {identity && (
                <div className="pdf-signature-record">
                  <h3 id="certificate-loaded" tabIndex={-1}>
                    Certificate loaded
                  </h3>
                  <Details
                    rows={[
                      ["Name", identity.info.commonName],
                      ["Organisation", identity.info.organisation],
                      ["Issuer", identity.info.issuer],
                      [
                        "Validity period",
                        `${identity.info.validFrom.toLocaleDateString()} – ${identity.info.validTo.toLocaleDateString()}`,
                      ],
                    ]}
                  />
                </div>
              )}
            </div>
          </section>
          {identity && (
            <section className="pdf-signature-section" aria-labelledby="signature-details">
              <h2 id="signature-details">
                Signature details <span className="air-help">(optional)</span>
              </h2>
              <div className="pdf-signature-fields">
                {(
                  [
                    ["sig-reason", "Reason", reason, setReason],
                    ["sig-location", "Location", location, setLocation],
                    ["sig-contact", "Contact", contactInfo, setContactInfo],
                  ] as const
                ).map(([id, label, value, set]) => (
                  <div key={id}>
                    <label htmlFor={id} className="air-label">
                      {label}
                    </label>
                    <input
                      id={id}
                      name={id}
                      className="air-field"
                      value={value}
                      readOnly={busy}
                      type={id === "sig-contact" ? "email" : "text"}
                      autoComplete={id === "sig-contact" ? "email" : "off"}
                      spellCheck={id === "sig-contact" ? false : undefined}
                      onChange={(event) => {
                        set(event.target.value);
                        setError(null);
                        setSuccess(null);
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
          <ActionButton
            onClick={handleSign}
            processing={signing}
            disabled={!identity || certLoading}
            label="Sign & Download PDF"
            processingLabel="Signing…"
          />
          {signing && (
            <p className="air-help">
              Keep this tool open until signing finishes. Your source file is unchanged.
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
