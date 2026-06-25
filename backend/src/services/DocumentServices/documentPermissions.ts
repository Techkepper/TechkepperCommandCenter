import { Op } from "sequelize";

import AppError from "../../errors/AppError";
import SmartDocument from "../../models/SmartDocument";
import Ticket from "../../models/Ticket";
import ShowUserService from "../UserServices/ShowUserService";
import BuildTicketScope from "../ReportServices/BuildTicketScope";

interface UserContext {
  id: string;
  profile: string;
}

export const getUserQueueIds = async (userId: string): Promise<number[]> => {
  const user = await ShowUserService(userId);
  return user.queues.map(queue => queue.id);
};

export const buildDocumentWhere = async (
  user: UserContext,
  searchParam = ""
): Promise<Record<string, unknown>> => {
  const trimmedSearch = searchParam.trim().toLowerCase();
  const searchWhere = trimmedSearch
    ? {
        [Op.or]: [
          { title: { [Op.like]: `%${trimmedSearch}%` } },
          { originalName: { [Op.like]: `%${trimmedSearch}%` } },
          { description: { [Op.like]: `%${trimmedSearch}%` } },
          { category: { [Op.like]: `%${trimmedSearch}%` } }
        ]
      }
    : {};

  if (user.profile === "admin") {
    return searchWhere;
  }

  const queueIds = await getUserQueueIds(user.id);
  const accessWhere = {
    [Op.or]: [
      { uploadedById: Number(user.id) },
      { queueId: null, ticketId: null },
      ...(queueIds.length ? [{ queueId: { [Op.in]: queueIds } }] : [])
    ]
  };

  return trimmedSearch ? { [Op.and]: [searchWhere, accessWhere] } : accessWhere;
};

export const ensureDocumentAccess = async (
  document: SmartDocument,
  user: UserContext
): Promise<void> => {
  if (user.profile === "admin") return;
  if (document.uploadedById === Number(user.id)) return;
  if (!document.queueId && !document.ticketId) return;

  const queueIds = await getUserQueueIds(user.id);
  if (document.queueId && queueIds.includes(Number(document.queueId))) return;

  if (document.ticketId) {
    const ticketScope = await BuildTicketScope(user.id, user.profile);
    const ticket = await Ticket.findOne({
      where: { [Op.and]: [ticketScope, { id: document.ticketId }] }
    });
    if (ticket) return;
  }

  throw new AppError("ERR_NO_PERMISSION", 403);
};

export const ensureDocumentWriteAccess = async (
  data: { queueId?: number | null; ticketId?: number | null },
  user: UserContext
): Promise<void> => {
  if (user.profile === "admin") return;

  const queueIds = await getUserQueueIds(user.id);
  if (data.queueId && queueIds.includes(Number(data.queueId))) return;

  if (data.ticketId) {
    const ticketScope = await BuildTicketScope(user.id, user.profile);
    const ticket = await Ticket.findOne({
      where: { [Op.and]: [ticketScope, { id: data.ticketId }] }
    });
    if (ticket) return;
  }

  if (!data.queueId && !data.ticketId) return;

  throw new AppError("ERR_NO_PERMISSION", 403);
};
