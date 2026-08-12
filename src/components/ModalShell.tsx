/* Hallmark · pre-emit critique: P5 H5 E5 S4 R5 V4 */
/**
 * Hallmark · component scope: CloakPDF modal family.
 *
 * One behavioural and visual frame for every dismissible dialog. The shell
 * owns the portal, named scrim, focus/scroll containment, topmost Escape
 * handling, backdrop policy, responsive placement, and shared Motion timing.
 * Dialog content stays with the feature that owns it.
 */

import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CLOAK_MODAL_OPEN_EVENT } from "../utils/modal-events.ts";
import { useFocusTrap } from "../utils/useFocusTrap.ts";
import { AnimatePresence, m, variants } from "./motion.tsx";

type ModalPlacement = "center" | "command";

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  describedBy?: string;
  /** Backdrop dismissal can be disabled for progress and destructive states. */
  dismissOnBackdrop?: boolean;
  /** Escape remains separately configurable from backdrop dismissal. */
  dismissOnEscape?: boolean;
  placement?: ModalPlacement;
  panelClassName?: string;
  testId?: string;
}

export function ModalShell({
  open,
  onClose,
  children,
  labelledBy,
  describedBy,
  dismissOnBackdrop = true,
  dismissOnEscape = true,
  placement = "center",
  panelClassName = "",
  testId,
}: ModalShellProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const announcedOpenRef = useRef(false);
  const isTopmost = useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) {
      announcedOpenRef.current = false;
      return;
    }
    // StrictMode replays effects in development; announce once per actual open
    // cycle so popover listeners receive one deterministic light-dismiss signal.
    if (announcedOpenRef.current) return;
    announcedOpenRef.current = true;
    document.dispatchEvent(new CustomEvent(CLOAK_MODAL_OPEN_EVENT));
  }, [open]);

  useEffect(() => {
    if (!open || !dismissOnEscape) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !isTopmost()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [dismissOnEscape, isTopmost, onClose, open]);

  if (typeof document === "undefined") return null;

  const rootPlacement =
    placement === "command"
      ? "items-start px-3 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pt-[10vh]"
      : "items-end sm:items-center sm:px-3 md:px-6";
  const panelVariants = placement === "command" ? variants.instant : variants.sheet;
  const scrimVariants = placement === "command" ? variants.instant : variants.scrim;
  const rootVariants = placement === "command" ? variants.instant : variants.modalRoot;

  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div
          className={`fixed inset-0 z-[var(--z-dialog)] flex justify-center ${rootPlacement}`}
          data-cloak-modal-root="true"
          data-cloak-modal-layer="dialog"
          variants={rootVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {dismissOnBackdrop ? (
            <m.button
              type="button"
              aria-label="Close dialog"
              tabIndex={-1}
              onClick={() => isTopmost() && onClose()}
              className="cloak-modal-scrim absolute inset-0 cursor-default border-0"
              variants={scrimVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            />
          ) : (
            <m.div
              aria-hidden="true"
              className="cloak-modal-scrim absolute inset-0"
              variants={scrimVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            />
          )}

          <m.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
            data-testid={testId}
            tabIndex={-1}
            className={`cloak-dialog relative flex w-full flex-col overflow-hidden ${panelClassName}`}
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {children}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

interface ModalCloseButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  initialFocus?: boolean;
}

export function ModalCloseButton({
  onClick,
  label = "Close",
  disabled,
  initialFocus,
}: ModalCloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      data-dialog-initial-focus={initialFocus ? "true" : undefined}
      className="cloak-dialog__close cloak-focus"
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

export function ModalSectionLabel({
  children,
  trailing,
}: {
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="cloak-dialog__section-label">
      <span>{children}</span>
      {trailing && <span>{trailing}</span>}
    </div>
  );
}
