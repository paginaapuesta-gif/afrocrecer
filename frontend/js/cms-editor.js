(function initAutoVisualCMS() {
  const TEXT_TAGS = new Set(["H1", "H2", "H3", "P", "SPAN"]);
  const SELECTOR = "h1,h2,h3,p,span,img,video,iframe,a";
  const IGNORE_SELECTOR = [
    "script",
    "style",
    "link[rel='stylesheet']",
    "meta",
    "noscript",
    "nav",
    "header nav",
    "[role='navigation']",
    ".nav",
    ".navbar",
    "footer",
    "[data-no-edit]",
    "button",
    "input",
    "select",
    "textarea"
  ].join(",");

  const state = {
    enabled: false,
    isEditMode: false,
    bindings: new Map(),
    changes: new Map(),
    saveInProgress: false,
    iframeOverlays: []
  };
  let mutationObserver = null;

  function getStoredUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (_error) {
      return null;
    }
  }

  function isAdmin() {
    const user = getStoredUser();
    return Boolean(user && user.role === "admin");
  }

  function resolveApiBase() {
    if (typeof window.apiUrl === "function") {
      return window.API_BASE_URL || window.location.origin;
    }

    const fromWindow = String(window.__API_BASE_URL__ || window.API_BASE_URL || "").trim();
    const fromMeta = String(document.querySelector('meta[name="api-base-url"]')?.content || "").trim();
    if (fromWindow) return fromWindow;
    if (fromMeta) return fromMeta;

    const host = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;

    if (host === "localhost" && (protocol === "file:" || ["5500", "5173", "8080"].includes(port))) {
      return "http://localhost:3000";
    }

    return window.location.origin;
  }

  function apiUrl(path) {
    if (typeof window.apiUrl === "function") return window.apiUrl(path);
    const base = resolveApiBase();
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${base}${normalized}`;
  }

  function getToken() {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      sessionStorage.getItem("token") ||
      ""
    );
  }

  function pageSlug() {
    const filename = (window.location.pathname.split("/").pop() || "home.html").toLowerCase();
    return (filename.replace(/\.html?$/i, "") || "home").replace(/[^a-z0-9_-]/g, "");
  }

  function isButtonLikeAnchor(el) {
    const role = (el.getAttribute("role") || "").toLowerCase();
    const cls = String(el.className || "").toLowerCase();
    return role === "button" || /\b(btn|button|cta|menu|nav)\b/.test(cls);
  }

  function shouldIgnore(el) {
    if (!(el instanceof HTMLElement)) return true;
    if (el.closest("[data-no-edit]")) return true;
    if (el.closest(IGNORE_SELECTOR)) return true;

    if (el.tagName === "A") {
      if (isButtonLikeAnchor(el)) return true;
      if (el.closest("header") || el.closest("nav") || el.closest("footer")) return true;
    }

    return false;
  }

  function classify(el) {
    if (TEXT_TAGS.has(el.tagName)) return "text";
    if (el.tagName === "IMG") return "image";
    if (el.tagName === "VIDEO" || el.tagName === "IFRAME") return "video";
    if (el.tagName === "A") return "link";
    return null;
  }

  function ensureToastContainer() {
    let box = document.getElementById("cmsToastContainer");
    if (box) return box;
    box = document.createElement("div");
    box.id = "cmsToastContainer";
    box.className = "cms-toast-container";
    document.body.appendChild(box);
    return box;
  }

  function toast(message, type) {
    const box = ensureToastContainer();
    const item = document.createElement("div");
    item.className = `cms-toast cms-toast--${type || "info"}`;
    item.textContent = message;
    box.appendChild(item);

    setTimeout(() => {
      item.classList.add("is-out");
      setTimeout(() => item.remove(), 220);
    }, 1700);
  }

  function renderUI() {
    if (document.getElementById("cmsEditorDock")) return;

    const style = document.createElement("style");
    style.textContent = `
      .cms-editor-dock { position: fixed; right: 16px; bottom: 16px; z-index: 99999; display: flex; gap: 8px; }
      .cms-editor-btn { border: 0; border-radius: 8px; padding: 10px 12px; font: 600 13px/1 sans-serif; box-shadow: 0 3px 10px rgba(0,0,0,.2); cursor: pointer; }
      .cms-editor-btn--edit { background: #101828; color: #fff; }
      .cms-editor-btn--save { background: #1570ef; color: #fff; }
      .cms-editor-btn[disabled] { opacity: .6; cursor: not-allowed; }
      .cms-editable { outline: 1px dashed transparent; transition: outline-color .15s ease; }
      .cms-edit-mode .cms-editable:hover { outline-color: #1570ef !important; cursor: pointer !important; }
      .cms-edit-mode [contenteditable='true'].cms-editable { outline-color: #53b1fd; }
      .cms-edit-mode .cms-editable--changed { outline-color: #f79009 !important; }
      .cms-iframe-overlay { position: absolute; inset: 0; background: rgba(21, 112, 239, .08); border: 1px dashed #1570ef; cursor: pointer; z-index: 2; }
      .cms-toast-container { position: fixed; right: 12px; top: 12px; z-index: 100000; display: grid; gap: 8px; }
      .cms-toast { background: #101828; color: #fff; padding: 9px 11px; border-radius: 8px; font: 500 12px/1.25 sans-serif; }
      .cms-toast--success { background: #027a48; }
      .cms-toast--error { background: #b42318; }
      .cms-toast.is-out { opacity: 0; transition: opacity .2s ease; }
    `;
    document.head.appendChild(style);

    const dock = document.createElement("div");
    dock.id = "cmsEditorDock";
    dock.className = "cms-editor-dock";

    const editBtn = document.createElement("button");
    editBtn.id = "cmsEditToggle";
    editBtn.type = "button";
    editBtn.className = "cms-editor-btn cms-editor-btn--edit";
    editBtn.textContent = "✏️ Editar página";

    const saveBtn = document.createElement("button");
    saveBtn.id = "cmsSaveChanges";
    saveBtn.type = "button";
    saveBtn.className = "cms-editor-btn cms-editor-btn--save";
    saveBtn.textContent = "Guardar cambios";
    saveBtn.disabled = true;

    editBtn.addEventListener("click", toggleEditMode);
    saveBtn.addEventListener("click", saveAllChanges);

    dock.appendChild(editBtn);
    dock.appendChild(saveBtn);
    document.body.appendChild(dock);
  }

  function markChanged(el, key, value) {
    state.changes.set(key, String(value || ""));
    el.classList.add("cms-editable--changed");

    const saveBtn = document.getElementById("cmsSaveChanges");
    if (saveBtn) saveBtn.disabled = state.changes.size === 0;
  }

  function parseUploadUrl(payload) {
    if (!payload || typeof payload !== "object") return "";
    const direct = payload.url || payload.path || payload.file?.url || payload.location || "";
    if (direct) return toAbsoluteAssetUrl(direct);
    const filename = payload.filename || payload.file?.filename || "";
    if (filename) return toAbsoluteAssetUrl(`/uploads/${filename}`);
    return "";
  }

  function toAbsoluteAssetUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("data:")) return raw;

    const base = resolveApiBase();

    try {
      if (raw.startsWith("/")) {
        return new URL(raw, `${base}/`).toString();
      }
      return new URL(raw, `${base}/`).toString();
    } catch (_error) {
      return raw;
    }
  }

  async function uploadImage(file) {
    const form = new FormData();
    form.append("file", file);

    let response;
    try {
      response = await fetch(apiUrl("/api/upload"), {
        method: "POST",
        body: form,
        headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {}
      });
    } catch (_error) {
      throw new Error("No hay conexión con /api/upload");
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Solo administrador puede subir imágenes");
      }
      throw new Error("Error subiendo imagen");
    }

    const data = await response.json();
    const url = parseUploadUrl(data);
    if (!url) throw new Error("Upload sin URL válida");
    return url;
  }

  function buildKeys(elements) {
    const page = pageSlug();
    const counters = { texto: 0, imagen: 0, video: 0, link: 0 };
    const labels = new Set();

    return elements.map((el) => {
      const type = classify(el);
      let suffix = "";

      if (type === "text") {
        if (el.tagName === "H1" && !labels.has("titulo")) {
          suffix = "titulo";
        } else if ((el.tagName === "H2" || el.tagName === "H3") && !labels.has("subtitulo")) {
          suffix = "subtitulo";
        } else if ((el.tagName === "P" || el.tagName === "SPAN") && !labels.has("descripcion")) {
          suffix = "descripcion";
        } else {
          counters.texto += 1;
          suffix = `texto.${counters.texto}`;
        }
        labels.add(suffix);
      }

      if (type === "image") {
        counters.imagen += 1;
        suffix = `imagen.${counters.imagen}`;
      }
      if (type === "video") {
        counters.video += 1;
        suffix = `video.${counters.video}`;
      }
      if (type === "link") {
        counters.link += 1;
        suffix = `link.${counters.link}`;
      }

      return { el, type, key: `${page}.${suffix}` };
    });
  }

  function cleanupIframeOverlays() {
    state.iframeOverlays.forEach((overlay) => overlay.remove());
    state.iframeOverlays = [];
  }

  function addIframeOverlay(iframe, onClick) {
    const parent = iframe.parentElement;
    if (!parent) return;

    const parentStyle = window.getComputedStyle(parent).position;
    if (parentStyle === "static") {
      parent.style.position = "relative";
    }

    const overlay = document.createElement("button");
    overlay.type = "button";
    overlay.className = "cms-iframe-overlay";
    overlay.setAttribute("aria-label", "Editar video embebido");
    overlay.addEventListener("click", onClick);

    parent.appendChild(overlay);
    state.iframeOverlays.push(overlay);
  }

  function attachText(el, key) {
    const onInput = () => markChanged(el, key, el.innerText);
    state.bindings.set(el, { key, type: "text", onInput });
    el.classList.add("cms-editable");
  }

  function attachImage(el, key) {
    const onClick = (event) => {
      if (!state.isEditMode) return;
      event.preventDefault();
      event.stopPropagation();

      const picker = document.createElement("input");
      picker.type = "file";
      picker.accept = "image/*";
      picker.addEventListener("change", async () => {
        const file = picker.files && picker.files[0];
        if (!file) return;
        try {
          const url = await uploadImage(file);
          el.src = toAbsoluteAssetUrl(url);
          markChanged(el, key, url);
          toast("Imagen actualizada", "success");
        } catch (error) {
          toast(error.message || "Error subiendo imagen", "error");
        }
      });
      picker.click();
    };

    state.bindings.set(el, { key, type: "image", onClick });
    el.classList.add("cms-editable");
  }

  function attachVideo(el, key) {
    const onClick = (event) => {
      if (!state.isEditMode) return;
      event.preventDefault();
      event.stopPropagation();

      const current = el.getAttribute("src") || el.currentSrc || "";
      const next = window.prompt("Nueva URL del video", current);
      if (next === null) return;
      const value = String(next).trim();
      if (!value) return;

      if (el.tagName === "VIDEO") {
        el.src = value;
        el.load();
      } else {
        el.setAttribute("src", value);
      }

      markChanged(el, key, value);
      toast("Video actualizado", "success");
    };

    state.bindings.set(el, { key, type: "video", onClick });
    el.classList.add("cms-editable");
  }

  function attachLink(el, key) {
    const onClick = (event) => {
      if (!state.isEditMode) return;
      event.preventDefault();
      event.stopPropagation();

      const current = el.getAttribute("href") || "";
      const next = window.prompt("Nueva URL del enlace", current);
      if (next === null) return;
      const value = String(next).trim();
      if (!value) return;

      el.setAttribute("href", value);
      markChanged(el, key, value);
      toast("Enlace actualizado", "success");
    };

    state.bindings.set(el, { key, type: "link", onClick });
    el.classList.add("cms-editable");
  }

  async function preload(bindings) {
    await Promise.all(bindings.map(async ({ el, key, type }) => {
      try {
        const res = await fetch(apiUrl(`/api/content/${encodeURIComponent(key)}`));
        if (!res.ok) return;
        const data = await res.json();
        const value = String(data?.valor || "");
        if (!value) return;

        if (type === "text") el.innerText = value;
        if (type === "image") el.src = toAbsoluteAssetUrl(value);
        if (type === "video") {
          if (el.tagName === "VIDEO") {
            el.src = toAbsoluteAssetUrl(value);
            el.load();
          } else {
            el.setAttribute("src", toAbsoluteAssetUrl(value));
          }
        }
        if (type === "link") el.setAttribute("href", value);
      } catch (_error) {
        // no-op
      }
    }));
  }

  function clearBindings() {
    cleanupIframeOverlays();
    state.bindings.forEach((meta, el) => {
      el.classList.remove("cms-editable", "cms-editable--changed");
      if (meta.onInput) el.removeEventListener("input", meta.onInput);
      if (meta.onClick) el.removeEventListener("click", meta.onClick);
      el.removeAttribute("contenteditable");
    });
    state.bindings.clear();
  }

  async function scan() {
    clearBindings();
    const elements = Array.from(document.querySelectorAll(SELECTOR)).filter((el) => !shouldIgnore(el));
    const bindings = buildKeys(elements);
    await preload(bindings);

    bindings.forEach(({ el, key, type }) => {
      if (type === "text") attachText(el, key);
      if (type === "image") attachImage(el, key);
      if (type === "video") attachVideo(el, key);
      if (type === "link") attachLink(el, key);
    });

    if (state.isEditMode) enableEditing();
  }

  function shouldProcessMutations(mutations) {
    if (state.isEditMode) return false;

    return mutations.some((mutation) => {
      const target = mutation.target;
      if (!(target instanceof HTMLElement) && !(target instanceof Node)) return false;

      const el = target instanceof HTMLElement ? target : target.parentElement;
      if (!el) return false;

      if (
        el.closest("#cmsEditorDock") ||
        el.closest("#cmsToastContainer") ||
        el.closest(".cms-iframe-overlay")
      ) {
        return false;
      }

      return true;
    });
  }

  function enableEditing() {
    document.body.classList.add("cms-edit-mode");

    state.bindings.forEach((meta, el) => {
      if (meta.type === "text") {
        el.setAttribute("contenteditable", "true");
        el.addEventListener("input", meta.onInput);
      } else if (meta.type === "video" && el.tagName === "IFRAME") {
        addIframeOverlay(el, meta.onClick);
      } else if (meta.onClick) {
        el.addEventListener("click", meta.onClick);
      }
    });
  }

  function disableEditing() {
    document.body.classList.remove("cms-edit-mode");
    cleanupIframeOverlays();

    state.bindings.forEach((meta, el) => {
      if (meta.onInput) el.removeEventListener("input", meta.onInput);
      if (meta.onClick) el.removeEventListener("click", meta.onClick);
      el.removeAttribute("contenteditable");
    });
  }

  function toggleEditMode() {
    state.isEditMode = !state.isEditMode;
    const toggle = document.getElementById("cmsEditToggle");

    if (state.isEditMode) {
      enableEditing();
      if (mutationObserver) mutationObserver.disconnect();
      if (toggle) toggle.textContent = "✅ Salir de edición";
      toast("Modo edición activado", "success");
    } else {
      disableEditing();
      if (mutationObserver) {
        mutationObserver.observe(document.body, { childList: true, subtree: true });
      }
      if (toggle) toggle.textContent = "✏️ Editar página";
      toast("Modo edición desactivado", "info");
    }
  }

  async function saveEntry(key, value) {
    let response;
    try {
      response = await fetch(apiUrl(`/api/content/${encodeURIComponent(key)}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
        },
        body: JSON.stringify({ valor: String(value || "") })
      });
    } catch (_error) {
      throw new Error("No hay conexión con /api/content");
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Solo administrador puede guardar cambios");
      }
      throw new Error(`Error guardando ${key}`);
    }
  }

  async function saveAllChanges() {
    if (state.saveInProgress || state.changes.size === 0) return;

    const saveBtn = document.getElementById("cmsSaveChanges");
    state.saveInProgress = true;

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Guardando...";
    }

    let ok = 0;
    let fail = 0;

    for (const [key, value] of Array.from(state.changes.entries())) {
      try {
        await saveEntry(key, value);
        ok += 1;
        state.changes.delete(key);

        state.bindings.forEach((meta, el) => {
          if (meta.key === key) el.classList.remove("cms-editable--changed");
        });
      } catch (error) {
        fail += 1;
        toast(error.message || "Error guardando cambios", "error");
      }
    }

    if (ok > 0) toast(`Guardado: ${ok} cambio(s)`, "success");
    if (fail > 0 && ok === 0) toast("Error al guardar cambios", "error");

    if (saveBtn) {
      saveBtn.textContent = "Guardar cambios";
      saveBtn.disabled = state.changes.size === 0;
    }

    state.saveInProgress = false;
  }

  async function start() {
    if (!isAdmin()) {
      state.enabled = false;
      return;
    }

    state.enabled = true;
    renderUI();
    await scan();

    mutationObserver = new MutationObserver((mutations) => {
      if (!shouldProcessMutations(mutations)) return;
      clearTimeout(mutationObserver.__cmsTimer);
      mutationObserver.__cmsTimer = setTimeout(scan, 220);
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
