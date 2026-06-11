import { Router } from "express";
import * as SessionController from "../controllers/SessionController";
import isAuth from "../middleware/isAuth";
import { createRateLimiter } from "../middleware/rateLimit";

const authRoutes = Router();

const loginRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: req =>
    `${req.ip}:${String(req.body?.email || "").trim().toLowerCase()}`
});
const refreshRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60
});

authRoutes.post("/login", loginRateLimit, SessionController.store);

authRoutes.post(
  "/refresh_token",
  refreshRateLimit,
  SessionController.update
);

authRoutes.delete("/logout", isAuth, SessionController.remove);

export default authRoutes;
