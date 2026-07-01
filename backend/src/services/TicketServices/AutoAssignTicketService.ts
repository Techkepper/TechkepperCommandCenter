import Queue from "../../models/Queue";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import { EmitTicketEvent } from "../../helpers/EmitTicketEvent";
import { logger } from "../../utils/logger";
import ShowTicketService from "./ShowTicketService";
import UpdateTicketService from "./UpdateTicketService";

const AutoAssignTicketService = async (ticket: Ticket): Promise<Ticket> => {
  if (ticket.status !== "pending" || ticket.userId || !ticket.queueId) {
    return ticket;
  }

  try {
    const candidates = await User.findAll({
      where: {
        profile: "agent",
        isActive: true,
        availabilityStatus: "available"
      },
      include: [
        {
          model: Queue,
          as: "queues",
          attributes: [],
          through: { attributes: [] },
          where: { id: ticket.queueId },
          required: true
        }
      ],
      order: [["id", "ASC"]]
    });

    if (!candidates.length) {
      logger.info(
        {
          eventType: "assignment_skipped_no_available_users",
          ticketId: ticket.id,
          queueId: ticket.queueId
        },
        "Automatic assignment skipped"
      );
      EmitTicketEvent(ticket, "assignmentAvailability", {
        action: "assignment_skipped_no_available_users",
        ticketId: ticket.id,
        queueId: ticket.queueId
      });
      return ticket;
    }

    const workloads = await Promise.all(
      candidates.map(async candidate => ({
        candidate,
        openTickets: await Ticket.count({
          where: { userId: candidate.id, status: "open" }
        })
      }))
    );
    workloads.sort(
      (left, right) =>
        left.openTickets - right.openTickets ||
        left.candidate.id - right.candidate.id
    );
    const selected = workloads[0].candidate;
    const { ticket: assignedTicket } = await UpdateTicketService({
      ticketData: { userId: selected.id, status: "open" },
      ticketId: ticket.id,
      performedByUserId: selected.id,
      performedByProfile: "system",
      assignmentAction: "auto_assignment"
    });
    return assignedTicket;
  } catch (error) {
    logger.warn(
      {
        eventType: "automatic_assignment_failed",
        ticketId: ticket.id,
        queueId: ticket.queueId,
        errorName: (error as Error).name
      },
      "Automatic assignment failed; ticket remains pending"
    );
    return ShowTicketService(ticket.id);
  }
};

export default AutoAssignTicketService;
