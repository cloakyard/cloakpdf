import { useEffect, useRef } from "react";
import { mountAirLight } from "../../docs/air/light-runtime.mjs";

/** The canonical light renderer loads only when this landing artwork can animate. */
export function AirHorizon() {
  const field = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!field.current) return;
    const light = mountAirLight(field.current);
    return () => light.destroy();
  }, []);
  return (
    <div ref={field} className="pdf-horizon" aria-hidden="true">
      <svg viewBox="0 0 1200 240" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="home-plane" x2="0" y2="1">
            <stop stopColor="var(--air-surface-soft)" stopOpacity="0.8" />
            <stop offset="1" stopColor="var(--air-surface-soft)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="home-edge-fade">
            <stop stopColor="white" stopOpacity="0" />
            <stop offset="0.2" stopColor="white" />
            <stop offset="0.8" stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="home-horizon-mask">
            <rect width="1200" height="240" fill="url(#home-edge-fade)" />
          </mask>
        </defs>
        <g mask="url(#home-horizon-mask)">
          <path d="M0 100Q600 84 1200 145V240H0Z" fill="url(#home-plane)" />
          <path
            d="M0 100Q600 84 1200 145"
            fill="none"
            stroke="var(--air-accent)"
            strokeOpacity="0.22"
          />
          <path d="M0 182Q600 132 1200 139V240H0Z" fill="url(#home-plane)" />
          <path
            d="M0 182Q600 132 1200 139"
            fill="none"
            stroke="var(--air-accent)"
            strokeOpacity="0.28"
          />
        </g>
      </svg>
      <canvas />
    </div>
  );
}
