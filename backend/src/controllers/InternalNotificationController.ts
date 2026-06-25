import { Request, Response } from "express";

import {
  listUnreadInternalNotifications,
  markInternalNotificationRead
} from "../services/DocumentServices/InternalDocumentNotificationService";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const notifications = await listUnreadInternalNotifications(req.user.id);
  return res.json({ notifications });
};

export const markRead = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const notification = await markInternalNotificationRead({
    notificationId: req.params.notificationId,
    userId: req.user.id
  });
  return res.json(notification);
};
