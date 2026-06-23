import AppError from "../../errors/AppError";
import SmartDocumentTemplate from "../../models/SmartDocumentTemplate";
import SmartDocumentTemplateVersion from "../../models/SmartDocumentTemplateVersion";
import { saveDocumentBuffer } from "./documentStorage";
import { ensureDocumentWriteAccess } from "./documentPermissions";
import { extractTemplateVariablesFromBuffer } from "./docxTemplateEngine";
import { serializeJsonList } from "./templateSerialization";

interface Request {
  file?: Express.Multer.File;
  name?: string;
  description?: string;
  category?: string;
  queueId?: number | null;
  ecosystemId?: number | null;
  requiredVariables?: string[];
  userId: string;
  userProfile: string;
}

const normalizeOptionalNumber = (value?: number | null): number | null => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return null;
  }
  return Number(value);
};

const CreateDocumentTemplateService = async ({
  file,
  name,
  description,
  category,
  queueId,
  ecosystemId,
  requiredVariables,
  userId,
  userProfile
}: Request): Promise<SmartDocumentTemplate> => {
  if (!file) {
    throw new AppError("ERR_DOCUMENT_TEMPLATE_FILE_REQUIRED", 400);
  }

  if (
    file.mimetype !==
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    throw new AppError("ERR_DOCUMENT_TEMPLATE_MUST_BE_DOCX", 415);
  }

  const normalizedQueueId = normalizeOptionalNumber(queueId);
  await ensureDocumentWriteAccess(
    { queueId: normalizedQueueId },
    { id: userId, profile: userProfile }
  );

  const detectedVariables = extractTemplateVariablesFromBuffer(file.buffer);
  const normalizedRequiredVariables =
    requiredVariables && requiredVariables.length
      ? requiredVariables
      : detectedVariables;
  const { storedName, storagePath } = await saveDocumentBuffer(
    file.buffer,
    file.mimetype,
    "templates"
  );

  const template = await SmartDocumentTemplate.create({
    name: name?.trim() || file.originalname.replace(/\.docx$/i, ""),
    description: description?.trim() || null,
    category: category?.trim() || null,
    createdById: Number(userId),
    queueId: normalizedQueueId,
    ecosystemId: normalizeOptionalNumber(ecosystemId),
    isActive: true
  } as unknown as SmartDocumentTemplate);

  await SmartDocumentTemplateVersion.create({
    templateId: template.id,
    version: 1,
    originalName: file.originalname,
    storedName,
    storagePath,
    mimeType: file.mimetype,
    size: file.size,
    detectedVariables: serializeJsonList(detectedVariables),
    requiredVariables: serializeJsonList(normalizedRequiredVariables),
    isActive: true,
    uploadedById: Number(userId)
  } as unknown as SmartDocumentTemplateVersion);

  return SmartDocumentTemplate.findByPk(template.id, {
    include: [
      "createdBy",
      "queue",
      "ecosystem",
      {
        model: SmartDocumentTemplateVersion,
        as: "versions",
        where: { isActive: true },
        required: false,
        separate: true,
        limit: 1,
        order: [["version", "DESC"]]
      }
    ]
  }) as Promise<SmartDocumentTemplate>;
};

export default CreateDocumentTemplateService;
