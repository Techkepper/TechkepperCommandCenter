import { Request, Response } from "express";

import AppError from "../errors/AppError";
import ListDocumentTemplatesService from "../services/DocumentServices/ListDocumentTemplatesService";
import CreateDocumentTemplateService from "../services/DocumentServices/CreateDocumentTemplateService";
import ShowDocumentTemplateService from "../services/DocumentServices/ShowDocumentTemplateService";
import GenerateDocumentFromTemplateService from "../services/DocumentServices/GenerateDocumentFromTemplateService";
import DeleteDocumentTemplateService from "../services/DocumentServices/DeleteDocumentTemplateService";
import {
  parseJsonList,
  serializeTemplateVersion
} from "../services/DocumentServices/templateSerialization";
import SmartDocumentTemplate from "../models/SmartDocumentTemplate";
import {
  getExpectedVariablesByDocumentType,
  normalizeDocumentType,
  isDocumentPurpose
} from "../services/DocumentServices/documentTaxonomy";

type IndexQuery = {
  searchParam?: string;
  pageNumber?: string;
  purpose?: string;
  documentType?: string;
  ecosystemId?: string;
};

const rethrowDocumentDbError = (err: Error): never => {
  const databaseError = err as Error & {
    original?: { code?: string };
    parent?: { code?: string };
  };
  const code = databaseError.original?.code || databaseError.parent?.code;

  if (code === "ER_NO_SUCH_TABLE" || code === "ER_BAD_FIELD_ERROR") {
    throw new AppError("ERR_SMART_DOCUMENTS_NOT_INSTALLED", 503);
  }

  throw err;
};

const serializeTemplate = (
  template: SmartDocumentTemplate
): Record<string, unknown> => {
  const plainTemplate = template.toJSON();
  const activeVersion = template.versions?.find(version => version.isActive);
  const detectedVariables = activeVersion
    ? parseJsonList(activeVersion.detectedVariables)
    : [];
  const normalizedPurpose = isDocumentPurpose(template.purpose)
    ? template.purpose
    : "other";
  const normalizedDocumentType = normalizeDocumentType(
    template.documentType,
    normalizedPurpose
  );
  const expectedVariables = getExpectedVariablesByDocumentType(
    normalizedDocumentType
  );
  const missingExpectedVariables = expectedVariables.filter(
    variable => !detectedVariables.includes(variable)
  );
  return {
    ...plainTemplate,
    documentType: normalizedDocumentType,
    expectedVariables,
    missingExpectedVariables,
    versions: (template.versions || []).map(serializeTemplateVersion)
  };
};

const parseJsonBodyObject = (value: unknown): Record<string, unknown> => {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber, purpose, documentType, ecosystemId } =
    req.query as IndexQuery;

  try {
    const result = await ListDocumentTemplatesService({
      searchParam,
      pageNumber,
      purpose,
      documentType,
      ecosystemId: ecosystemId ? Number(ecosystemId) : undefined,
      userId: req.user.id,
      userProfile: req.user.profile
    });

    return res.json({
      ...result,
      templates: result.templates.map(serializeTemplate)
    });
  } catch (err) {
    return rethrowDocumentDbError(err);
  }
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  try {
    const requiredVariables =
      typeof req.body.requiredVariables === "string"
        ? req.body.requiredVariables
            .split(",")
            .map((item: string) => item.trim())
            .filter(Boolean)
        : undefined;

    const template = await CreateDocumentTemplateService({
      file: req.file,
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      documentType: req.body.documentType,
      purpose: req.body.purpose,
      requiresClient:
        req.body.requiresClient === true || req.body.requiresClient === "true",
      allowGenericRecipient:
        req.body.allowGenericRecipient === true ||
        req.body.allowGenericRecipient === "true",
      queueId: req.body.queueId,
      ecosystemId: req.body.ecosystemId,
      requiredVariables,
      userId: req.user.id,
      userProfile: req.user.profile
    });

    return res.status(201).json(serializeTemplate(template));
  } catch (err) {
    return rethrowDocumentDbError(err);
  }
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { templateId } = req.params;

  try {
    const template = await ShowDocumentTemplateService({
      templateId,
      userId: req.user.id,
      userProfile: req.user.profile
    });

    return res.json(serializeTemplate(template));
  } catch (err) {
    return rethrowDocumentDbError(err);
  }
};

export const generate = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { templateId } = req.params;

  try {
    const document = await GenerateDocumentFromTemplateService({
      templateId,
      title: req.body.title,
      data: parseJsonBodyObject(req.body.data),
      businessClientId: req.body.businessClientId,
      collaboratorId: req.body.collaboratorId,
      recipientMode: req.body.recipientMode,
      userId: req.user.id,
      userProfile: req.user.profile
    });

    return res.status(201).json(document);
  } catch (err) {
    return rethrowDocumentDbError(err);
  }
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    await DeleteDocumentTemplateService({
      templateId: req.params.templateId,
      userId: req.user.id,
      userProfile: req.user.profile
    });

    return res.status(204).send();
  } catch (err) {
    return rethrowDocumentDbError(err);
  }
};
