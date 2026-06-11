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
  const userQueueIds = user.queues?.map(queue => queue.id) || [];
  const requestedQueueIds = queueIds.length ? queueIds : userQueueIds;
  const allowedQueueIds =
    userProfile === "admin"
      ? requestedQueueIds
      : requestedQueueIds.filter(id => userQueueIds.includes(id));
  const includeHistoricalAssignments =
    (userProfile === "agent" || userProfile === "user") &&
    (status === "closed" || Boolean(searchParam));

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
          { status: "closed" },
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

  if (showAll !== "true" && userProfile !== "admin" && userProfile !== "supervisor") {
    andConditions.push({
      [Op.or]: [{ userId: Number(userId) }, { status: "pending" }]
    });
  }

  if (status) {
    andConditions.push({ status });
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
        [Op.or]: [
          { oldUserId: Number(userId) },
          { newUserId: Number(userId) }
        ]
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

  return {
    tickets,
    count,
    hasMore: count > offset + tickets.length
  };
};

export default ListTicketsService;
