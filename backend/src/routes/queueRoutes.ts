import { Router } from "express";
import isAuth from "../middleware/isAuth";

import * as QueueController from "../controllers/QueueController";
import requireRole from "../middleware/requireRole";

const queueRoutes = Router();

queueRoutes.get("/queue", isAuth, QueueController.index);

queueRoutes.post("/queue", isAuth, requireRole("admin"), QueueController.store);

queueRoutes.get("/queue/:queueId", isAuth, QueueController.show);

queueRoutes.put(
  "/queue/:queueId",
  isAuth,
  requireRole("admin"),
  QueueController.update
);

queueRoutes.delete(
  "/queue/:queueId",
  isAuth,
  requireRole("admin"),
  QueueController.remove
);

export default queueRoutes;
