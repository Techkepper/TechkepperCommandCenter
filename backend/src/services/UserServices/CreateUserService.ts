import * as Yup from "yup";

import AppError from "../../errors/AppError";
import { SerializeUser } from "../../helpers/SerializeUser";
import User from "../../models/User";

interface Request {
  email: string;
  password: string;
  name: string;
  queueIds?: number[];
  profile?: string;
  whatsappId?: number;
  isActive?: boolean;
  theme?: string;
}

interface Response {
  email: string;
  name: string;
  id: number;
  profile: string;
}

const CreateUserService = async ({
  email,
  password,
  name,
  queueIds = [],
  profile = "agent",
  whatsappId,
  isActive = true,
  theme = "dark"
}: Request): Promise<Response> => {
  const normalizedEmail = email.trim().toLowerCase();
  const schema = Yup.object().shape({
    name: Yup.string().required().min(2).max(120),
    email: Yup.string()
      .email()
      .max(254)
      .required()
      .test(
        "Check-email",
        "ERR_USER_EMAIL_ALREADY_EXISTS",
        async value => {
          if (!value) return false;
          const emailExists = await User.findOne({
            where: { email: value.trim().toLowerCase() }
          });
          return !emailExists;
        }
      ),
    password: Yup.string().required().min(12).max(128),
    profile: Yup.string().oneOf(["admin", "supervisor", "agent"]),
    theme: Yup.string().oneOf(["dark", "light"])
  });

  try {
    await schema.validate({
      email: normalizedEmail,
      password,
      name,
      profile,
      theme
    });
  } catch (err) {
    throw new AppError(err.message);
  }

  const user = await User.create(
    {
      email: normalizedEmail,
      password,
      name,
      profile,
      isActive,
      theme,
      whatsappId: whatsappId ? whatsappId : null
    } as any,
    { include: ["queues", "whatsapp"] }
  );

  await user.$set("queues", queueIds);

  await user.reload();

  return SerializeUser(user);
};

export default CreateUserService;
