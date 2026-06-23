import { Op } from "sequelize";

import AppError from "../../errors/AppError";
import SmartDocumentTemplate from "../../models/SmartDocumentTemplate";
import { getUserQueueIds } from "./documentPermissions";

interface UserContext {
  id: string;
  profile: string;
}

export const buildTemplateWhere = async (
  user: UserContext,
  searchParam = ""
): Promise<Record<string, unknown>> => {
  const trimmedSearch = searchParam.trim().toLowerCase();
  const searchWhere = trimmedSearch
    ? {
        [Op.or]: [
          { name: { [Op.like]: `%${trimmedSearch}%` } },
          { description: { [Op.like]: `%${trimmedSearch}%` } },
          { category: { [Op.like]: `%${trimmedSearch}%` } }
        ]
      }
    : {};

  if (user.profile === "admin") {
    return searchWhere;
  }

  const queueIds = await getUserQueueIds(user.id);
  const accessWhere = {
    [Op.or]: [
      { createdById: Number(user.id) },
      ...(queueIds.length ? [{ queueId: { [Op.in]: queueIds } }] : [])
    ]
  };

  return trimmedSearch ? { [Op.and]: [searchWhere, accessWhere] } : accessWhere;
};

export const ensureTemplateAccess = async (
  template: SmartDocumentTemplate,
  user: UserContext
): Promise<void> => {
  if (user.profile === "admin") return;
  if (template.createdById === Number(user.id)) return;

  const queueIds = await getUserQueueIds(user.id);
  if (template.queueId && queueIds.includes(Number(template.queueId))) return;

  throw new AppError("ERR_NO_PERMISSION", 403);
};
