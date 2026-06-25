import { Router } from "express";

import * as CommercialProposalController from "../controllers/CommercialProposalController";
import isAuth from "../middleware/isAuth";
import requireRole from "../middleware/requireRole";

const routes = Router();

routes.post(
  "/commercial-proposals/calculate",
  isAuth,
  requireRole("admin", "supervisor"),
  CommercialProposalController.calculate
);
routes.get("/commercial-proposals", isAuth, CommercialProposalController.index);
routes.post(
  "/commercial-proposals",
  isAuth,
  requireRole("admin", "supervisor"),
  CommercialProposalController.store
);
routes.get(
  "/commercial-proposals/:proposalId",
  isAuth,
  CommercialProposalController.show
);
routes.put(
  "/commercial-proposals/:proposalId",
  isAuth,
  requireRole("admin", "supervisor"),
  CommercialProposalController.update
);
routes.patch(
  "/commercial-proposals/:proposalId/status",
  isAuth,
  requireRole("admin", "supervisor"),
  CommercialProposalController.changeStatus
);
routes.post(
  "/commercial-proposals/:proposalId/generate",
  isAuth,
  requireRole("admin", "supervisor"),
  CommercialProposalController.generate
);
routes.get(
  "/commercial-proposals/:proposalId/download",
  isAuth,
  CommercialProposalController.download
);
routes.get(
  "/commercial-proposals/:proposalId/events",
  isAuth,
  CommercialProposalController.events
);
routes.get(
  "/commercial-proposals/:proposalId/notification-recipients",
  isAuth,
  requireRole("admin", "supervisor"),
  CommercialProposalController.notificationRecipients
);
routes.delete(
  "/commercial-proposals/:proposalId",
  isAuth,
  requireRole("admin"),
  CommercialProposalController.archive
);

export default routes;
