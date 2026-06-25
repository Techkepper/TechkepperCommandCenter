import { Op, Transaction } from "sequelize";

import AppError from "../../errors/AppError";
import { getIO } from "../../libs/socket";
import InternalNotification from "../../models/InternalNotification";
import SmartDocument from "../../models/SmartDocument";
import CommercialProposal from "../../models/CommercialProposal";
import User from "../../models/User";
import { logger } from "../../utils/logger";
import { ensureDocumentAccess } from "./documentPermissions";

const notificationIncludes = [
  { model: User, as: "createdBy", attributes: ["id", "name"] },
  {
    model: SmartDocument,
    as: "document",
    attributes: ["id", "title", "status"]
  },
  {
    model: CommercialProposal,
    as: "proposal",
    attributes: ["id", "title", "status"]
  }
];

export const listEligibleDocumentNotificationUsers = async ({
  document,
  searchParam = ""
}: {
  document: SmartDocument;
  searchParam?: string;
}): Promise<User[]> => {
  const search = searchParam.trim();
  const users = await User.findAll({
    where: {
      isActive: true,
      ...(search
        ? {
            [Op.or]: [
              { name: { [Op.like]: `%${search}%` } },
              { email: { [Op.like]: `%${search}%` } }
            ]
          }
        : {})
    },
    attributes: ["id", "name", "email", "profile"],
    include: ["queues"],
    order: [["name", "ASC"]],
    limit: 100
  });

  const accessResults = await Promise.all(
    users.map(async user => {
      try {
        await ensureDocumentAccess(document, {
          id: String(user.id),
          profile: user.profile
        });
        return user;
      } catch (error) {
        if (!(error instanceof AppError) || error.statusCode !== 403) {
          throw error;
        }
        return null;
      }
    })
  );
  return accessResults.filter((user): user is User => user !== null);
};

export const validateDocumentNotificationRecipients = async ({
  document,
  recipientIds
}: {
  document: SmartDocument;
  recipientIds: number[];
}): Promise<User[]> => {
  const uniqueIds = Array.from(
    new Set(
      recipientIds.map(Number).filter(id => Number.isInteger(id) && id > 0)
    )
  );
  if (!uniqueIds.length) return [];

  const users = await User.findAll({
    where: { id: { [Op.in]: uniqueIds }, isActive: true },
    attributes: ["id", "name", "email", "profile"]
  });
  if (users.length !== uniqueIds.length) {
    throw new AppError(
      "Uno o más usuarios seleccionados no existen o están inactivos.",
      400
    );
  }

  await Promise.all(
    users.map(async user => {
      try {
        await ensureDocumentAccess(document, {
          id: String(user.id),
          profile: user.profile
        });
      } catch (error) {
        if (error instanceof AppError && error.statusCode === 403) {
          throw new AppError(
            `${user.name} no tiene acceso al documento seleccionado.`,
            403
          );
        }
        throw error;
      }
    })
  );
  return users;
};

export const createDocumentStatusNotifications = async ({
  document,
  recipients,
  createdBy,
  status,
  statusLabel,
  comment,
  transaction
}: {
  document: SmartDocument;
  recipients: User[];
  createdBy: User;
  status: string;
  statusLabel: string;
  comment?: string;
  transaction: Transaction;
}): Promise<InternalNotification[]> => {
  if (!recipients.length) return [];
  const title = "Nuevo documento para revisión o seguimiento";
  const message = `${createdBy.name} cambió el estado de ${document.title} a ${statusLabel}.`;

  return InternalNotification.bulkCreate(
    recipients.map(recipient => ({
      userId: recipient.id,
      createdById: createdBy.id,
      type: "document_status_change",
      title,
      message,
      documentId: document.id,
      status,
      comment: comment?.trim().slice(0, 2000) || null,
      readAt: null
    })) as unknown as InternalNotification[],
    { transaction, returning: true }
  );
};

export const emitInternalNotifications = async (
  notificationIds: number[]
): Promise<void> => {
  if (!notificationIds.length) return;
  const notifications = await InternalNotification.findAll({
    where: { id: { [Op.in]: notificationIds } },
    include: notificationIncludes
  });
  try {
    const io = getIO();
    notifications.forEach(notification => {
      io.to(`user:${notification.userId}`).emit("internalNotification", {
        action: "create",
        notification
      });
    });
  } catch (error) {
    logger.warn(
      { notificationCount: notifications.length },
      "Document notifications were persisted but socket delivery was unavailable"
    );
  }
};

export const listUnreadInternalNotifications = async (
  userId: string
): Promise<InternalNotification[]> =>
  InternalNotification.findAll({
    where: { userId: Number(userId), readAt: null },
    include: notificationIncludes,
    order: [["createdAt", "DESC"]],
    limit: 50
  });

export const markInternalNotificationRead = async ({
  notificationId,
  userId
}: {
  notificationId: string;
  userId: string;
}): Promise<InternalNotification> => {
  const notification = await InternalNotification.findOne({
    where: { id: Number(notificationId), userId: Number(userId) }
  });
  if (!notification) {
    throw new AppError("ERR_INTERNAL_NOTIFICATION_NOT_FOUND", 404);
  }
  if (!notification.readAt) {
    await notification.update({ readAt: new Date() });
  }
  return notification;
};
