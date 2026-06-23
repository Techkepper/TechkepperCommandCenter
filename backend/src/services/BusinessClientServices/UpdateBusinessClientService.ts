import BusinessClient from "../../models/BusinessClient";
import Queue from "../../models/Queue";
import User from "../../models/User";
import {
  ensureBusinessClientQueueWriteAccess,
  ensureUniqueIdentification,
  normalizeBusinessClientData
} from "./businessClientHelpers";
import { BusinessClientActor, BusinessClientData } from "./businessClientTypes";
import ShowBusinessClientService from "./ShowBusinessClientService";

interface Request {
  clientId: string | number;
  data: BusinessClientData;
  actor: BusinessClientActor;
}

const UpdateBusinessClientService = async ({
  clientId,
  data,
  actor
}: Request): Promise<BusinessClient> => {
  const client = await ShowBusinessClientService({ clientId, actor });
  await ensureBusinessClientQueueWriteAccess(actor, client.queueId);

  const normalized = normalizeBusinessClientData(data);
  await ensureBusinessClientQueueWriteAccess(actor, normalized.queueId || null);
  await ensureUniqueIdentification(
    normalized.normalizedIdentificationNumber,
    Number(client.id)
  );

  await client.update(normalized);
  return client.reload({
    include: [
      { model: Queue, as: "queue", attributes: ["id", "name", "color"] },
      { model: User, as: "createdBy", attributes: ["id", "name"] }
    ]
  });
};

export default UpdateBusinessClientService;
