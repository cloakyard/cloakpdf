/** Air shell shared by the entry, reading and standalone routes. */
import { ArrowRight, ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

declare const __APP_VERSION__: string;
export function Layout({
  children,
  onHome,
  showBack = false,
  onPrivacy,
}: {
  children: ReactNode;
  onHome: () => void;
  showBack?: boolean;
  onPrivacy: () => void;
}) {
  return (
    <div className="pdf-site">
      <a href="#main" className="air-button air-button--primary air-page-skip">
        Skip to main content
      </a>
      <header className="air-page-width air-page-header pdf-header">
        <div className="pdf-brand-group">
          {showBack && (
            <button
              type="button"
              className="air-icon-button air-button--quiet"
              onClick={onHome}
              aria-label="Back to home"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={onHome}
            aria-label="CloakPDF home"
            className="air-page-brand pdf-brand"
          >
            <img src="/cloakpdf-mark.svg" alt="" width="36" height="36" className="air-page-mark" />
            <span translate="no">CloakPDF</span>
          </button>
        </div>
        <nav className="air-page-nav" aria-label="Primary navigation">
          {!showBack && (
            <>
              <a href="#workbench">Editor</a>
              <a href="#toolkit">Tools</a>
            </>
          )}
          <a
            href="https://github.com/cloakyard/cloakpdf"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View CloakPDF source on GitHub"
          >
            Source <ArrowRight size={14} aria-hidden="true" />
          </a>
        </nav>
      </header>
      <main id="main" tabIndex={-1} className={showBack ? "air-page-width pdf-main" : "pdf-main"}>
        {children}
      </main>
      <footer className="air-page-width air-page-footer pdf-footer">
        <div>
          <p>
            CloakPDF <span className="pdf-version">v{__APP_VERSION__}</span>
          </p>
          <p>
            Made for your files. Part of <a href="https://cloakyard.com">Cloakyard</a>.
          </p>
        </div>
        <nav aria-label="Footer">
          <button className="air-button air-button--quiet" type="button" onClick={onPrivacy}>
            Privacy policy
          </button>
          <a
            href="https://github.com/cloakyard/cloakpdf/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
          >
            MIT license
          </a>
          <a href="https://github.com/sumitsahoo" target="_blank" rel="noopener noreferrer">
            Sumit Sahoo
          </a>
        </nav>
      </footer>
    </div>
  );
}
