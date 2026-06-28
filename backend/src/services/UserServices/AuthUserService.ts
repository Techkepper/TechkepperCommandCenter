import { getRounds, hash } from "bcryptjs";
import User from "../../models/User";
import AppError from "../../errors/AppError";
import {
  createAccessToken,
  createRefreshToken
} from "../../helpers/CreateTokens";
import { SerializeUser } from "../../helpers/SerializeUser";
import Queue from "../../models/Queue";

interface SerializedUser {
  id: number;
  name: string;
  email: string;
  profile: string;
  queues: Queue[];
}

interface Request {
  email: string;
  password: string;
}

interface Response {
  serializedUser: SerializedUser;
  token: string;
  refreshToken: string;
}

const AuthUserService = async ({
  email,
  password
}: Request): Promise<Response> => {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const user = await User.findOne({
    where: { email: normalizedEmail },
    include: ["queues"]
  });

  if (!user) {
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }

  if (!user.isActive) {
    throw new AppError("ERR_USER_INACTIVE", 403);
  }

  if (!(await user.checkPassword(password))) {
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }

  if (getRounds(user.passwordHash) < 12) {
    await user.update({ passwordHash: await hash(password, 12) });
  }

  await user.update({
    lastActivityAt: new Date(),
    availabilityStatus: "available"
  });
  await user.reload();
  const token = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  const serializedUser = SerializeUser(user);

  return {
    serializedUser,
    token,
    refreshToken
  };
};

export default AuthUserService;
