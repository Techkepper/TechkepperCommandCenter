import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import ListSettingByValueService from "../services/SettingServices/ListSettingByValueService";

const isAuthApi = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  const [scheme, token] = authHeader.trim().split(/\s+/);
  if (scheme !== "Bearer" || !token) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  try {
    const getToken = await ListSettingByValueService(token);
    if (!getToken) {
      throw new AppError("ERR_SESSION_EXPIRED", 401);
    }

    if (getToken.value !== token) {
      throw new AppError("ERR_SESSION_EXPIRED", 401);
    }
  } catch (_err) {
    throw new AppError(
      "ERR_SESSION_EXPIRED",
      401
    );
  }

  return next();
};

export default isAuthApi;
