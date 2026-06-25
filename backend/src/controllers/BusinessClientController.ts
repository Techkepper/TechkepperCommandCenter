import { Request, Response } from "express";
import * as Yup from "yup";

import AppError from "../errors/AppError";
import { EmitBusinessClientEvent } from "../helpers/EmitBusinessClientEvent";
import CreateBusinessClientService from "../services/BusinessClientServices/CreateBusinessClientService";
import ListBusinessClientsService from "../services/BusinessClientServices/ListBusinessClientsService";
import SetBusinessClientStatusService from "../services/BusinessClientServices/SetBusinessClientStatusService";
import ShowBusinessClientService from "../services/BusinessClientServices/ShowBusinessClientService";
import UpdateBusinessClientService from "../services/BusinessClientServices/UpdateBusinessClientService";
import { BusinessClientData } from "../services/BusinessClientServices/businessClientTypes";
import { showBusinessClientDossier } from "../services/DossierServices";

type IndexQuery = {
  searchParam?: string;
  pageNumber?: string;
  status?: "active" | "inactive" | "all";
  type?: "physical" | "legal";
};

const businessClientSchema = Yup.object().shape({
  type: Yup.string().oneOf(["physical", "legal"]).required(),
  displayName: Yup.string().trim().min(2).max(255).required(),
  legalName: Yup.string().trim().max(255).nullable(),
  tradeName: Yup.string().trim().max(255).nullable(),
  identificationType: Yup.string().trim().max(80).required(),
  identificationNumber: Yup.string().trim().max(80).required(),
  legalRepresentativeName: Yup.string().trim().max(255).nullable(),
  legalRepresentativeId: Yup.string().trim().max(80).nullable(),
  legalRepresentativePosition: Yup.string().trim().max(255).nullable(),
  email: Yup.string().trim().email().max(255).nullable(),
  phone: Yup.string().trim().max(80).nullable(),
  address: Yup.string().trim().max(500).nullable(),
  country: Yup.string().trim().max(120).nullable(),
  province: Yup.string().trim().max(120).nullable(),
  canton: Yup.string().trim().max(120).nullable(),
  district: Yup.string().trim().max(120).nullable(),
  notes: Yup.string().trim().max(10000).nullable(),
  queueId: Yup.number().integer().positive().nullable()
});

const rethrowBusinessClientDbError = (err: Error): never => {
  const databaseError = err as Error & {
    original?: { code?: string };
    parent?: { code?: string };
  };
  const code = databaseError.original?.code || databaseError.parent?.code;

  if (code === "ER_NO_SUCH_TABLE" || code === "ER_BAD_FIELD_ERROR") {
    throw new AppError("ERR_BUSINESS_CLIENTS_NOT_INSTALLED", 503);
  }
  if (code === "ER_DUP_ENTRY") {
    throw new AppError("ERR_DUPLICATED_BUSINESS_CLIENT", 409);
  }

  throw err;
};

const validateClientData = async (data: BusinessClientData): Promise<void> => {
  try {
    await businessClientSchema.validate(data, { abortEarly: false });
  } catch (err) {
    throw new AppError(err.message, 400);
  }

  if (data.type === "legal" && !data.legalName?.trim()) {
    throw new AppError(
      "La razón social es obligatoria para clientes jurídicos."
    );
  }
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber, status, type } = req.query as IndexQuery;

  try {
    const result = await ListBusinessClientsService({
      searchParam,
      pageNumber,
      status,
      type,
      actor: req.user
    });
    return res.json(result);
  } catch (err) {
    return rethrowBusinessClientDbError(err);
  }
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  try {
    const client = await ShowBusinessClientService({
      clientId: req.params.clientId,
      actor: req.user
    });
    return res.json(client);
  } catch (err) {
    return rethrowBusinessClientDbError(err);
  }
};

export const dossier = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    return res.json(
      await showBusinessClientDossier({
        clientId: Number(req.params.clientId),
        actor: req.user
      })
    );
  } catch (err) {
    return rethrowBusinessClientDbError(err);
  }
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const data = req.body as BusinessClientData;
  await validateClientData(data);

  try {
    const client = await CreateBusinessClientService({
      data,
      actor: req.user
    });
    EmitBusinessClientEvent("create", client);
    return res.status(201).json(client);
  } catch (err) {
    return rethrowBusinessClientDbError(err);
  }
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const data = req.body as BusinessClientData;
  await validateClientData(data);

  try {
    const previous = await ShowBusinessClientService({
      clientId: req.params.clientId,
      actor: req.user
    });
    const previousQueueId = previous.queueId;
    const client = await UpdateBusinessClientService({
      clientId: req.params.clientId,
      data,
      actor: req.user
    });
    EmitBusinessClientEvent(
      "update",
      client,
      previousQueueId ? [previousQueueId] : []
    );
    return res.json(client);
  } catch (err) {
    return rethrowBusinessClientDbError(err);
  }
};

export const setStatus = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const schema = Yup.object().shape({
    isActive: Yup.boolean().required()
  });

  try {
    await schema.validate(req.body);
    const client = await SetBusinessClientStatusService({
      clientId: req.params.clientId,
      isActive: req.body.isActive,
      actor: req.user
    });
    EmitBusinessClientEvent("update", client);
    return res.json(client);
  } catch (err) {
    if (err instanceof Yup.ValidationError) {
      throw new AppError(err.message, 400);
    }
    return rethrowBusinessClientDbError(err);
  }
};
