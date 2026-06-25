import { Router } from "express";

import * as InternalNotificationController from "../controllers/InternalNotificationController";
import isAuth from "../middleware/isAuth";

const internalNotificationRoutes = Router();

internalNotificationRoutes.get(
  "/internal-notifications",
  isAuth,
  InternalNotificationController.index
);
internalNotificationRoutes.patch(
  "/internal-notifications/:notificationId/read",
  isAuth,
  InternalNotificationController.markRead
);

export default internalNotificationRoutes;
