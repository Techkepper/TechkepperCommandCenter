import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import { getIO } from "../../libs/socket";
import Ticket from "../../models/Ticket";
import TicketAssignmentEvent from "../../models/TicketAssignmentEvent";
import User from "../../models/User";
import { logger } from "../../utils/logger";
import AppError from "../../errors/AppError";
import GetSettingValueService from "../SettingServices/GetSettingValueService";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import ShowTicketService from "./ShowTicketService";
import { EmitTicketEvent } from "../../helpers/EmitTicketEvent";

interface TicketData {
  status?: string;
  userId?: number | null;
  queueId?: number | null;
  whatsappId?: number;
  ecosystemId?: number | null;
}

interface Request {
  ticketData: TicketData;
  ticketId: string | number;
  performedByUserId?: string | number;
  performedByProfile?: string;
}

interface Response {
  ticket: Ticket;
  oldStatus: string;
  oldUserId: number | undefined;
  assignmentEvent?: TicketAssignmentEvent;
}

const replaceTemplateVariables = (
  template: string,
  ticket: Ticket,
  agent: User,
  companyName: string,
  businessHours: string
): string => {
  const variables: Record<string, string> = {
    NOMBRE_AGENTE: agent.name || "",
    NOMBRE_CLIENTE: ticket.contact?.name || "",
    DEPARTAMENTO: ticket.queue?.name || "",
    EMPRESA: companyName,
    HORARIO_ATENCION: businessHours
  };

  return Object.keys(variables).reduce(
    (message, key) =>
      message.replace(new RegExp(`{${key}}`, "g"), variables[key]),
    template
  );
};

const UpdateTicketService = async ({
  ticketData,
  ticketId,
  performedByUserId,
  performedByProfile
}: Request): Promise<Response> => {
  const incomingUserId =
    ticketData.userId === null || ticketData.userId === undefined
      ? undefined
      : Number(ticketData.userId);

  if (
    incomingUserId &&
    (!ticketData.status || ticketData.status === "pending")
  ) {
    ticketData.status = "open";
  }

  if (ticketData.status === "pending") {
    ticketData.userId = null;
  }

  const ticket = await ShowTicketService(ticketId);
  await SetTicketMessagesAsRead(ticket);

  const oldStatus = ticket.status;
  const oldStatusIsClosed = oldStatus === "closed";
  const oldUserId = ticket.userId || undefined;
  const oldAudience = {
    id: ticket.id,
    status: ticket.status,
    userId: ticket.userId,
    queueId: ticket.queueId
  };
  const hasUserChange = Object.prototype.hasOwnProperty.call(
    ticketData,
    "userId"
  );
  const requestedUserId =
    ticketData.userId === null || ticketData.userId === undefined
      ? undefined
      : Number(ticketData.userId);
  const assignmentChanged =
    hasUserChange && Number(oldUserId || 0) !== Number(requestedUserId || 0);

  if (
    oldStatus === "pending" &&
    oldUserId &&
    requestedUserId &&
    Number(oldUserId) !== Number(requestedUserId) &&
    performedByProfile === "agent"
  ) {
    throw new AppError("ERR_TICKET_ALREADY_ASSIGNED", 409);
  }

  let newUser: User | null = null;
  if (assignmentChanged && requestedUserId) {
    newUser = await User.findByPk(requestedUserId);
    if (!newUser || !newUser.isActive) {
      throw new AppError("ERR_ASSIGNED_USER_INACTIVE", 400);
    }
  }

  if (ticketData.whatsappId && ticket.whatsappId !== ticketData.whatsappId) {
    await CheckContactOpenTickets(ticket.contactId, ticketData.whatsappId);
  }

  if (oldStatusIsClosed && ticketData.status !== "closed") {
    await CheckContactOpenTickets(ticket.contact.id, ticket.whatsappId);
  }

  const updateData: Record<string, unknown> = {};
  Object.entries(ticketData).forEach(([key, value]) => {
    if (value !== undefined) {
      updateData[key] = value;
    }
  });

  if (
    ticketData.status === "open" &&
    !ticket.firstResponseAt &&
    requestedUserId
  ) {
    updateData.firstResponseAt = new Date();
  }

  if (ticketData.status === "closed") {
    updateData.closedAt = new Date();
  } else if (ticketData.status && oldStatusIsClosed) {
    updateData.closedAt = null;
  }

  await ticket.update(updateData);
  await ticket.reload();

  let assignmentEvent: TicketAssignmentEvent | undefined;
  if (assignmentChanged) {
    let action = "assignment";
    if (oldUserId && requestedUserId) {
      action = "reassignment";
    } else if (
      requestedUserId &&
      Number(performedByUserId) === Number(requestedUserId)
    ) {
      action = "take";
    }

    assignmentEvent = await TicketAssignmentEvent.create({
      ticketId: ticket.id,
      oldUserId: oldUserId || null,
      newUserId: requestedUserId || null,
      performedByUserId: Number(
        performedByUserId || requestedUserId || oldUserId
      ),
      action,
      autoMessageStatus: requestedUserId ? "pending" : "not_applicable"
    } as any);

    if (newUser) {
      try {
        const [enabled, template, companyName, businessHours] =
          await Promise.all([
            GetSettingValueService("assignmentAutoMessage", "enabled"),
            GetSettingValueService(
              "assignmentMessageTemplate",
              "Hola, le saluda {EMPRESA}. Su solicitud ha sido asignada a {NOMBRE_AGENTE}, quien estará a cargo de brindarle seguimiento. Con gusto le atenderemos por este medio."
            ),
            GetSettingValueService("companyName", "Techkepper"),
            GetSettingValueService(
              "businessHours",
              "lunes a viernes de 9:00 a.m. a 5:00 p.m."
            )
          ]);

        if (enabled !== "enabled") {
          await assignmentEvent.update({ autoMessageStatus: "disabled" });
        } else if (
          !ticket.contact?.number ||
          ticket.whatsapp?.status !== "CONNECTED"
        ) {
          await assignmentEvent.update({
            autoMessageStatus: "skipped",
            autoMessageError:
              "La conexion de WhatsApp no esta activa o el contacto no es valido."
          });
        } else {
          const body = replaceTemplateVariables(
            template,
            ticket,
            newUser,
            companyName,
            businessHours
          );
          await SendWhatsAppMessage({ body, ticket });
          await assignmentEvent.update({ autoMessageStatus: "sent" });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        await assignmentEvent.update({
          autoMessageStatus: "failed",
          autoMessageError: message.substring(0, 500)
        });
        logger.error(
          { err, ticketId: ticket.id },
          "Assignment auto-message failed"
        );
      }
    }
  }

  const reloadedTicket = await ShowTicketService(ticket.id);
  if (
    reloadedTicket.status !== oldStatus ||
    Number(reloadedTicket.userId || 0) !== Number(oldUserId || 0)
  ) {
    EmitTicketEvent(oldAudience, "ticket", {
      action: "delete",
      ticketId: reloadedTicket.id
    });
  }

  EmitTicketEvent(
    reloadedTicket,
    "ticket",
    {
      action: "update",
      ticket: reloadedTicket
    },
    [ticketId.toString()]
  );

  if (assignmentEvent) {
    assignmentEvent =
      (await TicketAssignmentEvent.findByPk(assignmentEvent.id, {
        include: [
          { model: User, as: "oldUser", attributes: ["id", "name"] },
          { model: User, as: "newUser", attributes: ["id", "name"] },
          {
            model: User,
            as: "performedByUser",
            attributes: ["id", "name"]
          }
        ]
      })) || assignmentEvent;
    getIO().to(ticketId.toString()).emit("assignmentEvent", {
      action: "create",
      event: assignmentEvent
    });
  }

  return {
    ticket: reloadedTicket,
    oldStatus,
    oldUserId,
    assignmentEvent
  };
};

export default UpdateTicketService;
