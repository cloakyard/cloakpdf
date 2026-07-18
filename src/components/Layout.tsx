/** Shared Cloakyard-family shell for marketing, privacy, and standalone tools. */

import { ArrowUpRight, ChevronLeft, Scale, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { tools } from "../config/tool-registry.ts";

declare const __APP_VERSION__: string;

const REPO_URL = "https://github.com/cloakyard/cloakpdf";
const CLOAKYARD_URL = "https://github.com/cloakyard";
const AUTHOR_URL = "https://github.com/sumitsahoo";

interface LayoutProps {
  children: ReactNode;
  onHome: () => void;
  showBack?: boolean;
  onPrivacy: () => void;
  footerVariant?: "statement" | "compact";
}

function GithubMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export function Layout({
  children,
  onHome,
  showBack = false,
  onPrivacy,
  footerVariant = "statement",
}: LayoutProps) {
  return (
    <div className="cloak-site flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[var(--z-system-overlay)] focus:rounded-md focus:bg-primary-600 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      <header className="cloak-site-header !h-[4.5rem]">
        <div className="site-frame cloak-site-header__inner">
          <div className="flex min-w-0 items-center gap-2">
            {showBack && (
              <button
                type="button"
                onClick={onHome}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-[var(--color-ink-2)] transition-colors hover:bg-[var(--color-paper-2)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 pointer-coarse:size-11"
                aria-label="Back to home"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
            )}

            <button
              type="button"
              onClick={onHome}
              aria-label="CloakPDF home"
              className="flex min-h-10 min-w-0 items-center gap-[0.6rem] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 pointer-coarse:min-h-11"
            >
              <img
                src="/icons/logo.svg"
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
          </div>

          <nav
            aria-label="Primary navigation"
            className="cloak-site-header__nav flex items-center justify-center gap-1"
          >
            {!showBack && (
              <>
                <a className="cloak-nav-link" href="#workbench">
                  Editor
                </a>
                <a className="cloak-nav-link" href="#toolkit">
                  Toolkit
                </a>
                <a className="cloak-nav-link" href="#privacy-model">
                  Privacy
                </a>
              </>
            )}
          </nav>

          <div className="flex items-center justify-end">
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
        </div>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className={`${showBack ? "site-frame" : ""} w-full flex-1 scroll-mt-20`}
      >
        {children}
      </main>

      <footer
        className="cloak-site-footer mt-auto"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div
          className={`site-frame ${footerVariant === "statement" ? "py-8 sm:py-10" : "py-6 sm:py-7"}`}
        >
          {footerVariant === "statement" ? (
            <div className="grid gap-8 border-b border-[var(--color-night-rule)] pb-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-end lg:gap-20">
              <div>
                <p className="cloak-mono-label mb-4 text-primary-400">CloakPDF / Cloakyard</p>
                <p className="cloak-site-footer__statement">
                  Open a PDF. <span className="text-primary-400">Keep it local.</span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 font-mono text-xs uppercase tracking-[0.04em] text-[var(--color-night-muted)]">
                {showBack ? (
                  <button
                    type="button"
                    onClick={onHome}
                    className="text-left hover:text-primary-400 focus-visible:outline-none focus-visible:text-primary-400"
                  >
                    Home / {tools.length} utilities
                  </button>
                ) : (
                  <a
                    className="hover:text-primary-400 focus-visible:outline-none focus-visible:text-primary-400"
                    href="#toolkit"
                  >
                    {tools.length} utilities
                  </a>
                )}
                <a
                  className="hover:text-primary-400 focus-visible:outline-none focus-visible:text-primary-400"
                  href={REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                </a>
                <button
                  type="button"
                  onClick={onPrivacy}
                  className="text-left hover:text-primary-400 focus-visible:outline-none focus-visible:text-primary-400"
                >
                  Privacy policy
                </button>
                <a
                  className="hover:text-primary-400 focus-visible:outline-none focus-visible:text-primary-400"
                  href={CLOAKYARD_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  Cloakyard <ArrowUpRight className="ml-1 inline size-3" aria-hidden="true" />
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5 border-b border-[var(--color-night-rule)] pb-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={onHome}
                aria-label="CloakPDF home"
                className="cloak-focus inline-flex min-h-10 w-fit items-center gap-[0.6rem] rounded-md pointer-coarse:min-h-11"
              >
                <img
                  src="/icons/logo.svg"
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
              </button>
              <p className="m-0 max-w-md text-sm leading-relaxed text-[var(--color-night-muted)] sm:text-right">
                A focused PDF utility running inside the same private browser workbench.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-6 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-night-muted)] sm:flex-row sm:items-center">
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
            <div className="flex items-center gap-4 sm:ml-auto">
              <button
                type="button"
                onClick={onPrivacy}
                className="inline-flex items-center gap-2 hover:text-primary-400 focus-visible:outline-none focus-visible:text-primary-400"
              >
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                Privacy
              </button>
              <a
                className="inline-flex items-center gap-2 hover:text-primary-400 focus-visible:outline-none focus-visible:text-primary-400"
                href={`${REPO_URL}/blob/main/LICENSE`}
                target="_blank"
                rel="noreferrer"
              >
                <Scale className="size-3.5" aria-hidden="true" />
                MIT licensed
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
