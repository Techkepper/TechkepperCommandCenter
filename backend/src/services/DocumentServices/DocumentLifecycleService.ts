import { Transaction } from "sequelize";

import AppError from "../../errors/AppError";
import SmartDocument from "../../models/SmartDocument";
import SmartDocumentEvent from "../../models/SmartDocumentEvent";
import User from "../../models/User";
import sequelize from "../../database";
import ShowDocumentService from "./ShowDocumentService";
import {
  createDocumentStatusNotifications,
  emitInternalNotifications,
  validateDocumentNotificationRecipients
} from "./InternalDocumentNotificationService";

export const documentStatuses = [
  "draft",
  "generated",
  "in_review",
  "sent",
  "approved",
  "rejected",
  "archived",
  "pending_signature"
] as const;

export type DocumentStatus = (typeof documentStatuses)[number];

export const documentEventTypes = [
  "created",
  "generated",
  "uploaded",
  "uploaded_existing_document",
  "downloaded_docx",
  "downloaded_pdf",
  "status_changed",
  "associated_client",
  "associated_collaborator",
  "associated_base_document",
  "dropbox_sync_success",
  "dropbox_sync_failed",
  "deleted",
  "restored",
  "archived",
  "comment_added"
] as const;

export type DocumentEventType = (typeof documentEventTypes)[number];

const supervisorStatuses: DocumentStatus[] = [
  "draft",
  "generated",
  "in_review",
  "sent",
  "approved",
  "rejected",
  "archived"
];

const transitions: Record<DocumentStatus, DocumentStatus[]> = {
  draft: ["generated", "in_review", "archived"],
  generated: ["draft", "in_review", "sent", "archived", "pending_signature"],
  in_review: [
    "draft",
    "generated",
    "sent",
    "approved",
    "rejected",
    "archived",
    "pending_signature"
  ],
  sent: ["in_review", "approved", "rejected", "archived", "pending_signature"],
  approved: ["archived"],
  rejected: ["draft", "in_review", "archived"],
  archived: ["draft", "generated"],
  pending_signature: ["sent", "approved", "rejected", "archived"]
};

const statusLabels: Record<DocumentStatus, string> = {
  draft: "Borrador",
  generated: "Generado",
  in_review: "En revisión",
  sent: "Enviado",
  approved: "Aprobado",
  rejected: "Rechazado",
  archived: "Archivado",
  pending_signature: "Pendiente de firma"
};

export const isDocumentStatus = (value: unknown): value is DocumentStatus =>
  typeof value === "string" &&
  documentStatuses.includes(value as DocumentStatus);

export const normalizeDocumentStatus = (value: unknown): DocumentStatus =>
  isDocumentStatus(value) ? value : "generated";

export const recordDocumentEvent = async ({
  documentId,
  userId,
  eventType,
  previousStatus = null,
  newStatus = null,
  comment,
  metadata,
  transaction
}: {
  documentId: number;
  userId?: string | number | null;
  eventType: DocumentEventType;
  previousStatus?: DocumentStatus | null;
  newStatus?: DocumentStatus | null;
  comment?: string | null;
  metadata?: Record<string, unknown> | null;
  transaction?: Transaction;
}): Promise<SmartDocumentEvent> =>
  SmartDocumentEvent.create(
    {
      documentId,
      userId: userId === undefined || userId === null ? null : Number(userId),
      eventType,
      previousStatus,
      newStatus,
      comment: comment?.trim().slice(0, 2000) || null,
      metadata: metadata ? JSON.stringify(metadata) : null
    } as unknown as SmartDocumentEvent,
    { transaction }
  );

export const listDocumentEvents = async ({
  documentId,
  userId,
  userProfile
}: {
  documentId: string | number;
  userId: string;
  userProfile: string;
}): Promise<SmartDocumentEvent[]> => {
  const document = await ShowDocumentService({
    documentId,
    userId,
    userProfile
  });

  return SmartDocumentEvent.findAll({
    where: { documentId: document.id },
    include: [{ model: User, as: "user", attributes: ["id", "name"] }],
    order: [["createdAt", "DESC"]]
  });
};

export const updateDocumentStatus = async ({
  documentId,
  newStatus,
  comment,
  notificationUserIds = [],
  userId,
  userProfile
}: {
  documentId: string | number;
  newStatus: unknown;
  comment?: string;
  notificationUserIds?: unknown;
  userId: string;
  userProfile: string;
}): Promise<SmartDocument> => {
  if (userProfile !== "admin" && userProfile !== "supervisor") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  if (!isDocumentStatus(newStatus)) {
    throw new AppError("El estado documental seleccionado no es válido.", 400);
  }
  if (userProfile === "supervisor" && !supervisorStatuses.includes(newStatus)) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const document = await ShowDocumentService({
    documentId,
    userId,
    userProfile
  });
  const recipientIds = Array.isArray(notificationUserIds)
    ? notificationUserIds.map(Number)
    : [];
  if (recipientIds.length > 50) {
    throw new AppError("Puede notificar como máximo a 50 usuarios.", 400);
  }
  const recipients = await validateDocumentNotificationRecipients({
    document,
    recipientIds
  });
  const actor = await User.findByPk(userId, {
    attributes: ["id", "name", "email", "profile"]
  });
  if (!actor) throw new AppError("ERR_NO_USER_FOUND", 404);
  const previousStatus = normalizeDocumentStatus(document.status);
  if (previousStatus === newStatus) {
    throw new AppError("El documento ya tiene el estado seleccionado.", 400);
  }
  if (
    userProfile !== "admin" &&
    !transitions[previousStatus].includes(newStatus)
  ) {
    throw new AppError(
      `No es posible cambiar el documento de ${previousStatus} a ${newStatus}.`,
      400
    );
  }

  let notificationIds: number[] = [];
  await sequelize.transaction(async transaction => {
    await SmartDocument.update(
      { status: newStatus },
      { where: { id: document.id }, transaction }
    );
    await recordDocumentEvent({
      documentId: document.id,
      userId,
      eventType: newStatus === "archived" ? "archived" : "status_changed",
      previousStatus,
      newStatus,
      comment,
      metadata: recipients.length
        ? { notifiedUserIds: recipients.map(recipient => recipient.id) }
        : null,
      transaction
    });
    const notifications = await createDocumentStatusNotifications({
      document,
      recipients,
      createdBy: actor,
      status: newStatus,
      statusLabel: statusLabels[newStatus],
      comment,
      transaction
    });
    notificationIds = notifications.map(notification => notification.id);
  });

  await emitInternalNotifications(notificationIds);
  return ShowDocumentService({ documentId, userId, userProfile });
};
