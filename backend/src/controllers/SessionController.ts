import * as Yup from "yup";
import { Request, Response } from "express";
import AppError from "../errors/AppError";

import AuthUserService from "../services/UserServices/AuthUserService";
import {
  SendRefreshToken,
  ClearRefreshToken
} from "../helpers/SendRefreshToken";
import { RefreshTokenService } from "../services/AuthServices/RefreshTokenService";
import User from "../models/User";
import { RevokeUserSockets } from "../helpers/EmitUserEvent";
import { SerializeUser } from "../helpers/SerializeUser";
import UpdateUserAvailabilityService from "../services/UserServices/UpdateUserAvailabilityService";

export const store = async (req: Request, res: Response): Promise<Response> => {
  const schema = Yup.object({
    email: Yup.string().trim().lowercase().email().max(254).required(),
    password: Yup.string().min(10).max(128).required()
  });
  let credentials: { email: string; password: string };
  try {
    credentials = await schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
  } catch (err) {
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }
  const { email, password } = credentials;

  const { token, serializedUser, refreshToken } = await AuthUserService({
    email,
    password
  });

  SendRefreshToken(res, refreshToken);
  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    token,
    user: serializedUser
  });
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const token: string = req.cookies.jrt;

  if (!token) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  const { user, newToken, refreshToken } = await RefreshTokenService(
    res,
    token
  );

  SendRefreshToken(res, refreshToken);
  res.setHeader("Cache-Control", "no-store");

  return res.json({ token: newToken, user: SerializeUser(user) });
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await UpdateUserAvailabilityService({
    targetUserId: req.user.id,
    availabilityStatus: "offline",
    actorUserId: req.user.id,
    actorProfile: req.user.profile
  });
  await User.increment("tokenVersion", { where: { id: req.user.id } });
  await RevokeUserSockets(req.user.id);
  ClearRefreshToken(res);

  return res.send();
};
