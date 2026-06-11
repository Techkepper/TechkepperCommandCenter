import * as Yup from "yup";

import AppError from "../../errors/AppError";
import { SerializeUser } from "../../helpers/SerializeUser";
import ShowUserService from "./ShowUserService";

interface UserData {
  email?: string;
  password?: string;
  name?: string;
  profile?: string;
  queueIds?: number[];
  whatsappId?: number;
  isActive?: boolean;
  theme?: string;
}

interface Request {
  userData: UserData;
  userId: string | number;
}

interface Response {
  id: number;
  name: string;
  email: string;
  profile: string;
}

const UpdateUserService = async ({
  userData,
  userId
}: Request): Promise<Response | undefined> => {
  const user = await ShowUserService(userId);

  const schema = Yup.object().shape({
    name: Yup.string().min(2),
    email: Yup.string().email().max(254),
    profile: Yup.string().oneOf(["admin", "supervisor", "agent"]),
    password: Yup.string().min(12).max(128),
    isActive: Yup.boolean(),
    theme: Yup.string().oneOf(["dark", "light"])
  });

  const {
    email,
    password,
    profile,
    name,
    queueIds,
    whatsappId,
    isActive,
    theme
  } = userData;

  try {
    await schema.validate({
      email,
      password: password || undefined,
      profile,
      name,
      isActive,
      theme
    });
  } catch (err) {
    throw new AppError(err.message);
  }

  const updateData: Record<string, unknown> = {};
  if (email !== undefined) updateData.email = email.trim().toLowerCase();
  if (password) updateData.password = password;
  if (profile !== undefined) updateData.profile = profile;
  if (name !== undefined) updateData.name = name;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (theme !== undefined) updateData.theme = theme;
  if (whatsappId !== undefined) {
    updateData.whatsappId = whatsappId || null;
  }
  if (
    password ||
    profile !== undefined ||
    (isActive !== undefined && isActive !== user.isActive)
  ) {
    updateData.tokenVersion = user.tokenVersion + 1;
  }

  await user.update(updateData);

  if (queueIds !== undefined) {
    await user.$set("queues", queueIds);
  }

  await user.reload();

  return SerializeUser(user);
};

export default UpdateUserService;
