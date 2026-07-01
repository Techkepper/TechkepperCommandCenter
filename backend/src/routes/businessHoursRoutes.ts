import { Router } from "express";
import * as BusinessHoursController from "../controllers/BusinessHoursController";
import isAuth from "../middleware/isAuth";
import requireRole from "../middleware/requireRole";

const routes = Router();

routes.get(
  "/business-hours",
  isAuth,
  requireRole("admin"),
  BusinessHoursController.show
);
routes.put(
  "/business-hours",
  isAuth,
  requireRole("admin"),
  BusinessHoursController.update
);
routes.post(
  "/business-hours/special-dates",
  isAuth,
  requireRole("admin"),
  BusinessHoursController.storeSpecialDate
);
routes.put(
  "/business-hours/special-dates/:specialDateId",
  isAuth,
  requireRole("admin"),
  BusinessHoursController.updateSpecialDateEntry
);
routes.delete(
  "/business-hours/special-dates/:specialDateId",
  isAuth,
  requireRole("admin"),
  BusinessHoursController.removeSpecialDate
);

export default routes;
