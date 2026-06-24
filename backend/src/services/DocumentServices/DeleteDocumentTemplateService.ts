import AppError from "../../errors/AppError";
import SmartDocumentTemplate from "../../models/SmartDocumentTemplate";
import SmartDocumentTemplateVersion from "../../models/SmartDocumentTemplateVersion";
import { removeDocumentFile } from "./documentStorage";
import ShowDocumentTemplateService from "./ShowDocumentTemplateService";

interface Request {
  templateId: string | number;
  userId: string;
  userProfile: string;
}

const DeleteDocumentTemplateService = async ({
  templateId,
  userId,
  userProfile
}: Request): Promise<void> => {
  if (userProfile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const template = await ShowDocumentTemplateService({
    templateId,
    userId,
    userProfile
  });

  const versions = template.versions || [];
  await Promise.all(
    versions.map(version => removeDocumentFile(version.storagePath))
  );

  await SmartDocumentTemplateVersion.destroy({
    where: { templateId: template.id }
  });
  await SmartDocumentTemplate.destroy({ where: { id: template.id } });
};

export default DeleteDocumentTemplateService;
