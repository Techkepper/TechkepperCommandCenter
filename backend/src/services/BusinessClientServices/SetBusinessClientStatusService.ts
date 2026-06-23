import BusinessClient from "../../models/BusinessClient";
import Queue from "../../models/Queue";
import User from "../../models/User";
import { ensureBusinessClientQueueWriteAccess } from "./businessClientHelpers";
import { BusinessClientActor } from "./businessClientTypes";
import ShowBusinessClientService from "./ShowBusinessClientService";

interface Request {
  clientId: string | number;
  isActive: boolean;
  actor: BusinessClientActor;
}

const SetBusinessClientStatusService = async ({
  clientId,
  isActive,
  actor
}: Request): Promise<BusinessClient> => {
  const client = await ShowBusinessClientService({ clientId, actor });
  await ensureBusinessClientQueueWriteAccess(actor, client.queueId);
  await client.update({ isActive });

  return client.reload({
    include: [
      { model: Queue, as: "queue", attributes: ["id", "name", "color"] },
      { model: User, as: "createdBy", attributes: ["id", "name"] }
    ]
  });
};

export default SetBusinessClientStatusService;
