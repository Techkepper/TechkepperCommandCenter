import { getIO } from "../libs/socket";

export const EmitUserEvent = (
  action: "create" | "update" | "delete",
  user?: Record<string, any>,
  userId?: number
): void => {
  const resolvedUserId = Number(user?.id || userId || 0);
  const io = getIO();
  let audience = io.to("role:admin");

  if (resolvedUserId) {
    audience = audience.to(`user:${resolvedUserId}`);
  }

  audience.emit("user", {
    action,
    ...(user ? { user } : {}),
    ...(userId ? { userId } : {})
  });
};

export const RevokeUserSockets = async (userId: string | number): Promise<void> => {
  const io = getIO();
  const socketIds = await io.in(`user:${userId}`).allSockets();

  socketIds.forEach(socketId => {
    io.sockets.sockets.get(socketId)?.disconnect(true);
  });
};
