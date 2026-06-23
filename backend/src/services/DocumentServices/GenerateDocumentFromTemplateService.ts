import path from "path";

import AppError from "../../errors/AppError";
import SmartDocument from "../../models/SmartDocument";
import { renderDocxTemplate } from "./docxTemplateEngine";
import { resolveDocumentPath, saveDocumentBuffer } from "./documentStorage";
import ShowDocumentTemplateService from "./ShowDocumentTemplateService";
import { parseJsonList } from "./templateSerialization";

interface Request {
  templateId: string | number;
  title?: string;
  data: Record<string, unknown>;
  userId: string;
  userProfile: string;
}

const docxMimeType =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const sanitizeFileName = (name: string): string =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 120);

const buildGeneratedName = (templateName: string, title?: string): string => {
  const date = new Date().toISOString().slice(0, 10);
  const baseName = sanitizeFileName(title || templateName || "documento");
  return `${baseName}-${date}.docx`;
};

const GenerateDocumentFromTemplateService = async ({
  templateId,
  title,
  data,
  userId,
  userProfile
}: Request): Promise<SmartDocument> => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new AppError("ERR_DOCUMENT_DATA_REQUIRED", 400);
  }

  const template = await ShowDocumentTemplateService({
    templateId,
    userId,
    userProfile
  });
  const activeVersion = template.versions?.find(version => version.isActive);

  if (!activeVersion) {
    throw new AppError("ERR_DOCUMENT_TEMPLATE_WITHOUT_ACTIVE_VERSION", 400);
  }

  const requiredVariables = parseJsonList(activeVersion.requiredVariables);
  const missingVariables = requiredVariables.filter(variable => {
    const value = data[variable];
    return value === undefined || value === null || String(value).trim() === "";
  });

  if (missingVariables.length) {
    throw new AppError(
      `Faltan variables requeridas: ${missingVariables.join(", ")}`,
      400
    );
  }

  let outputBuffer: Buffer;
  try {
    outputBuffer = await renderDocxTemplate(
      resolveDocumentPath(activeVersion.storagePath),
      data
    );
  } catch {
    throw new AppError("ERR_DOCUMENT_GENERATION_FAILED", 500);
  }

  const { storedName, storagePath } = await saveDocumentBuffer(
    outputBuffer,
    docxMimeType,
    "generated"
  );
  const originalName = buildGeneratedName(template.name, title);

  const document = await SmartDocument.create({
    title: title?.trim() || template.name,
    description: `Generado desde plantilla: ${template.name}`,
    originalName: path.basename(originalName),
    storedName,
    storagePath,
    mimeType: docxMimeType,
    size: outputBuffer.length,
    category: template.category,
    tags: `plantilla:${template.id};version:${activeVersion.version}`,
    uploadedById: Number(userId),
    contactId: null,
    ticketId: null,
    queueId: template.queueId,
    ecosystemId: template.ecosystemId
  } as unknown as SmartDocument);

  return document.reload({
    include: ["uploadedBy", "contact", "ticket", "queue", "ecosystem"]
  });
};

export default GenerateDocumentFromTemplateService;
