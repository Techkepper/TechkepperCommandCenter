import express from "express";
import isAuth from "../middleware/isAuth";

import * as WhatsAppController from "../controllers/WhatsAppController";
import requireRole from "../middleware/requireRole";

const whatsappRoutes = express.Router();

whatsappRoutes.get("/whatsapp/", isAuth, WhatsAppController.index);

whatsappRoutes.post(
  "/whatsapp/",
  isAuth,
  requireRole("admin"),
  WhatsAppController.store
);

whatsappRoutes.get(
  "/whatsapp/:whatsappId",
  isAuth,
  requireRole("admin"),
  WhatsAppController.show
);

whatsappRoutes.put(
  "/whatsapp/:whatsappId",
  isAuth,
  requireRole("admin"),
  WhatsAppController.update
);

whatsappRoutes.delete(
  "/whatsapp/:whatsappId",
  isAuth,
  requireRole("admin"),
  WhatsAppController.remove
);

export default whatsappRoutes;
