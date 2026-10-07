/**
 * Pins the correctness contract the crypto Web Worker relies on:
 * a self-signed certificate + key built by buildSelfSignedCert survive a PEM
 * round-trip (the boundary the worker crosses) and the reconstructed key still
 * produces a valid PKCS#7 signature that carries the certificate.
 *
 * If forge ever stopped round-tripping these losslessly, the worker path in
 * generateSelfSignedCertAsync would silently produce unsignable certs — this
 * test fails loudly instead.
 */

import { describe, expect, it } from "vite-plus/test";
import forge from "node-forge";
import { SELF_SIGNED_ORG, buildSelfSignedCert } from "../../src/utils/self-signed-cert.ts";

describe("buildSelfSignedCert + PEM round-trip", () => {
  it("reconstructs a signable key + certificate from PEM", () => {
    const { key, cert } = buildSelfSignedCert("Jane Doe");

    // Subject is what we asked for.
    expect(cert.subject.getField("CN")?.value).toBe("Jane Doe");
    expect(cert.subject.getField("O")?.value).toBe(SELF_SIGNED_ORG);

    // Cross the worker boundary: serialise to PEM, then parse back.
    const keyPem = forge.pki.privateKeyToPem(key);
    const certPem = forge.pki.certificateToPem(cert);
    const key2 = forge.pki.privateKeyFromPem(keyPem);
    const cert2 = forge.pki.certificateFromPem(certPem);

    // The reconstructed certificate keeps its identity + validity window.
    // (X.509 stores times at second precision, so compare floored to seconds —
    // the sub-second remainder of the original `new Date()` is dropped on encode.)
    expect(cert2.subject.getField("CN")?.value).toBe("Jane Doe");
    expect(Math.floor(cert2.validity.notAfter.getTime() / 1000)).toBe(
      Math.floor(cert.validity.notAfter.getTime() / 1000),
    );

    // The reconstructed key can still sign a PKCS#7 detached signature, and the
    // resulting blob carries the certificate (CN intact) — i.e. it's usable for
    // the real signPdf path.
    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer("hello world", "utf8");
    p7.addCertificate(cert2);
    p7.addSigner({
      key: key2 as unknown as string,
      certificate: cert2,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
        { type: forge.pki.oids.messageDigest },
      ],
    });
    p7.sign({ detached: true });

    const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
    expect(der.length).toBeGreaterThan(0);

    // Re-parse the signature and confirm the embedded cert's CN survived.
    const reparsed = forge.pkcs7.messageFromAsn1(
      forge.asn1.fromDer(der),
    ) as forge.pkcs7.PkcsSignedData;
    expect(reparsed.certificates?.[0]?.subject.getField("CN")?.value).toBe("Jane Doe");
  }, 30000);
});
