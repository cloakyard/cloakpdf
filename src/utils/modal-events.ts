import { type Dispatch, type SetStateAction, useEffect } from "react";

/** Light-dismiss signal sent when a true modal takes over the interface. */
export const CLOAK_MODAL_OPEN_EVENT = "cloakpdf:modal-open";

/** Close an anchored disclosure when a true modal assumes focus ownership. */
export function useCloseOnModalOpen(setOpen: Dispatch<SetStateAction<boolean>>): void {
  useEffect(() => {
    const close = () => setOpen(false);
    document.addEventListener(CLOAK_MODAL_OPEN_EVENT, close);
    return () => document.removeEventListener(CLOAK_MODAL_OPEN_EVENT, close);
  }, [setOpen]);
}
