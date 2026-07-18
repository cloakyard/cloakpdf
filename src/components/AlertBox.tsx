/**
 * Red error banner for inline failure messages.
 *
 * Errors are the only message type handled here — warnings, info, and success
 * all go through {@link InfoCallout} so their colour harmonises with the
 * surrounding tool category.
 *
 * Errors are static, high-contrast status surfaces. Motion is reserved for
 * progress so a failure never competes with the task the user is fixing.
 */

interface AlertBoxProps {
  /** Text displayed inside the alert. */
  message: string;
}

export function AlertBox({ message }: AlertBoxProps) {
  return (
    <div
      role="alert"
      className="cloak-notice border-red-200 bg-red-50 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
    >
      {/* `overflow-wrap: anywhere` (vs the gentler `break-words`) so
          long unbreakable tokens in surfaced runtime errors —
          `onnxruntime::webgpu::BufferManager::Download(void *, size_t)`,
          file paths with no spaces, stack-trace lines — wrap at the
          container edge instead of spilling past it on narrow viewports. */}
      <p className="wrap-anywhere">{message}</p>
    </div>
  );
}
