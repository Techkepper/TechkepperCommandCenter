import { Op } from "sequelize";
import SmartDocument from "../../models/SmartDocument";
import User from "../../models/User";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import Queue from "../../models/Queue";
import Ecosystem from "../../models/Ecosystem";
import { buildDocumentWhere } from "./documentPermissions";
import { isDocumentPurpose } from "./documentTaxonomy";
import { isDocumentStatus } from "./DocumentLifecycleService";
import { serializeSmartDocuments } from "./documentSerialization";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  purpose?: string;
  status?: string;
  userId: string;
  userProfile: string;
}

interface Response {
  documents: Record<string, unknown>[];
  count: number;
  hasMore: boolean;
}

const ListDocumentsService = async ({
  searchParam = "",
  pageNumber = "1",
  purpose,
  status,
  userId,
  userProfile
}: Request): Promise<Response> => {
  const limit = 20;
  const offset = limit * (+pageNumber - 1);
  const baseWhere = await buildDocumentWhere(
    { id: userId, profile: userProfile },
    searchParam
  );
  const purposeWhere =
    purpose && isDocumentPurpose(purpose)
      ? { [Op.and]: [baseWhere, { purpose }] }
      : baseWhere;
  const where =
    status && isDocumentStatus(status)
      ? { [Op.and]: [purposeWhere, { status }] }
      : purposeWhere;

  const { count, rows: documents } = await SmartDocument.findAndCountAll({
    where,
    include: [
      { model: User, as: "uploadedBy", attributes: ["id", "name", "email"] },
      { model: Contact, as: "contact", attributes: ["id", "name", "number"] },
      { model: Ticket, as: "ticket", attributes: ["id", "status"] },
      { model: Queue, as: "queue", attributes: ["id", "name", "color"] },
      { model: Ecosystem, as: "ecosystem", attributes: ["id", "name", "color"] }
    ],
    distinct: true,
    limit,
    offset,
    order: [["createdAt", "DESC"]]
  });

  return {
    documents: await serializeSmartDocuments(documents),
    count,
    hasMore: count > offset + documents.length
  };
};

export default ListDocumentsService;
