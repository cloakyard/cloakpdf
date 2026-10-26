/** Common public footer, including the independent render-recovery surface. */
import { ArrowUpRight } from "lucide-react";

declare const __APP_VERSION__: string;
export function PublicFooter({ onPrivacy }: { onPrivacy?: () => void }) {
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
        {onPrivacy ? (
          <button type="button" onClick={onPrivacy}>
            Privacy policy
          </button>
        ) : (
          <a href={`${import.meta.env.BASE_URL}?view=privacy`}>Privacy policy</a>
        )}
        <a href="https://github.com/cloakyard/cloakpdf" target="_blank" rel="noopener noreferrer">
          Source
        </a>
        <a
          href="https://github.com/cloakyard/cloakpdf/blob/main/LICENSE"
          target="_blank"
          rel="noopener noreferrer"
        >
          MIT license
        </a>
        <a href="https://cloakyard.com">
          Cloakyard <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </nav>
    </footer>
  );
}
