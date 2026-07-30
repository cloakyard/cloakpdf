/* Hallmark · component scope: PWA updater · design-system: DESIGN.md · tone: technical-operational · contrast/focus/mobile: pass */
/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V4 */

// ReloadPrompt.tsx — PWA service-worker update banner. Shown when a new
// SW version is available, or briefly when the app first becomes
// installable with its core interface cached.
//
// A compact operational surface at the bottom-right (bottom-center on
// mobile), with an "Update" button when needRefresh and a self-dismissing
// cache-status toast on first install.

import { RefreshCw, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { AnimatePresence, m, variants } from "./motion.tsx";

const UPDATE_CHECK_INTERVAL_MS = 10 * 60 * 1000;
const RELOAD_FALLBACK_MS = 1500;

type ReloadNoticeVariant = "update" | "offline";

interface ReloadNoticeProps {
  variant: ReloadNoticeVariant;
  updating?: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ReloadNotice({ variant, updating = false, onClose, onUpdate }: ReloadNoticeProps) {
  const isUpdate = variant === "update";
  const Icon = isUpdate ? RefreshCw : ShieldCheck;
  const eyebrow = isUpdate ? "System update" : "Offline support";
  const title = isUpdate ? "Update CloakPDF" : "Core app cached";
  const body = isUpdate
    ? "A newer build is ready. Update now to apply the latest fixes."
    : "The core interface is cached. AI models and OCR data may still require a connection.";
  const announcement = updating ? "Updating CloakPDF…" : `${title}. ${body}`;

  return (
    <>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
      <div
        className="cloak-dialog cloak-dialog--floating relative flex w-full max-w-sm flex-col overflow-hidden"
        aria-busy={updating}
      >
        <div className="flex items-start gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-mono text-xxs font-semibold uppercase leading-none tracking-[0.07em] text-primary-600">
              <Icon
                className={`h-4 w-4 shrink-0 ${updating ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              {eyebrow}
            </p>
            <p className="mt-2 text-card-title font-semibold leading-tight tracking-[-0.01em] text-[var(--color-ink)]">
              {updating ? "Applying update…" : title}
            </p>
            <p className="mt-1 text-xs leading-[1.5] text-[var(--color-ink-3)]">{body}</p>
          </div>
          {!isUpdate && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Dismiss cache status"
              className="cloak-dialog__close cloak-focus -mr-2 -mt-2"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
        {isUpdate && (
          <div className="flex items-center justify-end gap-2 border-t border-[var(--color-rule)] bg-[var(--color-paper-2)] px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={updating}
              className="cloak-focus min-h-10 whitespace-nowrap rounded-md border border-[var(--color-rule-strong)] bg-[var(--color-surface)] px-3 py-1.5 font-mono text-xxs font-semibold uppercase tracking-wide text-[var(--color-ink-2)] transition-[background-color,border-color,color,transform] hover:border-primary-500 hover:text-primary-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:min-h-11"
            >
              Later
            </button>
            <button
              type="button"
              onClick={onUpdate}
              disabled={updating}
              className="cloak-focus inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-md bg-primary-600 px-3 py-1.5 font-mono text-xxs font-semibold uppercase tracking-wide text-[var(--color-accent-ink)] transition-[background-color,opacity,transform] hover:bg-primary-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary-600 pointer-coarse:min-h-11"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${updating ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              {updating ? "Updating…" : "Update now"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export function ReloadPrompt() {
  // Stash the SW update interval + the live registration so the unmount
  // cleanup can clear the timer and so the focus/visibility listeners below —
  // which fire outside `useRegisterSW`'s onRegisteredSW lifecycle — can reach
  // the registration to trigger an update check.
  const updateIntervalRef = useRef<number | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const swUrlRef = useRef<string>("");
  const lastCheckRef = useRef<number>(0);
  const updatingRef = useRef(false);
  const [updating, setUpdating] = useState(false);

  // Poll sw.js for a freshly-deployed build. Throttled to once a minute so the
  // interval and the focus/visibility listeners can all call it without
  // hammering the network. `cache: "no-store"` bypasses the HTTP cache so an
  // edge-revalidated sw.js is always seen.
  const checkForUpdate = useCallback(async () => {
    const registration = registrationRef.current;
    if (!registration || registration.installing) return;
    if (!navigator.onLine) return;
    const now = Date.now();
    if (now - lastCheckRef.current < 60_000) return;
    lastCheckRef.current = now;
    try {
      const resp = await fetch(swUrlRef.current, { cache: "no-store" });
      if (resp.status === 200) await registration.update();
    } catch {
      // Network blip — try again on the next interval or refocus.
    }
  }, []);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      registrationRef.current = registration;
      swUrlRef.current = swUrl;
      if (updateIntervalRef.current !== null) {
        window.clearInterval(updateIntervalRef.current);
      }
      updateIntervalRef.current = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
    },
  });

  // A tab left open while a new build ships would otherwise wait up to a full
  // poll interval to notice (this SPA has no real navigations to trigger the
  // browser's own SW update check). Re-checking when the user returns to the
  // tab makes the "Update available" prompt appear within seconds of refocus.
  useEffect(() => {
    const onForeground = () => {
      if (document.visibilityState === "visible") void checkForUpdate();
    };
    document.addEventListener("visibilitychange", onForeground);
    window.addEventListener("focus", onForeground);
    return () => {
      document.removeEventListener("visibilitychange", onForeground);
      window.removeEventListener("focus", onForeground);
      if (updateIntervalRef.current !== null) {
        window.clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [checkForUpdate]);

  // Edge cases on freshly-launched origins can drop workbox-window's
  // controlling event. Fall back to an explicit reload so the Update
  // button is never a no-op.
  const handleUpdate = useCallback(() => {
    if (updatingRef.current) return;
    updatingRef.current = true;
    setUpdating(true);
    void updateServiceWorker(true);
    setTimeout(() => window.location.reload(), RELOAD_FALLBACK_MS);
  }, [updateServiceWorker]);

  const close = useCallback(() => {
    setOfflineReady(false);
    setNeedRefresh(false);
  }, [setOfflineReady, setNeedRefresh]);

  useEffect(() => {
    if (!offlineReady || needRefresh) return;
    const id = setTimeout(close, 4000);
    return () => clearTimeout(id);
  }, [offlineReady, needRefresh, close]);

  const show = offlineReady || needRefresh;
  // Latch which toast is showing so its copy/buttons don't flip to the
  // "offline" variant mid-exit — close() clears both flags at once, which
  // would otherwise flash the wrong text for the length of the fade-out.
  const shownRef = useRef<ReloadNoticeVariant>("offline");
  if (show) shownRef.current = needRefresh ? "update" : "offline";

  return (
    <AnimatePresence>
      {show && (
        <m.div
          className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-[var(--z-toast)] flex justify-center sm:right-6 sm:bottom-6 sm:left-auto sm:justify-end"
          variants={variants.fadeUp}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <ReloadNotice
            variant={shownRef.current}
            updating={updating}
            onClose={close}
            onUpdate={handleUpdate}
          />
        </m.div>
      )}
    </AnimatePresence>
  );
}
