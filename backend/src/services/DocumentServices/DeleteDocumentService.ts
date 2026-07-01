import SmartDocument from "../../models/SmartDocument";
import AppError from "../../errors/AppError";
import { deleteFileFromDropbox } from "../DropboxServices";
import { removeDocumentFile } from "./documentStorage";
import ShowDocumentService from "./ShowDocumentService";
import { hasCloudDocumentCopy } from "./documentStorageAvailability";
import {
  normalizeDocumentStatus,
  recordDocumentEvent
} from "./DocumentLifecycleService";

interface Request {
  documentId: string | number;
  userId: string;
  userProfile: string;
  deleteFromDropbox?: boolean;
}

const DeleteDocumentService = async ({
  documentId,
  userId,
  userProfile,
  deleteFromDropbox = false
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

  if (deleteFromDropbox && hasCloudDocumentCopy(document)) {
    const remotePath = document.externalStoragePath || document.storageFileId;
    if (remotePath) {
      try {
        await deleteFileFromDropbox(remotePath);
      } catch (_error) {
        throw new AppError(
          "No fue posible eliminar el archivo en Dropbox.",
          502
        );
      }
    }
  }

  await removeDocumentFile(document.storagePath);

  await recordDocumentEvent({
    documentId: document.id,
    userId,
    eventType: "deleted",
    previousStatus: normalizeDocumentStatus(document.status),
    metadata: {
      title: document.title,
      deleteFromDropbox
    }
  });

  await SmartDocument.destroy({ where: { id: document.id } });
};

export default DeleteDocumentService;
