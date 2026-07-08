import { CookieOptions } from "express";
import { isPublicBackendSecure } from "./appUrls";

const refreshCookiePath = process.env.REFRESH_COOKIE_PATH || "/";

const normalizeHostname = (url: string): string | null => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
};

export const isCrossOriginAuth = (
  env: NodeJS.ProcessEnv = process.env
): boolean => {
  const configured = env.CROSS_ORIGIN_AUTH?.trim().toLowerCase();
  if (configured === "true") return true;
  if (configured === "false") return false;

  const frontendHost = env.FRONTEND_URL
    ? normalizeHostname(env.FRONTEND_URL)
    : null;
  const backendHost = env.PUBLIC_BACKEND_URL
    ? normalizeHostname(env.PUBLIC_BACKEND_URL)
    : null;

  if (!frontendHost || !backendHost) return false;
  return frontendHost !== backendHost;
};

export const getRefreshCookieSameSite = (
  env: NodeJS.ProcessEnv = process.env
): NonNullable<CookieOptions["sameSite"]> => {
  const configured = env.COOKIE_SAME_SITE?.trim().toLowerCase();
  if (configured === "none" || configured === "lax" || configured === "strict") {
    return configured;
  }

  return isCrossOriginAuth(env) ? "none" : "strict";
};

export const getRefreshCookieSecure = (
  env: NodeJS.ProcessEnv = process.env
): boolean => {
  if (getRefreshCookieSameSite(env) === "none") {
    return true;
  }

  return (
    env.COOKIE_SECURE === "true" ||
    (!env.COOKIE_SECURE && isPublicBackendSecure(env))
  );
};

export const getRefreshCookiePath = (): string => refreshCookiePath;

export const getRefreshCookieOptions = (
  env: NodeJS.ProcessEnv = process.env
): CookieOptions => ({
  httpOnly: true,
  secure: getRefreshCookieSecure(env),
  sameSite: getRefreshCookieSameSite(env),
  path: getRefreshCookiePath(),
  maxAge: 7 * 24 * 60 * 60 * 1000
});

export const getRefreshCookieClearPaths = (): string[] =>
  Array.from(new Set([refreshCookiePath, "/auth", "/api/auth", "/"]));
