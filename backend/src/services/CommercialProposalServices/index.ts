import path from "path";
import { promises as fs } from "fs";
import {
  Op,
  Transaction,
  UniqueConstraintError,
  WhereOptions
} from "sequelize";

import sequelize from "../../database";
import AppError from "../../errors/AppError";
import { getIO } from "../../libs/socket";
import BusinessClient from "../../models/BusinessClient";
import BusinessClientDocument from "../../models/BusinessClientDocument";
import CommercialProposal from "../../models/CommercialProposal";
import CommercialProposalEvent from "../../models/CommercialProposalEvent";
import CommercialProposalItem from "../../models/CommercialProposalItem";
import CommercialProposalPaymentMilestone from "../../models/CommercialProposalPaymentMilestone";
import InternalNotification from "../../models/InternalNotification";
import Queue from "../../models/Queue";
import SmartDocument from "../../models/SmartDocument";
import User from "../../models/User";
import { logger } from "../../utils/logger";
import { getActorQueueIds } from "../BusinessClientServices/businessClientHelpers";
import ConvertDocumentToPdfService from "../DocumentServices/ConvertDocumentToPdfService";
import {
  removeDocumentFile,
  resolveDocumentPath,
  saveDocumentBuffer
} from "../DocumentServices/documentStorage";
import { renderDocxTemplate } from "../DocumentServices/docxTemplateEngine";
import { recordDocumentEvent } from "../DocumentServices/DocumentLifecycleService";

export const proposalStatuses = [
  "draft",
  "in_review",
  "sent",
  "accepted",
  "rejected",
  "expired",
  "converted_to_contract",
  "archived"
] as const;

type ProposalStatus = (typeof proposalStatuses)[number];
type Actor = { id: string; profile: string };
export type ProposalDocumentVariant = "formal" | "quick";

interface ProposalItemData {
  title: string;
  description?: string | null;
  includedItems?: string[];
  subtotal?: number;
  isIncluded?: boolean;
}

interface MilestoneData {
  name: string;
  percentage: number;
  description?: string | null;
}

interface ProposalCalculation {
  desiredNetAmount: number;
  sellerCommissionRate: number;
  externalCosts: number;
  thirdPartyLicenses: number;
  additionalMarginRate: number;
  recommendedSubtotal: number;
  discountAmount: number;
  ivaRate: number;
  subtotal: number;
  estimatedCommission: number;
  estimatedNetAmount: number;
  ivaAmount: number;
  total: number;
  belowDesiredNet: boolean;
}

export interface ProposalData {
  businessClientId?: number | null;
  manualClientName?: string | null;
  manualClientEmail?: string | null;
  manualClientPhone?: string | null;
  manualClientIdentification?: string | null;
  clientNumber: string;
  proposalNumber?: string;
  offerDate: string;
  title: string;
  introduction?: string | null;
  identifiedNeed?: string | null;
  generalScope?: string | null;
  investmentAnalysis?: string | null;
  currency: "CRC" | "USD";
  desiredNetAmount?: number;
  sellerCommissionRate?: number;
  externalCosts?: number;
  thirdPartyLicenses?: number;
  additionalMarginRate?: number;
  discountAmount?: number;
  ivaRate?: number;
  manualSubtotal?: number | null;
  roundFinalPrice?: boolean;
  showIvi?: boolean;
  paymentTermsText?: string | null;
  projectTimeline?: string | null;
  termsText?: string | null;
  futureRecommendation?: string | null;
  queueId?: number | null;
  items?: ProposalItemData[];
  milestones?: MilestoneData[];
}

const money = (value: unknown): number => {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new AppError("Los montos deben ser números positivos.", 400);
  }
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
};

const rate = (value: unknown): number => {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new AppError("Los porcentajes deben estar entre 0 y 100.", 400);
  }
  return parsed;
};

export const calculateProposalProfitability = (data: {
  desiredNetAmount?: number;
  sellerCommissionRate?: number;
  externalCosts?: number;
  thirdPartyLicenses?: number;
  additionalMarginRate?: number;
  discountAmount?: number;
  ivaRate?: number;
  manualSubtotal?: number | null;
  roundFinalPrice?: boolean;
}): ProposalCalculation => {
  const desiredNetAmount = money(data.desiredNetAmount);
  const externalCosts = money(data.externalCosts);
  const thirdPartyLicenses = money(data.thirdPartyLicenses);
  const discountAmount = money(data.discountAmount);
  const sellerCommissionRate = rate(data.sellerCommissionRate);
  const additionalMarginRate = rate(data.additionalMarginRate);
  const ivaRate = rate(data.ivaRate);
  const divisor = 1 - sellerCommissionRate / 100 - additionalMarginRate / 100;
  if (divisor <= 0) {
    throw new AppError(
      "La comisión y el margen adicional deben sumar menos de 100%.",
      400
    );
  }

  let recommendedSubtotal =
    (desiredNetAmount + externalCosts + thirdPartyLicenses) / divisor;
  if (data.roundFinalPrice)
    recommendedSubtotal = Math.ceil(recommendedSubtotal);
  recommendedSubtotal = money(recommendedSubtotal);
  const baseSubtotal =
    data.manualSubtotal === null || data.manualSubtotal === undefined
      ? recommendedSubtotal
      : money(data.manualSubtotal);
  const subtotal = money(Math.max(0, baseSubtotal - discountAmount));
  const estimatedCommission = money(subtotal * (sellerCommissionRate / 100));
  const estimatedNetAmount = money(
    subtotal - estimatedCommission - externalCosts - thirdPartyLicenses
  );
  const ivaAmount = money(subtotal * (ivaRate / 100));
  const total = money(subtotal + ivaAmount);

  return {
    desiredNetAmount,
    sellerCommissionRate,
    externalCosts,
    thirdPartyLicenses,
    additionalMarginRate,
    recommendedSubtotal,
    discountAmount,
    ivaRate,
    subtotal,
    estimatedCommission,
    estimatedNetAmount,
    ivaAmount,
    total,
    belowDesiredNet: estimatedNetAmount < desiredNetAmount
  };
};

const proposalIncludes = [
  {
    model: BusinessClient,
    as: "businessClient",
    attributes: [
      "id",
      "displayName",
      "legalName",
      "identificationNumber",
      "legalRepresentativeName",
      "email",
      "phone",
      "queueId"
    ]
  },
  { model: Queue, as: "queue", attributes: ["id", "name", "color"] },
  { model: User, as: "createdBy", attributes: ["id", "name"] },
  { model: User, as: "updatedBy", attributes: ["id", "name"] },
  { model: SmartDocument, as: "generatedDocument" },
  { model: CommercialProposalItem, as: "items" },
  { model: CommercialProposalPaymentMilestone, as: "milestones" }
];

const ensureProposalWriteRole = (actor: Actor): void => {
  if (actor.profile !== "admin" && actor.profile !== "supervisor") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
};

const ensureProposalAccess = async (
  proposal: CommercialProposal,
  actor: Actor,
  write = false
): Promise<void> => {
  if (actor.profile === "admin") return;
  const queueIds = await getActorQueueIds(actor);
  if (
    proposal.queueId &&
    queueIds.includes(Number(proposal.queueId)) &&
    (!write || actor.profile === "supervisor")
  ) {
    return;
  }
  if (
    proposal.createdById === Number(actor.id) &&
    (!write || actor.profile === "supervisor")
  ) {
    return;
  }
  throw new AppError("ERR_NO_PERMISSION", 403);
};

const recordEvent = async ({
  proposalId,
  userId,
  eventType,
  previousStatus,
  newStatus,
  comment,
  metadata,
  transaction
}: {
  proposalId: number;
  userId: string | number | null;
  eventType: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  comment?: string | null;
  metadata?: Record<string, unknown>;
  transaction?: Transaction;
}): Promise<void> => {
  await CommercialProposalEvent.create(
    {
      proposalId,
      userId: userId === null ? null : Number(userId),
      eventType,
      previousStatus: previousStatus || null,
      newStatus: newStatus || null,
      comment: comment?.trim().slice(0, 2000) || null,
      metadata: metadata ? JSON.stringify(metadata) : null
    } as unknown as CommercialProposalEvent,
    { transaction }
  );
};

const resolveClientAndQueue = async (
  data: ProposalData,
  actor: Actor
): Promise<{ client: BusinessClient | null; queueId: number | null }> => {
  if (!data.businessClientId && !data.manualClientName?.trim()) {
    throw new AppError(
      "Seleccione un cliente registrado o indique un cliente manual.",
      400
    );
  }
  if (data.businessClientId && data.manualClientName?.trim()) {
    throw new AppError(
      "Use un cliente registrado o datos manuales, no ambos.",
      400
    );
  }
  const client = data.businessClientId
    ? await BusinessClient.findByPk(data.businessClientId)
    : null;
  if (data.businessClientId && !client) {
    throw new AppError("El cliente seleccionado no existe.", 400);
  }
  const queueId =
    client?.queueId || (data.queueId ? Number(data.queueId) : null);
  if (actor.profile === "supervisor") {
    const queueIds = await getActorQueueIds(actor);
    if (!queueId || !queueIds.includes(queueId)) {
      throw new AppError("ERR_NO_PERMISSION", 403);
    }
  }
  return { client, queueId };
};

const validateProposalData = (data: ProposalData): void => {
  if (!data.clientNumber?.trim()) {
    throw new AppError("El número de cliente es obligatorio.", 400);
  }
  if (!data.offerDate || !data.title?.trim()) {
    throw new AppError("La fecha y el título son obligatorios.", 400);
  }
  if (data.currency !== "CRC" && data.currency !== "USD") {
    throw new AppError("La moneda debe ser CRC o USD.", 400);
  }
  if (!data.items?.length) {
    throw new AppError("Agregue al menos un rubro o fase.", 400);
  }
  if (data.items.some(item => !item.title?.trim())) {
    throw new AppError("Cada rubro debe tener un título.", 400);
  }
  const percentage = (data.milestones || []).reduce(
    (sum, milestone) => sum + Number(milestone.percentage || 0),
    0
  );
  if (data.milestones?.length && Math.abs(percentage - 100) > 0.01) {
    throw new AppError(
      "Los porcentajes de los hitos de pago deben sumar 100%.",
      400
    );
  }
};

const persistChildren = async (
  proposalId: number,
  items: ProposalItemData[],
  milestones: MilestoneData[],
  total: number,
  transaction: Transaction
): Promise<void> => {
  await CommercialProposalItem.destroy({ where: { proposalId }, transaction });
  await CommercialProposalPaymentMilestone.destroy({
    where: { proposalId },
    transaction
  });
  await CommercialProposalItem.bulkCreate(
    items.map((item, index) => ({
      proposalId,
      sortOrder: index + 1,
      title: item.title.trim(),
      description: item.description?.trim() || null,
      includedItems: JSON.stringify(item.includedItems || []),
      subtotal: money(item.subtotal),
      isIncluded: item.isIncluded !== false
    })) as unknown as CommercialProposalItem[],
    { transaction }
  );
  await CommercialProposalPaymentMilestone.bulkCreate(
    milestones.map((milestone, index) => ({
      proposalId,
      sortOrder: index + 1,
      name: milestone.name.trim(),
      percentage: rate(milestone.percentage),
      amount: money(total * (Number(milestone.percentage) / 100)),
      description: milestone.description?.trim() || null
    })) as unknown as CommercialProposalPaymentMilestone[],
    { transaction }
  );
};

const normalizedProposalData = (
  data: ProposalData,
  actor: Actor,
  queueId: number | null,
  proposalNumber: string
) => {
  const includedItemsSubtotal = (data.items || [])
    .filter(item => item.isIncluded !== false)
    .reduce((sum, item) => sum + money(item.subtotal), 0);
  const calculation = calculateProposalProfitability({
    ...data,
    manualSubtotal:
      data.manualSubtotal === null || data.manualSubtotal === undefined
        ? includedItemsSubtotal || null
        : data.manualSubtotal
  });
  const persistedCalculation = {
    desiredNetAmount: calculation.desiredNetAmount,
    sellerCommissionRate: calculation.sellerCommissionRate,
    externalCosts: calculation.externalCosts,
    thirdPartyLicenses: calculation.thirdPartyLicenses,
    additionalMarginRate: calculation.additionalMarginRate,
    recommendedSubtotal: calculation.recommendedSubtotal,
    discountAmount: calculation.discountAmount,
    ivaRate: calculation.ivaRate,
    subtotal: calculation.subtotal,
    estimatedCommission: calculation.estimatedCommission,
    estimatedNetAmount: calculation.estimatedNetAmount,
    ivaAmount: calculation.ivaAmount,
    total: calculation.total
  };
  return {
    businessClientId: data.businessClientId || null,
    manualClientName: data.manualClientName?.trim() || null,
    manualClientEmail: data.manualClientEmail?.trim().toLowerCase() || null,
    manualClientPhone: data.manualClientPhone?.trim() || null,
    manualClientIdentification: data.manualClientIdentification?.trim() || null,
    clientNumber: data.clientNumber.trim(),
    proposalNumber,
    offerDate: data.offerDate,
    title: data.title.trim(),
    introduction: data.introduction?.trim() || null,
    identifiedNeed: data.identifiedNeed?.trim() || null,
    generalScope: data.generalScope?.trim() || null,
    investmentAnalysis: data.investmentAnalysis?.trim() || null,
    currency: data.currency,
    ...persistedCalculation,
    roundFinalPrice: Boolean(data.roundFinalPrice),
    showIvi: Boolean(data.showIvi),
    paymentTermsText: data.paymentTermsText?.trim() || null,
    projectTimeline: data.projectTimeline?.trim() || null,
    termsText: data.termsText?.trim() || null,
    futureRecommendation: data.futureRecommendation?.trim() || null,
    queueId,
    updatedById: Number(actor.id)
  };
};

const buildNextProposalNumber = async (
  transaction: Transaction
): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `PROP-${year}-`;
  const existing = await CommercialProposal.findAll({
    attributes: ["proposalNumber"],
    where: { proposalNumber: { [Op.like]: `${prefix}%` } },
    paranoid: false,
    transaction,
    lock: transaction.LOCK.UPDATE
  });
  const highestSequence = existing.reduce((highest, proposal) => {
    const match = proposal.proposalNumber.match(
      new RegExp(`^${prefix}(\\d+)$`)
    );
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);

  return `${prefix}${String(highestSequence + 1).padStart(3, "0")}`;
};

export const createProposal = async ({
  data,
  actor
}: {
  data: ProposalData;
  actor: Actor;
}): Promise<CommercialProposal> => {
  ensureProposalWriteRole(actor);
  validateProposalData(data);
  const { queueId } = await resolveClientAndQueue(data, actor);
  const createWithConsecutive = async (attempt = 1): Promise<number> => {
    try {
      return await sequelize.transaction(async transaction => {
        const proposalNumber = await buildNextProposalNumber(transaction);
        const proposal = await CommercialProposal.create(
          {
            ...normalizedProposalData(data, actor, queueId, proposalNumber),
            status: "draft",
            createdById: Number(actor.id)
          } as unknown as CommercialProposal,
          { transaction }
        );
        await persistChildren(
          proposal.id,
          data.items || [],
          data.milestones || [],
          proposal.total,
          transaction
        );
        await recordEvent({
          proposalId: proposal.id,
          userId: actor.id,
          eventType: "proposal_created",
          newStatus: "draft",
          metadata: { proposalNumber },
          transaction
        });
        await recordEvent({
          proposalId: proposal.id,
          userId: actor.id,
          eventType: "items_added",
          metadata: { itemCount: data.items?.length || 0 },
          transaction
        });
        return proposal.id;
      });
    } catch (error) {
      if (!(error instanceof UniqueConstraintError) || attempt >= 3) {
        throw error;
      }
      return createWithConsecutive(attempt + 1);
    }
  };
  const proposalId = await createWithConsecutive();
  // eslint-disable-next-line no-use-before-define
  return showProposal({ proposalId, actor });
};

export const updateProposal = async ({
  proposalId,
  data,
  actor
}: {
  proposalId: number;
  data: ProposalData;
  actor: Actor;
}): Promise<CommercialProposal> => {
  ensureProposalWriteRole(actor);
  validateProposalData(data);
  const proposal = await CommercialProposal.findByPk(proposalId);
  if (!proposal) throw new AppError("ERR_NO_PROPOSAL_FOUND", 404);
  await ensureProposalAccess(proposal, actor, true);
  const { queueId } = await resolveClientAndQueue(data, actor);
  await sequelize.transaction(async transaction => {
    await proposal.update(
      normalizedProposalData(data, actor, queueId, proposal.proposalNumber),
      { transaction }
    );
    await persistChildren(
      proposal.id,
      data.items || [],
      data.milestones || [],
      proposal.total,
      transaction
    );
    await recordEvent({
      proposalId: proposal.id,
      userId: actor.id,
      eventType: "proposal_updated",
      metadata: {
        itemCount: data.items?.length || 0,
        milestoneCount: data.milestones?.length || 0
      },
      transaction
    });
    await recordEvent({
      proposalId: proposal.id,
      userId: actor.id,
      eventType: "items_updated",
      metadata: { itemCount: data.items?.length || 0 },
      transaction
    });
    await recordEvent({
      proposalId: proposal.id,
      userId: actor.id,
      eventType: "calculation_updated",
      metadata: { ...calculateProposalProfitability(data) },
      transaction
    });
  });
  // eslint-disable-next-line no-use-before-define
  return showProposal({ proposalId, actor });
};

export const showProposal = async ({
  proposalId,
  actor
}: {
  proposalId: number;
  actor: Actor;
}): Promise<CommercialProposal> => {
  const proposal = await CommercialProposal.findByPk(proposalId, {
    include: proposalIncludes,
    order: [
      [{ model: CommercialProposalItem, as: "items" }, "sortOrder", "ASC"],
      [
        { model: CommercialProposalPaymentMilestone, as: "milestones" },
        "sortOrder",
        "ASC"
      ]
    ]
  });
  if (!proposal) throw new AppError("ERR_NO_PROPOSAL_FOUND", 404);
  await ensureProposalAccess(proposal, actor);
  return proposal;
};

export const listProposals = async ({
  actor,
  searchParam = "",
  status,
  currency,
  businessClientId,
  dateFrom,
  dateTo
}: {
  actor: Actor;
  searchParam?: string;
  status?: string;
  currency?: string;
  businessClientId?: number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{ proposals: CommercialProposal[] }> => {
  const conditions: WhereOptions[] = [];
  if (searchParam.trim()) {
    conditions.push({
      [Op.or]: [
        { proposalNumber: { [Op.like]: `%${searchParam.trim()}%` } },
        { title: { [Op.like]: `%${searchParam.trim()}%` } },
        { manualClientName: { [Op.like]: `%${searchParam.trim()}%` } }
      ]
    });
  }
  if (status && proposalStatuses.includes(status as ProposalStatus)) {
    conditions.push({ status });
  }
  if (currency === "CRC" || currency === "USD") conditions.push({ currency });
  if (businessClientId) conditions.push({ businessClientId });
  if (dateFrom || dateTo) {
    conditions.push({
      offerDate: {
        ...(dateFrom ? { [Op.gte]: dateFrom } : {}),
        ...(dateTo ? { [Op.lte]: dateTo } : {})
      }
    });
  }
  if (actor.profile !== "admin") {
    const queueIds = await getActorQueueIds(actor);
    conditions.push({
      [Op.or]: [
        { queueId: { [Op.in]: queueIds } },
        { createdById: Number(actor.id) }
      ]
    });
  }
  const proposals = await CommercialProposal.findAll({
    where: conditions.length ? { [Op.and]: conditions } : {},
    include: [
      {
        model: BusinessClient,
        as: "businessClient",
        attributes: ["id", "displayName"]
      },
      { model: User, as: "createdBy", attributes: ["id", "name"] }
    ],
    order: [["updatedAt", "DESC"]],
    limit: 100
  });
  return { proposals };
};

const formatMoney = (value: unknown, currency: string): string =>
  `${currency} ${Number(value || 0).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const formatOfferDate = (value: string): string => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("es-CR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, month - 1, day)));
};

const proposalTemplatePaths: Record<ProposalDocumentVariant, string> = {
  formal: path.resolve(
    process.cwd(),
    "assets",
    "document-templates",
    "commercial-proposals",
    "commercial-proposal-formal.docx"
  ),
  quick: path.resolve(
    process.cwd(),
    "assets",
    "document-templates",
    "commercial-proposals",
    "commercial-proposal-quick.docx"
  )
};

const buildProposalTemplateData = (
  proposal: CommercialProposal
): Record<string, string> => {
  const clientName =
    proposal.businessClient?.displayName || proposal.manualClientName || "";
  const clientEmail =
    proposal.businessClient?.email || proposal.manualClientEmail || "";
  const clientPhone =
    proposal.businessClient?.phone || proposal.manualClientPhone || "";
  const clientContact =
    proposal.businessClient?.legalRepresentativeName || clientName;
  const proposalItems = proposal.items
    .filter(item => item.isIncluded)
    .map(item => {
      let entries: string[] = [];
      try {
        const parsedEntries: unknown = JSON.parse(item.includedItems || "[]");
        entries = Array.isArray(parsedEntries)
          ? parsedEntries.filter(
              (entry): entry is string => typeof entry === "string"
            )
          : [];
      } catch {
        entries = [];
      }
      return [
        `${item.sortOrder}. ${item.title}`,
        item.description || "",
        ...entries.map(entry => `- ${entry}`),
        `Subtotal: ${formatMoney(item.subtotal, proposal.currency)}`
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
  const paymentConditions = [
    ...proposal.milestones.map(
      milestone =>
        `${milestone.name}: ${Number(milestone.percentage)}% - ${formatMoney(
          milestone.amount,
          proposal.currency
        )}${milestone.description ? `\n${milestone.description}` : ""}`
    ),
    proposal.paymentTermsText || ""
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    NUMERO_CLIENTE: proposal.clientNumber,
    NUMERO_PRESUPUESTO: proposal.proposalNumber,
    FECHA_OFERTA: formatOfferDate(proposal.offerDate),
    CLIENTE_NOMBRE: clientName,
    CLIENTE_CONTACTO: clientContact,
    CLIENTE_CORREO: clientEmail,
    CLIENTE_TELEFONO: clientPhone,
    TITULO_PROPUESTA: proposal.title,
    INTRODUCCION: proposal.introduction || "",
    ALCANCE_GENERAL: proposal.generalScope || "",
    MENSAJE_CIERRE:
      "Agradecemos la oportunidad de presentar esta propuesta y quedamos atentos para revisar cualquier ajuste requerido.",
    MONEDA: proposal.currency,
    TITULO_PRESUPUESTO: proposal.title,
    DESCRIPCION_COTIZACION:
      proposal.identifiedNeed || proposal.generalScope || "",
    RUBROS_PROPUESTA: proposalItems,
    ANALISIS_INVERSION: proposal.investmentAnalysis || "",
    SUBTOTAL: formatMoney(proposal.subtotal, proposal.currency),
    IVA_PORCENTAJE: `${Number(proposal.ivaRate)}%`,
    IVA_MONTO: formatMoney(proposal.ivaAmount, proposal.currency),
    DESCUENTO: formatMoney(proposal.discountAmount, proposal.currency),
    TOTAL: `${formatMoney(proposal.total, proposal.currency)}${
      proposal.showIvi ? " IVI" : ""
    }`,
    CONDICIONES_PAGO: paymentConditions,
    PLAZO_PROYECTO: proposal.projectTimeline || "",
    NOTA_COMERCIAL: proposal.showIvi
      ? "Los montos indicados incluyen el impuesto de valor agregado."
      : "",
    TERMINOS: proposal.termsText || "",
    RECOMENDACION_POSTERIOR: proposal.futureRecommendation || ""
  };
};

export const generateProposalDocument = async ({
  proposalId,
  actor,
  variant = "formal"
}: {
  proposalId: number;
  actor: Actor;
  variant?: ProposalDocumentVariant;
}): Promise<SmartDocument> => {
  ensureProposalWriteRole(actor);
  if (variant !== "formal" && variant !== "quick") {
    throw new AppError(
      "La variante de cotización seleccionada no es válida.",
      400
    );
  }
  const proposal = await showProposal({ proposalId, actor });
  await ensureProposalAccess(proposal, actor, true);
  const buffer = await renderDocxTemplate(
    proposalTemplatePaths[variant],
    buildProposalTemplateData(proposal)
  );
  const mimeType =
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const saved = await saveDocumentBuffer(buffer, mimeType, "generated");
  const variantLabel =
    variant === "formal" ? "Propuesta comercial" : "Cotización rápida";
  let document: SmartDocument | null = null;
  try {
    document = await SmartDocument.create({
      title: `${variantLabel} - ${proposal.title}`,
      description: `${variantLabel} ${proposal.proposalNumber}, generada desde el machote oficial Techkepper`,
      originalName: `${proposal.proposalNumber.replace(
        /[^a-z0-9_-]/gi,
        "_"
      )}-${variant}.docx`,
      storedName: saved.storedName,
      storagePath: saved.storagePath,
      mimeType,
      size: buffer.length,
      category: variantLabel,
      purpose: "quotations",
      status: "generated",
      tags: `commercial-proposal:${proposal.id};variant:${variant}`,
      uploadedById: Number(actor.id),
      contactId: null,
      ticketId: null,
      queueId: proposal.queueId,
      ecosystemId: null
    } as unknown as SmartDocument);
    if (proposal.businessClientId) {
      await BusinessClientDocument.upsert({
        documentId: document.id,
        businessClientId: proposal.businessClientId,
        linkedById: Number(actor.id)
      } as unknown as BusinessClientDocument);
    }
    await proposal.update({
      generatedDocumentId: document.id,
      updatedById: Number(actor.id)
    });
    await recordDocumentEvent({
      documentId: document.id,
      userId: actor.id,
      eventType: "generated",
      newStatus: "generated",
      metadata: { commercialProposalId: proposal.id, variant }
    });
    await recordEvent({
      proposalId: proposal.id,
      userId: actor.id,
      eventType: "docx_generated",
      metadata: { documentId: document.id, variant }
    });
    return document.reload();
  } catch (error) {
    if (document) await document.destroy({ force: true });
    await removeDocumentFile(saved.storagePath);
    throw error;
  }
};

export const downloadProposal = async ({
  proposalId,
  format,
  actor
}: {
  proposalId: number;
  format: "docx" | "pdf";
  actor: Actor;
}): Promise<{ buffer: Buffer; filename: string; mimeType: string }> => {
  const proposal = await showProposal({ proposalId, actor });
  if (!proposal.generatedDocument) {
    throw new AppError(
      "Genere primero el documento DOCX de la propuesta.",
      400
    );
  }
  const sourcePath = resolveDocumentPath(
    proposal.generatedDocument.storagePath
  );
  if (format === "pdf") {
    const buffer = await ConvertDocumentToPdfService({
      sourcePath,
      mimeType: proposal.generatedDocument.mimeType
    });
    await recordEvent({
      proposalId,
      userId: actor.id,
      eventType: "pdf_generated"
    });
    return {
      buffer,
      filename: `${
        path.parse(proposal.generatedDocument.originalName).name
      }.pdf`,
      mimeType: "application/pdf"
    };
  }
  const buffer = await fs.readFile(sourcePath);
  return {
    buffer,
    filename: proposal.generatedDocument.originalName,
    mimeType: proposal.generatedDocument.mimeType
  };
};

export const updateProposalStatus = async ({
  proposalId,
  status,
  comment,
  notificationUserIds = [],
  actor
}: {
  proposalId: number;
  status: string;
  comment?: string;
  notificationUserIds?: number[];
  actor: Actor;
}): Promise<CommercialProposal> => {
  ensureProposalWriteRole(actor);
  if (!proposalStatuses.includes(status as ProposalStatus)) {
    throw new AppError("El estado comercial seleccionado no es válido.", 400);
  }
  if (
    actor.profile !== "admin" &&
    (status === "archived" || status === "converted_to_contract")
  ) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  const proposal = await showProposal({ proposalId, actor });
  await ensureProposalAccess(proposal, actor, true);
  if (proposal.status === status) {
    throw new AppError("La propuesta ya tiene el estado seleccionado.", 400);
  }
  const recipients = notificationUserIds.length
    ? await User.findAll({
        where: {
          id: { [Op.in]: Array.from(new Set(notificationUserIds.map(Number))) },
          isActive: true
        },
        attributes: ["id", "name", "profile"],
        include: ["queues"]
      })
    : [];
  if (recipients.length !== new Set(notificationUserIds.map(Number)).size) {
    throw new AppError("Uno o más destinatarios no son válidos.", 400);
  }
  await Promise.all(
    recipients.map(recipient =>
      ensureProposalAccess(proposal, {
        id: String(recipient.id),
        profile: recipient.profile
      })
    )
  );
  const actorUser = await User.findByPk(actor.id, {
    attributes: ["id", "name"]
  });
  const notificationIds: number[] = [];
  await sequelize.transaction(async transaction => {
    const previousStatus = proposal.status;
    await proposal.update(
      { status, updatedById: Number(actor.id) },
      { transaction }
    );
    const eventTypes: Record<string, string> = {
      accepted: "proposal_accepted",
      rejected: "proposal_rejected",
      archived: "proposal_archived",
      sent: "proposal_sent"
    };
    await recordEvent({
      proposalId,
      userId: actor.id,
      eventType: eventTypes[status] || "status_changed",
      previousStatus,
      newStatus: status,
      comment,
      transaction
    });
    if (recipients.length && actorUser) {
      const notifications = await InternalNotification.bulkCreate(
        recipients.map(recipient => ({
          userId: recipient.id,
          createdById: actorUser.id,
          type: "commercial_proposal_status_change",
          title: "Propuesta comercial para revisión o seguimiento",
          message: `${actorUser.name} cambió el estado de ${proposal.title} a ${status}.`,
          documentId: proposal.generatedDocumentId,
          proposalId: proposal.id,
          status,
          comment: comment?.trim() || null,
          readAt: null
        })) as unknown as InternalNotification[],
        { transaction, returning: true }
      );
      notificationIds.push(...notifications.map(item => item.id));
    }
  });
  if (notificationIds.length) {
    const notifications = await InternalNotification.findAll({
      where: { id: { [Op.in]: notificationIds } },
      include: [
        { model: User, as: "createdBy", attributes: ["id", "name"] },
        {
          model: CommercialProposal,
          as: "proposal",
          attributes: ["id", "title", "status"]
        }
      ]
    });
    try {
      const io = getIO();
      notifications.forEach(notification =>
        io
          .to(`user:${notification.userId}`)
          .emit("internalNotification", { action: "create", notification })
      );
    } catch (error) {
      logger.warn(
        { err: error, proposalId },
        "Proposal notifications persisted but socket delivery failed"
      );
    }
  }
  return showProposal({ proposalId, actor });
};

export const listProposalNotificationRecipients = async ({
  proposalId,
  actor
}: {
  proposalId: number;
  actor: Actor;
}): Promise<User[]> => {
  ensureProposalWriteRole(actor);
  const proposal = await showProposal({ proposalId, actor });
  await ensureProposalAccess(proposal, actor, true);
  const users = await User.findAll({
    where: { isActive: true },
    attributes: ["id", "name", "profile"],
    include: ["queues"],
    order: [["name", "ASC"]]
  });
  const authorized = await Promise.all(
    users.map(async user => {
      try {
        await ensureProposalAccess(proposal, {
          id: String(user.id),
          profile: user.profile
        });
        return user;
      } catch (error) {
        if (!(error instanceof AppError) || error.statusCode !== 403) {
          throw error;
        }
        return null;
      }
    })
  );
  return authorized.filter((user): user is User => Boolean(user));
};

export const listProposalEvents = async ({
  proposalId,
  actor
}: {
  proposalId: number;
  actor: Actor;
}): Promise<CommercialProposalEvent[]> => {
  await showProposal({ proposalId, actor });
  return CommercialProposalEvent.findAll({
    where: { proposalId },
    include: [{ model: User, attributes: ["id", "name"] }],
    order: [["createdAt", "DESC"]]
  });
};

export const archiveProposal = async ({
  proposalId,
  actor
}: {
  proposalId: number;
  actor: Actor;
}): Promise<CommercialProposal> => {
  if (actor.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  return updateProposalStatus({ proposalId, status: "archived", actor });
};

export const deleteProposal = async ({
  proposalId,
  actor
}: {
  proposalId: number;
  actor: Actor;
}): Promise<void> => {
  if (actor.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  const proposal = await CommercialProposal.findByPk(proposalId);
  if (!proposal) {
    throw new AppError("ERR_NO_PROPOSAL_FOUND", 404);
  }

  await sequelize.transaction(async transaction => {
    await recordEvent({
      proposalId: proposal.id,
      userId: actor.id,
      eventType: "proposal_deleted",
      previousStatus: proposal.status,
      metadata: { proposalNumber: proposal.proposalNumber },
      transaction
    });
    await proposal.destroy({ transaction });
  });
};
