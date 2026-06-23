import { Op } from "sequelize";
import AppError from "../errors/AppError";
import Ticket from "../models/Ticket";

const CheckContactOpenTickets = async (
  contactId: number,
  whatsappId: number
): Promise<void> => {
  const activeStatuses = ["open", "assigned", "in_progress", "pending"];
  const ticket = await Ticket.findOne({
    where: { contactId, whatsappId, status: { [Op.or]: activeStatuses } }
  });

  if (ticket) {
    throw new AppError("ERR_OTHER_OPEN_TICKET");
  }
};

export default CheckContactOpenTickets;
