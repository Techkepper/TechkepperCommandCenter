import SmartDocument from "../../models/SmartDocument";
import AppError from "../../errors/AppError";
import { removeDocumentFile } from "./documentStorage";
import ShowDocumentService from "./ShowDocumentService";
import {
  normalizeDocumentStatus,
  recordDocumentEvent
} from "./DocumentLifecycleService";

interface Request {
  documentId: string | number;
  userId: string;
  userProfile: string;
}

const DeleteDocumentService = async ({
  documentId,
  userId,
  userProfile
}: Request): Promise<void> => {
  if (userProfile !== "admin" && userProfile !== "supervisor") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const document = await ShowDocumentService({
    documentId,
    userId,
    userProfile
  });

  if (userProfile !== "admin" && document.uploadedById !== Number(userId)) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  await recordDocumentEvent({
    documentId: document.id,
    userId,
    eventType: "deleted",
    previousStatus: normalizeDocumentStatus(document.status),
    metadata: { title: document.title }
  });
  await removeDocumentFile(document.storagePath);
  await SmartDocument.destroy({ where: { id: document.id } });
};

export default DeleteDocumentService;
