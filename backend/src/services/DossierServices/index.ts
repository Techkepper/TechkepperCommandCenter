/* eslint-disable @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any */
import { Op } from "sequelize";

import CollaboratorDocument from "../../models/CollaboratorDocument";
import CommercialProposalEvent from "../../models/CommercialProposalEvent";
import InternalNotification from "../../models/InternalNotification";
import SmartDocument from "../../models/SmartDocument";
import SmartDocumentEvent from "../../models/SmartDocumentEvent";
import User from "../../models/User";
import ShowBusinessClientService from "../BusinessClientServices/ShowBusinessClientService";
import { listBusinessClientDocuments } from "../DocumentServices/BusinessClientDocumentService";
import { ensureDocumentAccess } from "../DocumentServices/documentPermissions";
import { showCollaborator } from "../CollaboratorServices";
import { listProposals } from "../CommercialProposalServices";

type Actor = { id: string; profile: string };

const pendingDocumentStatuses = ["in_review", "pending_signature", "rejected"];
const pendingProposalStatuses = ["in_review", "sent", "expired"];

const serializeDocument = (
  document: SmartDocument,
  allDocuments: SmartDocument[]
) => ({
  id: document.id,
  title: document.title,
  originalName: document.originalName,
  mimeType: document.mimeType,
  category: document.category,
  purpose: document.purpose,
  status: document.status,
  documentDate: document.documentDate,
  baseDocumentId: document.baseDocumentId,
  baseDocument: document.baseDocumentId
    ? (() => {
        const base = allDocuments.find(
          item => Number(item.id) === Number(document.baseDocumentId)
        );
        return base ? { id: base.id, title: base.title } : null;
      })()
    : null,
  relatedAddendums: allDocuments
    .filter(item => Number(item.baseDocumentId) === Number(document.id))
    .map(item => ({ id: item.id, title: item.title, status: item.status })),
  uploadedBy: document.uploadedBy
    ? { id: document.uploadedBy.id, name: document.uploadedBy.name }
    : null,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt
});

const serializeProposal = (
  proposal: Record<string, any>,
  includeInternal: boolean
) => ({
  id: proposal.id,
  proposalNumber: proposal.proposalNumber,
  title: proposal.title,
  status: proposal.status,
  subtotal: proposal.subtotal,
  ivaAmount: proposal.ivaAmount,
  total: proposal.total,
  currency: proposal.currency,
  offerDate: proposal.offerDate,
  generatedDocumentId: proposal.generatedDocumentId,
  createdBy: proposal.createdBy
    ? { id: proposal.createdBy.id, name: proposal.createdBy.name }
    : null,
  createdAt: proposal.createdAt,
  updatedAt: proposal.updatedAt,
  ...(includeInternal
    ? {
        desiredNetAmount: proposal.desiredNetAmount,
        sellerCommissionRate: proposal.sellerCommissionRate,
        externalCosts: proposal.externalCosts,
        thirdPartyLicenses: proposal.thirdPartyLicenses,
        additionalMarginRate: proposal.additionalMarginRate,
        estimatedCommission: proposal.estimatedCommission,
        estimatedNetAmount: proposal.estimatedNetAmount
      }
    : {})
});

const loadDocumentEvents = async (
  documentIds: number[]
): Promise<Record<string, any>[]> =>
  documentIds.length
    ? SmartDocumentEvent.findAll({
        where: { documentId: { [Op.in]: documentIds } },
        include: [{ model: User, as: "user", attributes: ["id", "name"] }],
        order: [["createdAt", "DESC"]]
      })
    : [];

const loadProposalEvents = async (
  proposalIds: number[]
): Promise<Record<string, any>[]> =>
  proposalIds.length
    ? CommercialProposalEvent.findAll({
        where: { proposalId: { [Op.in]: proposalIds } },
        include: [{ model: User, as: "user", attributes: ["id", "name"] }],
        order: [["createdAt", "DESC"]]
      })
    : [];

const loadNotifications = async ({
  documentIds,
  proposalIds,
  actor
}: {
  documentIds: number[];
  proposalIds: number[];
  actor: Actor;
}): Promise<Record<string, any>[]> => {
  const entityConditions: Record<string, unknown>[] = [];
  if (documentIds.length) {
    entityConditions.push({ documentId: { [Op.in]: documentIds } });
  }
  if (proposalIds.length) {
    entityConditions.push({ proposalId: { [Op.in]: proposalIds } });
  }
  if (!entityConditions.length) return [];

  try {
    return await InternalNotification.findAll({
      where: {
        [Op.and]: [
          { [Op.or]: entityConditions },
          ...(actor.profile === "admin" ? [] : [{ userId: Number(actor.id) }])
        ]
      },
      include: [{ model: User, as: "createdBy", attributes: ["id", "name"] }],
      order: [["createdAt", "DESC"]]
    });
  } catch (error) {
    const dbError = error as Error & {
      original?: { code?: string };
      parent?: { code?: string };
    };
    const code = dbError.original?.code || dbError.parent?.code;
    if (code === "ER_NO_SUCH_TABLE" || code === "ER_BAD_FIELD_ERROR") {
      return [];
    }
    throw error;
  }
};

const buildActivity = ({
  documentEvents,
  proposalEvents,
  notifications
}: {
  documentEvents: Record<string, any>[];
  proposalEvents: Record<string, any>[];
  notifications: Record<string, any>[];
}) =>
  [
    ...documentEvents.map(event => ({
      id: `document-${event.id}`,
      entityType: "document",
      entityId: event.documentId,
      eventType: event.eventType,
      previousStatus: event.previousStatus,
      newStatus: event.newStatus,
      comment: event.comment,
      user: event.user ? { id: event.user.id, name: event.user.name } : null,
      createdAt: event.createdAt
    })),
    ...proposalEvents.map(event => ({
      id: `proposal-${event.id}`,
      entityType: "proposal",
      entityId: event.proposalId,
      eventType: event.eventType,
      previousStatus: event.previousStatus,
      newStatus: event.newStatus,
      comment: event.comment,
      user: event.user ? { id: event.user.id, name: event.user.name } : null,
      createdAt: event.createdAt
    })),
    ...notifications.map(notification => ({
      id: `notification-${notification.id}`,
      entityType: notification.proposalId ? "proposal" : "document",
      entityId: notification.proposalId || notification.documentId,
      eventType: "internal_notification",
      previousStatus: null,
      newStatus: notification.status,
      comment: notification.message,
      user: notification.createdBy
        ? {
            id: notification.createdBy.id,
            name: notification.createdBy.name
          }
        : null,
      createdAt: notification.createdAt
    }))
  ].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );

const buildPermissions = (actor: Actor) => ({
  canManageDocuments:
    actor.profile === "admin" || actor.profile === "supervisor",
  canDownloadDocx: actor.profile === "admin" || actor.profile === "supervisor",
  canManageProposals:
    actor.profile === "admin" || actor.profile === "supervisor",
  canViewInternalProposalData:
    actor.profile === "admin" || actor.profile === "supervisor"
});

export const showBusinessClientDossier = async ({
  clientId,
  actor
}: {
  clientId: number;
  actor: Actor;
}) => {
  const client = await ShowBusinessClientService({ clientId, actor });
  const [documentResult, proposalResult] = await Promise.all([
    listBusinessClientDocuments(clientId, actor),
    listProposals({ actor, businessClientId: clientId })
  ]);
  const documents = documentResult.documents.filter(
    (document): document is SmartDocument => Boolean(document)
  );
  const { proposals } = proposalResult;
  const documentIds = documents.map(document => Number(document.id));
  const proposalIds = proposals.map(proposal => Number(proposal.id));
  const [documentEvents, proposalEvents, notifications] = await Promise.all([
    loadDocumentEvents(documentIds),
    loadProposalEvents(proposalIds),
    loadNotifications({ documentIds, proposalIds, actor })
  ]);
  const includeInternal =
    actor.profile === "admin" || actor.profile === "supervisor";
  const serializedDocuments = documents.map(document =>
    serializeDocument(document, documents)
  );
  const serializedProposals = proposals.map(proposal =>
    serializeProposal(proposal.toJSON(), includeInternal)
  );
  const pendingDocuments = serializedDocuments.filter(document =>
    pendingDocumentStatuses.includes(document.status)
  );
  const pendingProposals = serializedProposals.filter(proposal =>
    pendingProposalStatuses.includes(proposal.status)
  );

  return {
    entityType: "businessClient",
    entity: client,
    permissions: buildPermissions(actor),
    summary: {
      documentCount: serializedDocuments.length,
      proposalCount: serializedProposals.length,
      lastDocument: serializedDocuments[0] || null,
      lastProposal: serializedProposals[0] || null,
      pendingCount: pendingDocuments.length + pendingProposals.length
    },
    documents: serializedDocuments,
    proposals: serializedProposals,
    activity: buildActivity({
      documentEvents,
      proposalEvents,
      notifications
    }),
    pending: {
      documents: pendingDocuments,
      proposals: pendingProposals
    }
  };
};

export const showCollaboratorDossier = async ({
  collaboratorId,
  actor
}: {
  collaboratorId: number;
  actor: Actor;
}) => {
  const collaborator = await showCollaborator(collaboratorId, actor);
  const links = await CollaboratorDocument.findAll({
    where: { collaboratorId },
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
      if (!link.document) return false;
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
  const documentIds = documents.map(document => Number(document.id));
  const [documentEvents, notifications] = await Promise.all([
    loadDocumentEvents(documentIds),
    loadNotifications({ documentIds, proposalIds: [], actor })
  ]);
  const serializedDocuments = documents.map(document =>
    serializeDocument(document, documents)
  );
  const pendingDocuments = serializedDocuments.filter(document =>
    pendingDocumentStatuses.includes(document.status)
  );

  return {
    entityType: "collaborator",
    entity: collaborator,
    permissions: buildPermissions(actor),
    summary: {
      documentCount: serializedDocuments.length,
      proposalCount: 0,
      lastDocument: serializedDocuments[0] || null,
      lastProposal: null,
      pendingCount: pendingDocuments.length
    },
    documents: serializedDocuments,
    proposals: [],
    activity: buildActivity({
      documentEvents,
      proposalEvents: [],
      notifications
    }),
    pending: { documents: pendingDocuments, proposals: [] }
  };
};
