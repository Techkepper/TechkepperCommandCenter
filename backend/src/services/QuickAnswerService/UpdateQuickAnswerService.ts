import QuickAnswer from "../../models/QuickAnswer";
import AppError from "../../errors/AppError";

interface QuickAnswerData {
  shortcut?: string;
  message?: string;
  queueId?: number | null;
  isActive?: boolean;
}

interface Request {
  quickAnswerData: QuickAnswerData;
  quickAnswerId: string;
}

const UpdateQuickAnswerService = async ({
  quickAnswerData,
  quickAnswerId
}: Request): Promise<QuickAnswer> => {
  const { shortcut, message, queueId, isActive } = quickAnswerData;

  const quickAnswer = await QuickAnswer.findOne({
    where: { id: quickAnswerId },
    attributes: ["id", "shortcut", "message", "queueId", "isActive"]
  });

  if (!quickAnswer) {
    throw new AppError("ERR_NO_QUICK_ANSWERS_FOUND", 404);
  }
  await quickAnswer.update({
    shortcut,
    message,
    queueId,
    isActive
  });

  await quickAnswer.reload({
    attributes: ["id", "shortcut", "message", "queueId", "isActive"]
  });

  return quickAnswer;
};

export default UpdateQuickAnswerService;
