import { AlertTriangle, Check, Copy, RefreshCw, ShieldCheck } from "lucide-react";
import { Component, createRef, type ErrorInfo, type ReactNode } from "react";

declare const __APP_VERSION__: string;

const REPO_URL = "https://github.com/cloakyard/cloakpdf";
const AUTHOR_URL = "https://github.com/sumitsahoo";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  copied: boolean;
}

function GithubMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, copied: false };

  private reloadButtonRef = createRef<HTMLButtonElement>();
  private copyResetTimer: ReturnType<typeof setTimeout> | null = null;

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[CloakPDF] Uncaught error:", error, info.componentStack);
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
    this.setState({ error: null, copied: false });
  };

  private handleCopy = async (): Promise<void> => {
    const { error } = this.state;
    if (!error) return;
    const text = `CloakPDF ${__APP_VERSION__} — ${new Date().toISOString()}\n\n${error.message}\n\n${error.stack ?? "(no stack)"}\n\nBrowser: ${navigator.userAgent}`;
    try {
      await navigator.clipboard.writeText(text);
      this.setState({ copied: true });
      if (this.copyResetTimer) clearTimeout(this.copyResetTimer);
      this.copyResetTimer = setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // Clipboard unavailable (older browsers, insecure contexts) — silent noop.
    }
  };

  render(): ReactNode {
    const { error, copied } = this.state;
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

    const focusRing =
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-paper)]";

    return (
      <div className="cloak-site flex min-h-svh flex-col">
        <a
          href="#error-main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[var(--z-system-overlay)] focus:rounded-md focus:bg-primary-600 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to error details
        </a>

        <header className="cloak-site-header !h-[4.5rem]">
          <div className="site-frame flex h-full items-center justify-between gap-4">
            <button
              type="button"
              onClick={this.handleReload}
              aria-label="Reload CloakPDF"
              className={`flex min-w-0 items-center gap-[0.6rem] rounded-md ${focusRing}`}
            >
              <img
                src="/cloakpdf-mark.svg"
                alt=""
                aria-hidden="true"
                width="40"
                height="40"
                className="size-10 shrink-0 rounded-full"
              />
              <span
                translate="no"
                className="whitespace-nowrap text-[1.125rem] leading-none font-[800] tracking-[-0.02em] text-[var(--color-ink)]"
              >
                Cloak<span className="text-[var(--color-accent)]">PDF</span>
              </span>
            </button>

            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="cloak-outline-link pointer-coarse:min-h-11"
              aria-label="View CloakPDF source on GitHub"
            >
              <GithubMark className="size-3.5" />
              <span className="hidden sm:inline">Source</span>
            </a>
          </div>
        </header>

        <main
          id="error-main"
          tabIndex={-1}
          className="site-frame w-full flex-1 scroll-mt-20 py-14 sm:py-20"
        >
          <div className="mx-auto max-w-[52rem]">
            <header
              role="alert"
              aria-live="assertive"
              className="border-b border-[var(--color-rule-strong)] pb-10 sm:pb-14"
            >
              <p className="m-0 flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.1em] text-red-600 uppercase dark:text-red-400">
                <AlertTriangle className="size-4" aria-hidden="true" />
                Application error / local session
              </p>
              <h1 className="mt-6 min-w-0 text-[clamp(3rem,9vw,6rem)] leading-[0.92] font-[760] tracking-[-0.06em] text-[var(--color-ink)] text-balance wrap-anywhere">
                Something went wrong.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-relaxed text-[var(--color-ink-2)]">
                CloakPDF hit an unexpected error. Reload the app first; if the problem returns, the
                diagnostic below can be attached to a GitHub issue.
              </p>
            </header>

            <section className="flex items-start gap-3 border-b border-[var(--color-rule)] py-6">
              <ShieldCheck
                className="mt-0.5 size-5 shrink-0 text-[var(--color-accent)]"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-base font-semibold text-[var(--color-ink)]">
                  Your PDF was not uploaded
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-2)]">
                  The error happened inside the local browser session; CloakPDF has no document
                  upload endpoint.
                </p>
              </div>
            </section>

            <section className="border-b border-[var(--color-rule)] py-8 sm:py-10">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="m-0 font-mono text-[10px] font-semibold tracking-[0.09em] text-[var(--color-accent)] uppercase">
                    01 / Diagnostic
                  </p>
                  <h2 className="mt-2 text-xl font-[700] tracking-[-0.025em] text-[var(--color-ink)]">
                    Error details
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={this.handleCopy}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[var(--radius-input)] border border-[var(--color-rule-strong)] px-3 font-mono text-[10px] font-semibold tracking-[0.05em] text-[var(--color-ink-2)] uppercase transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] ${focusRing}`}
                  aria-label={copied ? "Copied to clipboard" : "Copy error details to clipboard"}
                >
                  {copied ? (
                    <Check className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Copy className="size-3.5" aria-hidden="true" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
                <span className="sr-only" role="status" aria-live="polite">
                  {copied ? "Error details copied to clipboard." : ""}
                </span>
              </div>
              <pre className="thin-scrollbar max-h-48 overflow-x-auto rounded-[var(--radius-input)] border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-[var(--color-ink)] wrap-anywhere">
                {error.message}
              </pre>
              <p className="mt-3 font-mono text-[10px] tracking-[0.05em] text-[var(--color-ink-3)] uppercase">
                CloakPDF {__APP_VERSION__} / {new Date().toLocaleString()}
              </p>
            </section>

            <section className="py-8 sm:py-10">
              <p className="m-0 font-mono text-[10px] font-semibold tracking-[0.09em] text-[var(--color-accent)] uppercase">
                02 / Recovery
              </p>
              <h2 className="mt-2 text-xl font-[700] tracking-[-0.025em] text-[var(--color-ink)]">
                Continue from a clean app state
              </h2>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  ref={this.reloadButtonRef}
                  type="button"
                  onClick={this.handleReload}
                  className={`cloak-action-button inline-flex items-center justify-center gap-2 border border-[var(--color-accent)] bg-[var(--color-accent)] px-6 text-[var(--color-accent-ink)] transition-colors hover:bg-[var(--color-accent-hover)] ${focusRing}`}
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Reload app
                </button>
                <button
                  type="button"
                  onClick={this.handleReset}
                  className={`cloak-action-button inline-flex items-center justify-center border border-[var(--color-rule-strong)] bg-[var(--color-surface)] px-6 text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] ${focusRing}`}
                >
                  Try again
                </button>
              </div>
              <p className="mt-6 text-sm leading-relaxed text-[var(--color-ink-2)]">
                If this keeps happening,{" "}
                <a
                  href={issueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-semibold text-[var(--color-accent)] underline decoration-[var(--color-rule-strong)] underline-offset-4 hover:text-[var(--color-accent-hover)] ${focusRing}`}
                >
                  report the issue on GitHub
                </a>
                . The version, browser, error, and stack trace will be pre-filled in the report.
              </p>
            </section>
          </div>
        </main>

        <footer
          className="cloak-site-footer mt-auto"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="site-frame py-6 sm:py-7">
            <div className="flex flex-col gap-5 border-b border-[var(--color-night-rule)] pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex items-center gap-[0.6rem]">
                <img
                  src="/cloakpdf-mark.svg"
                  alt=""
                  aria-hidden="true"
                  width="34"
                  height="34"
                  className="size-[34px] shrink-0 rounded-full"
                />
                <span
                  translate="no"
                  className="whitespace-nowrap text-[1.125rem] leading-none font-[800] tracking-[-0.02em] text-[var(--color-night-ink)]"
                >
                  Cloak<span className="text-primary-400">PDF</span>
                </span>
              </div>
              <p className="m-0 max-w-md text-sm leading-relaxed text-[var(--color-night-muted)] sm:text-right">
                Open-source PDF tools, processed inside your browser.
              </p>
            </div>
            <div className="flex flex-col gap-3 pt-6 font-mono text-[10px] tracking-[0.06em] text-[var(--color-night-muted)] uppercase sm:flex-row sm:items-center">
              <span translate="no">CloakPDF v{__APP_VERSION__}</span>
              <span className="hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span>
                Built by{" "}
                <a
                  className="text-[var(--color-night-ink)] hover:text-primary-400 focus-visible:outline-none focus-visible:text-primary-400"
                  href={AUTHOR_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  Sumit Sahoo
                </a>
              </span>
              <a
                href={`${REPO_URL}/blob/main/LICENSE`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-400 focus-visible:outline-none focus-visible:text-primary-400 sm:ml-auto"
              >
                MIT licensed
              </a>
            </div>
          </div>
        </footer>
      </div>
    );
  }
}
