import { Op } from "sequelize";

import AppError from "../../errors/AppError";
import BusinessClient from "../../models/BusinessClient";
import Queue from "../../models/Queue";
import ShowUserService from "../UserServices/ShowUserService";
import { BusinessClientActor, BusinessClientData } from "./businessClientTypes";

const nullableText = (value?: string | null): string | null => {
  const normalized = value?.trim();
  return normalized || null;
};

export const normalizeIdentificationNumber = (value: string): string =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

export const normalizeBusinessClientData = (
  data: BusinessClientData
): BusinessClientData & { normalizedIdentificationNumber: string } => ({
  type: data.type,
  displayName: data.displayName.trim(),
  legalName: nullableText(data.legalName),
  tradeName: nullableText(data.tradeName),
  identificationType: data.identificationType.trim(),
  identificationNumber: data.identificationNumber.trim(),
  normalizedIdentificationNumber: normalizeIdentificationNumber(
    data.identificationNumber
  ),
  legalRepresentativeName: nullableText(data.legalRepresentativeName),
  legalRepresentativeId: nullableText(data.legalRepresentativeId),
  legalRepresentativePosition: nullableText(data.legalRepresentativePosition),
  email: nullableText(data.email)?.toLowerCase() || null,
  phone: nullableText(data.phone),
  address: nullableText(data.address),
  country: nullableText(data.country),
  province: nullableText(data.province),
  canton: nullableText(data.canton),
  district: nullableText(data.district),
  notes: nullableText(data.notes),
  queueId:
    data.queueId === undefined || data.queueId === null
      ? null
      : Number(data.queueId)
});

export const getActorQueueIds = async (
  actor: BusinessClientActor
): Promise<number[]> => {
  const user = await ShowUserService(actor.id);
  return user.queues.map(queue => Number(queue.id));
};

export const ensureBusinessClientQueueWriteAccess = async (
  actor: BusinessClientActor,
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

  const queueIds = await getActorQueueIds(actor);
  if (!queueIds.includes(queueId)) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
};

export const ensureBusinessClientReadAccess = async (
  client: BusinessClient,
  actor: BusinessClientActor
): Promise<void> => {
  if (actor.profile === "admin") return;
  if (client.queueId === null) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const queueIds = await getActorQueueIds(actor);
  if (!queueIds.includes(Number(client.queueId))) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
};

export const ensureUniqueIdentification = async (
  normalizedIdentificationNumber: string,
  excludedId?: number
): Promise<void> => {
  const duplicate = await BusinessClient.findOne({
    where: {
      normalizedIdentificationNumber,
      ...(excludedId ? { id: { [Op.ne]: excludedId } } : {})
    },
    paranoid: false
  });

  if (duplicate) {
    throw new AppError("ERR_DUPLICATED_BUSINESS_CLIENT", 409);
  }
};
