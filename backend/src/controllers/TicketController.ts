import { Request, Response } from "express";
import CreateTicketService from "../services/TicketServices/CreateTicketService";
import DeleteTicketService from "../services/TicketServices/DeleteTicketService";
import ListTicketsService from "../services/TicketServices/ListTicketsService";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import UpdateTicketService from "../services/TicketServices/UpdateTicketService";
import EnsureTicketAccessService from "../services/TicketServices/EnsureTicketAccessService";
import AppError from "../errors/AppError";
import TicketAssignmentEvent from "../models/TicketAssignmentEvent";
import User from "../models/User";
import { EmitTicketEvent } from "../helpers/EmitTicketEvent";
import EnsureTicketReadAccessService from "../services/TicketServices/EnsureTicketReadAccessService";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
  status: string;
  date: string;
  showAll: string;
  withUnreadMessages: string;
  queueIds: string;
  agentId: string;
  ecosystemId: string;
};

interface TicketData {
  contactId: number;
  status: string;
  queueId: number;
  userId: number;
  ecosystemId: number;
  whatsappId: number;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const {
    pageNumber,
    status,
    date,
    searchParam,
    showAll,
    queueIds: queueIdsStringified,
    withUnreadMessages,
    agentId,
    ecosystemId
  } = req.query as IndexQuery;

  const userId = req.user.id;

  let queueIds: number[] = [];

  if (queueIdsStringified) {
    queueIds = JSON.parse(queueIdsStringified);
  }

  const { tickets, count, hasMore } = await ListTicketsService({
    searchParam,
    pageNumber,
    status,
    date,
    showAll,
    userId,
    userProfile: req.user.profile,
    queueIds,
    withUnreadMessages,
    agentId,
    ecosystemId
  });

  return res.status(200).json({ tickets, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { contactId, status } = req.body as TicketData;
  const userId =
    req.user.profile === "agent"
      ? Number(req.user.id)
      : (req.body as TicketData).userId;

  const ticket = await CreateTicketService({ contactId, status, userId });

  EmitTicketEvent(ticket, "ticket", {
    action: "update",
    ticket
  });

  return res.status(200).json(ticket);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;

  const contact = await ShowTicketService(ticketId);
  const access = await EnsureTicketReadAccessService(
    contact,
    req.user.id,
    req.user.profile
  );

  return res.status(200).json({
    ...contact.get({ plain: true }),
    readOnly: access.readOnly,
    canReply: access.canReply
  });
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId } = req.params;
  const existingTicket = await ShowTicketService(ticketId);
  const actor = await EnsureTicketAccessService(
    existingTicket,
    req.user.id,
    req.user.profile
  );
  const ticketData: TicketData = { ...req.body };

  if (req.user.profile === "agent") {
    if (
      ticketData.userId &&
      Number(ticketData.userId) !== Number(req.user.id)
    ) {
      throw new AppError("ERR_NO_PERMISSION", 403);
    }
    if (ticketData.whatsappId) {
      throw new AppError("ERR_NO_PERMISSION", 403);
    }
    if (
      ticketData.queueId &&
      !actor.queues.some(queue => queue.id === Number(ticketData.queueId))
    ) {
      throw new AppError("ERR_NO_PERMISSION", 403);
    }
  }

  if (req.user.profile === "supervisor") {
    if (ticketData.whatsappId) {
      throw new AppError("ERR_NO_PERMISSION", 403);
    }
    if (
      ticketData.queueId &&
      !actor.queues.some(queue => queue.id === Number(ticketData.queueId))
    ) {
      throw new AppError("ERR_NO_PERMISSION", 403);
    }
  }

  const { ticket } = await UpdateTicketService({
    ticketData,
    ticketId,
    performedByUserId: req.user.id,
    performedByProfile: req.user.profile
  });

  return res.status(200).json(ticket);
};

export const assignmentEvents = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId } = req.params;
  const ticket = await ShowTicketService(ticketId);
  await EnsureTicketReadAccessService(ticket, req.user.id, req.user.profile);

  const events = await TicketAssignmentEvent.findAll({
    where: { ticketId },
    include: [
      { model: User, as: "oldUser", attributes: ["id", "name"] },
      { model: User, as: "newUser", attributes: ["id", "name"] },
      { model: User, as: "performedByUser", attributes: ["id", "name"] }
    ],
    order: [["createdAt", "DESC"]]
  });

  return res.status(200).json(events);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId } = req.params;

  const ticket = await DeleteTicketService(ticketId);

  EmitTicketEvent(
    ticket,
    "ticket",
    {
      action: "delete",
      ticketId: +ticketId
    },
    [String(ticketId)]
  );

  return res.status(200).json({ message: "ticket deleted" });
};
