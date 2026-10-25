import { useLayoutEffect, useRef } from "react";
import { mountAirArtwork } from "../../docs/air/artwork.mjs";

const sheets = [
  {
    closed: "translate(-10px, 11px) rotate(-3deg)",
    open: "translate(-92px, 11px) rotate(-13deg)",
    delay: 120,
  },
  {
    closed: "translate(10px, 9px) rotate(3deg)",
    open: "translate(92px, 9px) rotate(12deg)",
    delay: 180,
  },
  {
    closed: "translate(-4px, 1px) rotate(-2deg)",
    open: "translate(-44px, 1px) rotate(-6deg)",
    delay: 0,
  },
  {
    closed: "translate(4px, 0px) rotate(1deg)",
    open: "translate(44px, 0px) rotate(5deg)",
    delay: 60,
  },
];

/** Decorative pages unveil once; file acquisition never waits for the artwork. */
export function PageStack() {
  const stack = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = stack.current;
    if (!root) return;
    const pages = [...root.querySelectorAll<HTMLElement>(".pdf-page-stack-rear")];
    const artwork = mountAirArtwork(root, {
      settle() {}, // The rendered styles already describe the final, opened stack.
      run: (animate) =>
        animate(
          pages.map((element, index) => ({
            element,
            keyframes: [{ transform: sheets[index].closed }, { transform: sheets[index].open }],
            options: {
              duration: 2200,
              delay: sheets[index].delay,
              easing: getComputedStyle(root).getPropertyValue("--air-ease-in-out").trim(),
            },
          })),
        ),
    });
    return () => artwork.destroy();
  }, []);

  return (
    <div className="pdf-page-stack" ref={stack} aria-hidden="true">
      <div className="pdf-page-stack-board">
        {sheets.map((sheet, index) => (
          <div
            className="pdf-page-stack-sheet pdf-page-stack-rear"
            key={sheet.open}
            style={{ transform: sheet.open, zIndex: index + 1 }}
          >
            <span className="pdf-page-stack-rules" />
          </div>
        ))}
        <div className="pdf-page-stack-sheet pdf-page-stack-front">
          <p>
            An idea
            <br />
            worth keeping.
          </p>
          <span className="pdf-page-stack-rules" />
          <span className="pdf-page-stack-short-rule" />
        </div>
      </div>
    </div>
  );
}
