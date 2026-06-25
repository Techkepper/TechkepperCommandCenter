import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";

import AppError from "../../errors/AppError";

const storageRoot = path.resolve(
  process.env.SMART_DOCUMENTS_STORAGE_PATH ||
    path.resolve(__dirname, "..", "..", "..", "storage", "smart-documents")
);

const allowedMimeTypes: Record<string, string> = {
  "application/pdf": ".pdf",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    ".pptx",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

export const maxDocumentSize = 20 * 1024 * 1024;

export const getDocumentExtension = (mimeType: string): string | null =>
  allowedMimeTypes[mimeType.toLowerCase()] || null;

export const resolveDocumentPath = (relativePath: string): string => {
  const resolved = path.resolve(storageRoot, relativePath);
  if (
    resolved !== storageRoot &&
    !resolved.startsWith(`${storageRoot}${path.sep}`)
  ) {
    throw new AppError("ERR_INVALID_DOCUMENT_PATH", 400);
  }
  return resolved;
};

export const saveDocumentBuffer = async (
  buffer: Buffer,
  mimeType: string,
  namespace = ""
): Promise<{ storedName: string; storagePath: string }> => {
  const extension = getDocumentExtension(mimeType);
  if (!extension) {
    throw new AppError("ERR_UNSUPPORTED_DOCUMENT_TYPE", 415);
  }

  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const storedName = `${randomBytes(24).toString("hex")}${extension}`;
  const storagePath = path
    .join(namespace, year, month, storedName)
    .replace(/\\/g, "/");
  const outputPath = resolveDocumentPath(storagePath);

  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.promises.writeFile(outputPath, buffer, { flag: "wx" });

  return { storedName, storagePath };
};

export const removeDocumentFile = async (
  relativePath: string
): Promise<void> => {
  try {
    await fs.promises.unlink(resolveDocumentPath(relativePath));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
  }
};
