// Executable reference, not a production file-format adapter.
export const FILE_LIMIT = 4 * 1024 * 1024;
export function readLocalChunk(blob, signal) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const abort = () => reader.abort();
    const cleanup = () => signal.removeEventListener("abort", abort);
    reader.onload = () => {
      cleanup();
      resolve(reader.result);
    };
    reader.onerror = () => {
      cleanup();
      reject(reader.error);
    };
    reader.onabort = () => {
      cleanup();
      reject(new DOMException("Cancelled", "AbortError"));
    };
    if (signal.aborted) return reject(new DOMException("Cancelled", "AbortError"));
    signal.addEventListener("abort", abort, { once: true });
    reader.readAsArrayBuffer(blob);
  });
}
export function createFileWorkflow({
  readChunk = readLocalChunk,
  onChange = () => {},
  chunkSize = 65536,
} = {}) {
  let state = {
    file: null,
    phase: "empty",
    completed: 0,
    preview: "",
    notice: "Choose a file or try the sample.",
    error: false,
  };
  let generation = 0;
  let controller;
  let releasePause;
  let disposed = false;
  const emit = (patch) => {
    if (disposed) return;
    state = { ...state, ...patch };
    onChange({ ...state });
  };
  function invalidate() {
    generation++;
    controller?.abort();
    releasePause?.();
    releasePause = undefined;
  }
  function report(notice, error = true) {
    emit({ notice, error });
  }
  function select(files) {
    if (disposed || !files.length) return false;
    if (files.length !== 1) {
      report("Choose one file at a time. Your current selection is unchanged.");
      return false;
    }
    const file = files[0];
    if (!/\.(txt|json)$/i.test(file.name)) {
      report("Choose a .txt or .json file for this study. Your current selection is unchanged.");
      return false;
    }
    if (file.size > FILE_LIMIT) {
      report("This study accepts files up to 4 MiB. Your current selection is unchanged.");
      return false;
    }
    invalidate();
    emit({
      file,
      phase: "ready",
      completed: 0,
      preview: "",
      error: false,
      notice: "File selected. Preview it when you’re ready.",
    });
    return true;
  }
  function clear() {
    invalidate();
    emit({
      file: null,
      phase: "empty",
      completed: 0,
      preview: "",
      error: false,
      notice: "Selection removed. The original file is unchanged.",
    });
  }
  function cancel() {
    if (!["reading", "paused"].includes(state.phase)) return;
    invalidate();
    emit({
      phase: "cancelled",
      error: false,
      notice: "Reading cancelled. Your file and any partial preview are still here.",
    });
  }
  function resume() {
    releasePause?.();
    releasePause = undefined;
  }
  async function start({ pause = false, fail = false, unknown = false } = {}) {
    if (disposed || !state.file || ["reading", "paused"].includes(state.phase)) return false;
    invalidate();
    const token = generation;
    const file = state.file;
    const signal = (controller = new AbortController()).signal;
    const current = () => !disposed && token === generation;
    const decoder = new TextDecoder("utf-8", { fatal: true });
    // Small samples have a real halfway boundary too; no timers simulate progress.
    const step = Math.max(1, Math.min(chunkSize, Math.ceil(file.size / 2)));
    let preview = "";
    let inspected = false;
    emit({
      phase: "reading",
      completed: 0,
      preview,
      unknown,
      error: false,
      notice: "Reading your file on this device…",
    });
    try {
      for (let offset = 0; offset < file.size; offset += step) {
        const end = Math.min(file.size, offset + step);
        const bytes = await readChunk(file.slice(offset, end), signal);
        if (!current()) return false;
        if (bytes.byteLength !== end - offset) throw new Error("Incomplete read");
        const text = decoder.decode(bytes, { stream: end < file.size });
        preview = Array.from(preview + text)
          .slice(0, 1200)
          .join("");
        emit({ completed: end, preview });
        if (!inspected && end >= file.size / 2 && end < file.size) {
          inspected = true;
          if (fail) throw new Error("study-interruption");
          if (pause) {
            const paused = new Promise((resolve) => {
              releasePause = resolve;
            });
            emit({
              phase: "paused",
              notice: "Paused halfway for this study. Continue reading or cancel.",
            });
            await paused;
            if (!current()) return false;
            emit({ phase: "reading", notice: "Reading continues on this device…" });
          }
        }
      }
      if (!current()) return false;
      emit({
        phase: "complete",
        error: false,
        completed: file.size,
        preview,
        notice: file.size
          ? "Text preview ready. The original file is unchanged."
          : "This file is empty. Choose another file to preview.",
      });
      return true;
    } catch (error) {
      if (!current()) return false;
      emit({
        phase: "error",
        error: true,
        notice:
          error.message === "study-interruption"
            ? "Study interruption: reading stopped halfway. Turn off the interruption and try again. Your file is still selected."
            : "Couldn’t read this file as UTF-8 text. Your file and any partial preview are still here. Try again or choose another file.",
      });
      return false;
    }
  }
  return {
    select,
    clear,
    cancel,
    resume,
    start,
    report,
    getState: () => ({ ...state }),
    dispose() {
      invalidate();
      disposed = true;
    },
  };
}

if (typeof document !== "undefined" && document.querySelector("#air-files")) {
  const $ = (id) => document.getElementById(id);
  const zone = $("air-file-drop");
  const input = $("air-file-input");
  const browse = $("air-file-browse");
  const read = $("air-file-read");
  const cancel = $("air-file-cancel");
  const resume = $("air-file-resume");
  let acquisition = 0;
  let dragDepth = 0;
  let alive = true;
  const size = (bytes) =>
    bytes < 1024
      ? `${bytes} bytes`
      : `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(bytes / 1024)} KiB`;
  const workflow = createFileWorkflow({
    onChange(state) {
      const busy = ["reading", "paused"].includes(state.phase);
      const returnFocus =
        ([cancel, resume].includes(document.activeElement) && !busy) ||
        (document.activeElement === $("air-file-remove") && !state.file);
      $("air-file-selection").hidden = !state.file;
      $("air-file-name").textContent = state.file?.name ?? "";
      $("air-file-size").textContent = state.file ? size(state.file.size) : "";
      browse.classList.toggle("air-button--primary", !state.file);
      read.hidden = !state.file;
      read.classList.toggle("air-button--primary", !!state.file && state.phase !== "paused");
      resume.classList.toggle("air-button--primary", state.phase === "paused");
      read.setAttribute("aria-disabled", String(busy));
      read.setAttribute("aria-busy", String(state.phase === "reading"));
      const label =
        state.phase === "paused"
          ? "Paused"
          : busy
            ? "Reading file…"
            : state.phase === "error"
              ? "Try reading again"
              : ["complete", "cancelled"].includes(state.phase)
                ? "Read again"
                : "Preview text";
      read.querySelectorAll(".air-action-labels > span").forEach((span) => {
        span.toggleAttribute("data-active", span.textContent === label);
        span.setAttribute("aria-hidden", String(span.textContent !== label));
      });
      cancel.hidden = !busy;
      resume.hidden = state.phase !== "paused";
      if ($("air-file-status").textContent !== state.notice)
        $("air-file-status").textContent = state.notice;
      $("air-file-status").dataset.state = state.error ? "error" : state.phase;
      const outputText =
        state.preview ||
        (state.phase === "complete"
          ? "The file has no text to display."
          : "Your preview will appear here.");
      if ($("air-file-output").textContent !== outputText)
        $("air-file-output").textContent = outputText;
      $("air-file-output").dataset.empty = String(!state.preview);
      $("air-file-output").setAttribute("aria-busy", String(state.phase === "reading"));
      const progress = $("air-file-progress-region");
      $("air-file-progress-region").hidden =
        !state.file || ["empty", "ready"].includes(state.phase);
      progress.setAttribute(
        "aria-valuetext",
        `${size(state.completed)} read${state.unknown ? "" : ` of ${size(state.file?.size ?? 0)}`}`,
      );
      for (const attr of ["aria-valuemin", "aria-valuemax", "aria-valuenow"])
        progress.removeAttribute(attr);
      if (!state.unknown) {
        progress.setAttribute("aria-valuemin", "0");
        progress.setAttribute("aria-valuemax", String(Math.max(1, state.file?.size ?? 0)));
        progress.setAttribute("aria-valuenow", String(state.completed));
      }
      $("air-file-progress").hidden = !!state.unknown || state.file?.size === 0;
      $("air-file-progress-fill").style.transform =
        `scaleX(${state.file?.size ? state.completed / state.file.size : 0})`;
      $("air-file-count").textContent = state.unknown
        ? `${size(state.completed)} read · Total unavailable`
        : `${size(state.completed)} of ${size(state.file?.size ?? 0)} read`;
      if (returnFocus) (state.file ? read : browse).focus();
    },
  });
  const choose = (files) => {
    acquisition++;
    workflow.select(Array.from(files));
  };
  browse.addEventListener("click", () => {
    acquisition++;
    input.click();
  });
  input.addEventListener("change", () => {
    choose(input.files);
    input.value = "";
  });
  $("air-file-remove").addEventListener("click", () => {
    acquisition++;
    workflow.clear();
  });
  $("air-file-sample").addEventListener("click", () =>
    choose([
      new File(
        [
          "A little room to begin.\n\nAir keeps the tools quiet and your work in view.\n\nA local text preview — café, 日本語, and a new line.\n".repeat(
            20,
          ),
        ],
        "air-sample.txt",
        { type: "text/plain" },
      ),
    ]),
  );
  read.addEventListener("click", () => {
    acquisition++;
    void workflow.start({
      pause: $("air-file-pause").checked,
      fail: $("air-file-fail").checked,
      unknown: $("air-file-unknown").checked,
    });
  });
  cancel.addEventListener("click", () => {
    acquisition++;
    workflow.cancel();
  });
  resume.addEventListener("click", () => {
    acquisition++;
    read.focus();
    workflow.resume();
  });
  $("air-file-paste").addEventListener("click", async () => {
    const token = ++acquisition;
    try {
      if (!navigator.clipboard?.readText) throw new Error("unsupported");
      const text = await navigator.clipboard.readText();
      if (!alive || token !== acquisition) return;
      if (!text) {
        workflow.report("The clipboard has no text. Copy some text or browse for a file.");
        return;
      }
      choose([new File([text], "pasted-text.txt", { type: "text/plain" })]);
    } catch {
      if (alive && token === acquisition)
        workflow.report(
          "Clipboard access is unavailable. Paste into this area with your keyboard, or browse for a file. Your selection is unchanged.",
        );
    }
  });
  zone.addEventListener("paste", (event) => {
    if (event.target.closest("input, textarea, [contenteditable]")) return;
    const files = event.clipboardData?.files;
    const text = event.clipboardData?.getData("text/plain");
    if (files?.length) {
      event.preventDefault();
      choose(files);
    } else if (text) {
      event.preventDefault();
      choose([new File([text], "pasted-text.txt", { type: "text/plain" })]);
    }
  });
  const hasFiles = (event) => Array.from(event.dataTransfer?.types ?? []).includes("Files");
  const resetDrag = () => {
    dragDepth = 0;
    delete zone.dataset.dragging;
  };
  zone.addEventListener("dragenter", (event) => {
    if (hasFiles(event)) {
      event.preventDefault();
      dragDepth++;
      zone.dataset.dragging = "true";
    }
  });
  zone.addEventListener("dragover", (event) => {
    if (hasFiles(event)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    }
  });
  zone.addEventListener("dragleave", () => {
    if (--dragDepth <= 0) resetDrag();
  });
  zone.addEventListener("drop", (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    resetDrag();
    choose(event.dataTransfer.files);
  });
  // A missed file drop must not navigate away and discard the current selection.
  window.addEventListener("dragover", (event) => {
    if (hasFiles(event)) event.preventDefault();
  });
  window.addEventListener("drop", (event) => {
    if (hasFiles(event)) {
      event.preventDefault();
      resetDrag();
      workflow.report(
        "Drop the file inside the file area, or use Browse files. Your selection is unchanged.",
      );
    }
  });
  window.addEventListener("dragend", resetDrag);
  window.addEventListener("pagehide", () => {
    alive = false;
    acquisition++;
    workflow.cancel();
    resetDrag();
  });
  window.addEventListener("pageshow", () => {
    alive = true;
  });
  $("air-file-enhanced").hidden = false;
  $("air-file-scenarios").hidden = false;
  zone.tabIndex = 0;
  workflow.report("Choose a file or try the sample.", false);
}
