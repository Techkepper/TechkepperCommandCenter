import { Router } from "express";
import isAuth from "../middleware/isAuth";
import requireRole from "../middleware/requireRole";
import * as EcosystemController from "../controllers/EcosystemController";

const ecosystemRoutes = Router();
ecosystemRoutes.get("/ecosystems", isAuth, EcosystemController.index);
ecosystemRoutes.post(
  "/ecosystems",
  isAuth,
  requireRole("admin"),
  EcosystemController.store
);
ecosystemRoutes.put(
  "/ecosystems/:ecosystemId",
  isAuth,
  requireRole("admin"),
  EcosystemController.update
);

export default ecosystemRoutes;
