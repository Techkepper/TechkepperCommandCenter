import AppError from "../../errors/AppError";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { whatsappProvider, ProviderMessage } from "../../providers/WhatsApp";

import formatBody from "../../helpers/Mustache";
import CreateMessageService from "../MessageServices/CreateMessageService";

interface Request {
  body: string;
  ticket: Ticket;
  quotedMsg?: Message;
  skipProviderPersist?: boolean;
}

const SendWhatsAppMessage = async ({
  body,
  ticket,
  quotedMsg,
  skipProviderPersist = false
}: Request): Promise<ProviderMessage> => {
  if (!ticket.whatsappId) {
    throw new AppError("ERR_TICKET_NO_WHATSAPP");
  }

  const chatId = `${ticket.contact.number}@${ticket.isGroup ? "g" : "c"}.us`;
  const formattedBody = formatBody(body, ticket.contact);

  try {
    const sentMessage = await whatsappProvider.sendMessage(
      ticket.whatsappId,
      chatId,
      formattedBody,
      {
        quotedMessageId: quotedMsg?.id,
        quotedMessageFromMe: quotedMsg?.fromMe,
        linkPreview: false,
        skipPersist: skipProviderPersist
      }
    );

    await ticket.update({ lastMessage: formattedBody });
    if (skipProviderPersist) {
      await CreateMessageService({
        messageData: {
          id: sentMessage.id,
          ticketId: ticket.id,
          body: formattedBody,
          fromMe: true,
          read: true,
          mediaType: "chat",
          ack: sentMessage.ack !== undefined ? sentMessage.ack : 1
        }
      });
    }
    return sentMessage;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMessage;
