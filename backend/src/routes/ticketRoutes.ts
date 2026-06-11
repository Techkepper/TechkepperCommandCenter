import express from "express";
import isAuth from "../middleware/isAuth";

import * as TicketController from "../controllers/TicketController";
import requireRole from "../middleware/requireRole";

const ticketRoutes = express.Router();

ticketRoutes.get("/tickets", isAuth, TicketController.index);

ticketRoutes.get("/tickets/:ticketId", isAuth, TicketController.show);

ticketRoutes.get(
  "/tickets/:ticketId/assignment-events",
  isAuth,
  TicketController.assignmentEvents
);

ticketRoutes.post("/tickets", isAuth, TicketController.store);

ticketRoutes.put("/tickets/:ticketId", isAuth, TicketController.update);

ticketRoutes.delete(
  "/tickets/:ticketId",
  isAuth,
  requireRole("admin"),
  TicketController.remove
);

export default ticketRoutes;
