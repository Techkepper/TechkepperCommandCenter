import { Router } from "express";

import * as CollaboratorController from "../controllers/CollaboratorController";
import isAuth from "../middleware/isAuth";
import requireRole from "../middleware/requireRole";

const collaboratorRoutes = Router();

collaboratorRoutes.get("/collaborators", isAuth, CollaboratorController.index);
collaboratorRoutes.get(
  "/collaborators/:collaboratorId/dossier",
  isAuth,
  CollaboratorController.dossier
);
collaboratorRoutes.get(
  "/collaborators/:collaboratorId",
  isAuth,
  CollaboratorController.show
);
collaboratorRoutes.post(
  "/collaborators",
  isAuth,
  requireRole("admin", "supervisor"),
  CollaboratorController.store
);
collaboratorRoutes.put(
  "/collaborators/:collaboratorId",
  isAuth,
  requireRole("admin", "supervisor"),
  CollaboratorController.update
);
collaboratorRoutes.patch(
  "/collaborators/:collaboratorId/status",
  isAuth,
  requireRole("admin", "supervisor"),
  CollaboratorController.setStatus
);

export default collaboratorRoutes;
