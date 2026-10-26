/** Air shell shared by the entry, reading and standalone routes. */
import { ArrowUpRight, ChevronDown, ChevronLeft } from "lucide-react";
import { useRef, type ReactNode } from "react";

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
  const disclosure = useRef<HTMLDetailsElement>(null);
  const links = (
    <>
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
        Source <ArrowUpRight size={16} aria-hidden="true" />
      </a>
    </>
  );
  return (
    <div className="pdf-site">
      <a href="#main" className="air-button air-button--primary air-page-skip">
        Skip to main content
      </a>
      <div className="pdf-header-shell">
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
              <img
                src="/cloakpdf-mark.svg"
                alt=""
                width="36"
                height="36"
                className="air-page-mark"
              />
              <span translate="no">CloakPDF</span>
            </button>
          </div>
          <nav className="air-page-nav pdf-desktop-nav" aria-label="Primary navigation">
            {links}
          </nav>
          <details
            className="pdf-mobile-nav"
            ref={disclosure}
            onKeyDown={(event) => {
              if (event.key === "Escape" && disclosure.current?.open) {
                disclosure.current.open = false;
                disclosure.current.querySelector("summary")?.focus();
                event.preventDefault();
              }
            }}
          >
            <summary className="air-button air-button--quiet">
              Menu <ChevronDown size={16} aria-hidden="true" />
            </summary>
            <nav
              className="air-page-nav"
              aria-label="Primary navigation"
              onClick={(event) => {
                const anchor = (event.target as Element).closest("a");
                if (!anchor || !disclosure.current) return;
                disclosure.current.open = false;
                disclosure.current.querySelector("summary")?.focus({ preventScroll: true });
                const href = anchor.getAttribute("href");
                if (href?.startsWith("#"))
                  document.getElementById(href.slice(1))?.focus({ preventScroll: true });
              }}
            >
              {links}
            </nav>
          </details>
        </header>
      </div>
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
          <button type="button" onClick={onPrivacy}>
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
