/** Indeterminate work is described honestly, without invented progress or decorative movement. */
export function LoadingState({
  label = "Loading…",
  fullPage = false,
}: {
  label?: string;
  fullPage?: boolean;
}) {
  return (
    <div
      className={`pdf-loading-state${fullPage ? " pdf-loading-state--page" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="pdf-loading-mark" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
