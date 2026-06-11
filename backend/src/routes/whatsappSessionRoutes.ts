import { Router } from "express";
import isAuth from "../middleware/isAuth";

import WhatsAppSessionController from "../controllers/WhatsAppSessionController";
import requireRole from "../middleware/requireRole";
import { createRateLimiter } from "../middleware/rateLimit";

const whatsappSessionRoutes = Router();
const qrRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 12,
  keyGenerator: req => `${req.user.id}:${req.params.whatsappId}`
});

whatsappSessionRoutes.post(
  "/whatsappsession/:whatsappId",
  isAuth,
  requireRole("admin"),
  qrRateLimit,
  WhatsAppSessionController.store
);

whatsappSessionRoutes.put(
  "/whatsappsession/:whatsappId",
  isAuth,
  requireRole("admin"),
  qrRateLimit,
  WhatsAppSessionController.update
);

whatsappSessionRoutes.delete(
  "/whatsappsession/:whatsappId",
  isAuth,
  requireRole("admin"),
  WhatsAppSessionController.remove
);

export default whatsappSessionRoutes;
