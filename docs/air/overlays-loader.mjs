const host = document.querySelector("#air-overlay-root");
const retry = document.querySelector("#air-overlay-retry");
let loading = false;
let attempts = 0;
async function load() {
  if (loading) return;
  loading = true;
  observer.disconnect();
  const restoreFocus = document.activeElement === retry;
  retry.hidden = true;
  try {
    const url = new URL("./assets/air-overlays.js?air=cd7f69ff30c0", import.meta.url);
    const attempt = attempts++;
    // Browsers cache rejected module fetches. A deliberate retry needs a fresh URL.
    if (attempt) url.searchParams.set("retry", String(attempt));
    const { mountOverlayStudy } = await import(url.href);
    mountOverlayStudy(host, restoreFocus);
    observer.disconnect();
  } catch {
    loading = false;
    host.querySelector("#air-overlay-load-status").textContent =
      "The examples couldn’t load. Try again.";
    retry.hidden = false;
  }
}
const observer = new IntersectionObserver(
  (entries) => {
    if (entries.some((entry) => entry.isIntersecting)) void load();
  },
  { rootMargin: "200px" },
);
observer.observe(host);
retry.addEventListener("click", load);
