(function initFrontendConfig() {

  const API_BASE_URL = "https://afrocrecer-api.onrender.com";

  window.API_BASE_URL = API_BASE_URL;

  window.apiUrl = function apiUrl(pathname) {
    const normalized = pathname.startsWith("/") 
      ? pathname 
      : `/${pathname}`;

    return `${API_BASE_URL}${normalized}`;
  };

})();