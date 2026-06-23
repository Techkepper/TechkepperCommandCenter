import { Op, fn, where, col, Includeable } from "sequelize";
import { startOfDay, endOfDay, parseISO } from "date-fns";

import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Queue from "../../models/Queue";
import ShowUserService from "../UserServices/ShowUserService";
import Whatsapp from "../../models/Whatsapp";
import User from "../../models/User";
import Ecosystem from "../../models/Ecosystem";
import TicketAssignmentEvent from "../../models/TicketAssignmentEvent";
import { logger } from "../../utils/logger";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  status?: string;
  date?: string;
  showAll?: string;
  userId: string;
  userProfile: string;
  withUnreadMessages?: string;
  queueIds: number[];
  agentId?: string;
  ecosystemId?: string;
}

interface Response {
  tickets: Ticket[];
  count: number;
  hasMore: boolean;
}

const OPEN_STATUSES = ["open", "assigned", "in_progress"];
const CLOSED_STATUSES = ["closed", "resolved"];

const normalizeStatusGroup = (status?: string): string | undefined => {
  if (status === "resolved") return "closed";
  if (status === "assigned" || status === "in_progress") return "open";
  return status;
};

const ListTicketsService = async ({
  searchParam = "",
  pageNumber = "1",
  queueIds,
  status,
  date,
  showAll,
  userId,
  userProfile,
  withUnreadMessages,
  agentId,
  ecosystemId
}: Request): Promise<Response> => {
  const user = await ShowUserService(userId);
  const normalizedStatus = normalizeStatusGroup(status);
  const userQueueIds = user.queues?.map(queue => queue.id) || [];
  const requestedQueueIds = queueIds.length ? queueIds : userQueueIds;
  const allowedQueueIds =
    userProfile === "admin"
      ? requestedQueueIds
      : requestedQueueIds.filter(id => userQueueIds.includes(id));
  const includeHistoricalAssignments =
    (userProfile === "agent" || userProfile === "user") &&
    (normalizedStatus === "closed" || Boolean(searchParam));

  const andConditions: any[] = [];
  if (userProfile === "supervisor") {
    andConditions.push({
      queueId: { [Op.or]: [allowedQueueIds, null] }
    });
  } else if (userProfile !== "admin") {
    const ticketVisibility: any[] = [
      { userId: Number(userId) },
      { userId: null, status: "pending" }
    ];
    if (includeHistoricalAssignments) {
      ticketVisibility.push({
        [Op.and]: [
          { status: { [Op.in]: ["closed", "resolved"] } },
          { "$assignmentEvents.id$": { [Op.ne]: null } }
        ]
      });
    }
    andConditions.push({
      [Op.or]: ticketVisibility
    });
    andConditions.push({
      queueId: { [Op.or]: [allowedQueueIds, null] }
    });
  } else if (queueIds.length) {
    andConditions.push({ queueId: { [Op.in]: queueIds } });
  }

  if (
    showAll !== "true" &&
    userProfile !== "admin" &&
    userProfile !== "supervisor"
  ) {
    andConditions.push({
      [Op.or]: [{ userId: Number(userId) }, { status: "pending", userId: null }]
    });
  }

  if (normalizedStatus === "pending") {
    andConditions.push({ status: "pending", userId: null });
  } else if (normalizedStatus === "open") {
    andConditions.push({ status: { [Op.in]: OPEN_STATUSES } });
  } else if (normalizedStatus === "closed") {
    andConditions.push({ status: { [Op.in]: CLOSED_STATUSES } });
  } else if (normalizedStatus) {
    andConditions.push({ status: normalizedStatus });
  }
  if (agentId) {
    andConditions.push({ userId: Number(agentId) });
  }
  if (ecosystemId) {
    andConditions.push({ ecosystemId: Number(ecosystemId) });
  }
  if (date) {
    andConditions.push({
      createdAt: {
        [Op.between]: [+startOfDay(parseISO(date)), +endOfDay(parseISO(date))]
      }
    });
  }
  if (withUnreadMessages === "true") {
    andConditions.push({ unreadMessages: { [Op.gt]: 0 } });
  }

  let includeCondition: Includeable[] = [
    {
      model: Contact,
      as: "contact",
      attributes: ["id", "name", "number", "profilePicUrl"]
    },
    {
      model: Queue,
      as: "queue",
      attributes: ["id", "name", "color"]
    },
    {
      model: User,
      as: "user",
      attributes: ["id", "name", "profile"]
    },
    {
      model: Ecosystem,
      as: "ecosystem",
      attributes: ["id", "name", "color"]
    },
    {
      model: Whatsapp,
      as: "whatsapp",
      attributes: ["id", "name", "status"]
    }
  ];

  if (includeHistoricalAssignments) {
    includeCondition.push({
      model: TicketAssignmentEvent,
      as: "assignmentEvents",
      attributes: [],
      required: false,
      duplicating: false,
      where: {
        [Op.or]: [{ oldUserId: Number(userId) }, { newUserId: Number(userId) }]
      }
    });
  }

  if (searchParam) {
    const sanitizedSearchParam = searchParam.toLocaleLowerCase().trim();
    includeCondition = [
      ...includeCondition,
      {
        model: Message,
        as: "messages",
        attributes: ["id", "body"],
        required: false,
        duplicating: false
      }
    ];
    andConditions.push({
      [Op.or]: [
        {
          "$contact.name$": where(
            fn("LOWER", col("contact.name")),
            "LIKE",
            `%${sanitizedSearchParam}%`
          )
        },
        { "$contact.number$": { [Op.like]: `%${sanitizedSearchParam}%` } },
        {
          "$messages.body$": where(
            fn("LOWER", col("messages.body")),
            "LIKE",
            `%${sanitizedSearchParam}%`
          )
        }
      ]
    });
  }

  const limit = 40;
  const offset = limit * (+pageNumber - 1);
  const { count, rows: tickets } = await Ticket.findAndCountAll({
    where: andConditions.length ? { [Op.and]: andConditions } : {},
    include: includeCondition,
    distinct: true,
    subQuery: false,
    limit,
    offset,
    order: [["updatedAt", "DESC"]]
  });

  logger.debug(
    {
      status,
      normalizedStatus,
      userId,
      userProfile,
      queueIds,
      ecosystemId,
      showAll,
      pageNumber,
      count,
      returned: tickets.map(ticket => ({
        id: ticket.id,
        status: ticket.status,
        userId: ticket.userId,
        queueId: ticket.queueId,
        ecosystemId: ticket.ecosystemId
      }))
    },
    "Ticket list query result"
  );

  return {
    tickets,
    count,
    hasMore: count > offset + tickets.length
  };
};

export default ListTicketsService;
