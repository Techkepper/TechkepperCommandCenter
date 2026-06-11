import { getIO } from "../libs/socket";

interface TicketAudience {
  id: number;
  status?: string;
  userId?: number | null;
  queueId?: number | null;
}

export const GetTicketAudienceRooms = (
  ticket: TicketAudience,
  extraRooms: string[] = []
): string[] => {
  const rooms = new Set<string>(["role:admin", ...extraRooms]);

  if (ticket.queueId) {
    rooms.add(`role:supervisor:queue:${ticket.queueId}`);
  }

  if (ticket.userId) {
    rooms.add(`user:${ticket.userId}`);
  } else if (ticket.status === "pending" && ticket.queueId) {
    rooms.add(`role:agent:queue:${ticket.queueId}`);
  }

  return Array.from(rooms);
};

export const EmitTicketEvent = (
  ticket: TicketAudience,
  event: string,
  payload: Record<string, unknown>,
  extraRooms: string[] = []
): void => {
  const io = getIO();
  const rooms = GetTicketAudienceRooms(ticket, extraRooms);
  let audience = io.to(rooms[0]);

  rooms.slice(1).forEach(room => {
    audience = audience.to(room);
  });

  audience.emit(event, payload);
};
