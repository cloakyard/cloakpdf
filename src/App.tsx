/**
 * Root application module.
 *
 * Manages which view is active (home / tool / editor / privacy) and delegates
 * rendering to the matching child component. The home page is editor-first:
 * dropping a PDF opens the unified editor; only multi-input + special tools
 * remain as standalone cards.
 *
 * Tool metadata and lazy components live in `config/tool-registry.ts`.
 */

import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Layout } from "./components/Layout.tsx";
import { LoadingSpinner } from "./components/LoadingSpinner.tsx";
import { OrientationLock } from "./components/OrientationLock.tsx";
import { PrivacyPolicy } from "./components/PrivacyPolicy.tsx";
import { ReloadPrompt } from "./components/ReloadPrompt.tsx";
import { HomeScreen } from "./home/HomeScreen.tsx";
import { findTool, findToolComponent, type ToolId } from "./config/tool-registry.ts";
// Plain metadata (no editor component graph) — safe on the home critical path.
import { EDITOR_TOOL_IDS } from "./editor/tools.ts";
import type { Tool } from "./types.ts";
import { isMobileDevice } from "./utils/device-memory.ts";
import { NAVIGATE_TOOL_EVENT, OPEN_EDITOR_EVENT } from "./utils/nav.ts";
// The canvas editor is the primary single-PDF surface (editor-first redesign).
// Lazy-loaded so its pdf-lib / PDF.js graph stays off the home critical path,
// and rendered full-screen outside <Layout> (it owns its own chrome).
const EditorView = lazy(() => import("./editor/EditorView.tsx"));

// ═══════════════════════════════════════════════════════════════════
//  Sub-components (defined at module level per rerender-no-inline-
//  components best practice)
// ═══════════════════════════════════════════════════════════════════

/** Loading fallback for the editor route. Deliberately mirrors EditorShell's own
 *  centred "Opening PDF…" spinner (same size, same viewport-centred position) so
 *  the chunk-load → PDF-parse handoff shows ONE loader in ONE place — never a
 *  top-anchored spinner followed by a centred one. */
function EditorLoadingFallback() {
  return (
    <div
      className="fixed inset-0 z-[var(--z-editor)] flex items-center justify-center bg-[var(--color-paper-2)]"
      role="status"
      aria-live="polite"
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600"
        aria-hidden="true"
      />
      <span className="sr-only">Opening the PDF editor…</span>
    </div>
  );
}

// ── ToolView ─────────────────────────────────────────────────────

interface ToolViewProps {
  /** Metadata for the currently active tool. */
  tool: Tool;
  /** The lazy-loaded component to render. */
  Component: React.LazyExoticComponent<React.ComponentType>;
}

/**
 * Renders the active tool's header (title + description) and its
 * lazily-loaded component wrapped in a `Suspense` boundary. For
 * `desktopOnly` tools on a mobile UA, renders a placeholder explaining
 * why the tool isn't available instead of mounting it — the home grid
 * already hides the card, but a saved URL / shared link could still
 * land a phone user here directly.
 *
 * No width wrapper here: every tool spans the same responsive shell as
 * the home page (one container, uniform edges). Content-intrinsic caps
 * (chat-bubble measure, diff-image width) live inside the tools.
 */
function ToolView({ tool, Component }: ToolViewProps) {
  const Icon = tool.icon;
  const blockedOnMobile = tool.desktopOnly && isMobileDevice();
  return (
    <div className="cloak-tool-page">
      <div className="mb-5 flex items-center gap-2 text-primary-600">
        <Icon className="size-4" aria-hidden="true" />
        <span className="cloak-mono-label">Standalone utility / local execution</span>
        {tool.beta && (
          <span className="rounded-sm border border-primary-200 bg-primary-50 px-2 py-1 font-mono text-[9px] font-semibold tracking-[0.08em] text-primary-700 uppercase dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
            Beta
          </span>
        )}
      </div>
      <header className="cloak-tool-page__head">
        <div>
          <h1 className="cloak-tool-page__title">{tool.title}</h1>
        </div>
        <div className="cloak-tool-page__aside">
          <p className="m-0 text-lg leading-relaxed text-[var(--color-ink-2)]">
            {tool.description}
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-[10px] uppercase tracking-[0.05em]">
            <div>
              <dt className="text-[var(--color-ink-3)]">Execution</dt>
              <dd className="mt-1 text-[var(--color-ink)]">In browser</dd>
            </div>
            <div>
              <dt className="text-[var(--color-ink-3)]">Document transfer</dt>
              <dd className="mt-1 text-[var(--color-ink)]">None</dd>
            </div>
            {tool.requirements && (
              <div className="col-span-2 border-t border-[var(--color-rule)] pt-3">
                <dt className="text-[var(--color-ink-3)]">Requirement</dt>
                <dd className="mt-1 normal-case tracking-normal text-[var(--color-ink)]">
                  {tool.requirements}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </header>

      <section className="cloak-tool-instrument" aria-label={`${tool.title} workspace`}>
        <div className="cloak-instrument-bar">
          <span>CloakPDF / {tool.title}</span>
          <span className="inline-flex items-center gap-2">
            <span className="cloak-status-dot" aria-hidden="true" /> Local execution
          </span>
        </div>
        <div className="cloak-tool-instrument__body">
          {blockedOnMobile ? (
            <DesktopOnlyNotice tool={tool} />
          ) : (
            <Suspense
              fallback={<LoadingSpinner className="flex items-center justify-center py-20" />}
            >
              <Component />
            </Suspense>
          )}
        </div>
      </section>
    </div>
  );
}

/**
 * Calm placeholder shown when a `desktopOnly` tool is opened on a
 * mobile device. Says *why* (mobile WebGPU / RAM ceilings make the
 * on-device AI tools unreliable) so the user understands this isn't
 * a generic "feature unavailable" message but a deliberate gate.
 */
function DesktopOnlyNotice({ tool }: { tool: Tool }) {
  return (
    <div className="rounded-md border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-6 text-[var(--color-ink)] sm:p-8">
      <h2 className="text-lg font-semibold tracking-[-0.01em] mb-2">
        {tool.title} runs only on desktop
      </h2>
      <p className="leading-relaxed text-[var(--color-ink-2)]">
        On-device AI loads large model files into memory and pushes the GPU hard during inference.
        On phones this reliably causes the browser tab to crash or the GPU device to be lost
        mid-question, so we've disabled the tool on mobile rather than ship a broken experience.
      </p>
      <p className="mt-3 leading-relaxed text-[var(--color-ink-2)]">
        Open this page on a laptop or desktop with at least 16 GB of RAM to use it. Every other
        CloakPDF tool runs fine on this device.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  Root component
// ═══════════════════════════════════════════════════════════════════

/**
 * View state for the app — discriminated union so the active payload
 * (active tool id, edited file) lives next to the view tag.
 *
 * Kept here at module scope rather than as a `type View = ...` inside
 * `App` so the union is easier to read in isolation.
 */
type View =
  | { kind: "home" }
  | { kind: "tool"; toolId: ToolId }
  | { kind: "editor"; file: File | null; tool?: string | null }
  | { kind: "privacy" };

/**
 * Root application component.
 *
 * Manages which view is active and delegates rendering to the matching
 * child component. Keeps its own state minimal so that child-local
 * state (e.g. search) doesn't bubble up unnecessarily.
 */
export function App() {
  const [view, setView] = useState<View>({ kind: "home" });
  const previousView = useRef(view);
  useEffect(() => {
    if (previousView.current === view) return;
    previousView.current = view;
    // Immediate routes keep keyboard navigation responsive. Announce the new
    // main region without scrolling again; the full-screen editor owns focus.
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [view]);

  // Every view transition routes through navigate() so scroll-to-top happens
  // synchronously in the click/event path (before paint — no post-render scroll
  // jump) instead of as a [view] effect that also re-ran on same-view setView.
  const navigate = useCallback((next: View) => {
    setView(next);
    window.scrollTo(0, 0);
  }, []);

  const goHome = useCallback(() => navigate({ kind: "home" }), [navigate]);

  // Editor-first routing: single-PDF tools that live in the editor open it (with
  // that tool preselected); multi-file / terminal / AI surfaces stay standalone.
  const handleSelectTool = useCallback(
    (id: ToolId) => {
      if (EDITOR_TOOL_IDS.has(id)) navigate({ kind: "editor", file: null, tool: id });
      else navigate({ kind: "tool", toolId: id });
    },
    [navigate],
  );

  const openEditor = useCallback(
    (file: File | null = null, tool: string | null = null) => {
      navigate({ kind: "editor", file, tool });
    },
    [navigate],
  );

  const handlePrivacy = useCallback(() => {
    navigate({ kind: "privacy" });
  }, [navigate]);

  // Cross-component deep-link: a tool fires `navigateToTool(id)` and we
  // route to it. Currently used by the encrypted-PDF notice in
  // `usePdfFile` to deep-link into the PDF Password tool.
  useEffect(() => {
    function onNavigate(event: Event) {
      const id = (event as CustomEvent<ToolId>).detail;
      if (findTool(id)) navigate({ kind: "tool", toolId: id });
    }
    // A tool's secondary "& edit" action finished and handed its output PDF
    // to the editor (Merge / Images-to-PDF / PDF Password unlock).
    function onOpenEditor(event: Event) {
      const file = (event as CustomEvent<File>).detail;
      navigate({ kind: "editor", file, tool: null });
    }
    window.addEventListener(NAVIGATE_TOOL_EVENT, onNavigate);
    window.addEventListener(OPEN_EDITOR_EVENT, onOpenEditor);
    return () => {
      window.removeEventListener(NAVIGATE_TOOL_EVENT, onNavigate);
      window.removeEventListener(OPEN_EDITOR_EVENT, onOpenEditor);
    };
  }, [navigate]);

  // The editor owns the full viewport and its own chrome, so it renders
  // outside <Layout> (no centered max-width, no app header/footer). Orientation
  // is intentionally unlocked here — the editor adapts to landscape the way
  // CloakIMG's does, rather than forcing portrait like the standalone tools.
  if (view.kind === "editor") {
    return (
      <>
        <Suspense fallback={<EditorLoadingFallback />}>
          <EditorView initialFile={view.file} initialTool={view.tool ?? null} onExit={goHome} />
        </Suspense>
        <ReloadPrompt />
      </>
    );
  }

  const showBack = view.kind !== "home";
  // Route identity resets local state when switching tools.
  const viewKey = view.kind === "tool" ? `tool:${view.toolId}` : view.kind;

  return (
    <>
      <Layout onHome={goHome} showBack={showBack} onPrivacy={handlePrivacy}>
        <div key={viewKey}>
          <ViewContent view={view} onSelectTool={handleSelectTool} onOpenEditor={openEditor} />
        </div>
      </Layout>
      <ReloadPrompt />
      {view.kind === "tool" && <OrientationLock />}
    </>
  );
}

interface ViewContentProps {
  view: View;
  onSelectTool: (id: ToolId) => void;
  onOpenEditor: (file?: File | null) => void;
}

function ViewContent({ view, onSelectTool, onOpenEditor }: ViewContentProps) {
  switch (view.kind) {
    case "home":
      return <HomeScreen onSelectTool={onSelectTool} onOpenEditor={onOpenEditor} />;
    case "tool": {
      const meta = findTool(view.toolId);
      const Component = findToolComponent(view.toolId);
      if (!meta || !Component)
        return <HomeScreen onSelectTool={onSelectTool} onOpenEditor={onOpenEditor} />;
      return <ToolView tool={meta} Component={Component} />;
    }
    case "editor":
      // Rendered full-screen in App before <Layout>; never reached here. The
      // case satisfies the exhaustiveness check below.
      return null;
    case "privacy":
      return <PrivacyPolicy />;
    default: {
      // Exhaustiveness check — TypeScript will flag missing cases.
      const _exhaustive: never = view;
      void _exhaustive;
      return null;
    }
  }
}
