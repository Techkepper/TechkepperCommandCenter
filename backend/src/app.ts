import "./bootstrap";
import "reflect-metadata";
import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import * as Sentry from "@sentry/node";

import "./database";
import uploadConfig from "./config/upload";
import AppError from "./errors/AppError";
import routes from "./routes";
import { logger } from "./utils/logger";
import ValidateSecurityConfig from "./helpers/ValidateSecurityConfig";
import whatsappWebhookRoutes from "./routes/whatsappWebhookRoutes";
import { isAllowedOrigin } from "./config/allowedOrigins";

Sentry.init({ dsn: process.env.SENTRY_DSN });
ValidateSecurityConfig();

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);

app.use(
  cors({
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Authorization",
      "Content-Type",
      "ngrok-skip-browser-warning"
    ],
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, origin || true);
        return;
      }
      callback(new AppError("ERR_CORS_ORIGIN_NOT_ALLOWED", 403));
    }
  })
);
app.use(cookieParser());
app.use("/webhooks/whatsapp", whatsappWebhookRoutes);
app.use(express.json({ limit: "2mb" }));
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
  );
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
  );
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  next();
});
app.use("/auth", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("Pragma", "no-cache");
  next();
});
app.use(Sentry.Handlers.requestHandler());
app.use(
  "/public",
  express.static(uploadConfig.directory, {
    dotfiles: "deny",
    index: false,
    setHeaders: res => {
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
    }
  })
);
app.use(routes);

app.use(Sentry.Handlers.errorHandler());

const getRequestLogContext = (req: Request, statusCode?: number) => ({
  method: req.method,
  path: req.originalUrl || req.path,
  statusCode,
  userId: req.user?.id,
  ip: req.ip
});

app.use(async (err: Error, req: Request, res: Response, _: NextFunction) => {
  if (err instanceof AppError) {
    if (err.message === "ERR_SESSION_EXPIRED" && err.statusCode === 401) {
      logger.debug(
        getRequestLogContext(req, err.statusCode),
        "Rejected expired or missing session"
      );
      return res.status(err.statusCode).json({ error: err.message });
    }

    logger.warn(
      { err, ...getRequestLogContext(req, err.statusCode) },
      "Handled application error"
    );
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof multer.MulterError) {
    logger.warn(
      { err, code: err.code, ...getRequestLogContext(req) },
      "Rejected media upload"
    );
    return res.status(err.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({
      error:
        err.code === "LIMIT_FILE_SIZE"
          ? "ERR_MEDIA_TOO_LARGE"
          : "ERR_INVALID_MEDIA"
    });
  }

  if (err.message === "ERR_UNSUPPORTED_MEDIA_TYPE") {
    return res.status(415).json({ error: err.message });
  }

  logger.error(
    { err, ...getRequestLogContext(req, 500) },
    "Unhandled server error"
  );
  return res.status(500).json({ error: "Internal server error" });
});

export default app;
