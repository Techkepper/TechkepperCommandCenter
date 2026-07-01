import { Op } from "sequelize";
import AfterHoursAutoReplyEvent from "../../models/AfterHoursAutoReplyEvent";
import Ticket from "../../models/Ticket";
import { logger } from "../../utils/logger";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import ShowTicketService from "../TicketServices/ShowTicketService";
import {
  BusinessHoursEvaluation,
  evaluateBusinessHours,
  getBusinessHoursConfig
} from "./BusinessHoursService";

const inFlight = new Set<string>();

const AUTO_REPLY_TYPES = ["after_hours", "non_working_day", "special_date"];

const safeError = (error: unknown): string =>
  error instanceof Error ? error.message.substring(0, 200) : "Unknown error";

const hasActiveAfterHoursCooldown = async ({
  contactId,
  replyType,
  cooldownHours
}: {
  contactId: number;
  replyType: NonNullable<BusinessHoursEvaluation["replyType"]>;
  cooldownHours: number;
}): Promise<boolean> => {
  const cooldownStart = new Date(
    Date.now() - cooldownHours * 60 * 60 * 1000
  );
  const recentEvents = await AfterHoursAutoReplyEvent.findAll({
    where: {
      contactId,
      replyType,
      status: "sent",
      createdAt: { [Op.gte]: cooldownStart }
    },
    attributes: ["ticketId"]
  });

  if (!recentEvents.length) {
    return false;
  }

  const ticketIds = [...new Set(recentEvents.map(event => event.ticketId))];
  const existingTickets = await Ticket.findAll({
    where: { id: ticketIds },
    attributes: ["id"]
  });
  const existingTicketIds = new Set(existingTickets.map(ticket => ticket.id));

  return recentEvents.some(event => existingTicketIds.has(event.ticketId));
};

export const shouldSendAfterHoursAutoReply = async ({
  contactId,
  receivedAt = new Date()
}: {
  contactId: number;
  receivedAt?: Date;
}): Promise<boolean> => {
  const evaluation = await evaluateBusinessHours(receivedAt);
  if (!evaluation.replyType || !evaluation.message) {
    return false;
  }

  const config = await getBusinessHoursConfig();
  return !(await hasActiveAfterHoursCooldown({
    contactId,
    replyType: evaluation.replyType,
    cooldownHours: config.cooldownHours
  }));
};

export const shouldSkipConnectionGreeting = async ({
  contactId,
  ticketId,
  receivedAt = new Date()
}: {
  contactId: number;
  ticketId: number;
  receivedAt?: Date;
}): Promise<boolean> => {
  const evaluation = await evaluateBusinessHours(receivedAt);
  if (evaluation.replyType && evaluation.message) {
    return true;
  }

  const priorAutoReply = await AfterHoursAutoReplyEvent.findOne({
    where: {
      ticketId,
      status: "sent",
      replyType: { [Op.in]: AUTO_REPLY_TYPES }
    }
  });

  return Boolean(priorAutoReply);
};

interface AfterHoursAutoReplyRequest {
  ticket: Ticket;
  receivedAt?: Date;
}

const AfterHoursAutoReplyService = async ({
  ticket,
  receivedAt = new Date()
}: AfterHoursAutoReplyRequest): Promise<void> => {
  const evaluation = await evaluateBusinessHours(receivedAt);
  if (!evaluation.replyType || !evaluation.message) {
    logger.info(
      {
        ticketId: ticket.id,
        reason: "inside_business_hours_or_disabled",
        receivedAt: receivedAt.toISOString()
      },
      "after_hours_auto_reply_skipped"
    );
    return;
  }

  const key = `${ticket.contactId}:${evaluation.replyType}`;
  if (inFlight.has(key)) {
    logger.info(
      {
        ticketId: ticket.id,
        replyType: evaluation.replyType,
        reason: "in_flight"
      },
      "after_hours_auto_reply_skipped"
    );
    return;
  }

  inFlight.add(key);
  try {
    const config = await getBusinessHoursConfig();
    if (
      await hasActiveAfterHoursCooldown({
        contactId: ticket.contactId,
        replyType: evaluation.replyType,
        cooldownHours: config.cooldownHours
      })
    ) {
      logger.info(
        {
          ticketId: ticket.id,
          contactId: ticket.contactId,
          replyType: evaluation.replyType,
          reason: "cooldown"
        },
        "after_hours_auto_reply_skipped"
      );
      return;
    }

    const hydratedTicket = await ShowTicketService(ticket.id);

    await SendWhatsAppMessage({
      body: evaluation.message,
      ticket: hydratedTicket,
      skipProviderPersist: true
    });
    await AfterHoursAutoReplyEvent.create({
      contactId: ticket.contactId,
      ticketId: ticket.id,
      replyType: evaluation.replyType,
      status: "sent",
      detail: evaluation.specialDateId
        ? `specialDateId:${evaluation.specialDateId}`
        : null
    } as AfterHoursAutoReplyEvent);
    logger.info(
      {
        ticketId: ticket.id,
        contactId: ticket.contactId,
        replyType: evaluation.replyType,
        receivedAt: receivedAt.toISOString()
      },
      "after_hours_auto_reply_sent"
    );
  } catch (error) {
    const detail = safeError(error);
    await AfterHoursAutoReplyEvent.create({
      contactId: ticket.contactId,
      ticketId: ticket.id,
      replyType: evaluation.replyType,
      status: "failed",
      detail
    } as AfterHoursAutoReplyEvent).catch(() => undefined);
    logger.warn(
      {
        ticketId: ticket.id,
        contactId: ticket.contactId,
        replyType: evaluation.replyType,
        error: detail
      },
      "after_hours_auto_reply_failed"
    );
  } finally {
    inFlight.delete(key);
  }
};

export default AfterHoursAutoReplyService;
