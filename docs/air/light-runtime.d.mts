export interface AirLightState {
  state: string;
  frames: number;
  firstDraw: number;
  averageCPU: number;
  fine: boolean;
}
export function mountAirLight(
  field: HTMLElement,
  options?: {
    pointerTarget?: HTMLElement;
    onState?: (state: AirLightState) => void;
  },
): {
  setFrozen(value: boolean): void;
  replay(animate?: boolean): Promise<void>;
  destroy(): void;
};
