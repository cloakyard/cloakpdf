import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import forge from "node-forge";
import { PDFDocument } from "@pdfme/pdf-lib";
import { buildSelfSignedCert } from "../../src/utils/self-signed-cert.ts";
import {
  detectSignatures,
  generateSelfSignedCertAsync,
  signPdf,
  parsePkcs12,
} from "../../src/utils/pdf-signer.ts";

afterEach(() => vi.unstubAllGlobals());

describe("certificate workflow lifecycle", () => {
  it("does not start a worker or synchronous key generation for a cancelled request", async () => {
    const worker = vi.fn();
    vi.stubGlobal("Worker", worker);
    const controller = new AbortController();
    controller.abort();
    await expect(
      generateSelfSignedCertAsync("Test signer", controller.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(worker).not.toHaveBeenCalled();
  });
  it("terminates in-flight key generation when cancelled instead of falling back", async () => {
    const terminate = vi.fn();
    const postMessage = vi.fn();
    vi.stubGlobal(
      "Worker",
      class {
        terminate = terminate;
        postMessage = postMessage;
      },
    );
    const controller = new AbortController();
    const result = generateSelfSignedCertAsync("Test signer", controller.signal);
    expect(postMessage).toHaveBeenCalledOnce();
    controller.abort();
    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    expect(terminate).toHaveBeenCalledOnce();
  });
  it("reads certificate identity from a real signed PDF with reserved Contents padding", async () => {
    const document = await PDFDocument.create();
    document.addPage();
    const { key, cert } = buildSelfSignedCert("Signature fixture");
    const bytes = await signPdf(new File([await document.save()], "test.pdf"), key, cert, [], {
      reason: "Test metadata",
    });
    const signatures = await detectSignatures(new File([bytes.slice()], "signed.pdf"));
    expect(signatures).toHaveLength(1);
    expect(signatures[0].reason).toBe("Test metadata");
    expect(signatures[0].signerName).toBe("Signature fixture");
    expect(signatures[0].certDetails?.commonName).toBe("Signature fixture");
    expect(signatures[0].certDetails?.isSelfSigned).toBe(true);
  });
  it("preserves Unicode certificate identity through PEM, PKCS#12 and signed PDF", async () => {
    const name = "Zoë — टीम";
    const original = buildSelfSignedCert(name);
    const key = forge.pki.privateKeyFromPem(forge.pki.privateKeyToPem(original.key));
    const cert = forge.pki.certificateFromPem(forge.pki.certificateToPem(original.cert));
    const archive = forge.asn1
      .toDer(forge.pkcs12.toPkcs12Asn1(key, [cert], "test-password", { algorithm: "3des" }))
      .getBytes();
    const bytes = Uint8Array.from(archive, (value) => value.charCodeAt(0));
    const parsed = parsePkcs12(bytes.buffer, "test-password");
    expect(parsed.info.commonName).toBe(name);
    expect(parsed.info.issuer).toBe(name);
    const document = await PDFDocument.create();
    document.addPage();
    const signed = await signPdf(
      new File([await document.save()], "test.pdf"),
      parsed.key,
      parsed.cert,
    );
    const signatures = await detectSignatures(new File([signed.slice()], "signed.pdf"));
    expect(signatures[0].signerName).toBe(name);
    expect(signatures[0].certDetails?.commonName).toBe(name);
    // Non-zero bytes after DER are not silently accepted as reserved padding.
    const range = new TextDecoder().decode(signed).match(/\/ByteRange\s*\[\s*0\s+\d+\s+(\d+)/)!;
    signed[Number(range[1]) - 2] = 49;
    const malformed = await detectSignatures(new File([signed.slice()], "malformed.pdf"));
    expect(malformed[0].certDetails).toBeUndefined();
  });
});
