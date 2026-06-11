import { Op, WhereOptions, fn, col, where as sequelizeWhere } from "sequelize";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import Ecosystem from "../../models/Ecosystem";
import Queue from "../../models/Queue";
import Ticket from "../../models/Ticket";
import TicketAssignmentEvent from "../../models/TicketAssignmentEvent";
import User from "../../models/User";
import GetSettingValueService from "../SettingServices/GetSettingValueService";
import BuildTicketScope from "./BuildTicketScope";

export interface AgentHistoryFilters {
  agentId?: string;
  searchParam?: string;
  startDate?: string;
  endDate?: string;
  queueId?: string;
  status?: string;
  ecosystemId?: string;
}

const AgentHistoryService = async (
  requesterId: string,
  requesterProfile: string,
  filters: AgentHistoryFilters
) => {
  if (requesterProfile === "agent" || requesterProfile === "user") {
    const enabled = await GetSettingValueService("allowAgentHistory", "disabled");
    if (enabled !== "enabled") {
      throw new AppError("ERR_NO_PERMISSION", 403);
    }
    filters.agentId = requesterId;
  }

  const scope = await BuildTicketScope(requesterId, requesterProfile);
  const conditions: WhereOptions[] = [scope];

  if (filters.agentId) conditions.push({ userId: Number(filters.agentId) });
  if (filters.queueId) conditions.push({ queueId: Number(filters.queueId) });
  if (filters.status) conditions.push({ status: filters.status });
  if (filters.ecosystemId) {
    conditions.push({ ecosystemId: Number(filters.ecosystemId) });
  }
  if (filters.startDate || filters.endDate) {
    conditions.push({
      createdAt: {
        ...(filters.startDate
          ? { [Op.gte]: new Date(`${filters.startDate}T00:00:00`) }
          : {}),
        ...(filters.endDate
          ? { [Op.lte]: new Date(`${filters.endDate}T23:59:59`) }
          : {})
      }
    });
  }

  const contactInclude: any = {
    model: Contact,
    as: "contact",
    attributes: ["id", "name", "number"]
  };
  if (filters.searchParam) {
    const search = filters.searchParam.toLowerCase().trim();
    contactInclude.where = {
      [Op.or]: [
        sequelizeWhere(fn("LOWER", col("contact.name")), "LIKE", `%${search}%`),
        { number: { [Op.like]: `%${search}%` } }
      ]
    };
    contactInclude.required = true;
  }

  const tickets = await Ticket.findAll({
    where: { [Op.and]: conditions },
    include: [
      contactInclude,
      { model: User, as: "user", attributes: ["id", "name", "profile"] },
      { model: Queue, as: "queue", attributes: ["id", "name", "color"] },
      {
        model: Ecosystem,
        as: "ecosystem",
        attributes: ["id", "name", "color"]
      }
    ],
    order: [["updatedAt", "DESC"]],
    limit: 2000
  });

  const grouped = new Map<number, any>();
  tickets.forEach(ticket => {
    const contactId = ticket.contact.id;
    const current = grouped.get(contactId) || {
      contactId,
      contactName: ticket.contact.name,
      number: ticket.contact.number,
      agent: ticket.user?.name || "Sin asignar",
      firstServiceAt: ticket.createdAt,
      lastInteractionAt: ticket.updatedAt,
      total: 0,
      open: 0,
      pending: 0,
      closed: 0,
      lastTicket: null
    };
    current.total += 1;
    current[ticket.status] = (current[ticket.status] || 0) + 1;
    if (ticket.createdAt < current.firstServiceAt) {
      current.firstServiceAt = ticket.createdAt;
    }
    if (ticket.updatedAt >= current.lastInteractionAt) {
      current.lastInteractionAt = ticket.updatedAt;
      current.lastTicket = {
        id: ticket.id,
        status: ticket.status,
        queue: ticket.queue?.name || "",
        ecosystem: ticket.ecosystem?.name || ""
      };
    }
    grouped.set(contactId, current);
  });

  const selectedAgentId =
    filters.agentId ||
    (requesterProfile === "agent" || requesterProfile === "user"
      ? requesterId
      : undefined);
  const assignmentWhere: any = selectedAgentId
    ? { newUserId: Number(selectedAgentId) }
    : {};
  const [reassignments, manualTakes] = await Promise.all([
    TicketAssignmentEvent.count({
      where: { ...assignmentWhere, action: "reassignment" }
    }),
    TicketAssignmentEvent.count({
      where: { ...assignmentWhere, action: "take" }
    })
  ]);

  return {
    rows: Array.from(grouped.values()),
    metrics: {
      customers: grouped.size,
      conversations: tickets.length,
      open: tickets.filter(ticket => ticket.status === "open").length,
      pending: tickets.filter(ticket => ticket.status === "pending").length,
      closed: tickets.filter(ticket => ticket.status === "closed").length,
      reassignments,
      manualTakes
    },
    truncated: tickets.length === 2000
  };
};

export default AgentHistoryService;
