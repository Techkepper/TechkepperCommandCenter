import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import ShowUserService from "../UserServices/ShowUserService";

const EnsureTicketAccessService = async (
  ticket: Ticket,
  actorId: string | number,
  actorProfile: string
): Promise<User> => {
  const actor = await ShowUserService(actorId);

  if (actorProfile === "admin") {
    return actor;
  }

  const queueIds = actor.queues?.map(queue => queue.id) || [];
  const queueAllowed = !ticket.queueId || queueIds.includes(ticket.queueId);

  if (actorProfile === "supervisor" && queueAllowed) {
    return actor;
  }

  const isAssigned = Number(ticket.userId) === Number(actor.id);
  const isAvailable =
    ticket.status === "pending" && !ticket.userId && queueAllowed;

  if (isAssigned || isAvailable) {
    return actor;
  }

  throw new AppError("ERR_NO_PERMISSION", 403);
};

export default EnsureTicketAccessService;
