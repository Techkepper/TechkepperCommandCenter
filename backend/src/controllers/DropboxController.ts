import { Request, Response } from "express";

import ShowDocumentService from "../services/DocumentServices/ShowDocumentService";
import { serializeSmartDocument } from "../services/DocumentServices/documentSerialization";
import {
  getDropboxStatus,
  syncSmartDocumentToDropbox,
  validateDropboxConnection
} from "../services/DropboxServices";
import { importDocumentsFromDropbox } from "../services/DropboxServices/importFromDropbox";

export const status = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  const result = await getDropboxStatus();
  return res.json(result);
};

export const validate = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  const result = await validateDropboxConnection();
  return res.json(result);
};

export const retryDocumentSync = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const document = await ShowDocumentService({
    documentId: req.params.documentId,
    userId: req.user.id,
    userProfile: req.user.profile
  });
  await syncSmartDocumentToDropbox({
    documentId: document.id,
    userId: req.user.id
  });
  const reloadedDocument = await ShowDocumentService({
    documentId: req.params.documentId,
    userId: req.user.id,
    userProfile: req.user.profile
  });
  return res.json(await serializeSmartDocument(reloadedDocument));
};

export const importFromDropbox = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const result = await importDocumentsFromDropbox(Number(req.user.id));
  return res.json(result);
};
