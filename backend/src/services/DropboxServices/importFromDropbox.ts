import path from "path";
import { Op } from "sequelize";

import AppError from "../../errors/AppError";
import SmartDocument from "../../models/SmartDocument";
import { logger } from "../../utils/logger";
import {
  getDocumentExtension,
  maxDocumentSize,
  removeDocumentFile,
  saveDocumentBuffer
} from "../DocumentServices/documentStorage";
import { recordDocumentEvent } from "../DocumentServices/DocumentLifecycleService";
import { isDocumentPurpose } from "../DocumentServices/documentTaxonomy";
import {
  downloadFileFromDropbox,
  dropboxProvider,
  DropboxRemoteFile,
  ensureEnvConfig,
  isDropboxEnabled,
  listDropboxFilesRecursive
} from "./index";

const dropboxImportRoot = "/TechkepperCommandCenter";

export type DropboxImportResult = {
  scanned: number;
  imported: number;
  skipped: number;
  failed: number;
  documents: SmartDocument[];
  errors: Array<{ path: string; message: string }>;
};

const mimeByExtension: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".ppt": "application/vnd.ms-powerpoint",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

const resolveMimeType = (fileName: string): string | null => {
  const extension = path.extname(fileName).toLowerCase();
  const mimeType = mimeByExtension[extension];
  if (!mimeType || !getDocumentExtension(mimeType)) return null;
  return mimeType;
};

const resolveStorageNamespace = (dropboxPath: string): string =>
  dropboxPath.includes("/generated/") ? "generated" : "documents";

const resolveOriginalName = (fileName: string): string => {
  const withoutPrefix = fileName.replace(/^\d+-/, "");
  return withoutPrefix || fileName;
};

const resolvePurpose = (dropboxPath: string, fileName: string): string => {
  const normalizedPath = dropboxPath.toLowerCase();
  const normalizedName = fileName.toLowerCase();

  if (normalizedPath.includes("/documents/proposals")) return "quotations";
  if (normalizedPath.includes("/documents/collaborators")) return "other";
  if (normalizedPath.includes("/documents/clients")) return "contracts";
  if (normalizedName.includes("prop-") || normalizedName.includes("prop_")) {
    return "quotations";
  }
  if (normalizedName.includes("nda")) return "nda";
  if (
    normalizedName.includes("contrato") ||
    normalizedName.includes("contract") ||
    normalizedName.includes("addendum") ||
    normalizedName.includes("adenda")
  ) {
    return "contracts";
  }
  return "other";
};

const resolveCategory = (fileName: string, purpose: string): string | null => {
  const normalizedName = fileName.toLowerCase();
  if (normalizedName.includes("nda")) return "nda";
  if (normalizedName.includes("prop-") || normalizedName.includes("prop_")) {
    return "quotation_proposal";
  }
  if (normalizedName.includes("contrato") || normalizedName.includes("contract")) {
    return "contract_active";
  }
  if (purpose === "quotations") return "quotation_proposal";
  if (purpose === "contracts") return "contract_active";
  return "other";
};

const resolveTitle = (originalName: string): string =>
  path.basename(originalName, path.extname(originalName));

const findExistingImportedDocument = async (
  entry: DropboxRemoteFile
): Promise<SmartDocument | null> =>
  SmartDocument.findOne({
    where: {
      [Op.or]: [
        { storageFileId: entry.id },
        { externalStoragePath: entry.path_display }
      ]
    }
  });

const importDropboxFile = async ({
  entry,
  userId
}: {
  entry: DropboxRemoteFile;
  userId: number;
}): Promise<SmartDocument | null> => {
  const existing = await findExistingImportedDocument(entry);
  if (existing) return null;

  if (entry.size > maxDocumentSize) {
    throw new AppError("ERR_DROPBOX_IMPORT_FILE_TOO_LARGE", 413);
  }

  const mimeType = resolveMimeType(entry.name);
  if (!mimeType) {
    throw new AppError("ERR_UNSUPPORTED_DOCUMENT_TYPE", 415);
  }

  const buffer = await downloadFileFromDropbox(entry.path_display);
  const namespace = resolveStorageNamespace(entry.path_display);
  const storedFile = await saveDocumentBuffer(buffer, mimeType, namespace);
  const originalName = resolveOriginalName(entry.name);
  const purpose = resolvePurpose(entry.path_display, entry.name);
  const normalizedPurpose = isDocumentPurpose(purpose) ? purpose : "other";
  const syncedAt = entry.client_modified
    ? new Date(entry.client_modified)
    : new Date();

  try {
    const document = await SmartDocument.create({
      title: resolveTitle(originalName),
      description: null,
      originalName,
      storedName: storedFile.storedName,
      storagePath: storedFile.storagePath,
      storageProvider: dropboxProvider,
      storageFileId: entry.id,
      externalStoragePath: entry.path_display,
      storageSyncedAt: syncedAt,
      storageStatus: "synced",
      mimeType,
      size: entry.size,
      category: resolveCategory(entry.name, normalizedPurpose),
      purpose: normalizedPurpose,
      status: "generated",
      documentDate: null,
      tags: "origen:dropbox;importado:true",
      uploadedById: userId,
      contactId: null,
      ticketId: null,
      queueId: null,
      ecosystemId: null,
      baseDocumentId: null
    } as unknown as SmartDocument);

    await recordDocumentEvent({
      documentId: document.id,
      userId,
      eventType: "imported_from_dropbox",
      newStatus: "generated",
      metadata: {
        provider: dropboxProvider,
        externalStoragePath: entry.path_display,
        storageFileId: entry.id
      }
    });

    return document.reload({ include: ["uploadedBy"] });
  } catch (error) {
    await removeDocumentFile(storedFile.storagePath);
    throw error;
  }
};

export const importDocumentsFromDropbox = async (
  userId: number
): Promise<DropboxImportResult> => {
  if (!isDropboxEnabled()) {
    throw new AppError(
      "La integración con Dropbox no está habilitada en el servidor.",
      409
    );
  }
  ensureEnvConfig();

  const entries = await listDropboxFilesRecursive(dropboxImportRoot);

  const result: DropboxImportResult = {
    scanned: entries.length,
    imported: 0,
    skipped: 0,
    failed: 0,
    documents: [],
    errors: []
  };

  await entries.reduce(
    (previous, entry) =>
      previous.then(async () => {
        try {
          const existing = await findExistingImportedDocument(entry);
          if (existing) {
            result.skipped += 1;
            return;
          }

          const document = await importDropboxFile({ entry, userId });
          if (!document) {
            result.skipped += 1;
            return;
          }
          result.imported += 1;
          result.documents.push(document);
        } catch (error) {
          result.failed += 1;
          const message =
            error instanceof AppError
              ? error.message
              : "No fue posible importar el archivo.";
          result.errors.push({ path: entry.path_display, message });
          logger.warn(
            {
              provider: dropboxProvider,
              path: entry.path_display,
              errorName: (error as Error).name
            },
            "Dropbox import file failed"
          );
        }
      }),
    Promise.resolve()
  );

  logger.info(
    {
      provider: dropboxProvider,
      scanned: result.scanned,
      imported: result.imported,
      skipped: result.skipped,
      failed: result.failed
    },
    "Dropbox import finished"
  );

  return result;
};
