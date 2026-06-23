import AppError from "../../errors/AppError";
import BusinessClient from "../../models/BusinessClient";
import Queue from "../../models/Queue";
import User from "../../models/User";
import { ensureBusinessClientReadAccess } from "./businessClientHelpers";
import { BusinessClientActor } from "./businessClientTypes";

interface Request {
  clientId: string | number;
  actor: BusinessClientActor;
}

const ShowBusinessClientService = async ({
  clientId,
  actor
}: Request): Promise<BusinessClient> => {
  const client = await BusinessClient.findByPk(clientId, {
    include: [
      { model: Queue, as: "queue", attributes: ["id", "name", "color"] },
      { model: User, as: "createdBy", attributes: ["id", "name"] }
    ]
  });

  if (!client) {
    throw new AppError("ERR_NO_BUSINESS_CLIENT_FOUND", 404);
  }

  await ensureBusinessClientReadAccess(client, actor);
  return client;
};

export default ShowBusinessClientService;
