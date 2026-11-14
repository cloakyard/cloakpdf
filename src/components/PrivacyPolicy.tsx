import { PrivacyPage, type PrivacySection } from "../../docs/air/privacy.tsx";
const REPO_URL = "https://github.com/cloakyard/cloakpdf";
const sections: PrivacySection[] = [
  {
    id: "local-processing",
    title: "Your documents stay on your device",
    body: (
      <>
        <p>
          PDF operations—including merging, splitting, compressing, signing, OCR, redaction, and
          editing—run in this browser tab through JavaScript, WebAssembly, PDF.js, and pdf-lib. Your
          PDF bytes, document metadata, and edits are not sent to a CloakPDF server because no file
          upload service exists.
        </p>
        <p>
          Results are created in browser memory and offered back to you as a browser download. Some
          tools may keep an in-progress draft or document index in browser storage on this device so
          you can resume work or reopen the same document more quickly.
        </p>
      </>
    ),
  },
  {
    id: "data-tracking",
    title: "No accounts, advertising, or analytics",
    body: (
      <>
        <p>
          CloakPDF has no accounts, advertising, analytics, or tracking cookies. Personal
          information in your documents and edits stays in this browser; it is not sent to the
          CloakPDF project.
        </p>
        <ul>
          <li>No CloakPDF account or account identifier</li>
          <li>No document-content or document-metadata collection</li>
          <li>No behavioural analytics, advertising profile, or cross-site tracking</li>
          <li>No cookies or local-storage entries used for tracking</li>
        </ul>
      </>
    ),
  },
  {
    id: "network-requests",
    title: "App assets may be downloaded; PDFs are not",
    body: (
      <>
        <p>
          The web app necessarily downloads its static code and may fetch PDF workers, OCR language
          data, or optional on-device AI model weights when a feature needs them. These asset
          requests do not contain your PDF files, document text, questions, or generated answers.
        </p>
        <p>
          Ask PDF runs its models locally through Transformers.js. OCR uses local browser runtimes,
          including WebAssembly and Tesseract. Model and support files may be fetched from public
          CDNs and cached by your browser; clearing this site’s browser data removes those cached
          files and any local document index.
        </p>
      </>
    ),
  },
  {
    id: "hosting",
    title: "The static host may keep standard access logs",
    body: (
      <>
        <p>
          CloakPDF is served as a static website. As with other websites, a hosting provider may
          receive and temporarily retain standard request information—such as an IP address,
          requested asset path, timestamp, and browser headers—for security, abuse prevention, and
          operations under that provider’s own policy.
        </p>
        <p>
          Those requests are for the application and its support assets. CloakPDF does not include
          your PDF content in them, and the application developer does not add a separate analytics
          or logging pipeline.
        </p>
      </>
    ),
  },
  {
    id: "source-license",
    title: "The privacy model is independently auditable",
    body: (
      <>
        <p>
          CloakPDF is open source. You can inspect the complete implementation in the{" "}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            CloakPDF source repository
          </a>{" "}
          and verify where document bytes, browser storage, and network requests are handled.
        </p>
        <p>
          The project is released under the{" "}
          <a href={`${REPO_URL}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">
            MIT License
          </a>
          . You may use it personally or commercially and may self-host your own copy without a
          CloakPDF licensing fee.
        </p>
      </>
    ),
  },
  {
    id: "rights-revisions",
    title: "There is no CloakPDF account record to request",
    body: (
      <>
        <p>
          Because the CloakPDF application does not hold an account or document record about you, it
          has no user dataset to disclose, correct, export, or delete. Browser-cached assets, local
          drafts, and on-device model files can be removed through your browser’s site-data
          controls.
        </p>
        <p>
          Questions or concerns can be raised through{" "}
          <a href={`${REPO_URL}/issues`} target="_blank" rel="noopener noreferrer">
            GitHub Issues
          </a>
          . If this policy changes, the revised document and its new effective date will be
          published on this page.
        </p>
      </>
    ),
  },
];
export function PrivacyPolicy() {
  return (
    <PrivacyPage
      product="CloakPDF"
      home={import.meta.env.BASE_URL}
      date="2026-11-14"
      lead={
        <>
          CloakPDF is a free, open-source PDF workbench. Document processing happens inside your
          browser; the application has no upload service, user account, advertising, or analytics
          pipeline.
        </>
      }
      sections={sections}
    />
  );
}
