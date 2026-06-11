import { getIO } from "../libs/socket";
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import { GetTicketAudienceRooms } from "./EmitTicketEvent";

export const EmitContactEvent = async (
  action: "create" | "update" | "delete",
  contact?: Contact,
  contactId?: number
): Promise<void> => {
  const resolvedContactId = contact?.id || contactId;
  const rooms = new Set<string>(["role:admin"]);

  if (resolvedContactId) {
    const tickets = await Ticket.findAll({
      where: { contactId: resolvedContactId },
      attributes: ["id", "status", "userId", "queueId"]
    });
    tickets.forEach(ticket => {
      GetTicketAudienceRooms(ticket).forEach(room => rooms.add(room));
    });
  }

  const roomList = Array.from(rooms);
  let audience = getIO().to(roomList[0]);
  roomList.slice(1).forEach(room => {
    audience = audience.to(room);
  });

  audience.emit("contact", {
    action,
    ...(contact ? { contact } : {}),
    ...(contactId ? { contactId } : {})
  });
};
