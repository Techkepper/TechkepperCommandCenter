import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as ReportController from "../controllers/ReportController";

const reportRoutes = Router();
reportRoutes.get("/reports/agent-history", isAuth, ReportController.agentHistory);
reportRoutes.get(
  "/reports/agent-history.csv",
  isAuth,
  ReportController.agentHistoryCsv
);

export default reportRoutes;
