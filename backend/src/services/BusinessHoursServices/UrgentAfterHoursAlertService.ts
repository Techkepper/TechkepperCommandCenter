import { Op } from "sequelize";
import AfterHoursAutoReplyEvent from "../../models/AfterHoursAutoReplyEvent";
import Ticket from "../../models/Ticket";
import { logger } from "../../utils/logger";
import SmtpEmailService from "../EmailServices/SmtpEmailService";
import ShowTicketService from "../TicketServices/ShowTicketService";
import {
  BusinessHoursEvaluation,
  evaluateBusinessHoursCondition,
  getBusinessHoursConfig
} from "./BusinessHoursService";

interface Request {
  ticket: Ticket;
  messageBody: string;
  receivedAt?: Date;
}

const inFlight = new Set<string>();

const safeError = (error: unknown): string =>
  error instanceof Error ? error.message.substring(0, 200) : "Unknown error";

const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const findUrgentKeyword = (
  messageBody: string,
  keywords: string[]
): string | null => {
  const normalizedMessage = normalizeText(messageBody);
  return (
    keywords.find(keyword =>
      normalizedMessage.includes(normalizeText(keyword.trim()))
    ) || null
  );
};

const conditionLabel = (
  replyType: NonNullable<BusinessHoursEvaluation["replyType"]>
): string => {
  if (replyType === "special_date") return "Fecha especial";
  if (replyType === "non_working_day") return "Día no laborable";
  return "Fuera de horario";
};

const buildEmailText = ({
  ticket,
  messageBody,
  receivedAt,
  timezone,
  condition
}: Request & { timezone: string; condition: string }): string => {
  const frontendUrl = (process.env.FRONTEND_URL || "").replace(/\/+$/, "");
  const conversationUrl = frontendUrl
    ? `${frontendUrl}/tickets/${ticket.id}`
    : "No configurado";
  const timestamp = new Intl.DateTimeFormat("es-CR", {
    timeZone: timezone,
    dateStyle: "full",
    timeStyle: "long"
  }).format(receivedAt || new Date());

  return [
    "Se recibió una solicitud urgente fuera del horario regular.",
    "",
    `Contacto: ${ticket.contact?.name || "Sin nombre"}`,
    `Número WhatsApp: ${ticket.contact?.number || "No disponible"}`,
    `Conversación/Ticket ID: ${ticket.id}`,
    `Fecha y hora: ${timestamp}`,
    `Condición: ${condition}`,
    `Conversación: ${conversationUrl}`,
    "",
    "Mensaje recibido:",
    messageBody.slice(0, 4000)
  ].join("\n");
};

const hasActiveUrgentEmailCooldown = async ({
  contactId,
  ticketId,
  cooldownMinutes
}: {
  contactId: number;
  ticketId: number;
  cooldownMinutes: number;
}): Promise<boolean> => {
  const cooldownStart = new Date(
    Date.now() - cooldownMinutes * 60 * 1000
  );
  const recentEvents = await AfterHoursAutoReplyEvent.findAll({
    where: {
      replyType: "urgent_email",
      status: "sent",
      createdAt: { [Op.gte]: cooldownStart },
      [Op.or]: [{ contactId }, { ticketId }]
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

const UrgentAfterHoursAlertService = async ({
  ticket,
  messageBody,
  receivedAt = new Date()
}: Request): Promise<void> => {
  let replyType: BusinessHoursEvaluation["replyType"] = null;
  try {
    const config = await getBusinessHoursConfig();
    if (!config.urgentEmailEnabled) {
      logger.info(
        { ticketId: ticket.id, reason: "disabled" },
        "urgent_after_hours_email_skipped"
      );
      return;
    }

    const keyword = findUrgentKeyword(messageBody, config.urgentKeywords);
    if (!keyword) {
      logger.info(
        { ticketId: ticket.id, reason: "no_urgent_keyword" },
        "urgent_after_hours_email_skipped"
      );
      return;
    }
    if (!config.urgentEmailRecipients.length) {
      logger.info(
        { ticketId: ticket.id, reason: "no_recipients" },
        "urgent_after_hours_email_skipped"
      );
      return;
    }

    const evaluation = await evaluateBusinessHoursCondition(receivedAt, config);
    replyType = evaluation.replyType;
    if (!replyType) {
      logger.info(
        { ticketId: ticket.id, reason: "inside_business_hours" },
        "urgent_after_hours_email_skipped"
      );
      return;
    }

    const lockKey = `${ticket.contactId}:${ticket.id}`;
    if (inFlight.has(lockKey)) {
      logger.info(
        { ticketId: ticket.id, reason: "in_flight" },
        "urgent_after_hours_email_skipped"
      );
      return;
    }

    inFlight.add(lockKey);
    try {
      if (
        await hasActiveUrgentEmailCooldown({
          contactId: ticket.contactId,
          ticketId: ticket.id,
          cooldownMinutes: config.urgentEmailCooldownMinutes
        })
      ) {
        logger.info(
          { ticketId: ticket.id, reason: "cooldown" },
          "urgent_after_hours_email_skipped"
        );
        return;
      }

      const hydratedTicket = await ShowTicketService(ticket.id);

      await SmtpEmailService({
        to: config.urgentEmailRecipients,
        subject: config.urgentEmailSubject,
        text: buildEmailText({
          ticket: hydratedTicket,
          messageBody,
          receivedAt,
          timezone: config.timezone,
          condition: conditionLabel(replyType)
        })
      });
      await AfterHoursAutoReplyEvent.create({
        contactId: ticket.contactId,
        ticketId: ticket.id,
        replyType: "urgent_email",
        status: "sent",
        detail: `condition:${replyType}`
      } as AfterHoursAutoReplyEvent);
      logger.info(
        {
          ticketId: ticket.id,
          contactId: ticket.contactId,
          condition: replyType,
          keyword
        },
        "urgent_after_hours_email_sent"
      );
    } finally {
      inFlight.delete(lockKey);
    }
  } catch (error) {
    const detail = safeError(error);
    await AfterHoursAutoReplyEvent.create({
      contactId: ticket.contactId,
      ticketId: ticket.id,
      replyType: "urgent_email",
      status: "failed",
      detail: replyType
        ? `condition:${replyType};error:${detail}`
        : `error:${detail}`
    } as AfterHoursAutoReplyEvent).catch(() => undefined);
    logger.warn(
      {
        ticketId: ticket.id,
        contactId: ticket.contactId,
        condition: replyType,
        error: detail
      },
      "urgent_after_hours_email_failed"
    );
  }
};

export { findUrgentKeyword };

export const getLatestUrgentEmailFailure = async (): Promise<{
  at: Date;
  detail: string;
} | null> => {
  const [lastFailure, lastSuccess] = await Promise.all([
    AfterHoursAutoReplyEvent.findOne({
      where: { replyType: "urgent_email", status: "failed" },
      order: [["createdAt", "DESC"]],
      attributes: ["detail", "createdAt"]
    }),
    AfterHoursAutoReplyEvent.findOne({
      where: { replyType: "urgent_email", status: "sent" },
      order: [["createdAt", "DESC"]],
      attributes: ["createdAt"]
    })
  ]);

  if (
    !lastFailure?.detail ||
    (lastSuccess &&
      lastSuccess.createdAt.getTime() >= lastFailure.createdAt.getTime())
  ) {
    return null;
  }

  return {
    at: lastFailure.createdAt,
    detail: lastFailure.detail
  };
};

export default UrgentAfterHoursAlertService;
