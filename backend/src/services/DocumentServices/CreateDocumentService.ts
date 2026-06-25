import AppError from "../../errors/AppError";
import Ecosystem from "../../models/Ecosystem";
import Queue from "../../models/Queue";
import SmartDocument from "../../models/SmartDocument";
import { removeDocumentFile, saveDocumentBuffer } from "./documentStorage";
import { ensureDocumentWriteAccess } from "./documentPermissions";
import { isDocumentPurpose } from "./documentTaxonomy";
import { normalizeOptionalDocumentId } from "./documentIds";
import { recordDocumentEvent } from "./DocumentLifecycleService";

interface Request {
  file?: Express.Multer.File;
  title?: string;
  description?: string;
  category?: string;
  purpose?: string;
  tags?: string;
  contactId?: number | null;
  ticketId?: number | null;
  queueId?: number | null;
  ecosystemId?: number | null;
  userId: string;
  userProfile: string;
}

const CreateDocumentService = async ({
  file,
  title,
  description,
  category,
  purpose,
  tags,
  contactId,
  ticketId,
  queueId,
  ecosystemId,
  userId,
  userProfile
}: Request): Promise<SmartDocument> => {
  if (userProfile !== "admin" && userProfile !== "supervisor") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  if (!file) {
    throw new AppError("ERR_DOCUMENT_FILE_REQUIRED", 400);
  }

  const normalizedPurpose = isDocumentPurpose(purpose) ? purpose : "other";
  const normalizedQueueId = normalizeOptionalDocumentId(
    queueId,
    "El departamento seleccionado"
  );
  const normalizedTicketId = normalizeOptionalDocumentId(
    ticketId,
    "La conversación seleccionada"
  );
  const normalizedEcosystemId = normalizeOptionalDocumentId(
    ecosystemId,
    "El ecosistema seleccionado"
  );
  const normalizedContactId = normalizeOptionalDocumentId(
    contactId,
    "El contacto seleccionado"
  );
  if (normalizedQueueId) {
    const queue = await Queue.findByPk(normalizedQueueId, {
      attributes: ["id"]
    });
    if (!queue) {
      throw new AppError("El departamento seleccionado no existe.", 400);
    }
  }
  if (normalizedEcosystemId) {
    const ecosystem = await Ecosystem.findByPk(normalizedEcosystemId, {
      attributes: ["id"]
    });
    if (!ecosystem) {
      throw new AppError("El ecosistema seleccionado no existe.", 400);
    }
  }

  await ensureDocumentWriteAccess(
    { queueId: normalizedQueueId, ticketId: normalizedTicketId },
    { id: userId, profile: userProfile }
  );

  const { storedName, storagePath } = await saveDocumentBuffer(
    file.buffer,
    file.mimetype,
    "documents"
  );

  const documentData = {
    title: title?.trim() || file.originalname,
    description: description?.trim() || null,
    originalName: file.originalname,
    storedName,
    storagePath,
    mimeType: file.mimetype,
    size: file.size,
    category: category?.trim() || null,
    purpose: normalizedPurpose,
    tags: tags?.trim() || null,
    uploadedById: Number(userId),
    contactId: normalizedContactId,
    ticketId: normalizedTicketId,
    queueId: normalizedQueueId,
    ecosystemId: normalizedEcosystemId
  };

  let document: SmartDocument | null = null;

  try {
    document = await SmartDocument.create(
      documentData as unknown as SmartDocument
    );

    const reloadedDocument = await document.reload({
      include: ["uploadedBy", "contact", "ticket", "queue", "ecosystem"]
    });
    await recordDocumentEvent({
      documentId: reloadedDocument.id,
      userId,
      eventType: "uploaded",
      newStatus: "generated",
      metadata: { originalName: reloadedDocument.originalName }
    });
    return reloadedDocument;
  } catch (err) {
    if (document) {
      await document.destroy({ force: true });
    }
    await removeDocumentFile(storagePath);
    throw err;
  }
};

export default CreateDocumentService;
