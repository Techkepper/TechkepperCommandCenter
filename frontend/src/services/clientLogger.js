import { getBackendUrl } from "../config";

const MAX_TEXT_LENGTH = 1000;
let installed = false;
let lastLogKey = "";
let lastLogAt = 0;

const truncate = value => {
  if (value == null) return undefined;
  return String(value).slice(0, MAX_TEXT_LENGTH);
};

const shouldSkipDuplicate = payload => {
  const key = `${payload.message}|${payload.requestUrl}|${payload.status}`;
  const now = Date.now();
  if (key === lastLogKey && now - lastLogAt < 3000) return true;
  lastLogKey = key;
  lastLogAt = now;
  return false;
};

export const logClientError = payload => {
  const normalized = {
    level: payload.level || "error",
    message: truncate(payload.message || payload.error?.message),
    name: truncate(payload.name || payload.error?.name),
    stack: truncate(payload.stack || payload.error?.stack),
    componentStack: truncate(payload.componentStack),
    url: truncate(window.location.href),
    userAgent: truncate(window.navigator.userAgent),
    status: payload.status,
    method: truncate(payload.method),
    requestUrl: truncate(payload.requestUrl),
    responseError: truncate(payload.responseError),
  };

  if (shouldSkipDuplicate(normalized)) return;

  fetch(`${getBackendUrl()}/client-logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalized),
    keepalive: true,
  }).catch(() => undefined);
};

export const installClientLogger = () => {
  if (installed) return;
  installed = true;

  window.addEventListener("error", event => {
    logClientError({
      message: event.message,
      error: event.error,
      level: "error",
    });
  });

  window.addEventListener("unhandledrejection", event => {
    const reason = event.reason || {};
    logClientError({
      message: reason.message || "Unhandled promise rejection",
      error: reason,
      level: "error",
    });
  });
};
