import { verify } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import authConfig from "../config/auth";
import User from "../models/User";

interface TokenPayload {
  id: string;
  profile: string;
  tokenVersion: number;
  type: string;
  iat: number;
  exp: number;
}

const isAuth = async (
  req: Request,
  _res: Response,
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
    const decoded = verify(token, authConfig.secret, {
      algorithms: ["HS256"],
      issuer: authConfig.issuer,
      audience: authConfig.audience
    });
    const { id, tokenVersion, type } = decoded as TokenPayload;

    if (type !== "access" || !id) {
      throw new AppError("ERR_SESSION_EXPIRED", 401);
    }

    const user = await User.findByPk(id, {
      attributes: [
        "id",
        "profile",
        "isActive",
        "lastActivityAt",
        "tokenVersion"
      ]
    });

    if (!user || !user.isActive) {
      throw new AppError("ERR_USER_INACTIVE", 403);
    }

    if (user.tokenVersion !== tokenVersion) {
      throw new AppError("ERR_SESSION_EXPIRED", 401);
    }

    req.user = {
      id: String(user.id),
      profile: user.profile
    };
    await user.update({ lastActivityAt: new Date() });
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError(
      "ERR_SESSION_EXPIRED",
      401
    );
  }

  next();
};

export default isAuth;
