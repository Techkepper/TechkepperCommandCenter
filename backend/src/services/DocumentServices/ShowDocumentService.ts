import AppError from "../../errors/AppError";
import SmartDocument from "../../models/SmartDocument";
import User from "../../models/User";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import Queue from "../../models/Queue";
import Ecosystem from "../../models/Ecosystem";
import { ensureDocumentAccess } from "./documentPermissions";

interface Request {
  documentId: string | number;
  userId: string;
  userProfile: string;
}

const ShowDocumentService = async ({
  documentId,
  userId,
  userProfile
}: Request): Promise<SmartDocument> => {
  const document = await SmartDocument.findByPk(documentId, {
    include: [
      { model: User, as: "uploadedBy", attributes: ["id", "name", "email"] },
      { model: Contact, as: "contact", attributes: ["id", "name", "number"] },
      { model: Ticket, as: "ticket", attributes: ["id", "status"] },
      { model: Queue, as: "queue", attributes: ["id", "name", "color"] },
      { model: Ecosystem, as: "ecosystem", attributes: ["id", "name", "color"] }
    ]
  });

  if (!document) {
    throw new AppError("ERR_NO_DOCUMENT_FOUND", 404);
  }

  await ensureDocumentAccess(document, { id: userId, profile: userProfile });

  return document;
};

export default ShowDocumentService;
