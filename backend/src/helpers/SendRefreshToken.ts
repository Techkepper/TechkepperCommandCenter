import { CookieOptions, Response } from "express";
import { isPublicBackendSecure } from "../config/appUrls";

// Default "/" so the cookie is sent for both direct (/auth/*) and proxied (/api/auth/*) API calls.
const refreshCookiePath = process.env.REFRESH_COOKIE_PATH || "/";

const getRefreshCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure:
    process.env.COOKIE_SECURE === "true" ||
    (!process.env.COOKIE_SECURE && isPublicBackendSecure()),
  sameSite: "strict",
  path: refreshCookiePath,
  maxAge: 7 * 24 * 60 * 60 * 1000
});

export const SendRefreshToken = (res: Response, token: string): void => {
  res.clearCookie("jrt", { path: "/" });
  res.cookie("jrt", token, getRefreshCookieOptions());
};

export const ClearRefreshToken = (res: Response): void => {
  const options = getRefreshCookieOptions();
  delete options.maxAge;
  Array.from(new Set([refreshCookiePath, "/auth", "/api/auth", "/"])).forEach(
    path => res.clearCookie("jrt", { ...options, path })
  );
};
