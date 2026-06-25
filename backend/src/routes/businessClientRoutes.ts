import { Router } from "express";

import * as BusinessClientController from "../controllers/BusinessClientController";
import isAuth from "../middleware/isAuth";
import requireRole from "../middleware/requireRole";

const businessClientRoutes = Router();

businessClientRoutes.get(
  "/business-clients",
  isAuth,
  BusinessClientController.index
);
businessClientRoutes.get(
  "/business-clients/:clientId/dossier",
  isAuth,
  BusinessClientController.dossier
);
businessClientRoutes.get(
  "/business-clients/:clientId",
  isAuth,
  BusinessClientController.show
);
businessClientRoutes.post(
  "/business-clients",
  isAuth,
  requireRole("admin", "supervisor"),
  BusinessClientController.store
);
businessClientRoutes.put(
  "/business-clients/:clientId",
  isAuth,
  requireRole("admin", "supervisor"),
  BusinessClientController.update
);
businessClientRoutes.patch(
  "/business-clients/:clientId/status",
  isAuth,
  requireRole("admin", "supervisor"),
  BusinessClientController.setStatus
);

export default businessClientRoutes;
