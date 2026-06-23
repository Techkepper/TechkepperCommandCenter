import { Request, Response } from "express";
import path from "path";

import AppError from "../errors/AppError";
import ListDocumentsService from "../services/DocumentServices/ListDocumentsService";
import CreateDocumentService from "../services/DocumentServices/CreateDocumentService";
import ShowDocumentService from "../services/DocumentServices/ShowDocumentService";
import DeleteDocumentService from "../services/DocumentServices/DeleteDocumentService";
import { resolveDocumentPath } from "../services/DocumentServices/documentStorage";

type IndexQuery = {
  searchParam?: string;
  pageNumber?: string;
};

const rethrowDocumentDbError = (err: Error): never => {
  const databaseError = err as Error & {
    original?: { code?: string };
    parent?: { code?: string };
  };
  const code = databaseError.original?.code || databaseError.parent?.code;

  if (code === "ER_NO_SUCH_TABLE") {
    throw new AppError("ERR_SMART_DOCUMENTS_NOT_INSTALLED", 503);
  }

  throw err;
};

const sanitizeDownloadName = (name: string): string =>
  path.basename(name).replace(/[^\w.\- ()]/g, "_");

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  try {
    const result = await ListDocumentsService({
      searchParam,
      pageNumber,
      userId: req.user.id,
      userProfile: req.user.profile
    });

    return res.json(result);
  } catch (err) {
    return rethrowDocumentDbError(err);
  }
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  try {
    const document = await CreateDocumentService({
      file: req.file,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      tags: req.body.tags,
      contactId: req.body.contactId,
      ticketId: req.body.ticketId,
      queueId: req.body.queueId,
      ecosystemId: req.body.ecosystemId,
      userId: req.user.id,
      userProfile: req.user.profile
    });

    return res.status(201).json(document);
  } catch (err) {
    return rethrowDocumentDbError(err);
  }
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { documentId } = req.params;

  try {
    const document = await ShowDocumentService({
      documentId,
      userId: req.user.id,
      userProfile: req.user.profile
    });

    return res.json(document);
  } catch (err) {
    return rethrowDocumentDbError(err);
  }
};

export const download = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  const { documentId } = req.params;

  try {
    const document = await ShowDocumentService({
      documentId,
      userId: req.user.id,
      userProfile: req.user.profile
    });
    const filePath = resolveDocumentPath(document.storagePath);

    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.download(filePath, sanitizeDownloadName(document.originalName));
  } catch (err) {
    return rethrowDocumentDbError(err);
  }
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { documentId } = req.params;

  try {
    await DeleteDocumentService({
      documentId,
      userId: req.user.id,
      userProfile: req.user.profile
    });

    return res.status(200).json({ message: "Documento eliminado" });
  } catch (err) {
    return rethrowDocumentDbError(err);
  }
};
