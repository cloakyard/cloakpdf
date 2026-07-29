/**
 * Application entry point.
 *
 * Mounts the React root onto the `#app` element in index.html.
 * StrictMode is enabled to surface potential issues during development.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { MotionProvider } from "./components/motion.tsx";
import { synchronizeModelCache } from "./utils/ai-runtime.ts";
import "./index.css";

// Model upgrades invalidate their CacheStorage bytes and every PDF
// embedding index derived from them. Finish that small, local cleanup
// before React mounts so a stale ready flag can never auto-load an old
// pipeline while eviction is in flight.
await synchronizeModelCache();

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <ErrorBoundary>
      <MotionProvider>
        <App />
      </MotionProvider>
    </ErrorBoundary>
  </StrictMode>,
);
