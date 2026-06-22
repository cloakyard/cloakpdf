/**
 * Crypto Web Worker — off-main-thread self-signed certificate generation.
 *
 * Generating a 2048-bit RSA key pair (forge.pki.rsa.generateKeyPair) is a
 * multi-second CPU burst that freezes the UI when run on the main thread. This
 * worker runs it off-thread and posts the result back as PEM strings, which the
 * main thread losslessly reconstructs into forge objects
 * (forge.pki.privateKeyFromPem / certificateFromPem) for PKCS#7 signing.
 *
 * It imports only the forge-based cert builder — never pdf-signer.ts (which
 * pulls in pdf-lib) — so the worker chunk stays lean and is fetched lazily, the
 * first time a user actually generates a certificate.
 *
 * The project's tsconfig uses `lib: ["ES2025", "DOM"]` (no WebWorker lib), so
 * `self` is typed as a Window. `onmessage` assignment is fine; `postMessage` is
 * narrowed through a small typed shim to avoid the Window overload that demands
 * a `targetOrigin`.
 */

import forge from "node-forge";
import { buildSelfSignedCert } from "../utils/self-signed-cert.ts";

/** Request sent from the main thread. */
interface GenerateCertRequest {
  type: "generateCert";
  commonName: string;
}

/** Response posted back to the main thread. */
type CryptoWorkerResponse =
  | { type: "cert"; keyPem: string; certPem: string }
  | { type: "error"; message: string };

const post = (msg: CryptoWorkerResponse): void =>
  (self as unknown as { postMessage: (m: CryptoWorkerResponse) => void }).postMessage(msg);

self.onmessage = (e: MessageEvent<GenerateCertRequest>) => {
  // A dedicated worker only ever receives messages from the same-origin document
  // that spawned it (its MessageEvent.origin is the empty string). Reject any
  // message carrying a foreign origin before touching the payload — defence in
  // depth against a misrouted/forged event.
  if (e.origin && e.origin !== self.location.origin) return;
  const data = e.data;
  if (!data || data.type !== "generateCert") return;
  try {
    const { key, cert } = buildSelfSignedCert(data.commonName);
    post({
      type: "cert",
      keyPem: forge.pki.privateKeyToPem(key),
      certPem: forge.pki.certificateToPem(cert),
    });
  } catch (err) {
    post({
      type: "error",
      message: err instanceof Error ? err.message : "Certificate generation failed.",
    });
  }
};
