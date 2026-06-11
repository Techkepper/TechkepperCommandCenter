import { Request, Response } from "express";
import AppError from "../errors/AppError";

import CreateUserService from "../services/UserServices/CreateUserService";
import ListUsersService from "../services/UserServices/ListUsersService";
import UpdateUserService from "../services/UserServices/UpdateUserService";
import ShowUserService from "../services/UserServices/ShowUserService";
import DeleteUserService from "../services/UserServices/DeleteUserService";
import {
  EmitUserEvent,
  RevokeUserSockets
} from "../helpers/EmitUserEvent";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { users, count, hasMore } = await ListUsersService({
    searchParam,
    pageNumber,
    activeOnly: req.user.profile === "agent",
    includeSensitive: req.user.profile === "admin"
  });

  return res.json({ users, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const {
    email,
    password,
    name,
    profile,
    queueIds,
    whatsappId,
    isActive,
    theme
  } = req.body;

  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const user = await CreateUserService({
    email,
    password,
    name,
    profile,
    queueIds,
    whatsappId,
    isActive,
    theme
  });

  EmitUserEvent("create", user as Record<string, any>);

  return res.status(200).json(user);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;
  if (
    req.user.profile === "agent" &&
    Number(req.user.id) !== Number(userId)
  ) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const user = await ShowUserService(userId);

  return res.status(200).json(user);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const isOwnProfile = Number(req.user.id) === Number(req.params.userId);
  if (req.user.profile !== "admin" && !isOwnProfile) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const { userId } = req.params;
  const userData =
    req.user.profile === "admin"
      ? req.body
      : {
          name: req.body.name,
          password: req.body.password,
          theme: req.body.theme
        };

  const user = await UpdateUserService({ userData, userId });

  EmitUserEvent("update", user as Record<string, any>);

  if (
    req.body.password ||
    req.body.profile !== undefined ||
    req.body.isActive !== undefined
  ) {
    await RevokeUserSockets(userId);
  }

  return res.status(200).json(user);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId } = req.params;

  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  await DeleteUserService(userId);

  EmitUserEvent("delete", undefined, Number(userId));
  await RevokeUserSockets(userId);

  return res.status(200).json({ message: "User deleted" });
};
