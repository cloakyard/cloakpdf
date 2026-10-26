/** PWA lifecycle; presentation is the pinned family notice. */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { AirUpdateNotice } from "../../docs/air/update-notice.tsx";

const UPDATE_CHECK_INTERVAL_MS = 10 * 60 * 1000;
const RELOAD_FALLBACK_MS = 1500;

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
  const [paused, setPaused] = useState(false);

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
      // local explicit update can reload, and only while outside a task.
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
    if (!offlineReady || needRefresh || paused) return;
    const id = setTimeout(close, 4000);
    return () => clearTimeout(id);
  }, [offlineReady, needRefresh, paused, close]);

  const show = offlineReady || (needRefresh && !dismissed);
  return show ? (
    <AirUpdateNotice
      state={needRefresh ? (updating ? "updating" : "update") : "offline"}
      detail={
        needRefresh && deferUpdate
          ? "Save or download your work, then return home to update."
          : undefined
      }
      blocked={deferUpdate}
      onClose={close}
      onUpdate={handleUpdate}
      onPause={setPaused}
    />
  ) : null;
}
