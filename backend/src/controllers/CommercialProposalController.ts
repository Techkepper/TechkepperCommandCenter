import { Request, Response } from "express";

import {
  calculateProposalProfitability,
  createProposal,
  deleteProposal,
  downloadProposal,
  generateProposalDocument,
  listProposalEvents,
  listProposalNotificationRecipients,
  listProposals,
  showProposal,
  updateProposal,
  updateProposalStatus
} from "../services/CommercialProposalServices";
import AppError from "../errors/AppError";

const internalFields = [
  "desiredNetAmount",
  "sellerCommissionRate",
  "externalCosts",
  "thirdPartyLicenses",
  "additionalMarginRate",
  "recommendedSubtotal",
  "estimatedCommission",
  "estimatedNetAmount"
];

const serializeForActor = (
  value: { toJSON?: () => Record<string, unknown> } | Record<string, unknown>,
  profile: string
) => {
  const serialized =
    typeof value.toJSON === "function" ? value.toJSON() : { ...value };
  if (profile !== "admin" && profile !== "supervisor") {
    internalFields.forEach(field => delete serialized[field]);
  }
  return serialized;
};

export const calculate = async (
  req: Request,
  res: Response
): Promise<Response> => res.json(calculateProposalProfitability(req.body));

export const index = async (req: Request, res: Response): Promise<Response> => {
  const result = await listProposals({
    actor: req.user,
    searchParam: String(req.query.searchParam || ""),
    status: req.query.status ? String(req.query.status) : undefined,
    currency: req.query.currency ? String(req.query.currency) : undefined,
    businessClientId: req.query.businessClientId
      ? Number(req.query.businessClientId)
      : undefined,
    dateFrom: req.query.dateFrom ? String(req.query.dateFrom) : undefined,
    dateTo: req.query.dateTo ? String(req.query.dateTo) : undefined
  });
  return res.json({
    proposals: result.proposals.map(proposal =>
      serializeForActor(proposal, req.user.profile)
    )
  });
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const proposal = await showProposal({
    proposalId: Number(req.params.proposalId),
    actor: req.user
  });
  return res.json(serializeForActor(proposal, req.user.profile));
};

export const store = async (req: Request, res: Response): Promise<Response> =>
  res
    .status(201)
    .json(await createProposal({ data: req.body, actor: req.user }));

export const update = async (req: Request, res: Response): Promise<Response> =>
  res.json(
    await updateProposal({
      proposalId: Number(req.params.proposalId),
      data: req.body,
      actor: req.user
    })
  );

export const changeStatus = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await updateProposalStatus({
      proposalId: Number(req.params.proposalId),
      status: req.body.status,
      comment: req.body.comment,
      notificationUserIds: req.body.notificationUserIds,
      actor: req.user
    })
  );

export const generate = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.status(201).json(
    await generateProposalDocument({
      proposalId: Number(req.params.proposalId),
      actor: req.user,
      variant: req.body.variant === "quick" ? "quick" : "formal"
    })
  );

export const download = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const format = req.query.format === "pdf" ? "pdf" : "docx";
  if (
    format === "docx" &&
    req.user.profile !== "admin" &&
    req.user.profile !== "supervisor"
  ) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  const file = await downloadProposal({
    proposalId: Number(req.params.proposalId),
    format,
    actor: req.user
  });
  res.type(file.mimeType);
  res.attachment(file.filename);
  return res.send(file.buffer);
};

export const events = async (req: Request, res: Response): Promise<Response> =>
  res.json({
    events: await listProposalEvents({
      proposalId: Number(req.params.proposalId),
      actor: req.user
    })
  });

export const notificationRecipients = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json({
    users: await listProposalNotificationRecipients({
      proposalId: Number(req.params.proposalId),
      actor: req.user
    })
  });

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await deleteProposal({
    proposalId: Number(req.params.proposalId),
    actor: req.user
  });
  return res.status(204).send();
};
