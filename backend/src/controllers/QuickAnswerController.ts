import * as Yup from "yup";
import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import ListQuickAnswerService from "../services/QuickAnswerService/ListQuickAnswerService";
import CreateQuickAnswerService from "../services/QuickAnswerService/CreateQuickAnswerService";
import ShowQuickAnswerService from "../services/QuickAnswerService/ShowQuickAnswerService";
import UpdateQuickAnswerService from "../services/QuickAnswerService/UpdateQuickAnswerService";
import DeleteQuickAnswerService from "../services/QuickAnswerService/DeleteQuickAnswerService";

import AppError from "../errors/AppError";
import ShowUserService from "../services/UserServices/ShowUserService";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

interface QuickAnswerData {
  shortcut: string;
  message: string;
  queueId?: number | null;
  isActive?: boolean;
}

const getUserQueueIds = async (userId: string): Promise<number[]> => {
  const user = await ShowUserService(userId);
  return user.queues.map(queue => queue.id);
};

const ensureQueueReadAccess = async (
  req: Request,
  queueId: number | null
): Promise<void> => {
  if (req.user.profile === "admin" || queueId === null) return;
  const queueIds = await getUserQueueIds(req.user.id);
  if (!queueIds.includes(Number(queueId))) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
};

const ensureSupervisorQueueWriteAccess = async (
  req: Request,
  queueId: number | null | undefined
): Promise<void> => {
  if (req.user.profile === "admin") return;
  const queueIds = await getUserQueueIds(req.user.id);
  if (!queueId || !queueIds.includes(Number(queueId))) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const user = await ShowUserService(req.user.id);
  const { quickAnswers, count, hasMore } = await ListQuickAnswerService({
    searchParam,
    pageNumber,
    profile: req.user.profile,
    queueIds: user.queues.map(queue => queue.id)
  });

  return res.json({ quickAnswers, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const newQuickAnswer: QuickAnswerData = req.body;

  const QuickAnswerSchema = Yup.object().shape({
    shortcut: Yup.string().required(),
    message: Yup.string().required(),
    queueId: Yup.number().nullable(),
    isActive: Yup.boolean()
  });

  try {
    await QuickAnswerSchema.validate(newQuickAnswer);
  } catch (err) {
    throw new AppError(err.message);
  }
  await ensureSupervisorQueueWriteAccess(req, newQuickAnswer.queueId);

  const quickAnswer = await CreateQuickAnswerService({
    ...newQuickAnswer
  });

  const io = getIO();
  io.emit("quickAnswer", {
    action: "create",
    quickAnswer
  });

  return res.status(200).json(quickAnswer);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { quickAnswerId } = req.params;

  const quickAnswer = await ShowQuickAnswerService(quickAnswerId);
  await ensureQueueReadAccess(req, quickAnswer.queueId);

  return res.status(200).json(quickAnswer);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const quickAnswerData: QuickAnswerData = req.body;

  const schema = Yup.object().shape({
    shortcut: Yup.string(),
    message: Yup.string(),
    queueId: Yup.number().nullable(),
    isActive: Yup.boolean()
  });

  try {
    await schema.validate(quickAnswerData);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { quickAnswerId } = req.params;
  const existingQuickAnswer = await ShowQuickAnswerService(quickAnswerId);
  await ensureSupervisorQueueWriteAccess(req, existingQuickAnswer.queueId);
  await ensureSupervisorQueueWriteAccess(
    req,
    quickAnswerData.queueId === undefined
      ? existingQuickAnswer.queueId
      : quickAnswerData.queueId
  );

  const quickAnswer = await UpdateQuickAnswerService({
    quickAnswerData,
    quickAnswerId
  });

  const io = getIO();
  io.emit("quickAnswer", {
    action: "update",
    quickAnswer
  });

  return res.status(200).json(quickAnswer);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { quickAnswerId } = req.params;
  const quickAnswer = await ShowQuickAnswerService(quickAnswerId);
  await ensureSupervisorQueueWriteAccess(req, quickAnswer.queueId);

  await DeleteQuickAnswerService(quickAnswerId);

  const io = getIO();
  io.emit("quickAnswer", {
    action: "delete",
    quickAnswerId
  });

  return res.status(200).json({ message: "Quick Answer deleted" });
};
