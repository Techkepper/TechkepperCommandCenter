import { Op } from "sequelize";

import AppError from "../../errors/AppError";
import BusinessClient from "../../models/BusinessClient";
import BusinessClientDocument from "../../models/BusinessClientDocument";
import SmartDocument from "../../models/SmartDocument";
import User from "../../models/User";
import { ensureBusinessClientQueueWriteAccess } from "../BusinessClientServices/businessClientHelpers";
import ShowBusinessClientService from "../BusinessClientServices/ShowBusinessClientService";
import ShowDocumentService from "./ShowDocumentService";
import {
  ensureDocumentAccess,
  ensureDocumentWriteAccess
} from "./documentPermissions";

interface Actor {
  id: string;
  profile: string;
}

const isMissingTableError = (err: Error): boolean => {
  const databaseError = err as Error & {
    original?: { code?: string };
    parent?: { code?: string };
  };
  const code = databaseError.original?.code || databaseError.parent?.code;
  return code === "ER_NO_SUCH_TABLE" || code === "ER_BAD_FIELD_ERROR";
};

export const listDocumentClientLinks = async (
  documentIds: number[],
  actor: Actor
): Promise<{ installed: boolean; links: BusinessClientDocument[] }> => {
  if (!documentIds.length) return { installed: true, links: [] };

  try {
    const links = await BusinessClientDocument.findAll({
      where: { documentId: { [Op.in]: documentIds } },
      include: [
        {
          model: BusinessClient,
          as: "businessClient",
          attributes: ["id", "displayName", "type", "isActive"]
        },
        { model: SmartDocument, as: "document" }
      ]
    });
    const accessResults = await Promise.all(
      links.map(async link => {
        try {
          await ensureDocumentAccess(link.document, actor);
          return true;
        } catch {
          return false;
        }
      })
    );
    const accessibleLinks = links.filter((_, index) => accessResults[index]);
    return { installed: true, links: accessibleLinks };
  } catch (err) {
    if (isMissingTableError(err)) return { installed: false, links: [] };
    throw err;
  }
};

export const listBusinessClientDocuments = async (
  businessClientId: number,
  actor: Actor
): Promise<{ installed: boolean; documents: SmartDocument[] }> => {
  await ShowBusinessClientService({ clientId: businessClientId, actor });

  try {
    const links = await BusinessClientDocument.findAll({
      where: { businessClientId },
      include: [
        {
          model: SmartDocument,
          as: "document",
          include: [
            {
              model: User,
              as: "uploadedBy",
              attributes: ["id", "name", "email"]
            }
          ]
        }
      ],
      order: [["createdAt", "DESC"]]
    });
    const accessResults = await Promise.all(
      links.map(async link => {
        try {
          await ensureDocumentAccess(link.document, actor);
          return true;
        } catch {
          return false;
        }
      })
    );
    const documents = links
      .filter((_, index) => accessResults[index])
      .map(link => link.document);
    return { installed: true, documents };
  } catch (err) {
    if (isMissingTableError(err)) return { installed: false, documents: [] };
    throw err;
  }
};

export const setDocumentBusinessClient = async ({
  documentId,
  businessClientId,
  actor
}: {
  documentId: number;
  businessClientId: number | null;
  actor: Actor;
}): Promise<{ installed: boolean; link: BusinessClientDocument | null }> => {
  const document = await ShowDocumentService({
    documentId,
    userId: actor.id,
    userProfile: actor.profile
  });
  await ensureDocumentWriteAccess(
    { queueId: document.queueId, ticketId: document.ticketId },
    actor
  );

  try {
    if (businessClientId === null) {
      await BusinessClientDocument.destroy({ where: { documentId } });
      return { installed: true, link: null };
    }

    const client = await ShowBusinessClientService({
      clientId: businessClientId,
      actor
    });
    await ensureBusinessClientQueueWriteAccess(actor, client.queueId);

    const [link] = await BusinessClientDocument.upsert({
      documentId,
      businessClientId,
      linkedById: Number(actor.id)
    } as unknown as BusinessClientDocument);
    await link.reload({
      include: [
        {
          model: BusinessClient,
          as: "businessClient",
          attributes: ["id", "displayName", "type", "isActive"]
        }
      ]
    });
    return { installed: true, link };
  } catch (err) {
    if (isMissingTableError(err)) return { installed: false, link: null };
    if (err instanceof AppError) throw err;
    throw err;
  }
};
