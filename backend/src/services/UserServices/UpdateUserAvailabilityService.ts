import AppError from "../../errors/AppError";
import { EmitUserEvent } from "../../helpers/EmitUserEvent";
import { SerializeUser } from "../../helpers/SerializeUser";
import { logger } from "../../utils/logger";
import ShowUserService from "./ShowUserService";

export const availabilityStatuses = [
  "available",
  "busy",
  "away",
  "unavailable",
  "offline"
] as const;

export type AvailabilityStatus = (typeof availabilityStatuses)[number];

const UpdateUserAvailabilityService = async ({
  targetUserId,
  availabilityStatus,
  actorUserId,
  actorProfile,
  systemChange = false
}: {
  targetUserId: string | number;
  availabilityStatus: unknown;
  actorUserId?: string | number;
  actorProfile?: string;
  systemChange?: boolean;
}): Promise<ReturnType<typeof SerializeUser>> => {
  if (
    typeof availabilityStatus !== "string" ||
    !availabilityStatuses.includes(availabilityStatus as AvailabilityStatus)
  ) {
    throw new AppError("ERR_INVALID_AVAILABILITY_STATUS", 400);
  }
  if (
    !systemChange &&
    Number(actorUserId) !== Number(targetUserId) &&
    actorProfile !== "admin"
  ) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const user = await ShowUserService(targetUserId);
  const previousStatus = user.availabilityStatus || "available";
  if (previousStatus !== availabilityStatus) {
    await user.update({ availabilityStatus });
    await user.reload();
    const serialized = SerializeUser(user);
    logger.info(
      {
        eventType: "user_availability_changed",
        userId: user.id,
        actorUserId: actorUserId ? Number(actorUserId) : null,
        previousStatus,
        availabilityStatus
      },
      "User availability changed"
    );
    EmitUserEvent("update", serialized as Record<string, any>);
    return serialized;
  }
  return SerializeUser(user);
};

export default UpdateUserAvailabilityService;
