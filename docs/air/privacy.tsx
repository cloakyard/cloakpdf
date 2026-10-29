import { useEffect, useRef, type ReactNode } from "react";

export interface PrivacySection {
  id: string;
  title: string;
  body: ReactNode;
}

/** One document body is shared by the public page and any in-editor dialog. */
export function PrivacySections({
  sections,
  heading = "h2",
}: {
  sections: PrivacySection[];
  heading?: "h2" | "h3";
}) {
  const Heading = heading;
  return sections.map(({ id, title, body }) => (
    <section key={id}>
      <Heading id={id} tabIndex={-1}>
        {title}
      </Heading>
      {body}
    </section>
  ));
}

export function PrivacyPage({
  product,
  home = "/",
  lead,
  date,
  sections,
  children,
}: {
  product: string;
  home?: string;
  lead: ReactNode;
  date: string;
  sections: PrivacySection[];
  children?: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const restore = () => {
      let id: string;
      try {
        id = decodeURIComponent(location.hash.slice(1));
      } catch {
        return;
      }
      for (const link of root.current?.querySelectorAll<HTMLAnchorElement>(".air-contents a") ??
        []) {
        if (link.hash === location.hash) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
      const target = document.getElementById(id);
      if (target && root.current?.contains(target)) {
        target.focus({ preventScroll: true });
        target.scrollIntoView();
      }
    };
    restore();
    window.addEventListener("hashchange", restore);
    return () => window.removeEventListener("hashchange", restore);
  }, []);
  return (
    <article ref={root} className="air-page air-policy" aria-labelledby="privacy-title">
      <a className="air-policy-back" href={home}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m12 19-7-7 7-7M5 12h14" />
        </svg>
        Back to {product}
      </a>
      <header className="air-policy-intro">
        <p className="air-page-eyebrow">{product} · Privacy</p>
        <h1 id="privacy-title">Privacy policy</h1>
        <p className="air-page-lede">{lead}</p>
        <p className="air-page-meta">
          Last updated{" "}
          <time dateTime={date}>
            {new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(
              new Date(`${date}T00:00:00Z`),
            )}
          </time>
        </p>
      </header>
      <div className="air-reading-layout">
        <details
          className="air-contents"
          open
          onKeyDown={(event) => {
            if (event.key === "Escape" && event.currentTarget.open) {
              event.currentTarget.open = false;
              event.currentTarget.querySelector("summary")?.focus();
              event.preventDefault();
            }
          }}
        >
          <summary>
            On this page{" "}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>
          <nav aria-label="Policy contents">
            {sections.map(({ id, title }) => (
              <a key={id} href={`#${id}`}>
                {title}
              </a>
            ))}
          </nav>
        </details>
        <div className="air-prose">
          {children}
          <PrivacySections sections={sections} />
        </div>
      </div>
    </article>
  );
}
