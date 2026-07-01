import { Request, Response } from "express";
import path from "path";

import AppError from "../errors/AppError";
import ListDocumentsService from "../services/DocumentServices/ListDocumentsService";
import CreateDocumentService from "../services/DocumentServices/CreateDocumentService";
import ShowDocumentService from "../services/DocumentServices/ShowDocumentService";
import DeleteDocumentService from "../services/DocumentServices/DeleteDocumentService";
import { resolveDocumentReadablePath } from "../services/DocumentServices/documentStorageRetention";
import ConvertDocumentToPdfService from "../services/DocumentServices/ConvertDocumentToPdfService";
import {
  listDocumentEvents,
  normalizeDocumentStatus,
  recordDocumentEvent,
  updateDocumentStatus
} from "../services/DocumentServices/DocumentLifecycleService";
import { listEligibleDocumentNotificationUsers } from "../services/DocumentServices/InternalDocumentNotificationService";
import UploadExistingDocumentService from "../services/DocumentServices/UploadExistingDocumentService";
import { serializeSmartDocument } from "../services/DocumentServices/documentSerialization";
import { updateDocumentStorageRetention } from "../services/DocumentServices/documentStorageRetention";

type IndexQuery = {
  searchParam?: string;
  pageNumber?: string;
  purpose?: string;
  status?: string;
};

const rethrowDocumentDbError = (err: Error): never => {
  const databaseError = err as Error & {
    original?: { code?: string };
    parent?: { code?: string };
  };
  const code = databaseError.original?.code || databaseError.parent?.code;

  if (code === "ER_NO_SUCH_TABLE" || code === "ER_BAD_FIELD_ERROR") {
    throw new AppError("ERR_SMART_DOCUMENTS_NOT_INSTALLED", 503);
  }

  throw err;
};

const sanitizeDownloadName = (name: string): string =>
  path.basename(name).replace(/[^\w.\- ()]/g, "_");

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber, purpose, status } = req.query as IndexQuery;

  try {
    const result = await ListDocumentsService({
      searchParam,
      pageNumber,
      purpose,
      status,
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
      purpose: req.body.purpose,
      tags: req.body.tags,
      contactId: req.body.contactId,
      ticketId: req.body.ticketId,
      queueId: req.body.queueId,
      ecosystemId: req.body.ecosystemId,
      userId: req.user.id,
      userProfile: req.user.profile
    });

    return res.status(201).json(await serializeSmartDocument(document));
  } catch (err) {
    return rethrowDocumentDbError(err);
  }
};

const uploadExisting = async (
  req: Request,
  res: Response,
  entityType: "businessClient" | "collaborator"
): Promise<Response> => {
  try {
    const entityId = Number(
      entityType === "businessClient"
        ? req.params.clientId
        : req.params.collaboratorId
    );
    if (!Number.isSafeInteger(entityId) || entityId <= 0) {
      throw new AppError("El expediente seleccionado no es válido.", 400);
    }
    const document = await UploadExistingDocumentService({
      file: req.file,
      title: req.body.title,
      documentType: req.body.documentType,
      status: req.body.status,
      documentDate: req.body.documentDate,
      comment: req.body.comment,
      actor: req.user,
      target: { entityType, entityId } as
        | { entityType: "businessClient"; entityId: number }
        | { entityType: "collaborator"; entityId: number }
    });
    return res.status(201).json(await serializeSmartDocument(document));
  } catch (err) {
    return rethrowDocumentDbError(err);
  }
};

export const uploadExistingForClient = (
  req: Request,
  res: Response
): Promise<Response> => uploadExisting(req, res, "businessClient");

export const uploadExistingForCollaborator = (
  req: Request,
  res: Response
): Promise<Response> => uploadExisting(req, res, "collaborator");

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { documentId } = req.params;

  try {
    const document = await ShowDocumentService({
      documentId,
      userId: req.user.id,
      userProfile: req.user.profile
    });

    return res.json(await serializeSmartDocument(document));
  } catch (err) {
    return rethrowDocumentDbError(err);
  }
};

export const download = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  const { documentId } = req.params;
  const requestedFormat = String(req.query.format || "original").toLowerCase();
  const canDownloadOriginal =
    req.user.profile === "admin" || req.user.profile === "supervisor";

  try {
    if (!canDownloadOriginal && requestedFormat !== "pdf") {
      throw new AppError(
        "Su perfil solo puede descargar documentos en formato PDF.",
        403
      );
    }

    const document = await ShowDocumentService({
      documentId,
      userId: req.user.id,
      userProfile: req.user.profile
    });
    const { filePath, cleanup } = await resolveDocumentReadablePath(document);

    res.setHeader("X-Content-Type-Options", "nosniff");

    try {
      if (requestedFormat === "pdf") {
        const pdf = await ConvertDocumentToPdfService({
          sourcePath: filePath,
          mimeType: document.mimeType
        });
        const pdfName = `${path.basename(
          document.originalName,
          path.extname(document.originalName)
        )}.pdf`;

        res.type("application/pdf");
        res.attachment(sanitizeDownloadName(pdfName));
        await recordDocumentEvent({
          documentId: document.id,
          userId: req.user.id,
          eventType: "downloaded_pdf",
          newStatus: normalizeDocumentStatus(document.status)
        });
        return res.send(pdf);
      }

      if (requestedFormat !== "original" && requestedFormat !== "docx") {
        throw new AppError(
          "El formato de descarga solicitado no es válido.",
          400
        );
      }

      if (
        requestedFormat === "docx" &&
        document.mimeType !==
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        throw new AppError(
          "Este documento no está disponible en formato DOCX.",
          400
        );
      }

      await recordDocumentEvent({
        documentId: document.id,
        userId: req.user.id,
        eventType: "downloaded_docx",
        newStatus: normalizeDocumentStatus(document.status)
      });
      return res.download(filePath, sanitizeDownloadName(document.originalName));
    } finally {
      if (cleanup) {
        await cleanup();
      }
    }
  } catch (err) {
    return rethrowDocumentDbError(err);
  }
};

export const events = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const history = await listDocumentEvents({
      documentId: req.params.documentId,
      userId: req.user.id,
      userProfile: req.user.profile
    });
    return res.json({ events: history });
  } catch (err) {
    return rethrowDocumentDbError(err);
  }
};

export const updateStatus = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const document = await updateDocumentStatus({
      documentId: req.params.documentId,
      newStatus: req.body.status,
      comment: req.body.comment,
      notificationUserIds: req.body.notificationUserIds,
      userId: req.user.id,
      userProfile: req.user.profile
    });
    return res.json(await serializeSmartDocument(document));
  } catch (err) {
    return rethrowDocumentDbError(err);
  }
};

export const updateStorageRetention = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const document = await updateDocumentStorageRetention({
      documentId: req.params.documentId,
      storageRetention: req.body.storageRetention,
      userId: req.user.id,
      userProfile: req.user.profile
    });
    return res.json(await serializeSmartDocument(document));
  } catch (err) {
    return rethrowDocumentDbError(err);
  }
};

export const notificationRecipients = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const document = await ShowDocumentService({
      documentId: req.params.documentId,
      userId: req.user.id,
      userProfile: req.user.profile
    });
    const users = await listEligibleDocumentNotificationUsers({
      document,
      searchParam: String(req.query.searchParam || "")
    });
    return res.json({
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        queues: user.queues?.map(queue => ({
          id: queue.id,
          name: queue.name
        }))
      }))
    });
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
