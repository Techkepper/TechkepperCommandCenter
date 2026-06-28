import { Router } from "express";

import * as DropboxController from "../controllers/DropboxController";
import isAuth from "../middleware/isAuth";
import requireRole from "../middleware/requireRole";

const routes = Router();

routes.get(
  "/dropbox/status",
  isAuth,
  requireRole("admin"),
  DropboxController.status
);

routes.post(
  "/dropbox/validate",
  isAuth,
  requireRole("admin"),
  DropboxController.validate
);

routes.post(
  "/documents/:documentId/dropbox-sync",
  isAuth,
  requireRole("admin"),
  DropboxController.retryDocumentSync
);

export default routes;
