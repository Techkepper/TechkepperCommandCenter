import sequelize from "../../database";
import AppError from "../../errors/AppError";
import BusinessClientDocument from "../../models/BusinessClientDocument";
import CollaboratorDocument from "../../models/CollaboratorDocument";
import SmartDocument from "../../models/SmartDocument";
import ShowBusinessClientService from "../BusinessClientServices/ShowBusinessClientService";
import { ensureBusinessClientQueueWriteAccess } from "../BusinessClientServices/businessClientHelpers";
import { showCollaborator } from "../CollaboratorServices";
import {
  isDocumentStatus,
  recordDocumentEvent
} from "./DocumentLifecycleService";
import { removeDocumentFile, saveDocumentBuffer } from "./documentStorage";
import { syncSmartDocumentToDropbox } from "../DropboxServices";

type Actor = { id: string; profile: string };
type EntityTarget =
  | { entityType: "businessClient"; entityId: number }
  | { entityType: "collaborator"; entityId: number };

interface Request {
  file?: Express.Multer.File;
  title?: string;
  documentType?: string;
  status?: string;
  documentDate?: string;
  comment?: string;
  actor: Actor;
  target: EntityTarget;
}

const purposeByDocumentType: Record<string, string> = {
  contract_active: "contracts",
  contract_addendum: "contracts",
  nda: "nda",
  quotation_proposal: "quotations",
  legal_document: "other",
  commercial_document: "other",
  internal_document: "other",
  other: "other"
};

const allowedDocumentTypes = Object.keys(purposeByDocumentType);

const UploadExistingDocumentService = async ({
  file,
  title,
  documentType = "other",
  status = "generated",
  documentDate,
  comment,
  actor,
  target
}: Request): Promise<SmartDocument> => {
  if (actor.profile !== "admin" && actor.profile !== "supervisor") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  if (!file) throw new AppError("Seleccione el archivo que desea subir.", 400);
  if (!allowedDocumentTypes.includes(documentType)) {
    throw new AppError("El tipo documental seleccionado no es válido.", 400);
  }
  if (!isDocumentStatus(status)) {
    throw new AppError("El estado documental seleccionado no es válido.", 400);
  }
  if (documentDate && !/^\d{4}-\d{2}-\d{2}$/.test(documentDate)) {
    throw new AppError("La fecha del documento no es válida.", 400);
  }

  let queueId: number | null = null;
  if (target.entityType === "businessClient") {
    const client = await ShowBusinessClientService({
      clientId: target.entityId,
      actor
    });
    await ensureBusinessClientQueueWriteAccess(actor, client.queueId);
    queueId = client.queueId;
  } else {
    const collaborator = await showCollaborator(target.entityId, actor);
    queueId = collaborator.queueId;
  }

  const storedFile = await saveDocumentBuffer(
    file.buffer,
    file.mimetype,
    "documents"
  );

  try {
    const documentId = await sequelize.transaction(async transaction => {
      const document = await SmartDocument.create(
        {
          title: title?.trim() || file.originalname,
          description: comment?.trim() || null,
          originalName: file.originalname,
          storedName: storedFile.storedName,
          storagePath: storedFile.storagePath,
          mimeType: file.mimetype,
          size: file.size,
          category: documentType,
          purpose: purposeByDocumentType[documentType],
          status,
          documentDate: documentDate || null,
          tags: "origen:expediente;preexistente:true",
          uploadedById: Number(actor.id),
          contactId: null,
          ticketId: null,
          queueId,
          ecosystemId: null,
          baseDocumentId: null
        } as unknown as SmartDocument,
        { transaction }
      );

      if (target.entityType === "businessClient") {
        await BusinessClientDocument.findOrCreate({
          where: { documentId: document.id },
          defaults: {
            documentId: document.id,
            businessClientId: target.entityId,
            linkedById: Number(actor.id)
          } as unknown as BusinessClientDocument,
          transaction
        });
      } else {
        await CollaboratorDocument.findOrCreate({
          where: { documentId: document.id },
          defaults: {
            documentId: document.id,
            collaboratorId: target.entityId,
            linkedById: Number(actor.id)
          } as unknown as CollaboratorDocument,
          transaction
        });
      }

      await recordDocumentEvent({
        documentId: document.id,
        userId: actor.id,
        eventType: "uploaded_existing_document",
        newStatus: status,
        comment,
        metadata: {
          documentType,
          documentDate: documentDate || null
        },
        transaction
      });
      await recordDocumentEvent({
        documentId: document.id,
        userId: actor.id,
        eventType:
          target.entityType === "businessClient"
            ? "associated_client"
            : "associated_collaborator",
        newStatus: status,
        metadata:
          target.entityType === "businessClient"
            ? { businessClientId: target.entityId }
            : { collaboratorId: target.entityId },
        transaction
      });
      return document.id;
    });

    const document = await SmartDocument.findByPk(documentId, {
      include: ["uploadedBy", "queue"]
    });
    if (!document)
      throw new AppError("No fue posible cargar el documento.", 500);
    await syncSmartDocumentToDropbox({
      documentId: document.id,
      userId: actor.id,
      preferredFolder:
        target.entityType === "businessClient" ? "clients" : "collaborators"
    });
    return document.reload({
      include: ["uploadedBy", "queue"]
    });
  } catch (error) {
    await removeDocumentFile(storedFile.storagePath);
    throw error;
  }
};

export default UploadExistingDocumentService;
