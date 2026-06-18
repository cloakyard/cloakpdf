/**
 * Privacy Policy page.
 *
 * Describes how CloakPDF handles (or rather, does not handle) user data.
 * All processing is client-side, so the policy is intentionally brief.
 *
 * Layout follows the home page's 4/8 rail: the title and overview anchor
 * the left rail, the policy sections sit in a two-column grid on the
 * right — so the page spans the full shell while each prose column keeps
 * a readable measure.
 */

import { ShieldCheck } from "lucide-react";

/** Shared heading style for the policy sections. */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold text-slate-800 dark:text-dark-text mb-2">{children}</h2>
  );
}

export function PrivacyPolicy() {
  return (
    <div className="grid gap-x-8 gap-y-8 lg:grid-cols-12 lg:items-start lg:gap-x-10">
      {/* ── Left rail: title, date, overview ── */}
      <div className="lg:col-span-4 xl:col-span-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-dark-text">
              Privacy Policy
            </h1>
            <p className="text-slate-500 dark:text-dark-text-muted mt-0.5">
              Last updated: June 12, 2026
            </p>
          </div>
        </div>
        <p className="mt-5 text-sm text-slate-600 dark:text-dark-text-muted leading-relaxed">
          CloakPDF is a free, open-source PDF toolkit that runs entirely in your web browser. We are
          committed to your privacy. This policy explains what data we collect (spoiler: none) and
          how the application works.
        </p>
      </div>

      {/* ── Policy sections — two columns from sm ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8 lg:col-span-8 xl:col-span-9 text-sm text-slate-600 dark:text-dark-text-muted leading-relaxed">
        <section>
          <SectionHeading>Your Files Stay on Your Device</SectionHeading>
          <p>
            All PDF processing — merging, splitting, compressing, signing, OCR, and every other
            operation — is performed locally in your browser using JavaScript. Your files are{" "}
            <strong className="text-slate-700 dark:text-dark-text">never uploaded</strong> to any
            server. No file content, metadata, or document data is transmitted over the network.
          </p>
        </section>

        <section>
          <SectionHeading>No Personal Data Collected</SectionHeading>
          <p>We do not collect, store, or process any personal information, including:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside marker:text-slate-400">
            <li>Names, email addresses, or account details (there are no accounts)</li>
            <li>IP addresses or device identifiers</li>
            <li>Usage analytics or behavioural tracking</li>
            <li>Cookies or persistent identifiers of any kind</li>
          </ul>
        </section>

        <section>
          <SectionHeading>No Cookies or Tracking</SectionHeading>
          <p>
            CloakPDF does not use cookies, local storage for tracking purposes, or any third-party
            analytics or advertising scripts. The application may use your browser’s cache and a
            Service Worker to enable offline use after the first visit; this data is stored only on
            your device and is never sent anywhere.
          </p>
        </section>

        <section>
          <SectionHeading>On-Device AI &amp; OCR</SectionHeading>
          <p>
            The Ask PDF feature runs open AI models in your browser via{" "}
            <strong className="text-slate-700 dark:text-dark-text">Transformers.js</strong> — your
            document, questions, and answers never leave your device. The OCR tool reads page layout
            with <strong className="text-slate-700 dark:text-dark-text">LlamaIndex</strong>
            ’s LlamaParse Lite (WebAssembly) and recognises scanned text with Tesseract, also fully
            on-device. Model files are fetched once from a public CDN and cached locally; those
            requests never contain your files. The document index Ask PDF builds is stored in your
            browser’s IndexedDB and can be removed at any time by clearing site data.
          </p>
        </section>

        <section>
          <SectionHeading>Third-Party Services</SectionHeading>
          <p>
            CloakPDF does not integrate any third-party analytics, advertising, or data-collection
            services. The application is hosted as a static site; standard web-server access logs
            (IP address, requested path, timestamp) may be retained by the hosting provider for
            security and operational purposes, subject to the hosting provider’s own privacy policy.
            No file content is included in these logs.
          </p>
        </section>

        <section>
          <SectionHeading>Open Source</SectionHeading>
          <p>
            CloakPDF is open source. You can inspect the full source code at{" "}
            <a
              href="https://github.com/cloakyard/cloakpdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50 rounded-sm"
            >
              github.com/cloakyard/cloakpdf
            </a>{" "}
            to verify these claims independently.
          </p>
        </section>

        <section>
          <SectionHeading>License &amp; Usage</SectionHeading>
          <p>
            CloakPDF is released under the{" "}
            <a
              href="https://github.com/cloakyard/cloakpdf/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50 rounded-sm"
            >
              MIT License
            </a>
            . You’re free to use it for personal or commercial purposes, and you can self-host your
            own copy — there are no licensing fees or restrictions.
          </p>
        </section>

        <section>
          <SectionHeading>Your Rights (GDPR &amp; Similar)</SectionHeading>
          <p>
            Because we do not collect any personal data, there is nothing for us to disclose,
            correct, or delete on your behalf. If you have questions about this policy, you can
            reach out via{" "}
            <a
              href="https://github.com/cloakyard/cloakpdf/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50 rounded-sm"
            >
              GitHub Issues
            </a>
            .
          </p>
        </section>

        <section>
          <SectionHeading>Changes to This Policy</SectionHeading>
          <p>
            If this policy ever changes, the updated version will be published here with a revised
            date at the top. Given the privacy-by-design nature of this application, significant
            changes are unlikely.
          </p>
        </section>
      </div>
    </div>
  );
}
