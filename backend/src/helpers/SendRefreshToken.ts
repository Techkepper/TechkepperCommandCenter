import { Response } from "express";
import {
  getRefreshCookieClearPaths,
  getRefreshCookieOptions
} from "../config/refreshCookie";

export const SendRefreshToken = (res: Response, token: string): void => {
  ClearRefreshToken(res);
  res.cookie("jrt", token, getRefreshCookieOptions());
};

export const ClearRefreshToken = (res: Response): void => {
  const options = getRefreshCookieOptions();
  delete options.maxAge;

  getRefreshCookieClearPaths().forEach(path => {
    res.clearCookie("jrt", { ...options, path });
  });
};
