import AppError from "../../errors/AppError";
import SmartDocumentTemplate from "../../models/SmartDocumentTemplate";
import SmartDocumentTemplateVersion from "../../models/SmartDocumentTemplateVersion";
import User from "../../models/User";
import Queue from "../../models/Queue";
import Ecosystem from "../../models/Ecosystem";
import { ensureTemplateAccess } from "./templatePermissions";

interface Request {
  templateId: string | number;
  userId: string;
  userProfile: string;
}

const ShowDocumentTemplateService = async ({
  templateId,
  userId,
  userProfile
}: Request): Promise<SmartDocumentTemplate> => {
  const template = await SmartDocumentTemplate.findByPk(templateId, {
    include: [
      { model: User, as: "createdBy", attributes: ["id", "name", "email"] },
      { model: Queue, as: "queue", attributes: ["id", "name", "color"] },
      {
        model: Ecosystem,
        as: "ecosystem",
        attributes: ["id", "name", "color"]
      },
      {
        model: SmartDocumentTemplateVersion,
        as: "versions",
        required: false,
        separate: true,
        order: [["version", "DESC"]]
      }
    ]
  });

  if (!template) {
    throw new AppError("ERR_NO_DOCUMENT_TEMPLATE_FOUND", 404);
  }

  await ensureTemplateAccess(template, { id: userId, profile: userProfile });

  return template;
};

export default ShowDocumentTemplateService;
