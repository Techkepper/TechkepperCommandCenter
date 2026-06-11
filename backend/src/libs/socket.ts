import { Server as SocketIO } from "socket.io";
import { Server } from "http";
import { verify } from "jsonwebtoken";
import AppError from "../errors/AppError";
import { logger } from "../utils/logger";
import authConfig from "../config/auth";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import EnsureTicketAccessService from "../services/TicketServices/EnsureTicketAccessService";
import ShowUserService from "../services/UserServices/ShowUserService";

interface SocketTokenPayload {
  id: string;
  profile: string;
  tokenVersion: number;
  type: string;
}

let io: SocketIO;

export const initIO = (httpServer: Server): SocketIO => {
  const allowedOrigins = (
    process.env.FRONTEND_URL || "http://localhost:3000"
  )
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

  io = new SocketIO(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== "string" || !token) {
        return next(new Error("ERR_SESSION_EXPIRED"));
      }

      const decoded = verify(token, authConfig.secret, {
        algorithms: ["HS256"],
        issuer: authConfig.issuer,
        audience: authConfig.audience
      }) as SocketTokenPayload;

      if (decoded.type !== "access" || !decoded.id) {
        return next(new Error("ERR_SESSION_EXPIRED"));
      }

      const user = await ShowUserService(decoded.id);

      if (
        !user ||
        !user.isActive ||
        user.tokenVersion !== decoded.tokenVersion
      ) {
        return next(new Error("ERR_SESSION_EXPIRED"));
      }

      (socket as any).authenticatedUser = {
        id: String(user.id),
        profile: user.profile,
        queueIds: user.queues?.map(queue => queue.id) || []
      };
      return next();
    } catch (error) {
      logger.warn("Rejected unauthorized Socket.io connection");
      return next(new Error("ERR_SESSION_EXPIRED"));
    }
  });

  io.on("connection", socket => {
    const authenticatedUser = (socket as any).authenticatedUser as {
      id: string;
      profile: string;
      queueIds: number[];
    };

    socket.join(`user:${authenticatedUser.id}`);
    if (authenticatedUser.profile === "admin") {
      socket.join("role:admin");
    }
    if (authenticatedUser.profile === "supervisor") {
      authenticatedUser.queueIds.forEach(queueId => {
        socket.join(`role:supervisor:queue:${queueId}`);
      });
    }
    if (authenticatedUser.profile === "agent") {
      authenticatedUser.queueIds.forEach(queueId => {
        socket.join(`role:agent:queue:${queueId}`);
      });
    }
    logger.info("Client Connected");
    socket.on("joinChatBox", async (ticketId: string) => {
      try {
        const ticket = await ShowTicketService(ticketId);
        await EnsureTicketAccessService(
          ticket,
          authenticatedUser.id,
          authenticatedUser.profile
        );
        await socket.join(String(ticket.id));
        logger.info("An authorized client joined a ticket channel");
      } catch (err) {
        logger.warn(
          `Denied ticket channel ${ticketId} to user ${authenticatedUser.id}`
        );
      }
    });

    socket.on("joinNotification", () => {
      logger.debug("Legacy notification room request ignored");
    });

    socket.on("joinTickets", () => {
      logger.debug("Legacy ticket status room request ignored");
    });

    socket.on("disconnect", () => {
      logger.info("Client disconnected");
    });

    return socket;
  });
  return io;
};

export const getIO = (): SocketIO => {
  if (!io) {
    throw new AppError("Socket IO not initialized");
  }
  return io;
};
