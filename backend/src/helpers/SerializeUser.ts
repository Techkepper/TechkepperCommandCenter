import Queue from "../models/Queue";
import User from "../models/User";
import Whatsapp from "../models/Whatsapp";

interface SerializedUser {
  id: number;
  name: string;
  email: string;
  profile: string;
  queues: Queue[];
  whatsapp: Whatsapp | null;
  whatsappId: number | null;
  isActive: boolean;
  theme: string;
  lastActivityAt: Date;
}

export const SerializeUser = (user: User): SerializedUser => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profile: user.profile,
    queues: user.queues,
    whatsapp: user.whatsapp,
    whatsappId: user.whatsappId,
    isActive: user.isActive,
    theme: user.theme,
    lastActivityAt: user.lastActivityAt
  };
};
