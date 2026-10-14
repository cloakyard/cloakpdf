/** Air dialog frame; the existing focus stack owns inertness and restoration. */
import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CLOAK_MODAL_OPEN_EVENT } from "../utils/modal-events.ts";
import { useFocusTrap } from "../utils/useFocusTrap.ts";
import { AnimatePresence, m, useDialogMotion, useIsPresent, type Variants } from "./motion.tsx";

type MotionState = { immediate: boolean; sheet: boolean };
const easing = [0.23, 1, 0.32, 1] as const;
const resting = { opacity: 1, transform: "translateY(0px) scale(1)" };
const pose = ({ sheet }: MotionState) => ({
  opacity: sheet ? 1 : 0,
  transform: sheet ? "translateY(100%) scale(1)" : "translateY(4px) scale(.98)",
});
const panelMotion: Variants = {
  initial: (state: MotionState) => (state.immediate ? resting : pose(state)),
  animate: (state: MotionState) => ({
    ...resting,
    transition: {
      duration: state.immediate ? 0 : 0.24,
      ease: state.sheet ? [0.32, 0.72, 0, 1] : easing,
    },
  }),
  exit: (state: MotionState) => ({
    ...pose(state),
    transition: { duration: state.immediate ? 0 : 0.16, ease: easing },
  }),
};
const scrimMotion: Variants = {
  initial: (state: MotionState) => ({ opacity: state.immediate ? 1 : 0 }),
  animate: (state: MotionState) => ({
    opacity: 1,
    transition: { duration: state.immediate ? 0 : 0.24, ease: easing },
  }),
  exit: (state: MotionState) => ({
    opacity: 0,
    transition: { duration: state.immediate ? 0 : 0.16, ease: easing },
  }),
};
type ModalPlacement = "center" | "command";

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  /** Run a queued command only after the outgoing trap releases inertness/focus. */
  onAfterClose?: () => void;
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

export function ModalShell({ open, ...props }: ModalShellProps) {
  const preference = useDialogMotion();
  const motion = {
    ...preference,
    immediate: props.placement === "command" || preference.immediate,
  };
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence custom={motion}>{open && <ModalFrame {...props} />}</AnimatePresence>,
    document.body,
  );
}

function ModalFrame({
  onClose,
  onAfterClose,
  children,
  labelledBy,
  describedBy,
  dismissOnBackdrop = true,
  dismissOnEscape = true,
  placement = "center",
  panelClassName = "",
  testId,
}: Omit<ModalShellProps, "open">) {
  const preference = useDialogMotion();
  const motion = { ...preference, immediate: placement === "command" || preference.immediate };
  const present = useIsPresent();
  const dialogRef = useRef<HTMLDivElement>(null);
  const isTopmost = useFocusTrap(dialogRef, true);
  const afterCloseRef = useRef(onAfterClose);
  afterCloseRef.current = onAfterClose;
  // Registered after the trap: its unmount cleanup releases the modal first.
  useEffect(() => () => afterCloseRef.current?.(), []);

  useEffect(() => {
    document.dispatchEvent(new CustomEvent(CLOAK_MODAL_OPEN_EVENT));
  }, []);

  useEffect(() => {
    if (!present || !dismissOnEscape) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.isComposing || event.keyCode === 229 || !isTopmost())
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [dismissOnEscape, isTopmost, onClose, present]);

  return (
    <m.div
      className="pdf-modal-root"
      data-placement={placement}
      custom={motion}
      data-cloak-modal-root="true"
      data-cloak-modal-layer="dialog"
      exit={{ opacity: 1, transition: { duration: 0 } }}
    >
      {dismissOnBackdrop ? (
        <m.button
          type="button"
          aria-label="Close dialog"
          tabIndex={-1}
          onClick={() => present && isTopmost() && onClose()}
          className="pdf-modal-scrim absolute inset-0 cursor-default border-0"
          custom={motion}
          variants={scrimMotion}
          initial="initial"
          animate="animate"
          exit="exit"
        />
      ) : (
        <m.div
          aria-hidden="true"
          className="pdf-modal-scrim absolute inset-0"
          custom={motion}
          variants={scrimMotion}
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
        onKeyDown={(event) => {
          // Inertness blocks background targets, not their global key listeners.
          // Keep native field keys inside the modal; the palette alone retains
          // its existing global toggle shortcut.
          if (
            placement === "command" &&
            (event.metaKey || event.ctrlKey) &&
            !event.altKey &&
            event.key.toLowerCase() === "k"
          )
            return;
          event.stopPropagation();
        }}
        className={`pdf-dialog ${panelClassName}`}
        custom={motion}
        variants={panelMotion}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </m.div>
    </m.div>
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
      className="air-icon-button pdf-dialog__close"
    >
      <X size={18} strokeWidth={1.6} aria-hidden="true" />
    </button>
  );
}
