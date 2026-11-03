export function motionMilliseconds(value: string): number;
export function createDialogMotion(dialog: HTMLDialogElement): {
  enter(event: Pick<MouseEvent, "detail">): void;
  close(event: Pick<MouseEvent, "detail">, value?: string): void;
  destroy(): void;
};
export function createCompletionMotion(element: HTMLElement): {
  play(event: Pick<MouseEvent, "detail">): void;
  destroy(): void;
};
