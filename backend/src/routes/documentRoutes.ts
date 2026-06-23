import express from "express";
import multer from "multer";

import isAuth from "../middleware/isAuth";
import * as DocumentController from "../controllers/DocumentController";
import {
  getDocumentExtension,
  maxDocumentSize
} from "../services/DocumentServices/documentStorage";

const documentRoutes = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxDocumentSize,
    files: 1,
    fields: 12
  },
  fileFilter(_req, file, cb) {
    if (!getDocumentExtension(file.mimetype)) {
      cb(new Error("ERR_UNSUPPORTED_DOCUMENT_TYPE"));
      return;
    }
    cb(null, true);
  }
});

documentRoutes.get("/documents", isAuth, DocumentController.index);

documentRoutes.post(
  "/documents",
  isAuth,
  upload.single("file"),
  DocumentController.store
);

documentRoutes.get("/documents/:documentId", isAuth, DocumentController.show);

documentRoutes.get(
  "/documents/:documentId/download",
  isAuth,
  DocumentController.download
);

documentRoutes.delete(
  "/documents/:documentId",
  isAuth,
  DocumentController.remove
);

export default documentRoutes;
