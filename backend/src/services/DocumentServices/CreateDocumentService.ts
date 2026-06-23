import AppError from "../../errors/AppError";
import SmartDocument from "../../models/SmartDocument";
import { saveDocumentBuffer } from "./documentStorage";
import { ensureDocumentWriteAccess } from "./documentPermissions";

interface Request {
  file?: Express.Multer.File;
  title?: string;
  description?: string;
  category?: string;
  tags?: string;
  contactId?: number | null;
  ticketId?: number | null;
  queueId?: number | null;
  ecosystemId?: number | null;
  userId: string;
  userProfile: string;
}

const normalizeOptionalNumber = (value?: number | null): number | null => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return null;
  }
  return Number(value);
};

const CreateDocumentService = async ({
  file,
  title,
  description,
  category,
  tags,
  contactId,
  ticketId,
  queueId,
  ecosystemId,
  userId,
  userProfile
}: Request): Promise<SmartDocument> => {
  if (!file) {
    throw new AppError("ERR_DOCUMENT_FILE_REQUIRED", 400);
  }

  const normalizedQueueId = normalizeOptionalNumber(queueId);
  const normalizedTicketId = normalizeOptionalNumber(ticketId);

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
    tags: tags?.trim() || null,
    uploadedById: Number(userId),
    contactId: normalizeOptionalNumber(contactId),
    ticketId: normalizedTicketId,
    queueId: normalizedQueueId,
    ecosystemId: normalizeOptionalNumber(ecosystemId)
  };

  const document = await SmartDocument.create(
    documentData as unknown as SmartDocument
  );

  return document.reload({
    include: ["uploadedBy", "contact", "ticket", "queue", "ecosystem"]
  });
};

export default CreateDocumentService;
