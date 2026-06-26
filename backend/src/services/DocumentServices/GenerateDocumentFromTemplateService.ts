import path from "path";

import AppError from "../../errors/AppError";
import sequelize from "../../database";
import BusinessClient from "../../models/BusinessClient";
import BusinessClientDocument from "../../models/BusinessClientDocument";
import CollaboratorDocument from "../../models/CollaboratorDocument";
import SmartDocument from "../../models/SmartDocument";
import ShowBusinessClientService from "../BusinessClientServices/ShowBusinessClientService";
import { showCollaborator } from "../CollaboratorServices";
import {
  extractTemplateVariablesFromBuffer,
  renderDocxTemplate
} from "./docxTemplateEngine";
import {
  removeDocumentFile,
  resolveDocumentPath,
  saveDocumentBuffer
} from "./documentStorage";
import ShowDocumentTemplateService from "./ShowDocumentTemplateService";
import { parseJsonList } from "./templateSerialization";
import { normalizeOptionalDocumentId } from "./documentIds";
import { recordDocumentEvent } from "./DocumentLifecycleService";
import {
  getDocumentRecipientKind,
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
  baseDocumentId?: number | string | null;
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
    CLIENTE_RAZON_SOCIAL: data.CLIENTE_RAZON_SOCIAL || clientName,
    CLIENTE_CEDULA: data.CLIENTE_CEDULA || client.identificationNumber || "",
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
  FREELANCE_NOMBRE: data.FREELANCE_NOMBRE || collaborator.fullName,
  FREELANCE_CEDULA: data.FREELANCE_CEDULA || collaborator.identificationNumber,
  FREELANCE_DENOMINACION: collaborator.contractualDenomination,
  CLIENTE_RAZON_SOCIAL: data.CLIENTE_RAZON_SOCIAL || collaborator.fullName,
  CLIENTE_CEDULA: data.CLIENTE_CEDULA || collaborator.identificationNumber,
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
  baseDocumentId,
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
    if (
      normalizeDocumentType(
        template.documentType,
        isDocumentPurpose(template.purpose) ? template.purpose : "other"
      ) === "contract_addendum"
    ) {
      throw new AppError(
        "No hay una plantilla activa de addendum. Suba una plantilla DOCX antes de generar.",
        400
      );
    }
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
  const isContractAddendum = normalizedDocumentType === "contract_addendum";

  const normalizedClientId = normalizeOptionalDocumentId(
    businessClientId,
    "El cliente seleccionado"
  );
  const normalizedCollaboratorId = normalizeOptionalDocumentId(
    collaboratorId,
    "El colaborador seleccionado"
  );
  const normalizedBaseDocumentId = normalizeOptionalDocumentId(
    baseDocumentId,
    "El documento base seleccionado"
  );
  if (normalizedClientId !== null && normalizedCollaboratorId !== null) {
    throw new AppError(
      "Seleccione un cliente o un colaborador, no ambos.",
      400
    );
  }
  const recipientKind = getDocumentRecipientKind(normalizedDocumentType);
  if (
    recipientKind === "client" &&
    (normalizedClientId === null || normalizedCollaboratorId !== null)
  ) {
    throw new AppError(
      "Este tipo documental requiere seleccionar un cliente.",
      400
    );
  }
  if (
    recipientKind === "collaborator" &&
    (normalizedCollaboratorId === null || normalizedClientId !== null)
  ) {
    throw new AppError(
      "Este contrato requiere seleccionar un colaborador.",
      400
    );
  }
  if (
    template.requiresClient &&
    recipientKind === "flexible" &&
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
  let baseDocument: SmartDocument | null = null;
  if (normalizedClientId !== null) {
    const client = await ShowBusinessClientService({
      clientId: normalizedClientId,
      actor: { id: userId, profile: userProfile }
    });
    documentData = applyPhysicalClientVariables(documentData, client);
  }
  if (isContractAddendum) {
    if (normalizedClientId === null || normalizedBaseDocumentId === null) {
      throw new AppError(
        "Seleccione el cliente y el contrato o documento base del addendum.",
        400
      );
    }
    const baseLink = await BusinessClientDocument.findOne({
      where: {
        businessClientId: normalizedClientId,
        documentId: normalizedBaseDocumentId
      },
      include: [{ model: SmartDocument, as: "document" }]
    });
    if (!baseLink?.document) {
      throw new AppError(
        "El documento base no pertenece al cliente seleccionado.",
        400
      );
    }
    baseDocument = baseLink.document;
    documentData = {
      ...documentData,
      DOCUMENTO_BASE: baseDocument.title,
      FECHA_DOCUMENTO_BASE:
        baseDocument.documentDate ||
        baseDocument.createdAt.toISOString().slice(0, 10)
    };
  } else if (normalizedBaseDocumentId !== null) {
    throw new AppError(
      "El documento base solo puede indicarse para un addendum.",
      400
    );
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
    if (
      isFreelanceSalesContract &&
      collaborator.contractualDenomination !== "LA CONTRATISTA" &&
      collaborator.contractualDenomination !== "EL CONTRATISTA"
    ) {
      throw new AppError(
        "Complete el sexo o denominación contractual del colaborador antes de generar el contrato.",
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
      "Complete el sexo o denominación contractual del colaborador antes de generar el contrato.",
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
  try {
    const documentId = await sequelize.transaction(async transaction => {
      const document = await SmartDocument.create(
        {
          title: title?.trim() || template.name,
          description: `Generado desde plantilla: ${template.name}`,
          originalName: path.basename(originalName),
          storedName,
          storagePath,
          mimeType: docxMimeType,
          size: outputBuffer.length,
          category: template.category,
          purpose: template.purpose,
          status: "generated",
          documentDate: new Date().toISOString().slice(0, 10),
          baseDocumentId: baseDocument?.id || null,
          tags: `plantilla:${template.id};version:${activeVersion.version}`,
          uploadedById: Number(userId),
          contactId: null,
          ticketId: null,
          queueId: template.queueId,
          ecosystemId: template.ecosystemId
        } as unknown as SmartDocument,
        { transaction }
      );

      if (normalizedClientId !== null) {
        await BusinessClientDocument.create(
          {
            documentId: document.id,
            businessClientId: normalizedClientId,
            linkedById: Number(userId)
          } as unknown as BusinessClientDocument,
          { transaction }
        );
        await recordDocumentEvent({
          documentId: document.id,
          userId,
          eventType: "associated_client",
          newStatus: "generated",
          metadata: { businessClientId: normalizedClientId },
          transaction
        });
      }
      if (normalizedCollaboratorId !== null) {
        await CollaboratorDocument.create(
          {
            documentId: document.id,
            collaboratorId: normalizedCollaboratorId,
            linkedById: Number(userId)
          } as unknown as CollaboratorDocument,
          { transaction }
        );
        await recordDocumentEvent({
          documentId: document.id,
          userId,
          eventType: "associated_collaborator",
          newStatus: "generated",
          metadata: { collaboratorId: normalizedCollaboratorId },
          transaction
        });
      }
      if (baseDocument) {
        await recordDocumentEvent({
          documentId: document.id,
          userId,
          eventType: "associated_base_document",
          newStatus: "generated",
          metadata: { baseDocumentId: baseDocument.id },
          transaction
        });
      }
      await recordDocumentEvent({
        documentId: document.id,
        userId,
        eventType: "generated",
        newStatus: "generated",
        metadata: {
          templateId: template.id,
          templateVersionId: activeVersion.id,
          baseDocumentId: baseDocument?.id || null
        },
        transaction
      });
      return document.id;
    });

    const reloadedDocument = await SmartDocument.findByPk(documentId, {
      include: ["uploadedBy", "contact", "ticket", "queue", "ecosystem"]
    });
    if (!reloadedDocument) {
      throw new AppError(
        "No fue posible registrar el documento generado.",
        500
      );
    }
    return reloadedDocument;
  } catch (err) {
    await removeDocumentFile(storagePath);
    throw err;
  }
};

export default GenerateDocumentFromTemplateService;
