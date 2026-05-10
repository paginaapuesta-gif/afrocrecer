(function initFrontendConfig() {

  const metaApiBase = document.querySelector('meta[name="api-base-url"]')?.content?.trim();
  const runtimeApiBase = window.__API_BASE_URL__;

  const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const localApiBase = `${window.location.protocol}//${window.location.hostname || "localhost"}:3000`;

  const inferredApiBase = window.location.protocol === "file:"
    ? "http://localhost:3000"
    : (isLocalHost && window.location.port !== "3000"
      ? localApiBase
      : window.location.origin);

  const API_BASE_URL = runtimeApiBase || metaApiBase || inferredApiBase;

  window.API_BASE_URL = API_BASE_URL;

  window.apiUrl = function apiUrl(pathname) {
    const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
    return `${API_BASE_URL}${normalized}`;
  };

})();
