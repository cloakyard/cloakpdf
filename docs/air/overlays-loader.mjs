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
    const collections = host.dataset.study === "collections";
    const url = new URL(
      collections
        ? "./assets/air-collections.js?air=0bbea11f0a18"
        : "./assets/air-overlays.js?air=cd7f69ff30c0",
      import.meta.url,
    );
    const attempt = attempts++;
    // Browsers cache rejected module fetches. A deliberate retry needs a fresh URL.
    if (attempt) url.searchParams.set("retry", String(attempt));
    const study = await import(url.href);
    const mount =
      host.dataset.study === "collections" ? study.mountCollectionStudy : study.mountOverlayStudy;
    mount(host, restoreFocus);
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
