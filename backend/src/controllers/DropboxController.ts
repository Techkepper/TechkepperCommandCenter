import { Request, Response } from "express";

import ShowDocumentService from "../services/DocumentServices/ShowDocumentService";
import {
  generateDropboxOAuthUrl,
  getDropboxStatus,
  handleDropboxOAuthCallback,
  syncSmartDocumentToDropbox,
  validateDropboxConnection
} from "../services/DropboxServices";

export const oauthStart = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const url = await generateDropboxOAuthUrl(req.user.id);
  return res.json({ url });
};

export const oauthCallback = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await handleDropboxOAuthCallback({
    code: req.query.code,
    state: req.query.state
  });

  return res
    .status(200)
    .type("html")
    .send(
      '<!doctype html><html><head><meta charset="utf-8"><title>Dropbox conectado</title></head><body style="font-family: Arial, sans-serif; background:#071009; color:#f4f8f3; padding:32px;"><h1>Dropbox conectado correctamente</h1><p>Puede cerrar esta ventana y volver a Techkepper Command Center.</p></body></html>'
    );
};

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
  return res.json(reloadedDocument);
};
