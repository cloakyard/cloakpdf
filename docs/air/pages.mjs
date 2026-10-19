// Reference interactions only. Product adapters must preserve their real data lifecycle.
const theme = document.querySelector("#air-page-theme");
const appearance = new URL(location.href).searchParams.get("theme");
if (["light", "dark"].includes(appearance)) theme.value = appearance;
function applyTheme() {
  if (theme.value === "system") delete document.documentElement.dataset.airTheme;
  else document.documentElement.dataset.airTheme = theme.value;
  const url = new URL(location.href);
  if (theme.value === "system") url.searchParams.delete("theme");
  else url.searchParams.set("theme", theme.value);
  history.replaceState(null, "", url);
  document.querySelectorAll("a[href]").forEach((link) => {
    const target = new URL(link.href);
    if (target.origin !== location.origin || !target.pathname.endsWith(".html")) return;
    if (theme.value === "system") target.searchParams.delete("theme");
    else target.searchParams.set("theme", theme.value);
    link.href = target.href;
  });
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.content =
      theme.value === "system"
        ? meta.media.includes("dark")
          ? "#101216"
          : "#fafbfc"
        : theme.value === "dark"
          ? "#101216"
          : "#fafbfc";
  });
}
theme.addEventListener("change", applyTheme);
applyTheme();
theme.parentElement.hidden = false;
function markSection() {
  document.querySelectorAll(".air-contents a").forEach((link) => {
    if (new URL(link.href).hash === location.hash) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}
window.addEventListener("hashchange", markSection);
markSection();
document.querySelectorAll(".air-contents").forEach((details) => {
  details.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && details.open) {
      details.open = false;
      details.querySelector("summary").focus();
    }
  });
});
const retry = document.querySelector("#air-preview-retry");
if (retry) {
  retry.hidden = false;
  document.querySelector("#air-preview-simulation").hidden = false;
  retry.addEventListener("click", () => {
    const failed = document.querySelector("#air-preview-fail").checked;
    document.querySelector("#air-recovery-preview").hidden = failed;
    document.querySelector("#unavailable-preview").textContent = failed
      ? "The preview couldn’t load."
      : "Your preview is ready.";
    const status = document.querySelector("#air-preview-status");
    status.textContent = failed
      ? "The simulated connection is still unavailable. Your sample note is unchanged."
      : "The sample preview is ready. Your note is unchanged.";
    status.dataset.state = failed ? "error" : "ready";
    document.querySelector("#air-preview-message").textContent = failed
      ? "Your sample is still here. Try again when the connection returns."
      : "The sample preview returned. You can carry on from where you were.";
  });
}
const form = document.querySelector("#air-recovery-form");
if (form) {
  const note = form.querySelector("textarea");
  const status = form.querySelector("#air-draft-status");
  const save = form.querySelector("#air-draft-save");
  const key = "cloakyard:air:recovery-study";
  let saved = note.value;
  let dirty = false;
  try {
    const previous = sessionStorage.getItem(key);
    if (previous !== null) {
      note.value = previous;
      saved = previous;
      status.textContent = "Your sample note was restored from this tab’s session storage.";
    }
  } catch {
    status.textContent =
      "Session storage is unavailable. Keep this page open or download a text copy.";
    status.dataset.state = "error";
  }
  form.querySelector("#air-draft-actions").hidden = false;
  form.querySelector("#air-draft-simulation").hidden = false;
  note.addEventListener("input", () => {
    dirty = note.value !== saved;
    status.textContent = dirty
      ? "Your latest changes are not saved yet."
      : "Your note is unchanged.";
    delete status.dataset.state;
    save.textContent = "Save sample note";
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      if (form.querySelector("#air-draft-fail").checked)
        throw new Error("Simulated storage failure");
      sessionStorage.setItem(key, note.value);
      saved = note.value;
      dirty = false;
      status.textContent =
        "Sample note saved for this browser tab. Download a copy for longer-term storage.";
      delete status.dataset.state;
      save.textContent = "Save sample note";
    } catch {
      status.textContent =
        "Couldn’t save the note. Your text is still here. Try again or download a text copy.";
      status.dataset.state = "error";
      save.textContent = "Try saving again";
    }
  });
  form.querySelector("#air-draft-download").addEventListener("click", () => {
    const link = document.createElement("a");
    const url = URL.createObjectURL(new Blob([note.value], { type: "text/plain;charset=utf-8" }));
    link.href = url;
    link.download = "air-sample-note.txt";
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    // Let the browser begin reading the file before releasing its local URL.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent =
      "Text-copy download requested. Check the downloaded file before leaving this page.";
    delete status.dataset.state;
  });
  window.addEventListener("beforeunload", (event) => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });
}
