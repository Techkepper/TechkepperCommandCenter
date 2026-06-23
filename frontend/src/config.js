function getConfig(name, defaultValue = null) {
  // If inside a docker container, use window.ENV
  if (window.ENV !== undefined) {
    return window.ENV[name] || defaultValue;
  }

  return import.meta.env[name] || defaultValue;
}

export function getBackendUrl() {
  const configured = getConfig("VITE_BACKEND_URL", "");
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  // Docker/Vite: API en /api (nginx o dev proxy), sin choque con rutas del SPA.
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api`;
  }

  return "http://localhost:8080";
}

export function getSocketConfig() {
  const configured = getConfig("VITE_BACKEND_URL", "");
  const usesApiProxy = !configured;

  if (usesApiProxy && typeof window !== "undefined" && window.location?.origin) {
    return {
      url: window.location.origin,
      path: "/api/socket.io",
    };
  }

  return {
    url: getBackendUrl(),
    path: "/socket.io",
  };
}

export function isNgrokUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return (
      hostname.endsWith(".ngrok-free.app") || hostname.endsWith(".ngrok.io")
    );
  } catch (_err) {
    return false;
  }
}

export function getNgrokHeaders() {
  return isNgrokUrl(getBackendUrl())
    ? { "ngrok-skip-browser-warning": "true" }
    : {};
}

export function getHoursCloseTicketsAuto() {
  return getConfig("VITE_HOURS_CLOSE_TICKETS_AUTO");
}
