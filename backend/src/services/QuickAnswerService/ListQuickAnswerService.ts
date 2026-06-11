import { Sequelize, Op } from "sequelize";
import QuickAnswer from "../../models/QuickAnswer";
import Queue from "../../models/Queue";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  profile?: string;
  queueIds?: number[];
}

interface Response {
  quickAnswers: QuickAnswer[];
  count: number;
  hasMore: boolean;
}

const ListQuickAnswerService = async ({
  searchParam = "",
  pageNumber = "1",
  profile = "agent",
  queueIds = []
}: Request): Promise<Response> => {
  const whereCondition: any = {
    message: Sequelize.where(
      Sequelize.fn("LOWER", Sequelize.col("message")),
      "LIKE",
      `%${searchParam.toLowerCase().trim()}%`
    )
  };
  if (profile !== "admin" && profile !== "supervisor") {
    whereCondition.isActive = true;
    whereCondition.queueId = { [Op.or]: [queueIds, null] };
  }

  const limit = 50;
  const offset = limit * (+pageNumber - 1);
  const { count, rows: quickAnswers } = await QuickAnswer.findAndCountAll({
    where: whereCondition,
    include: [{ model: Queue, as: "queue", attributes: ["id", "name", "color"] }],
    limit,
    offset,
    order: [["message", "ASC"]]
  });

  return {
    quickAnswers,
    count,
    hasMore: count > offset + quickAnswers.length
  };
};

export default ListQuickAnswerService;
