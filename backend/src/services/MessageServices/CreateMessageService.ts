import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import User from "../../models/User";
import Ecosystem from "../../models/Ecosystem";
import { EmitTicketEvent } from "../../helpers/EmitTicketEvent";

interface MessageData {
  id: string;
  ticketId: number;
  body: string;
  contactId?: number;
  fromMe?: boolean;
  read?: boolean;
  mediaType?: string;
  mediaUrl?: string;
  ack?: number;
  quotedMsgId?: string;
}
interface Request {
  messageData: MessageData;
}

const CreateMessageService = async ({
  messageData
}: Request): Promise<Message> => {
  await Message.upsert(messageData as any);

  const message = await Message.findByPk(messageData.id, {
    include: [
      "contact",
      {
        model: Ticket,
        as: "ticket",
        include: [
          "contact",
          "queue",
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "profile"]
          },
          {
            model: Ecosystem,
            as: "ecosystem",
            attributes: ["id", "name", "color"]
          },
          {
            model: Whatsapp,
            as: "whatsapp",
            attributes: ["id", "name", "status"]
          }
        ]
      },
      {
        model: Message,
        as: "quotedMsg",
        include: ["contact"]
      }
    ]
  });

  if (!message) {
    throw new Error("ERR_CREATING_MESSAGE");
  }

  EmitTicketEvent(
    message.ticket,
    "appMessage",
    {
      action: "create",
      message,
      ticket: message.ticket,
      contact: message.ticket.contact
    },
    [message.ticketId.toString()]
  );

  return message;
};

export default CreateMessageService;
