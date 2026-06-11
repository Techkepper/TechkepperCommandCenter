import AppError from "../../errors/AppError";
import QuickAnswer from "../../models/QuickAnswer";

interface Request {
  shortcut: string;
  message: string;
  queueId?: number | null;
  isActive?: boolean;
}

const CreateQuickAnswerService = async ({
  shortcut,
  message,
  queueId = null,
  isActive = true
}: Request): Promise<QuickAnswer> => {
  const nameExists = await QuickAnswer.findOne({
    where: { shortcut }
  });

  if (nameExists) {
    throw new AppError("ERR__SHORTCUT_DUPLICATED");
  }

  const quickAnswer = await QuickAnswer.create({
    shortcut,
    message,
    queueId,
    isActive
  });

  return quickAnswer;
};

export default CreateQuickAnswerService;
