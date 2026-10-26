type ArtworkStep = {
  element: Element;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
};
export function mountAirArtwork(
  root: HTMLElement,
  options: {
    run: (animate: (steps: ArtworkStep[]) => Promise<void>) => Promise<void>;
    settle: () => void;
    control?: HTMLButtonElement | null;
  },
): { finish(): void; destroy(): void };
