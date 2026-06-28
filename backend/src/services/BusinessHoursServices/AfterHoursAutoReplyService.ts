import { Op } from "sequelize";
import AfterHoursAutoReplyEvent from "../../models/AfterHoursAutoReplyEvent";
import Ticket from "../../models/Ticket";
import { logger } from "../../utils/logger";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import {
  evaluateBusinessHours,
  getBusinessHoursConfig
} from "./BusinessHoursService";

const inFlight = new Set<string>();

const safeError = (error: unknown): string =>
  error instanceof Error ? error.message.substring(0, 200) : "Unknown error";

const AfterHoursAutoReplyService = async (ticket: Ticket): Promise<void> => {
  const evaluation = await evaluateBusinessHours();
  if (!evaluation.replyType || !evaluation.message) {
    logger.info(
      { ticketId: ticket.id, reason: "inside_business_hours_or_disabled" },
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
    const cooldownStart = new Date(
      Date.now() - config.cooldownHours * 60 * 60 * 1000
    );
    const previous = await AfterHoursAutoReplyEvent.findOne({
      where: {
        contactId: ticket.contactId,
        replyType: evaluation.replyType,
        status: "sent",
        createdAt: { [Op.gte]: cooldownStart }
      }
    });
    if (previous) {
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

    await SendWhatsAppMessage({
      body: evaluation.message,
      ticket,
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
        replyType: evaluation.replyType
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
