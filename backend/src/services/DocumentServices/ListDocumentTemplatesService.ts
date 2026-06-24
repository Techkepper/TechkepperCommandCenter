import { Op } from "sequelize";

import SmartDocumentTemplate from "../../models/SmartDocumentTemplate";
import SmartDocumentTemplateVersion from "../../models/SmartDocumentTemplateVersion";
import User from "../../models/User";
import Queue from "../../models/Queue";
import Ecosystem from "../../models/Ecosystem";
import { buildTemplateWhere } from "./templatePermissions";
import { isDocumentPurpose } from "./documentTaxonomy";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  purpose?: string;
  documentType?: string;
  ecosystemId?: number;
  userId: string;
  userProfile: string;
}

interface Response {
  templates: SmartDocumentTemplate[];
  count: number;
  hasMore: boolean;
}

const ListDocumentTemplatesService = async ({
  searchParam = "",
  pageNumber = "1",
  purpose,
  documentType,
  ecosystemId,
  userId,
  userProfile
}: Request): Promise<Response> => {
  const limit = 20;
  const offset = limit * (+pageNumber - 1);
  const baseWhere = await buildTemplateWhere(
    { id: userId, profile: userProfile },
    searchParam
  );
  const filters: Record<string, unknown>[] = [baseWhere];
  if (purpose && isDocumentPurpose(purpose)) filters.push({ purpose });
  if (documentType) filters.push({ documentType });
  if (ecosystemId) filters.push({ ecosystemId });
  const where = filters.length > 1 ? { [Op.and]: filters } : baseWhere;

  const { count, rows: templates } =
    await SmartDocumentTemplate.findAndCountAll({
      where,
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
          where: { isActive: true },
          separate: true,
          limit: 1,
          order: [["version", "DESC"]]
        }
      ],
      distinct: true,
      limit,
      offset,
      order: [["updatedAt", "DESC"]]
    });

  return {
    templates,
    count,
    hasMore: count > offset + templates.length
  };
};

export default ListDocumentTemplatesService;
