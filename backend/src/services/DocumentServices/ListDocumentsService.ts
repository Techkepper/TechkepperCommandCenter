import { Op } from "sequelize";
import SmartDocument from "../../models/SmartDocument";
import User from "../../models/User";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import Queue from "../../models/Queue";
import Ecosystem from "../../models/Ecosystem";
import { buildDocumentWhere } from "./documentPermissions";
import { isDocumentPurpose } from "./documentTaxonomy";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  purpose?: string;
  userId: string;
  userProfile: string;
}

interface Response {
  documents: SmartDocument[];
  count: number;
  hasMore: boolean;
}

const ListDocumentsService = async ({
  searchParam = "",
  pageNumber = "1",
  purpose,
  userId,
  userProfile
}: Request): Promise<Response> => {
  const limit = 20;
  const offset = limit * (+pageNumber - 1);
  const baseWhere = await buildDocumentWhere(
    { id: userId, profile: userProfile },
    searchParam
  );
  const where =
    purpose && isDocumentPurpose(purpose)
      ? { [Op.and]: [baseWhere, { purpose }] }
      : baseWhere;

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
    documents,
    count,
    hasMore: count > offset + documents.length
  };
};

export default ListDocumentsService;
