// ReloadPrompt.tsx — PWA service-worker update banner. Shown when a new
// SW version is available, or briefly when the app first becomes
// installable with its core interface cached.
//
// A compact operational surface at the bottom-right (bottom-center on
// mobile), with an "Update" button when needRefresh and a self-dismissing
// cache-status toast on first install.

import { RefreshCw, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

const UPDATE_CHECK_INTERVAL_MS = 10 * 60 * 1000;
const RELOAD_FALLBACK_MS = 1500;

type ReloadNoticeVariant = "update" | "offline";

interface ReloadNoticeProps {
  variant: ReloadNoticeVariant;
  updating?: boolean;
  deferred?: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ReloadNotice({
  variant,
  updating = false,
  deferred = false,
  onClose,
  onUpdate,
}: ReloadNoticeProps) {
  const descriptionId = useId();
  const isUpdate = variant === "update";
  const Icon = isUpdate ? RefreshCw : ShieldCheck;
  const eyebrow = isUpdate ? "System update" : "Offline support";
  const title = isUpdate ? "Update CloakPDF" : "Core app cached";
  const body = isUpdate
    ? deferred
      ? "A newer build is ready. Save or download your work, then return home to update."
      : "A newer build is ready. Update now to apply the latest fixes."
    : "The core interface is cached. AI models and OCR data may still require a connection.";
  const announcement = updating ? "Updating CloakPDF…" : `${title}. ${body}`;

  return (
    <>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
      <div className="pdf-toast" aria-busy={updating}>
        <div className="pdf-toast-body">
          <div>
            <p className="pdf-toast-eyebrow">
              <Icon size={16} aria-hidden="true" />
              {eyebrow}
            </p>
            <p className="pdf-toast-title">{updating ? "Applying update…" : title}</p>
            <p id={descriptionId} className="pdf-toast-description">
              {body}
            </p>
          </div>
          {!isUpdate && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Dismiss cache status"
              className="air-icon-button air-button--quiet"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
        {isUpdate && (
          <div className="pdf-toast-actions">
            <button type="button" onClick={onClose} disabled={updating} className="air-button">
              Later
            </button>
            <button
              type="button"
              onClick={() => {
                if (!updating && !deferred) onUpdate();
              }}
              aria-disabled={updating || deferred || undefined}
              aria-describedby={descriptionId}
              aria-busy={updating}
              className="air-button air-button--primary"
            >
              <RefreshCw size={16} aria-hidden="true" />
              <span className="air-action-labels">
                <span data-active={!updating || undefined} aria-hidden={updating}>
                  Update now
                </span>
                <span data-active={updating || undefined} aria-hidden={!updating}>
                  Updating…
                </span>
              </span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export function ReloadPrompt({ deferUpdate = false }: { deferUpdate?: boolean }) {
  // Stash the SW update interval + the live registration so the unmount
  // cleanup can clear the timer and so the focus/visibility listeners below —
  // which fire outside `useRegisterSW`'s onRegisteredSW lifecycle — can reach
  // the registration to trigger an update check.
  const updateIntervalRef = useRef<number | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const swUrlRef = useRef<string>("");
  const lastCheckRef = useRef<number>(0);
  const updatingRef = useRef(false);
  const deferUpdateRef = useRef(deferUpdate);
  const reloadTimerRef = useRef<number | undefined>(undefined);
  const [updating, setUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // SW callbacks are registered once. Read the committed route when they fire,
  // including when another tab activates the waiting worker.
  useLayoutEffect(() => {
    deferUpdateRef.current = deferUpdate;
  }, [deferUpdate]);
  useEffect(() => {
    if (!deferUpdate) setDismissed(false);
  }, [deferUpdate]);

  const finishUpdate = useCallback(() => {
    window.clearTimeout(reloadTimerRef.current);
    if (!updatingRef.current) return;
    if (deferUpdateRef.current) {
      updatingRef.current = false;
      setUpdating(false);
      return;
    }
    window.location.reload();
  }, []);

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
    onNeedReload() {
      // An update in another tab must never discard this tab's work. Only a
      // local explicit Update now can reload, and only while outside a task.
      setNeedRefresh(true);
      finishUpdate();
    },
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
      window.clearTimeout(reloadTimerRef.current);
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
    if (updatingRef.current || deferUpdate) return;
    updatingRef.current = true;
    setUpdating(true);
    void updateServiceWorker(true);
    reloadTimerRef.current = window.setTimeout(finishUpdate, RELOAD_FALLBACK_MS);
  }, [deferUpdate, finishUpdate, updateServiceWorker]);

  const close = useCallback(() => {
    setOfflineReady(false);
    setDismissed(needRefresh);
  }, [needRefresh, setOfflineReady]);

  useEffect(() => {
    if (!offlineReady || needRefresh) return;
    const id = setTimeout(close, 4000);
    return () => clearTimeout(id);
  }, [offlineReady, needRefresh, close]);

  const show = offlineReady || (needRefresh && !dismissed);
  return show ? (
    <div className="pdf-toast-host">
      <ReloadNotice
        variant={needRefresh ? "update" : "offline"}
        updating={updating}
        deferred={deferUpdate}
        onClose={close}
        onUpdate={handleUpdate}
      />
    </div>
  ) : null;
}
