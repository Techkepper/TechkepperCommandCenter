import { Op, WhereOptions } from "sequelize";
import ShowUserService from "../UserServices/ShowUserService";

const BuildTicketScope = async (
  userId: string | number,
  profile: string
): Promise<WhereOptions> => {
  if (profile === "admin") {
    return {};
  }

  const user = await ShowUserService(userId);
  const queueIds = user.queues?.map(queue => queue.id) || [];
  const queueScope = { queueId: { [Op.or]: [queueIds, null] } };

  if (profile === "supervisor") {
    return queueScope;
  }

  return {
    [Op.and]: [
      queueScope,
      {
        [Op.or]: [
          { userId: Number(userId) },
          { userId: null, status: "pending" }
        ]
      }
    ]
  };
};

export default BuildTicketScope;
