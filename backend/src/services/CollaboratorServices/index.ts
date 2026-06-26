import { Op, Sequelize } from "sequelize";

import AppError from "../../errors/AppError";
import Collaborator from "../../models/Collaborator";
import Queue from "../../models/Queue";
import ShowUserService from "../UserServices/ShowUserService";

export interface CollaboratorActor {
  id: string;
  profile: string;
}

export interface CollaboratorData {
  fullName: string;
  identificationType: string;
  identificationNumber: string;
  contractualDenomination?: "LA CONTRATISTA" | "EL CONTRATISTA" | null;
  sex?: "female" | "male" | "unspecified";
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  queueId?: number | null;
}

const nullableText = (value?: string | null): string | null =>
  value?.trim() || null;

const normalizeIdentification = (value: string): string =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const actorQueueIds = async (actor: CollaboratorActor): Promise<number[]> => {
  const user = await ShowUserService(actor.id);
  return user.queues.map(queue => Number(queue.id));
};

const ensureQueueWriteAccess = async (
  actor: CollaboratorActor,
  queueId: number | null
): Promise<void> => {
  if (queueId !== null) {
    const queue = await Queue.findByPk(queueId, { attributes: ["id"] });
    if (!queue) throw new AppError("ERR_NO_QUEUE_FOUND", 404);
  }
  if (actor.profile === "admin") return;
  if (actor.profile !== "supervisor" || queueId === null) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  if (!(await actorQueueIds(actor)).includes(queueId)) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
};

const ensureReadAccess = async (
  collaborator: Collaborator,
  actor: CollaboratorActor
): Promise<void> => {
  if (actor.profile === "admin") return;
  if (
    collaborator.queueId === null ||
    !(await actorQueueIds(actor)).includes(Number(collaborator.queueId))
  ) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
};

const normalizeSex = (value?: string): "female" | "male" | "unspecified" =>
  value === "female" || value === "male" ? value : "unspecified";

const resolveContractualDenomination = (
  sex: "female" | "male" | "unspecified",
  requested?: string | null,
  current?: string | null
): "LA CONTRATISTA" | "EL CONTRATISTA" => {
  if (sex === "female") return "LA CONTRATISTA";
  if (sex === "male") return "EL CONTRATISTA";
  const preserved = requested || current;
  if (preserved === "LA CONTRATISTA" || preserved === "EL CONTRATISTA") {
    return preserved;
  }
  throw new AppError(
    "Complete el sexo o denominación contractual del colaborador.",
    400
  );
};

const normalizeData = (
  data: CollaboratorData,
  currentDenomination?: string | null
) => {
  const sex = normalizeSex(data.sex);
  return {
    fullName: data.fullName.trim(),
    identificationType: data.identificationType.trim(),
    identificationNumber: data.identificationNumber.trim(),
    normalizedIdentificationNumber: normalizeIdentification(
      data.identificationNumber
    ),
    contractualDenomination: resolveContractualDenomination(
      sex,
      data.contractualDenomination,
      currentDenomination
    ),
    sex,
    email: nullableText(data.email)?.toLowerCase() || null,
    phone: nullableText(data.phone),
    address: nullableText(data.address),
    notes: nullableText(data.notes),
    queueId:
      data.queueId === undefined || data.queueId === null
        ? null
        : Number(data.queueId)
  };
};

const include = [
  { model: Queue, as: "queue", attributes: ["id", "name", "color"] }
];

export const listCollaborators = async ({
  searchParam = "",
  pageNumber = "1",
  status = "active",
  actor
}: {
  searchParam?: string;
  pageNumber?: string;
  status?: string;
  actor: CollaboratorActor;
}): Promise<{
  collaborators: Collaborator[];
  count: number;
  hasMore: boolean;
}> => {
  const limit = 20;
  const offset = limit * (Number(pageNumber) - 1);
  const filters: Record<string, unknown>[] = [];
  if (searchParam.trim()) {
    filters.push({
      [Op.or]: [
        Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("fullName")),
          "LIKE",
          `%${searchParam.toLowerCase().trim()}%`
        ),
        { identificationNumber: { [Op.like]: `%${searchParam.trim()}%` } }
      ]
    });
  }
  if (status !== "all") filters.push({ isActive: status !== "inactive" });
  if (actor.profile !== "admin") {
    filters.push({ queueId: { [Op.in]: await actorQueueIds(actor) } });
  }
  const where = filters.length ? { [Op.and]: filters } : {};
  const { count, rows } = await Collaborator.findAndCountAll({
    where,
    include,
    limit,
    offset,
    order: [["fullName", "ASC"]]
  });
  return {
    collaborators: rows,
    count,
    hasMore: count > offset + rows.length
  };
};

export const showCollaborator = async (
  collaboratorId: string | number,
  actor: CollaboratorActor
): Promise<Collaborator> => {
  const collaborator = await Collaborator.findByPk(collaboratorId, { include });
  if (!collaborator) throw new AppError("ERR_NO_COLLABORATOR_FOUND", 404);
  await ensureReadAccess(collaborator, actor);
  return collaborator;
};

export const createCollaborator = async (
  data: CollaboratorData,
  actor: CollaboratorActor
): Promise<Collaborator> => {
  const normalized = normalizeData(data);
  await ensureQueueWriteAccess(actor, normalized.queueId);
  const duplicate = await Collaborator.findOne({
    where: {
      normalizedIdentificationNumber: normalized.normalizedIdentificationNumber
    },
    paranoid: false
  });
  if (duplicate) throw new AppError("ERR_DUPLICATED_COLLABORATOR", 409);
  const collaborator = await Collaborator.create({
    ...normalized,
    createdById: Number(actor.id),
    isActive: true
  } as unknown as Collaborator);
  return collaborator.reload({ include });
};

export const updateCollaborator = async (
  collaboratorId: string | number,
  data: CollaboratorData,
  actor: CollaboratorActor
): Promise<Collaborator> => {
  const collaborator = await showCollaborator(collaboratorId, actor);
  const normalized = normalizeData(data, collaborator.contractualDenomination);
  await ensureQueueWriteAccess(actor, normalized.queueId);
  const duplicate = await Collaborator.findOne({
    where: {
      normalizedIdentificationNumber: normalized.normalizedIdentificationNumber,
      id: { [Op.ne]: collaborator.id }
    },
    paranoid: false
  });
  if (duplicate) throw new AppError("ERR_DUPLICATED_COLLABORATOR", 409);
  await collaborator.update(normalized);
  return collaborator.reload({ include });
};

export const setCollaboratorStatus = async (
  collaboratorId: string | number,
  isActive: boolean,
  actor: CollaboratorActor
): Promise<Collaborator> => {
  const collaborator = await showCollaborator(collaboratorId, actor);
  await ensureQueueWriteAccess(actor, collaborator.queueId);
  await collaborator.update({ isActive });
  return collaborator.reload({ include });
};
