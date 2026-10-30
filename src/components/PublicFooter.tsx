/** Common public footer, including the independent render-recovery surface. */
import { ArrowUpRight } from "lucide-react";

declare const __APP_VERSION__: string;
export function PublicFooter({ privacy = false }: { privacy?: boolean }) {
  return (
    <footer className="air-page-width air-page-footer pdf-footer">
      <p className="air-page-identity">
        <span translate="no">CloakPDF v{__APP_VERSION__}</span>
        <span>
          Built by{" "}
          <a href="https://github.com/sumitsahoo" target="_blank" rel="noopener noreferrer">
            Sumit Sahoo
          </a>
        </span>
      </p>
      <nav aria-label="Footer navigation">
        <a
          href={`${import.meta.env.BASE_URL}?view=privacy`}
          aria-current={privacy ? "page" : undefined}
        >
          Privacy
        </a>
        <a href="https://github.com/cloakyard/cloakpdf" target="_blank" rel="noopener noreferrer">
          Source <ArrowUpRight aria-hidden="true" />
        </a>
        <a
          href="https://github.com/cloakyard/cloakpdf/blob/main/LICENSE"
          target="_blank"
          rel="noopener noreferrer"
        >
          MIT license <ArrowUpRight aria-hidden="true" />
        </a>
        <a href="https://cloakyard.com">
          Cloakyard <ArrowUpRight size={16} aria-hidden="true" />
        </a>
        <a href="https://ko-fi.com/sumitsahoo21" target="_blank" rel="noopener noreferrer">
          Buy me a coffee <ArrowUpRight aria-hidden="true" />
        </a>
      </nav>
    </footer>
  );
}
