import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import TicketAssignmentEvent from "../../models/TicketAssignmentEvent";
import User from "../../models/User";
import ShowUserService from "../UserServices/ShowUserService";

interface TicketReadAccess {
  actor: User;
  readOnly: boolean;
}

const EnsureTicketReadAccessService = async (
  ticket: Ticket,
  actorId: string | number,
  actorProfile: string
): Promise<TicketReadAccess> => {
  const actor = await ShowUserService(actorId);

  if (actorProfile === "admin") {
    return { actor, readOnly: false };
  }

  const queueIds = actor.queues?.map(queue => queue.id) || [];
  const queueAllowed = !ticket.queueId || queueIds.includes(ticket.queueId);

  if (actorProfile === "supervisor" && queueAllowed) {
    return { actor, readOnly: false };
  }

  const isAssigned = Number(ticket.userId) === Number(actor.id);
  const isAvailable =
    ticket.status === "pending" && !ticket.userId && queueAllowed;

  if (isAssigned || isAvailable) {
    return { actor, readOnly: false };
  }

  if (ticket.status === "closed" && queueAllowed) {
    const historicalAssignment = await TicketAssignmentEvent.findOne({
      where: {
        ticketId: ticket.id,
        [Op.or]: [{ oldUserId: actor.id }, { newUserId: actor.id }]
      },
      attributes: ["id"]
    });

    if (historicalAssignment) {
      return { actor, readOnly: true };
    }
  }

  throw new AppError("ERR_NO_PERMISSION", 403);
};

export default EnsureTicketReadAccessService;
