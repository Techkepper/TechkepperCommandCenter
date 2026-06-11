import express from "express";
import isAuth from "../middleware/isAuth";

import * as ContactController from "../controllers/ContactController";
import * as ImportPhoneContactsController from "../controllers/ImportPhoneContactsController";
import requireRole from "../middleware/requireRole";

const contactRoutes = express.Router();

contactRoutes.post(
  "/contacts/import",
  isAuth,
  requireRole("admin"),
  ImportPhoneContactsController.store
);

contactRoutes.get("/contacts", isAuth, ContactController.index);

contactRoutes.get("/contacts/:contactId", isAuth, ContactController.show);

contactRoutes.post("/contacts", isAuth, ContactController.store);

contactRoutes.post("/contact", isAuth, ContactController.getContact);

contactRoutes.put("/contacts/:contactId", isAuth, ContactController.update);

contactRoutes.delete(
  "/contacts/:contactId",
  isAuth,
  requireRole("admin", "supervisor"),
  ContactController.remove
);

export default contactRoutes;
