/*! Icon paths from Lucide 1.61.0.
ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

---

The following Lucide icons are derived from the Feather project:

airplay, alert-circle, alert-octagon, alert-triangle, aperture, arrow-down-circle, arrow-down-left, arrow-down-right, arrow-down, arrow-left-circle, arrow-left, arrow-right-circle, arrow-right, arrow-up-circle, arrow-up-left, arrow-up-right, arrow-up, at-sign, calendar, cast, check, chevron-down, chevron-left, chevron-right, chevron-up, chevrons-down, chevrons-left, chevrons-right, chevrons-up, circle, clipboard, clock, code, columns, command, compass, corner-down-left, corner-down-right, corner-left-down, corner-left-up, corner-right-down, corner-right-up, corner-up-left, corner-up-right, crosshair, database, divide-circle, divide-square, dollar-sign, download, external-link, feather, frown, hash, headphones, help-circle, info, italic, key, layout, life-buoy, link-2, link, loader, lock, log-in, log-out, maximize, meh, minimize, minimize-2, minus-circle, minus-square, minus, monitor, moon, more-horizontal, more-vertical, move, music, navigation-2, navigation, octagon, pause-circle, percent, plus-circle, plus-square, plus, power, radio, rss, search, server, share, shopping-bag, sidebar, smartphone, smile, square, table-2, tablet, target, terminal, trash-2, trash, triangle, tv, type, upload, x-circle, x-octagon, x-square, x, zoom-in, zoom-out

The MIT License (MIT) (for the icons listed above)

Copyright (c) 2013-present Cole Bemis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
/** Shared presentation only; each product owns safe worker activation and draft handling. */
import { useId, useLayoutEffect, useRef } from "react";

function NoticeIcon({ kind }: { kind: "offline" | "update" | "error" | "close" }) {
  const size = kind === "close" ? 18 : 20;
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {kind === "offline" ? (
        <>
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
          <path d="m9 12 2 2 4-4" />
        </>
      ) : kind === "error" ? (
        <>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </>
      ) : kind === "close" ? (
        <>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </>
      ) : (
        <>
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M8 16H3v5" />
        </>
      )}
    </svg>
  );
}

export type UpdateNoticeState = "offline" | "update" | "updating" | "error";

export function AirUpdateNotice({
  state,
  detail,
  blocked = false,
  onClose,
  onUpdate,
  onPause,
}: {
  state: UpdateNoticeState;
  detail?: string;
  blocked?: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onPause: (paused: boolean) => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const root = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const busy = state === "updating";
  const title =
    state === "offline"
      ? "Core app cached"
      : busy
        ? "Updating…"
        : state === "error"
          ? "Update paused"
          : "Update available";
  const body =
    detail ||
    (state === "offline"
      ? "The core app is cached. Some features may still need a connection."
      : busy
        ? "Applying the new version. This page will reload when it is ready."
        : "A new version is ready. Update and reload to use it.");
  const label = busy ? "Updating…" : state === "error" ? "Try again" : "Update and reload";

  useLayoutEffect(() => {
    const node = root.current;
    const remember = () => {
      if (document.activeElement instanceof HTMLElement && !node?.contains(document.activeElement))
        previousFocus.current = document.activeElement;
    };
    remember();
    document.addEventListener("focusin", remember);
    const resize = new ResizeObserver(() => {
      const focused = document.activeElement;
      if (focused instanceof HTMLElement && node?.contains(focused))
        focused.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    if (node) {
      resize.observe(node);
      if (node.firstElementChild) resize.observe(node.firstElementChild);
    }
    return () => {
      document.removeEventListener("focusin", remember);
      resize.disconnect();
      if (node?.contains(document.activeElement) && previousFocus.current?.isConnected)
        previousFocus.current.focus({ preventScroll: true });
    };
  }, []);

  return (
    <section
      ref={root}
      className="air-update"
      data-state={state}
      aria-labelledby={titleId}
      onPointerEnter={() => onPause(true)}
      onPointerLeave={() => onPause(Boolean(root.current?.contains(document.activeElement)))}
      onFocusCapture={() => onPause(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          onPause(event.currentTarget.matches(":hover"));
      }}
    >
      <div className="air-update-panel">
        <NoticeIcon
          kind={state === "error" ? "error" : state === "offline" ? "offline" : "update"}
        />
        <div
          className="air-update-copy"
          role={state === "error" ? "alert" : "status"}
          aria-atomic="true"
        >
          <h2 id={titleId}>{title}</h2>
          <p id={descriptionId}>{body}</p>
        </div>
        <div className="air-update-actions">
          {state === "offline" ? (
            <button
              type="button"
              className="air-icon-button air-button--quiet"
              aria-label="Dismiss offline status"
              onClick={(event) => {
                event.currentTarget.focus();
                onClose();
              }}
            >
              <NoticeIcon kind="close" />
            </button>
          ) : (
            <>
              <button
                type="button"
                className="air-button air-button--quiet"
                aria-disabled={busy || undefined}
                onClick={(event) => {
                  event.currentTarget.focus();
                  if (!busy) onClose();
                }}
              >
                Later
              </button>
              <button
                type="button"
                className="air-button air-button--primary"
                aria-label={label}
                aria-disabled={busy || blocked || undefined}
                aria-busy={busy || undefined}
                aria-describedby={descriptionId}
                onClick={(event) => {
                  event.currentTarget.focus();
                  if (!busy && !blocked) onUpdate();
                }}
              >
                <span className="air-action-labels">
                  {["Update and reload", "Updating…", "Try again"].map((text) => (
                    <span
                      key={text}
                      data-active={label === text || undefined}
                      aria-hidden={label !== text || undefined}
                    >
                      {text}
                    </span>
                  ))}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
