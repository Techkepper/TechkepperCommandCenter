import path from "path";

import AppError from "../../errors/AppError";
import BusinessClient from "../../models/BusinessClient";
import SmartDocument from "../../models/SmartDocument";
import { showCollaborator } from "../CollaboratorServices";
import {
  extractTemplateVariablesFromBuffer,
  renderDocxTemplate
} from "./docxTemplateEngine";
import { resolveDocumentPath, saveDocumentBuffer } from "./documentStorage";
import ShowDocumentTemplateService from "./ShowDocumentTemplateService";
import { parseJsonList } from "./templateSerialization";
import { setDocumentBusinessClient } from "./BusinessClientDocumentService";
import { setDocumentCollaborator } from "./CollaboratorDocumentService";
import {
  getRequiredVariablesByDocumentType,
  isDocumentPurpose,
  normalizeDocumentType
} from "./documentTaxonomy";

interface Request {
  templateId: string | number;
  title?: string;
  data: Record<string, unknown>;
  businessClientId?: number | string | null;
  collaboratorId?: number | string | null;
  recipientMode?: "client" | "collaborator" | "generic" | "manual";
  userId: string;
  userProfile: string;
}

const docxMimeType =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const applyPhysicalClientVariables = (
  data: Record<string, unknown>,
  client: BusinessClient
): Record<string, unknown> => {
  if (client.type !== "physical") return data;

  const clientName = client.displayName || client.legalName || "";
  return {
    ...data,
    CLIENTE_RAZON_SOCIAL: clientName,
    CLIENTE_CEDULA: client.identificationNumber || "",
    CLIENTE_REPRESENTANTE: clientName,
    CLIENTE_CEDULA_REPRESENTANTE: client.identificationNumber || "",
    CLIENTE_CARGO_REPRESENTANTE: "En nombre propio",
    CLIENTE_DOMICILIO: client.address || data.CLIENTE_DOMICILIO || "",
    CLIENTE_CORREO: client.email || data.CLIENTE_CORREO || ""
  };
};

const applyCollaboratorVariables = (
  data: Record<string, unknown>,
  collaborator: {
    fullName: string;
    identificationNumber: string;
    contractualDenomination: string;
    email?: string | null;
    address?: string | null;
  }
): Record<string, unknown> => ({
  ...data,
  FREELANCE_NOMBRE: collaborator.fullName,
  FREELANCE_CEDULA: collaborator.identificationNumber,
  FREELANCE_DENOMINACION: collaborator.contractualDenomination,
  CLIENTE_RAZON_SOCIAL: collaborator.fullName,
  CLIENTE_CEDULA: collaborator.identificationNumber,
  CLIENTE_REPRESENTANTE: collaborator.fullName,
  CLIENTE_CEDULA_REPRESENTANTE: collaborator.identificationNumber,
  CLIENTE_CARGO_REPRESENTANTE: "En nombre propio",
  CLIENTE_DOMICILIO: collaborator.address || data.CLIENTE_DOMICILIO || "",
  CLIENTE_CORREO: collaborator.email || data.CLIENTE_CORREO || ""
});

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
  businessClientId,
  collaboratorId,
  recipientMode = "manual",
  userId,
  userProfile
}: Request): Promise<SmartDocument> => {
  if (userProfile !== "admin" && userProfile !== "supervisor") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

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

  const normalizedPurpose = isDocumentPurpose(template.purpose)
    ? template.purpose
    : "other";
  const normalizedDocumentType = normalizeDocumentType(
    template.documentType,
    normalizedPurpose
  );
  const isFreelanceSalesContract =
    normalizedDocumentType === "freelance_sales_contract";

  const normalizedClientId =
    businessClientId === undefined ||
    businessClientId === null ||
    businessClientId === "" ||
    businessClientId === 0 ||
    businessClientId === "0"
      ? null
      : Number(businessClientId);
  const normalizedCollaboratorId =
    collaboratorId === undefined ||
    collaboratorId === null ||
    collaboratorId === "" ||
    collaboratorId === 0 ||
    collaboratorId === "0"
      ? null
      : Number(collaboratorId);
  if (
    normalizedClientId !== null &&
    (!Number.isInteger(normalizedClientId) || normalizedClientId <= 0)
  ) {
    throw new AppError("El cliente seleccionado no es válido.", 400);
  }
  if (
    normalizedCollaboratorId !== null &&
    (!Number.isInteger(normalizedCollaboratorId) ||
      normalizedCollaboratorId <= 0)
  ) {
    throw new AppError("El colaborador seleccionado no es válido.", 400);
  }
  if (normalizedClientId !== null && normalizedCollaboratorId !== null) {
    throw new AppError(
      "Seleccione un cliente o un colaborador, no ambos.",
      400
    );
  }
  if (isFreelanceSalesContract && normalizedCollaboratorId === null) {
    throw new AppError(
      "Este contrato requiere seleccionar un colaborador.",
      400
    );
  }
  if (
    template.requiresClient &&
    !isFreelanceSalesContract &&
    normalizedClientId === null &&
    normalizedCollaboratorId === null &&
    !(template.allowGenericRecipient && recipientMode === "generic")
  ) {
    throw new AppError(
      "Esta plantilla requiere seleccionar un cliente o colaborador.",
      400
    );
  }
  let documentData = { ...data };
  if (normalizedClientId !== null) {
    const client = await BusinessClient.findByPk(normalizedClientId, {
      attributes: [
        "id",
        "type",
        "displayName",
        "legalName",
        "identificationNumber",
        "email",
        "address"
      ]
    });
    if (!client) {
      throw new AppError("El cliente seleccionado no existe.", 400);
    }
    documentData = applyPhysicalClientVariables(documentData, client);
  }
  if (normalizedCollaboratorId !== null) {
    const collaborator = await showCollaborator(normalizedCollaboratorId, {
      id: userId,
      profile: userProfile
    });
    if (!collaborator.isActive) {
      throw new AppError(
        "El colaborador seleccionado no existe o está inactivo.",
        400
      );
    }
    documentData = applyCollaboratorVariables(documentData, collaborator);
  }

  const configuredRequiredVariables = parseJsonList(
    activeVersion.requiredVariables
  );
  const typeRequiredVariables = getRequiredVariablesByDocumentType(
    normalizedDocumentType
  );
  const requiredVariables = Array.from(
    new Set([...typeRequiredVariables, ...configuredRequiredVariables])
  );
  if (
    isFreelanceSalesContract &&
    documentData.FREELANCE_DENOMINACION !== "LA CONTRATISTA" &&
    documentData.FREELANCE_DENOMINACION !== "EL CONTRATISTA"
  ) {
    throw new AppError(
      "La denominación contractual debe ser LA CONTRATISTA o EL CONTRATISTA.",
      400
    );
  }
  const missingVariables = requiredVariables.filter(variable => {
    const value = documentData[variable];
    return value === undefined || value === null || String(value).trim() === "";
  });

  if (missingVariables.length) {
    throw new AppError(
      `Complete los campos obligatorios: ${missingVariables.join(", ")}`,
      400
    );
  }

  let outputBuffer: Buffer;
  try {
    outputBuffer = await renderDocxTemplate(
      resolveDocumentPath(activeVersion.storagePath),
      documentData
    );
    const unresolvedVariables =
      extractTemplateVariablesFromBuffer(outputBuffer);
    if (unresolvedVariables.length) {
      throw new AppError(
        `La plantilla conserva variables sin reemplazar: ${unresolvedVariables.join(
          ", "
        )}`,
        400
      );
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw new AppError(
        "El archivo original de esta plantilla no está disponible. Vuelva a cargar el machote DOCX.",
        409
      );
    }
    const templateError = err as Error & {
      properties?: { explanation?: string };
    };
    if (templateError.properties?.explanation) {
      throw new AppError(
        `El machote DOCX contiene etiquetas inválidas: ${templateError.properties.explanation}`,
        400
      );
    }
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
    purpose: template.purpose,
    tags: `plantilla:${template.id};version:${activeVersion.version}`,
    uploadedById: Number(userId),
    contactId: null,
    ticketId: null,
    queueId: template.queueId,
    ecosystemId: template.ecosystemId
  } as unknown as SmartDocument);

  const reloadedDocument = await document.reload({
    include: ["uploadedBy", "contact", "ticket", "queue", "ecosystem"]
  });

  if (normalizedClientId !== null) {
    await setDocumentBusinessClient({
      documentId: reloadedDocument.id,
      businessClientId: normalizedClientId,
      actor: { id: userId, profile: userProfile }
    });
  }
  if (normalizedCollaboratorId !== null) {
    await setDocumentCollaborator({
      documentId: reloadedDocument.id,
      collaboratorId: normalizedCollaboratorId,
      userId
    });
  }

  return reloadedDocument;
};

export default GenerateDocumentFromTemplateService;
