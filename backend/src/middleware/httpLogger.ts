import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

const shouldSkip = (req: Request): boolean => req.url === "/favicon.ico";

const httpLogger = (req: Request, res: Response, next: NextFunction): void => {
  if (shouldSkip(req)) {
    next();
    return;
  }

  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const payload = {
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs),
      origin: req.headers.origin,
      ip: req.ip,
      userId: req.user?.id
    };
    const message = `${req.method} ${payload.path} ${res.statusCode} ${payload.durationMs}ms`;

    if (res.statusCode >= 500) {
      logger.error(payload, message);
      return;
    }

    if (res.statusCode >= 400) {
      logger.warn(payload, message);
      return;
    }

    if (req.method === "OPTIONS") {
      logger.debug(payload, message);
      return;
    }

    logger.info(payload, message);
  });

  next();
};

export default httpLogger;
