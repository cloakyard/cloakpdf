export type PresenceKind = "dialog" | "sheet" | "panel" | "popover" | "notice" | "none" | "fade";
export function createPresenceMotion(
  element: HTMLElement,
  kind?: PresenceKind,
  onExit?: () => void,
): {
  update(open: boolean): void;
  destroy(): void;
};
