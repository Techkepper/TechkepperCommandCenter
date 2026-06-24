import AppError from "../../errors/AppError";
import Ecosystem from "../../models/Ecosystem";
import Queue from "../../models/Queue";
import SmartDocumentTemplate from "../../models/SmartDocumentTemplate";
import SmartDocumentTemplateVersion from "../../models/SmartDocumentTemplateVersion";
import { removeDocumentFile, saveDocumentBuffer } from "./documentStorage";
import { ensureDocumentWriteAccess } from "./documentPermissions";
import { extractTemplateVariablesFromBuffer } from "./docxTemplateEngine";
import { serializeJsonList } from "./templateSerialization";
import { normalizeOptionalDocumentId } from "./documentIds";
import {
  getRequiredVariablesByDocumentType,
  isDocumentPurpose,
  normalizeDocumentType
} from "./documentTaxonomy";

interface Request {
  file?: Express.Multer.File;
  name?: string;
  description?: string;
  category?: string;
  documentType?: string;
  purpose?: string;
  requiresClient?: boolean;
  allowGenericRecipient?: boolean;
  queueId?: number | null;
  ecosystemId?: number | null;
  requiredVariables?: string[];
  userId: string;
  userProfile: string;
}

const CreateDocumentTemplateService = async ({
  file,
  name,
  description,
  category,
  documentType,
  purpose,
  requiresClient = false,
  allowGenericRecipient = false,
  queueId,
  ecosystemId,
  requiredVariables,
  userId,
  userProfile
}: Request): Promise<SmartDocumentTemplate> => {
  if (userProfile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  if (!file) {
    throw new AppError("ERR_DOCUMENT_TEMPLATE_FILE_REQUIRED", 400);
  }

  if (
    file.mimetype !==
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    throw new AppError("ERR_DOCUMENT_TEMPLATE_MUST_BE_DOCX", 415);
  }

  const normalizedPurpose = isDocumentPurpose(purpose) ? purpose : "other";
  const normalizedDocumentType = normalizeDocumentType(
    documentType,
    normalizedPurpose
  );
  const normalizedEcosystemId =
    normalizedPurpose === "nda"
      ? null
      : normalizeOptionalDocumentId(ecosystemId, "El ecosistema seleccionado");
  const normalizedQueueId = normalizeOptionalDocumentId(
    queueId,
    "El departamento seleccionado"
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
    { queueId: normalizedQueueId },
    { id: userId, profile: userProfile }
  );

  const detectedVariables = extractTemplateVariablesFromBuffer(file.buffer);
  const configuredRequiredVariables =
    requiredVariables && requiredVariables.length
      ? requiredVariables
      : detectedVariables;
  const typeRequiredVariables = getRequiredVariablesByDocumentType(
    normalizedDocumentType
  );
  const normalizedRequiredVariables = Array.from(
    new Set([...typeRequiredVariables, ...configuredRequiredVariables])
  );
  const { storedName, storagePath } = await saveDocumentBuffer(
    file.buffer,
    file.mimetype,
    "templates"
  );

  let template: SmartDocumentTemplate | null = null;
  try {
    template = await SmartDocumentTemplate.create({
      name: name?.trim() || file.originalname.replace(/\.docx$/i, ""),
      description: description?.trim() || null,
      category: category?.trim() || null,
      documentType: normalizedDocumentType,
      purpose: normalizedPurpose,
      requiresClient,
      allowGenericRecipient,
      createdById: Number(userId),
      queueId: normalizedQueueId,
      ecosystemId: normalizedEcosystemId,
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
  } catch (err) {
    if (template) {
      await SmartDocumentTemplate.destroy({
        where: { id: template.id },
        force: true
      });
    }
    await removeDocumentFile(storagePath);
    throw err;
  }

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
