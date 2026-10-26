import { AlertTriangle, ArrowUpRight, Check, Copy, RefreshCw } from "lucide-react";
import { Component, createRef, type ErrorInfo, type ReactNode } from "react";

import { PublicFooter } from "./PublicFooter.tsx";

declare const __APP_VERSION__: string;

const REPO_URL = "https://github.com/cloakyard/cloakpdf";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  copied: boolean;
  copyFailed: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, copied: false, copyFailed: false };

  private reloadButtonRef = createRef<HTMLButtonElement>();
  private copyResetTimer: ReturnType<typeof setTimeout> | null = null;

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[CloakPDF] Uncaught error:", error, info.componentStack);
    window.requestAnimationFrame(() => this.reloadButtonRef.current?.focus());
  }

  componentDidUpdate(_prevProps: Props, prevState: State): void {
    if (!prevState.error && this.state.error) {
      this.reloadButtonRef.current?.focus();
    }
  }

  componentWillUnmount(): void {
    if (this.copyResetTimer) clearTimeout(this.copyResetTimer);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleReset = (): void => {
    if (this.copyResetTimer) clearTimeout(this.copyResetTimer);
    this.setState({ error: null, copied: false, copyFailed: false }, () => {
      document.querySelector<HTMLElement>("main[tabindex]")?.focus();
    });
  };

  private handleCopy = async (): Promise<void> => {
    const { error } = this.state;
    if (!error) return;
    const text = `CloakPDF ${__APP_VERSION__} — ${new Date().toISOString()}\n\n${error.message}\n\n${error.stack ?? "(no stack)"}\n\nBrowser: ${navigator.userAgent}`;
    try {
      await navigator.clipboard.writeText(text);
      this.setState({ copied: true, copyFailed: false });
      if (this.copyResetTimer) clearTimeout(this.copyResetTimer);
      this.copyResetTimer = setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      this.setState({ copied: false, copyFailed: true });
    }
  };

  render(): ReactNode {
    const { error, copied, copyFailed } = this.state;
    if (!error) return this.props.children;

    const issueBody = [
      `**CloakPDF version:** ${__APP_VERSION__}`,
      `**When:** ${new Date().toISOString()}`,
      `**Browser:** ${navigator.userAgent}`,
      ``,
      `**Error:** ${error.message}`,
      ``,
      `**Stack:**`,
      `\`\`\``,
      error.stack ?? "(no stack)",
      `\`\`\``,
    ].join("\n");

    const issueUrl = `${REPO_URL}/issues/new?title=${encodeURIComponent(
      `Crash: ${error.message}`,
    )}&body=${encodeURIComponent(issueBody)}`;

    return (
      <div className="pdf-site">
        <a href="#error-main" className="air-button air-button--primary air-page-skip">
          Skip to error details
        </a>
        <header className="air-page-width air-page-header pdf-header">
          <button
            type="button"
            onClick={this.handleReload}
            aria-label="Reload CloakPDF"
            className="air-page-brand pdf-brand"
          >
            <img src="/cloakpdf-mark.svg" alt="" width="36" height="36" className="air-page-mark" />
            <span translate="no">CloakPDF</span>
          </button>
          <nav className="air-page-nav" aria-label="Primary navigation">
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              Source <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </nav>
        </header>
        <main id="error-main" tabIndex={-1} className="air-page-width air-page pdf-error-main">
          <div className="air-prose">
            <header>
              <p className="air-page-kicker">
                <AlertTriangle size={16} aria-hidden="true" /> Something interrupted your session
              </p>
              <h1>Let’s get you back.</h1>
              <p role="alert">
                CloakPDF ran into an unexpected error. Try again, or reload the app if the problem
                continues.
              </p>
            </header>
            <div className="air-page-actions">
              <button
                ref={this.reloadButtonRef}
                type="button"
                onClick={this.handleReload}
                className="air-button air-button--primary"
              >
                <RefreshCw size={16} aria-hidden="true" /> Reload app
              </button>
              <button type="button" onClick={this.handleReset} className="air-button">
                Try again
              </button>
            </div>
            <p className="air-help">
              Reloading may lose unsaved changes. Your original PDF remains on your device.
            </p>
            <section className="pdf-error-details" aria-labelledby="error-details-title">
              <div className="pdf-error-heading">
                <h2 id="error-details-title">Error details</h2>
                <button
                  type="button"
                  onClick={this.handleCopy}
                  className="air-button"
                  aria-label="Copy error details to clipboard"
                >
                  {copied ? (
                    <Check size={16} aria-hidden="true" />
                  ) : (
                    <Copy size={16} aria-hidden="true" />
                  )}
                  <span className="air-action-labels">
                    <span data-active={!copied || undefined} aria-hidden={copied}>
                      Copy details
                    </span>
                    <span data-active={copied || undefined} aria-hidden={!copied}>
                      Copied
                    </span>
                  </span>
                </button>
              </div>
              <pre className="pdf-error-message" tabIndex={0} aria-label="Error message">
                {error.message}
              </pre>
              <p className="air-help">CloakPDF {__APP_VERSION__}</p>
              <p
                role="status"
                aria-live="polite"
                className={`air-help pdf-copy-status${copyFailed ? " air-help--error" : ""}`}
              >
                {copyFailed
                  ? "Couldn’t copy automatically. Select the error message above to copy it manually."
                  : copied
                    ? "Error details copied to clipboard."
                    : ""}
              </p>
            </section>
            <p>
              If this keeps happening,{" "}
              <a href={issueUrl} target="_blank" rel="noopener noreferrer">
                report the issue on GitHub
              </a>
              . The report will include the version, browser, error and stack trace. You can review
              it before posting.
            </p>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }
}
