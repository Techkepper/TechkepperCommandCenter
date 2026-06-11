import { Router, raw } from "express";
import {
  receive,
  verify
} from "../controllers/WhatsAppWebhookController";
import { createRateLimiter } from "../middleware/rateLimit";

const whatsappWebhookRoutes = Router();
const webhookRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 600
});

whatsappWebhookRoutes.get("/", webhookRateLimit, verify);
whatsappWebhookRoutes.post(
  "/",
  webhookRateLimit,
  raw({ type: "application/json", limit: "2mb" }),
  receive
);

export default whatsappWebhookRoutes;
