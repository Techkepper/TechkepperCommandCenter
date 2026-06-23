import { Request, Response } from "express";
import { logger } from "../utils/logger";

const MAX_TEXT_LENGTH = 1000;

const sanitizeText = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  return value.slice(0, MAX_TEXT_LENGTH);
};

export const store = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const level = req.body?.level === "error" ? "error" : "warn";
  const payload = {
    source: "frontend",
    message: sanitizeText(req.body?.message) || "Frontend client log",
    name: sanitizeText(req.body?.name),
    stack: sanitizeText(req.body?.stack),
    componentStack: sanitizeText(req.body?.componentStack),
    url: sanitizeText(req.body?.url),
    userAgent: sanitizeText(req.body?.userAgent),
    status: req.body?.status,
    method: sanitizeText(req.body?.method),
    requestUrl: sanitizeText(req.body?.requestUrl),
    responseError: sanitizeText(req.body?.responseError)
  };

  logger[level](payload, "Frontend client error");

  return res.status(204).send();
};
