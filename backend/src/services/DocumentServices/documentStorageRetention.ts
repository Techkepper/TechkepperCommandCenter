import fs from "fs";
import os from "os";
import path from "path";

import AppError from "../../errors/AppError";
import SmartDocument from "../../models/SmartDocument";
import {
  deleteFileFromDropbox,
  downloadFileFromDropbox,
  isDropboxEnabled,
  syncSmartDocumentToDropbox
} from "../DropboxServices";
import {
  normalizeDocumentStatus,
  recordDocumentEvent
} from "./DocumentLifecycleService";
import {
  hasCloudDocumentCopy,
  hasLocalDocumentFile
} from "./documentStorageAvailability";
import { removeDocumentFile, resolveDocumentPath } from "./documentStorage";
import ShowDocumentService from "./ShowDocumentService";

export const storageRetentionModes = [
  "local_and_cloud",
  "local_only",
  "cloud_only"
] as const;

export type StorageRetentionMode = (typeof storageRetentionModes)[number];

export const isStorageRetentionMode = (
  value: unknown
): value is StorageRetentionMode =>
  typeof value === "string" &&
  storageRetentionModes.includes(value as StorageRetentionMode);

const reloadDocument = async (documentId: number): Promise<SmartDocument> => {
  const document = await SmartDocument.findByPk(documentId);
  if (!document) {
    throw new AppError("ERR_NO_DOCUMENT_FOUND", 404);
  }
  return document;
};

export const restoreLocalDocumentFromDropbox = async (
  document: SmartDocument
): Promise<void> => {
  const remotePath = document.externalStoragePath || document.storageFileId;
  if (!remotePath) {
    throw new AppError(
      "No hay una copia en Dropbox disponible para restaurar el archivo local.",
      409
    );
  }

  const buffer = await downloadFileFromDropbox(remotePath);
  const outputPath = resolveDocumentPath(document.storagePath);
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.promises.writeFile(outputPath, buffer);
};

export const removeLocalDocumentCopy = async (
  document: SmartDocument
): Promise<void> => {
  await removeDocumentFile(document.storagePath);
};

export const removeCloudDocumentCopy = async (
  document: SmartDocument
): Promise<void> => {
  const remotePath = document.externalStoragePath || document.storageFileId;
  if (!remotePath) return;

  await deleteFileFromDropbox(remotePath);
  await document.update({
    storageProvider: "local",
    storageStatus: "pending",
    storageFileId: null,
    externalStoragePath: null,
    storageSyncedAt: null
  });
};

export const applyCloudOnlyRetention = async (
  document: SmartDocument
): Promise<void> => {
  if (document.storageRetention !== "cloud_only") return;
  if (!(await hasCloudDocumentCopy(document))) {
    throw new AppError(
      "No se puede dejar solo en la nube sin una copia sincronizada en Dropbox.",
      409
    );
  }
  if (await hasLocalDocumentFile(document.storagePath)) {
    await removeLocalDocumentCopy(document);
  }
};

export const resolveDocumentReadablePath = async (
  document: SmartDocument
): Promise<{ filePath: string; cleanup?: () => Promise<void> }> => {
  if (await hasLocalDocumentFile(document.storagePath)) {
    return { filePath: resolveDocumentPath(document.storagePath) };
  }

  const remotePath = document.externalStoragePath || document.storageFileId;
  if (!remotePath) {
    throw new AppError("ERR_NO_DOCUMENT_FILE", 404);
  }

  const buffer = await downloadFileFromDropbox(remotePath);
  const extension = path.extname(document.originalName || document.storedName);
  const tempPath = path.join(
    os.tmpdir(),
    `smart-document-${document.id}-${Date.now()}${extension || ""}`
  );
  await fs.promises.writeFile(tempPath, buffer);

  return {
    filePath: tempPath,
    cleanup: async () => {
      await fs.promises.unlink(tempPath).catch(() => undefined);
    }
  };
};

export const updateDocumentStorageRetention = async ({
  documentId,
  storageRetention,
  userId,
  userProfile
}: {
  documentId: string | number;
  storageRetention: string;
  userId: string;
  userProfile: string;
}): Promise<SmartDocument> => {
  if (userProfile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  if (!isStorageRetentionMode(storageRetention)) {
    throw new AppError(
      "La política de almacenamiento seleccionada no es válida.",
      400
    );
  }

  let document = await ShowDocumentService({
    documentId,
    userId,
    userProfile
  });
  const previousRetention = document.storageRetention || "local_and_cloud";

  if (previousRetention === storageRetention) {
    return document;
  }

  const dropboxAvailable = isDropboxEnabled();
  if (
    (storageRetention === "cloud_only" ||
      storageRetention === "local_and_cloud") &&
    !dropboxAvailable
  ) {
    throw new AppError(
      "Dropbox no está habilitado. Solo puede usar almacenamiento local.",
      409
    );
  }

  await document.update({ storageRetention });
  document = await reloadDocument(document.id);

  if (storageRetention === "local_only" && hasCloudDocumentCopy(document)) {
    await removeCloudDocumentCopy(document);
    document = await reloadDocument(document.id);
  }

  if (
    (storageRetention === "cloud_only" ||
      storageRetention === "local_and_cloud") &&
    !hasCloudDocumentCopy(document)
  ) {
    await syncSmartDocumentToDropbox({
      documentId: document.id,
      userId
    });
    document = await reloadDocument(document.id);
  }

  if (storageRetention === "local_and_cloud") {
    if (!(await hasLocalDocumentFile(document.storagePath))) {
      await restoreLocalDocumentFromDropbox(document);
    }
  }

  if (storageRetention === "cloud_only") {
    await applyCloudOnlyRetention(document);
  }

  await recordDocumentEvent({
    documentId: document.id,
    userId,
    eventType: "storage_retention_changed",
    newStatus: normalizeDocumentStatus(document.status),
    metadata: {
      storageRetention,
      previousRetention
    }
  });

  return reloadDocument(document.id);
};
