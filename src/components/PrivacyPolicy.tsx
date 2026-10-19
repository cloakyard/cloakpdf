/** Long-form privacy document aligned with the Cloakyard family system. */

import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

const REPO_URL = "https://github.com/cloakyard/cloakpdf";
const POLICY_LINK_CLASS = "pdf-policy-link";

interface PolicySectionProps {
  marker: string;
  title: string;
  children: ReactNode;
}

function PolicySection({ marker, title, children }: PolicySectionProps) {
  return (
    <section className="pdf-policy-section">
      <p className="air-page-eyebrow">{marker}</p>
      <h2>{title}</h2>
      <div className="pdf-policy-body">{children}</div>
    </section>
  );
}

export function PrivacyPolicy() {
  return (
    <article aria-labelledby="privacy-title" className="air-page pdf-policy">
      <header className="pdf-policy-header">
        <p className="pdf-policy-eyebrow air-page-eyebrow">
          <ShieldCheck className="size-4" aria-hidden="true" />
          CloakPDF / Privacy document
        </p>
        <h1 id="privacy-title">Privacy policy.</h1>
        <p className="air-page-lede">
          CloakPDF is a free, open-source PDF workbench. Document processing happens inside your
          browser; the application has no upload service, user account, advertising, or analytics
          pipeline.
        </p>

        <dl className="air-reading-facts">
          <div>
            <dt>Last updated</dt>
            <dd>
              <time dateTime="2026-07-18">July 18, 2026</time>
            </dd>
          </div>
          <div>
            <dt>Document uploads</dt>
            <dd>None</dd>
          </div>
          <div>
            <dt>Product analytics</dt>
            <dd>None</dd>
          </div>
        </dl>
      </header>

      <PolicySection marker="01 / Local processing" title="Your documents stay on your device">
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
      </PolicySection>

      <PolicySection marker="02 / Data & tracking" title="No accounts, advertising, or analytics">
        <p>
          CloakPDF does not ask for a name or email address, create user profiles, set tracking
          cookies, or install third-party analytics and advertising scripts. The application does
          not intentionally collect or retain personal information about how you use the tools.
        </p>
        <ul className="pdf-policy-list">
          <li>No CloakPDF account or account identifier</li>
          <li>No document-content or document-metadata collection</li>
          <li>No behavioural analytics, advertising profile, or cross-site tracking</li>
          <li>No cookies or local-storage entries used for tracking</li>
        </ul>
      </PolicySection>

      <PolicySection
        marker="03 / Network requests"
        title="App assets may be downloaded; PDFs are not"
      >
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
      </PolicySection>

      <PolicySection marker="04 / Hosting" title="The static host may keep standard access logs">
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
      </PolicySection>

      <PolicySection
        marker="05 / Source & license"
        title="The privacy model is independently auditable"
      >
        <p>
          CloakPDF is open source. You can inspect the complete implementation in the{" "}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={POLICY_LINK_CLASS}
          >
            CloakPDF source repository
          </a>{" "}
          and verify where document bytes, browser storage, and network requests are handled.
        </p>
        <p>
          The project is released under the{" "}
          <a
            href={`${REPO_URL}/blob/main/LICENSE`}
            target="_blank"
            rel="noopener noreferrer"
            className={POLICY_LINK_CLASS}
          >
            MIT License
          </a>
          . You may use it personally or commercially and may self-host your own copy without a
          CloakPDF licensing fee.
        </p>
      </PolicySection>

      <PolicySection
        marker="06 / Rights & revisions"
        title="There is no CloakPDF account record to request"
      >
        <p>
          Because the CloakPDF application does not hold an account or document record about you, it
          has no user dataset to disclose, correct, export, or delete. Browser-cached assets, local
          drafts, and on-device model files can be removed through your browser’s site-data
          controls.
        </p>
        <p>
          Questions or concerns can be raised through{" "}
          <a
            href={`${REPO_URL}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className={POLICY_LINK_CLASS}
          >
            GitHub Issues
          </a>
          . If this policy changes, the revised document and its new effective date will be
          published on this page.
        </p>
      </PolicySection>
    </article>
  );
}
