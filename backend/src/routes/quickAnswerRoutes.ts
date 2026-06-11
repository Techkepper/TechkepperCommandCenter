import express from "express";
import isAuth from "../middleware/isAuth";

import * as QuickAnswerController from "../controllers/QuickAnswerController";
import requireRole from "../middleware/requireRole";

const quickAnswerRoutes = express.Router();

quickAnswerRoutes.get("/quickAnswers", isAuth, QuickAnswerController.index);

quickAnswerRoutes.get(
  "/quickAnswers/:quickAnswerId",
  isAuth,
  QuickAnswerController.show
);

quickAnswerRoutes.post(
  "/quickAnswers",
  isAuth,
  requireRole("admin", "supervisor"),
  QuickAnswerController.store
);

quickAnswerRoutes.put(
  "/quickAnswers/:quickAnswerId",
  isAuth,
  requireRole("admin", "supervisor"),
  QuickAnswerController.update
);

quickAnswerRoutes.delete(
  "/quickAnswers/:quickAnswerId",
  isAuth,
  requireRole("admin", "supervisor"),
  QuickAnswerController.remove
);

export default quickAnswerRoutes;
