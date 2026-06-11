import { sign } from "jsonwebtoken";
import authConfig from "../config/auth";
import User from "../models/User";

export const createAccessToken = (user: User): string => {
  const { secret, expiresIn } = authConfig;

  return sign(
    {
      id: user.id,
      profile: user.profile,
      tokenVersion: user.tokenVersion,
      type: "access"
    },
    secret,
    {
      expiresIn,
      algorithm: "HS256",
      issuer: authConfig.issuer,
      audience: authConfig.audience,
      subject: String(user.id)
    }
  );
};

export const createRefreshToken = (user: User): string => {
  const { refreshSecret, refreshExpiresIn } = authConfig;

  return sign(
    {
      id: user.id,
      tokenVersion: user.tokenVersion,
      type: "refresh"
    },
    refreshSecret,
    {
      expiresIn: refreshExpiresIn,
      algorithm: "HS256",
      issuer: authConfig.issuer,
      audience: authConfig.audience,
      subject: String(user.id)
    }
  );
};
