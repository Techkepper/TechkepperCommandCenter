import { Request, Response } from "express";

import AppError from "../errors/AppError";
import {
  listBusinessClientDocuments,
  listDocumentClientLinks,
  setDocumentBusinessClient
} from "../services/DocumentServices/BusinessClientDocumentService";

export const links = async (req: Request, res: Response): Promise<Response> => {
  const ids = String(req.query.documentIds || "")
    .split(",")
    .map(value => Number(value))
    .filter(value => Number.isInteger(value) && value > 0)
    .slice(0, 100);
  const result = await listDocumentClientLinks(ids, req.user);
  return res.json(result);
};

export const clientDocuments = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const result = await listBusinessClientDocuments(
    Number(req.params.clientId),
    req.user
  );
  return res.json(result);
};

export const updateLink = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const rawClientId = req.body.businessClientId;
  const businessClientId =
    rawClientId === null || rawClientId === "" ? null : Number(rawClientId);
  if (
    businessClientId !== null &&
    (!Number.isInteger(businessClientId) || businessClientId <= 0)
  ) {
    throw new AppError("ERR_INVALID_BUSINESS_CLIENT_ID", 400);
  }

  const result = await setDocumentBusinessClient({
    documentId: Number(req.params.documentId),
    businessClientId,
    actor: req.user
  });
  return res.json(result);
};
