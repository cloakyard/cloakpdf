/**
 * Self-signed certificate builder (forge only — no pdf-lib).
 *
 * Kept in its own tiny module so the crypto Web Worker can import the cert
 * logic without dragging @pdfme/pdf-lib (which pdf-signer.ts pulls in) into
 * the worker chunk. Both the synchronous {@link generateSelfSignedCert} path
 * and the off-main-thread worker share this single source of truth, so the
 * two never drift.
 *
 * The expensive step is the 2048-bit RSA key generation — a multi-second CPU
 * burst that freezes the UI on the main thread, which is exactly why the
 * worker exists.
 */

import forge from "node-forge";

/** Organisation stamped onto every CloakPDF self-signed certificate. */
export const SELF_SIGNED_ORG = "Self-Signed (CloakPDF)";

/**
 * Build a self-signed certificate + RSA key pair for personal/testing use.
 *
 * @param commonName - The signer's name (certificate CN).
 * @returns The generated private key and certificate as forge objects.
 */
export function buildSelfSignedCert(commonName: string): {
  key: forge.pki.PrivateKey;
  cert: forge.pki.Certificate;
} {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();

  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01" + forge.util.bytesToHex(forge.random.getBytesSync(8));
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);

  const attrs: forge.pki.CertificateField[] = [
    {
      name: "commonName",
      value: commonName,
      // Forge expects a value type here; @types incorrectly declares an ASN.1 class.
      valueTagClass: forge.asn1.Type.UTF8 as unknown as forge.asn1.Class,
    },
    { name: "organizationName", value: SELF_SIGNED_ORG },
  ];

  cert.setSubject(attrs);
  cert.setIssuer(attrs);

  cert.setExtensions([
    { name: "basicConstraints", cA: false },
    {
      name: "keyUsage",
      digitalSignature: true,
      nonRepudiation: true,
    },
  ]);

  cert.sign(keys.privateKey, forge.md.sha256.create());

  return { key: keys.privateKey, cert };
}
