import express from "express";
import multer from "multer";

import isAuth from "../middleware/isAuth";
import * as DocumentController from "../controllers/DocumentController";
import * as DocumentTemplateController from "../controllers/DocumentTemplateController";
import * as BusinessClientDocumentController from "../controllers/BusinessClientDocumentController";
import requireRole from "../middleware/requireRole";
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
documentRoutes.get(
  "/document-business-client-links",
  isAuth,
  BusinessClientDocumentController.links
);
documentRoutes.get(
  "/business-clients/:clientId/documents",
  isAuth,
  BusinessClientDocumentController.clientDocuments
);
documentRoutes.put(
  "/documents/:documentId/business-client",
  isAuth,
  requireRole("admin", "supervisor"),
  BusinessClientDocumentController.updateLink
);

documentRoutes.get(
  "/document-templates",
  isAuth,
  DocumentTemplateController.index
);

documentRoutes.post(
  "/document-templates",
  isAuth,
  upload.single("file"),
  DocumentTemplateController.store
);

documentRoutes.get(
  "/document-templates/:templateId",
  isAuth,
  DocumentTemplateController.show
);

documentRoutes.post(
  "/document-templates/:templateId/generate",
  isAuth,
  DocumentTemplateController.generate
);

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
