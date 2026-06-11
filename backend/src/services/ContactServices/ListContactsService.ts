import { Sequelize, Op } from "sequelize";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import BuildTicketScope from "../ReportServices/BuildTicketScope";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  userId: string;
  userProfile: string;
}

interface Response {
  contacts: Contact[];
  count: number;
  hasMore: boolean;
}

const ListContactsService = async ({
  searchParam = "",
  pageNumber = "1",
  userId,
  userProfile
}: Request): Promise<Response> => {
  const ticketScope = await BuildTicketScope(userId, userProfile);
  const whereCondition = {
    [Op.or]: [
      {
        name: Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("name")),
          "LIKE",
          `%${searchParam.toLowerCase().trim()}%`
        )
      },
      { number: { [Op.like]: `%${searchParam.toLowerCase().trim()}%` } }
    ]
  };
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: contacts } = await Contact.findAndCountAll({
    where: whereCondition,
    include:
      userProfile === "admin"
        ? []
        : [
            {
              model: Ticket,
              as: "tickets",
              attributes: [],
              where: ticketScope,
              required: true
            }
          ],
    distinct: true,
    limit,
    offset,
    order: [["name", "ASC"]]
  });

  const hasMore = count > offset + contacts.length;

  return {
    contacts,
    count,
    hasMore
  };
};

export default ListContactsService;
