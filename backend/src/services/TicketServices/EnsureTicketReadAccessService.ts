import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import TicketAssignmentEvent from "../../models/TicketAssignmentEvent";
import User from "../../models/User";
import ShowUserService from "../UserServices/ShowUserService";

interface TicketReadAccess {
  actor: User;
  readOnly: boolean;
  canReply: boolean;
}

const EnsureTicketReadAccessService = async (
  ticket: Ticket,
  actorId: string | number,
  actorProfile: string
): Promise<TicketReadAccess> => {
  const actor = await ShowUserService(actorId);

  const queueIds = actor.queues?.map(queue => queue.id) || [];
  const queueAllowed = !ticket.queueId || queueIds.includes(ticket.queueId);
  const isAssigned = Number(ticket.userId) === Number(actor.id);
  const canReply = ticket.status === "open" && isAssigned;

  if (actorProfile === "admin") {
    return { actor, readOnly: false, canReply };
  }

  if (actorProfile === "supervisor" && queueAllowed) {
    return { actor, readOnly: false, canReply };
  }

  const isAvailable =
    ticket.status === "pending" && !ticket.userId && queueAllowed;

  if (isAssigned) {
    return { actor, readOnly: false, canReply };
  }

  if (isAvailable) {
    return { actor, readOnly: false, canReply: false };
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
      return { actor, readOnly: true, canReply: false };
    }
  }

  throw new AppError("ERR_NO_PERMISSION", 403);
};

export default EnsureTicketReadAccessService;
