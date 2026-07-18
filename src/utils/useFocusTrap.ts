import { type RefObject, useCallback, useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href]:not([tabindex="-1"]),button:not([disabled]):not([tabindex="-1"]),textarea:not([disabled]):not([tabindex="-1"]),input:not([disabled]):not([tabindex="-1"]),select:not([disabled]):not([tabindex="-1"]),[contenteditable="true"]:not([tabindex="-1"]),[tabindex]:not([tabindex="-1"])';

let appRootInertDepth = 0;
let appRootWasInert = false;
let bodyScrollLockDepth = 0;
let bodyOverflowBeforeLock = "";
let bodyPortalSuspendDepth = 0;
let focusTrapSequence = 0;

interface SuspendedBodyPortal {
  element: HTMLElement;
  hidden: HTMLElement["hidden"];
  inert: boolean;
  ariaHidden: string | null;
}

const suspendedBodyPortals = new Map<HTMLElement, SuspendedBodyPortal>();

interface FocusTrapEntry {
  token: symbol;
  ref: RefObject<HTMLElement | null>;
  root: HTMLElement | null;
  priority: number;
  sequence: number;
}

const focusTrapStack: FocusTrapEntry[] = [];

function topmostEntry(): FocusTrapEntry | undefined {
  return focusTrapStack.reduce<FocusTrapEntry | undefined>((top, entry) => {
    if (!top) return entry;
    if (entry.priority !== top.priority) return entry.priority > top.priority ? entry : top;
    return entry.sequence > top.sequence ? entry : top;
  }, undefined);
}

function focusableNodes(entry: FocusTrapEntry): HTMLElement[] {
  return Array.from(entry.ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
    (element) =>
      (element.offsetParent !== null || element === document.activeElement) &&
      !element.closest("[inert]") &&
      !element.closest('[aria-hidden="true"]'),
  );
}

function focusEntryBoundary(entry: FocusTrapEntry, last = false): void {
  const nodes = focusableNodes(entry);
  if (nodes.length === 0) {
    entry.ref.current?.focus();
    return;
  }
  const preferred = nodes.find((node) => node.hasAttribute("data-dialog-initial-focus"));
  (preferred ?? (last ? nodes[nodes.length - 1] : nodes[0])).focus();
}

function revealModalRoot(root: HTMLElement | null): void {
  if (!root) return;
  root.inert = false;
  root.removeAttribute("aria-hidden");
}

function concealModalRoot(root: HTMLElement | null): void {
  if (!root) return;
  root.inert = true;
  root.setAttribute("aria-hidden", "true");
}

/**
 * Keep paint order, pointer ownership, and the accessibility tree aligned with
 * the focus stack. Shared dialogs receive consecutive layers; the unmanaged
 * system overlay (OrientationLock) keeps its own higher z-index and priority.
 */
function syncModalStackPresentation(): void {
  const top = topmostEntry();
  const ordered = [...focusTrapStack].sort(
    (a, b) => a.priority - b.priority || a.sequence - b.sequence,
  );
  let dialogLayer = 0;

  for (const entry of ordered) {
    if (entry.root?.dataset.cloakModalLayer === "dialog") {
      entry.root.style.zIndex = `calc(var(--z-dialog) + ${dialogLayer})`;
      dialogLayer += 1;
    }
    if (entry === top) revealModalRoot(entry.root);
    else concealModalRoot(entry.root);
  }
}

function suspendExistingBodyPortals(): void {
  for (const child of document.body.children) {
    if (!(child instanceof HTMLElement) || !child.matches(".cloak-popover")) continue;
    if (!suspendedBodyPortals.has(child)) {
      suspendedBodyPortals.set(child, {
        element: child,
        hidden: child.hidden,
        inert: child.inert,
        ariaHidden: child.getAttribute("aria-hidden"),
      });
    }
    child.hidden = true;
    child.inert = true;
    child.setAttribute("aria-hidden", "true");
  }
}

function acquireBodyPortalSuspension(): void {
  bodyPortalSuspendDepth += 1;
  // Scan on every layer acquisition: a popover may have opened inside the
  // current top dialog before a second, higher-priority modal appeared.
  suspendExistingBodyPortals();
}

function releaseBodyPortalSuspension(): void {
  bodyPortalSuspendDepth = Math.max(0, bodyPortalSuspendDepth - 1);
  if (bodyPortalSuspendDepth > 0) return;

  for (const { element, hidden, inert, ariaHidden } of suspendedBodyPortals.values()) {
    if (!element.isConnected) continue;
    element.hidden = hidden;
    element.inert = inert;
    if (ariaHidden === null) element.removeAttribute("aria-hidden");
    else element.setAttribute("aria-hidden", ariaHidden);
  }
  suspendedBodyPortals.clear();
}

function acquireAppRootInert(appRoot: HTMLElement): void {
  if (appRootInertDepth === 0) appRootWasInert = appRoot.inert;
  appRootInertDepth += 1;
  appRoot.inert = true;
}

function releaseAppRootInert(appRoot: HTMLElement): void {
  appRootInertDepth = Math.max(0, appRootInertDepth - 1);
  if (appRootInertDepth === 0) appRoot.inert = appRootWasInert;
}

function acquireBodyScrollLock(): void {
  if (bodyScrollLockDepth === 0) bodyOverflowBeforeLock = document.body.style.overflow;
  bodyScrollLockDepth += 1;
  document.body.style.overflow = "hidden";
}

function releaseBodyScrollLock(): void {
  bodyScrollLockDepth = Math.max(0, bodyScrollLockDepth - 1);
  if (bodyScrollLockDepth === 0) document.body.style.overflow = bodyOverflowBeforeLock;
}

/**
 * Trap Tab focus within `ref` while `active`, and restore focus to the
 * element that was focused before the dialog opened once it closes.
 *
 * The trap participates in a shared modal stack: only the topmost active layer
 * handles Tab/focus containment, while body scroll and `#app` inertness are
 * reference-counted across every layer. This prevents nested dialogs from
 * stealing focus from one another or unlocking the page too early.
 *
 * `ref` should point at the element carrying `role="dialog"`. If it contains no
 * focusable control (Orientation Lock is the intentional example), the dialog
 * itself receives focus through its `tabIndex={-1}` fallback.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean): () => boolean {
  const tokenRef = useRef(Symbol("cloak-dialog"));
  const isTopmost = useCallback(() => topmostEntry()?.token === tokenRef.current, []);

  useEffect(() => {
    if (!active) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const root = ref.current?.closest<HTMLElement>('[data-cloak-modal-root="true"]') ?? ref.current;
    const entry: FocusTrapEntry = {
      token: tokenRef.current,
      ref,
      root,
      // The only unmanaged trap is the non-dismissible system overlay. It must
      // stay above regular dialogs even if one is opened programmatically later.
      priority: root?.dataset.cloakModalLayer === "dialog" ? 0 : 1,
      sequence: focusTrapSequence++,
    };
    focusTrapStack.push(entry);
    const appRoot = document.getElementById("app");
    const ownsAppRootInert = Boolean(appRoot && ref.current && !appRoot.contains(ref.current));
    if (appRoot && ownsAppRootInert) acquireAppRootInert(appRoot);
    acquireBodyScrollLock();
    acquireBodyPortalSuspension();

    const focusBoundary = (last = false) => {
      if (!isTopmost()) return;
      focusEntryBoundary(entry, last);
    };

    // Focus the incoming layer before hiding the previous one from the
    // accessibility tree. This avoids transient aria-hidden-on-focus conflicts.
    if (isTopmost()) revealModalRoot(root);
    focusBoundary();
    syncModalStackPresentation();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !ref.current || !isTopmost()) return;
      const nodes = focusableNodes(entry);
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const activeEl = document.activeElement;
      if (!ref.current.contains(activeEl)) {
        e.preventDefault();
        focusBoundary(e.shiftKey);
      } else if (e.shiftKey && activeEl === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const onFocusIn = (e: FocusEvent) => {
      if (!ref.current || !isTopmost() || ref.current.contains(e.target as Node)) return;
      focusBoundary();
    };

    let focusRepairFrame: number | null = null;
    const focusObserver = new MutationObserver(() => {
      if (focusRepairFrame !== null) return;
      focusRepairFrame = requestAnimationFrame(() => {
        focusRepairFrame = null;
        if (!ref.current || !isTopmost()) return;
        const focused = document.activeElement;
        const focusIsUsable =
          focused instanceof HTMLElement &&
          ref.current.contains(focused) &&
          (focused === ref.current ||
            (!focused.matches(":disabled") &&
              !focused.closest('[hidden],[inert],[aria-hidden="true"]')));
        if (!focusIsUsable) focusBoundary();
      });
    });
    if (ref.current) {
      // Stateful dialogs replace or disable their primary action as work starts.
      // Repair focus after React commits so it lands on the new preferred target
      // instead of falling to <body>; one frame coalesces progress-heavy updates.
      focusObserver.observe(ref.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["disabled", "hidden", "inert", "aria-hidden"],
      });
    }

    document.addEventListener("keydown", onKey, true);
    document.addEventListener("focusin", onFocusIn, true);
    const initialFocusFrame = requestAnimationFrame(() => {
      if (isTopmost() && ref.current && !ref.current.contains(document.activeElement)) {
        focusBoundary();
      }
    });

    return () => {
      const wasTopmost = isTopmost();
      cancelAnimationFrame(initialFocusFrame);
      if (focusRepairFrame !== null) cancelAnimationFrame(focusRepairFrame);
      focusObserver.disconnect();
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("focusin", onFocusIn, true);
      const index = focusTrapStack.findIndex((item) => item.token === tokenRef.current);
      if (index >= 0) focusTrapStack.splice(index, 1);
      syncModalStackPresentation();
      releaseBodyScrollLock();
      if (appRoot && ownsAppRootInert) releaseAppRootInert(appRoot);
      releaseBodyPortalSuspension();

      if (wasTopmost) {
        if (previouslyFocused?.isConnected && !previouslyFocused.closest("[inert]")) {
          previouslyFocused.focus();
        }
        if (document.activeElement === document.body || root?.contains(document.activeElement)) {
          const next = topmostEntry();
          if (next) focusEntryBoundary(next);
        }
      }

      // AnimatePresence may keep the outgoing root mounted briefly. Keep that
      // visual-only exit out of focus, hit-testing, and the accessibility tree.
      concealModalRoot(root);
    };
  }, [ref, active, isTopmost]);

  return isTopmost;
}
