import { Router } from "express";

import isAuth from "../middleware/isAuth";
import * as UserController from "../controllers/UserController";
import requireRole from "../middleware/requireRole";

const userRoutes = Router();

userRoutes.get("/users", isAuth, UserController.index);

userRoutes.post(
  "/users",
  isAuth,
  requireRole("admin"),
  UserController.store
);

userRoutes.put("/users/:userId", isAuth, UserController.update);

userRoutes.get("/users/:userId", isAuth, UserController.show);

userRoutes.delete(
  "/users/:userId",
  isAuth,
  requireRole("admin"),
  UserController.remove
);

export default userRoutes;
