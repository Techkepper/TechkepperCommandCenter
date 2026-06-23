import { Op, WhereOptions } from "sequelize";

import BusinessClient from "../../models/BusinessClient";
import Queue from "../../models/Queue";
import User from "../../models/User";
import { getActorQueueIds } from "./businessClientHelpers";
import { BusinessClientActor } from "./businessClientTypes";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  status?: "active" | "inactive" | "all";
  type?: "physical" | "legal";
  actor: BusinessClientActor;
}

interface Response {
  clients: BusinessClient[];
  count: number;
  hasMore: boolean;
}

const ListBusinessClientsService = async ({
  searchParam = "",
  pageNumber = "1",
  status = "active",
  type,
  actor
}: Request): Promise<Response> => {
  const limit = 20;
  const offset = limit * (Math.max(Number(pageNumber), 1) - 1);
  const conditions: WhereOptions[] = [];
  const search = searchParam.trim();

  if (search) {
    conditions.push({
      [Op.or]: [
        { displayName: { [Op.like]: `%${search}%` } },
        { legalName: { [Op.like]: `%${search}%` } },
        { tradeName: { [Op.like]: `%${search}%` } },
        { identificationNumber: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ]
    });
  }

  if (status !== "all") {
    conditions.push({ isActive: status === "active" });
  }

  if (type === "physical" || type === "legal") {
    conditions.push({ type });
  }

  if (actor.profile !== "admin") {
    const queueIds = await getActorQueueIds(actor);
    conditions.push({ queueId: { [Op.in]: queueIds } });
  }

  const where = conditions.length ? { [Op.and]: conditions } : {};
  const { count, rows: clients } = await BusinessClient.findAndCountAll({
    where,
    include: [
      { model: Queue, as: "queue", attributes: ["id", "name", "color"] },
      { model: User, as: "createdBy", attributes: ["id", "name"] }
    ],
    distinct: true,
    limit,
    offset,
    order: [
      ["isActive", "DESC"],
      ["displayName", "ASC"]
    ]
  });

  return {
    clients,
    count,
    hasMore: count > offset + clients.length
  };
};

export default ListBusinessClientsService;
