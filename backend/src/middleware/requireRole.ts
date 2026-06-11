import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import { hasRole, UserRole } from "../helpers/roles";

const requireRole = (...roles: UserRole[]) => (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!hasRole(req.user.profile, roles)) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  next();
};

export default requireRole;
