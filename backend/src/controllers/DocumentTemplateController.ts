import { Request, Response } from "express";

import AppError from "../errors/AppError";
import ListDocumentTemplatesService from "../services/DocumentServices/ListDocumentTemplatesService";
import CreateDocumentTemplateService from "../services/DocumentServices/CreateDocumentTemplateService";
import ShowDocumentTemplateService from "../services/DocumentServices/ShowDocumentTemplateService";
import GenerateDocumentFromTemplateService from "../services/DocumentServices/GenerateDocumentFromTemplateService";
import { serializeTemplateVersion } from "../services/DocumentServices/templateSerialization";
import SmartDocumentTemplate from "../models/SmartDocumentTemplate";

type IndexQuery = {
  searchParam?: string;
  pageNumber?: string;
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
  return {
    ...plainTemplate,
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
  const { searchParam, pageNumber } = req.query as IndexQuery;

  try {
    const result = await ListDocumentTemplatesService({
      searchParam,
      pageNumber,
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
      userId: req.user.id,
      userProfile: req.user.profile
    });

    return res.status(201).json(document);
  } catch (err) {
    return rethrowDocumentDbError(err);
  }
};
