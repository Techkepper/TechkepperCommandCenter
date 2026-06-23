import { getIO } from "../libs/socket";
import BusinessClient from "../models/BusinessClient";

export const EmitBusinessClientEvent = (
  action: "create" | "update",
  client: BusinessClient,
  additionalQueueIds: number[] = []
): void => {
  const rooms = new Set<string>(["role:admin"]);
  const queueIds = [client.queueId, ...additionalQueueIds].filter(
    (queueId): queueId is number => Boolean(queueId)
  );

  queueIds.forEach(queueId => {
    rooms.add(`role:supervisor:queue:${queueId}`);
    rooms.add(`role:agent:queue:${queueId}`);
  });

  const roomList = Array.from(rooms);
  let audience = getIO().to(roomList[0]);
  roomList.slice(1).forEach(room => {
    audience = audience.to(room);
  });

  audience.emit("businessClient", { action, client });
};
