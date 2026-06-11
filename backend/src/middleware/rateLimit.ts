import { NextFunction, Request, Response } from "express";
import AppError from "../errors/AppError";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export const createRateLimiter = ({
  windowMs,
  max,
  keyGenerator = req => req.ip || req.socket.remoteAddress || "unknown"
}: RateLimitOptions) => {
  const entries = new Map<string, RateLimitEntry>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = keyGenerator(req);

    if (!entries.has(key) && entries.size >= 5000) {
      entries.forEach((value, entryKey) => {
        if (value.resetAt <= now) entries.delete(entryKey);
      });
      while (entries.size >= 5000) {
        const oldestKey = entries.keys().next().value;
        if (oldestKey === undefined) break;
        entries.delete(oldestKey);
      }
    }

    const existing = entries.get(key);
    const entry =
      !existing || existing.resetAt <= now
        ? { count: 0, resetAt: now + windowMs }
        : existing;

    entry.count += 1;
    entries.set(key, entry);

    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader(
      "RateLimit-Remaining",
      String(Math.max(0, max - entry.count))
    );
    res.setHeader(
      "RateLimit-Reset",
      String(Math.ceil(entry.resetAt / 1000))
    );

    if (entry.count > max) {
      res.setHeader(
        "Retry-After",
        String(Math.ceil((entry.resetAt - now) / 1000))
      );
      throw new AppError("ERR_TOO_MANY_REQUESTS", 429);
    }

    next();
  };
};
