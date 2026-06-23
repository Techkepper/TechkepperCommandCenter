import { Router } from "express";
import * as ClientLogController from "../controllers/ClientLogController";
import { createRateLimiter } from "../middleware/rateLimit";

const clientLogRoutes = Router();

const clientLogRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120
});

clientLogRoutes.post(
  "/client-logs",
  clientLogRateLimit,
  ClientLogController.store
);

export default clientLogRoutes;
