import { CookieOptions, Response } from "express";

const getRefreshCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure:
    process.env.COOKIE_SECURE === "true" ||
    (!process.env.COOKIE_SECURE &&
      String(process.env.BACKEND_URL || "").startsWith("https://")),
  sameSite: "strict",
  path: "/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000
});

export const SendRefreshToken = (res: Response, token: string): void => {
  res.clearCookie("jrt", { path: "/" });
  res.cookie("jrt", token, getRefreshCookieOptions());
};

export const ClearRefreshToken = (res: Response): void => {
  const { maxAge: _maxAge, ...options } = getRefreshCookieOptions();
  res.clearCookie("jrt", options);
  res.clearCookie("jrt", { path: "/" });
};
