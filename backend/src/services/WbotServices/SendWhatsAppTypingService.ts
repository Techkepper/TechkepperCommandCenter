import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { whatsappProvider } from "../../providers/WhatsApp";
import { logger } from "../../utils/logger";

const isWhatsappCloudMessageId = (messageId?: string | null): boolean =>
  Boolean(messageId && messageId.startsWith("wamid."));

const resolveCustomerMessageId = async (
  ticket: Ticket
): Promise<string | null> => {
  if (isWhatsappCloudMessageId(ticket.lastCustomerMessageId)) {
    return ticket.lastCustomerMessageId;
  }

  const lastInboundMessage = await Message.findOne({
    where: {
      ticketId: ticket.id,
      fromMe: false,
      isDeleted: false
    },
    order: [["createdAt", "DESC"]],
    attributes: ["id"]
  });

  if (!isWhatsappCloudMessageId(lastInboundMessage?.id)) {
    return null;
  }

  return lastInboundMessage!.id;
};

const SendWhatsAppTypingService = async (ticket: Ticket): Promise<void> => {
  if (!ticket.whatsappId) {
    logger.info(
      { ticketId: ticket.id },
      "Skipped WhatsApp typing indicator: ticket has no WhatsApp connection"
    );
    return;
  }

  const customerNumber = ticket.contact?.number;
  if (!customerNumber) {
    logger.info(
      { ticketId: ticket.id },
      "Skipped WhatsApp typing indicator: ticket has no contact number"
    );
    return;
  }

  const messageId = await resolveCustomerMessageId(ticket);
  if (!messageId) {
    logger.info(
      { ticketId: ticket.id },
      "Skipped WhatsApp typing indicator: no inbound WhatsApp message found"
    );
    return;
  }

  await whatsappProvider.sendTyping(
    ticket.whatsappId,
    messageId,
    customerNumber
  );
};

export default SendWhatsAppTypingService;
