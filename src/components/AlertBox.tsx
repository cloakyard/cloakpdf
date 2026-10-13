import { AlertCircle } from "lucide-react";

/** A shared, static Air error with its full recovery message. */
export function AlertBox({ message }: { message: string }) {
  return (
    <div role="alert" className="air-notice air-notice--error pdf-alert">
      <AlertCircle size={18} strokeWidth={1.6} aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
