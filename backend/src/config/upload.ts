import path from "path";
import multer from "multer";
import { randomBytes } from "crypto";

const publicFolder = path.resolve(__dirname, "..", "..", "public");

const mediaExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/mp4": ".m4a",
  "audio/ogg": ".ogg",
  "audio/webm": ".webm",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
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
    ".pptx"
};

export const getExtensionForMimeType = (mimetype: string): string | null =>
  mediaExtensions[mimetype.toLowerCase()] || null;

export default {
  directory: publicFolder,
  limits: {
    fileSize: 16 * 1024 * 1024,
    files: 10,
    fields: 20
  },
  fileFilter(
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) {
    if (!getExtensionForMimeType(file.mimetype)) {
      cb(new Error("ERR_UNSUPPORTED_MEDIA_TYPE"));
      return;
    }
    cb(null, true);
  },

  storage: multer.diskStorage({
    destination: publicFolder,
    filename(_req, file, cb) {
      const extension = getExtensionForMimeType(file.mimetype);
      if (!extension) {
        cb(new Error("ERR_UNSUPPORTED_MEDIA_TYPE"), "");
        return;
      }
      cb(null, `${randomBytes(20).toString("hex")}${extension}`);
    }
  })
};
