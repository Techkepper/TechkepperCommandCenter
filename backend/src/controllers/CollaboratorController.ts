import { Request, Response } from "express";
import * as Yup from "yup";

import AppError from "../errors/AppError";
import {
  CollaboratorData,
  createCollaborator,
  listCollaborators,
  setCollaboratorStatus,
  showCollaborator,
  updateCollaborator
} from "../services/CollaboratorServices";

const schema = Yup.object().shape({
  fullName: Yup.string().trim().min(2).max(255).required(),
  identificationType: Yup.string().trim().max(80).required(),
  identificationNumber: Yup.string().trim().max(80).required(),
  contractualDenomination: Yup.string()
    .oneOf(["LA CONTRATISTA", "EL CONTRATISTA"])
    .required(),
  email: Yup.string().trim().email().max(255).nullable(),
  phone: Yup.string().trim().max(80).nullable(),
  address: Yup.string().trim().max(500).nullable(),
  notes: Yup.string().trim().max(10000).nullable(),
  queueId: Yup.number().integer().positive().nullable()
});

const validate = async (data: CollaboratorData): Promise<void> => {
  try {
    await schema.validate(data, { abortEarly: false });
  } catch (err) {
    throw new AppError(err.message, 400);
  }
};

const rethrowDbError = (err: Error): never => {
  const dbError = err as Error & {
    original?: { code?: string };
    parent?: { code?: string };
  };
  const code = dbError.original?.code || dbError.parent?.code;
  if (code === "ER_NO_SUCH_TABLE" || code === "ER_BAD_FIELD_ERROR") {
    throw new AppError("ERR_COLLABORATORS_NOT_INSTALLED", 503);
  }
  if (code === "ER_DUP_ENTRY") {
    throw new AppError("ERR_DUPLICATED_COLLABORATOR", 409);
  }
  throw err;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  try {
    return res.json(
      await listCollaborators({
        searchParam: String(req.query.searchParam || ""),
        pageNumber: String(req.query.pageNumber || "1"),
        status: String(req.query.status || "active"),
        actor: req.user
      })
    );
  } catch (err) {
    return rethrowDbError(err);
  }
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  try {
    return res.json(
      await showCollaborator(req.params.collaboratorId, req.user)
    );
  } catch (err) {
    return rethrowDbError(err);
  }
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  await validate(req.body);
  try {
    return res.status(201).json(await createCollaborator(req.body, req.user));
  } catch (err) {
    return rethrowDbError(err);
  }
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await validate(req.body);
  try {
    return res.json(
      await updateCollaborator(req.params.collaboratorId, req.body, req.user)
    );
  } catch (err) {
    return rethrowDbError(err);
  }
};

export const setStatus = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (typeof req.body.isActive !== "boolean") {
    throw new AppError("El estado del colaborador no es válido.", 400);
  }
  try {
    return res.json(
      await setCollaboratorStatus(
        req.params.collaboratorId,
        req.body.isActive,
        req.user
      )
    );
  } catch (err) {
    return rethrowDbError(err);
  }
};
