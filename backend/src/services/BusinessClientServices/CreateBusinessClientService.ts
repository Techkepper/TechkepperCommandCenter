import BusinessClient from "../../models/BusinessClient";
import Queue from "../../models/Queue";
import User from "../../models/User";
import {
  ensureBusinessClientQueueWriteAccess,
  ensureUniqueIdentification,
  normalizeBusinessClientData
} from "./businessClientHelpers";
import { BusinessClientActor, BusinessClientData } from "./businessClientTypes";

interface Request {
  data: BusinessClientData;
  actor: BusinessClientActor;
}

const CreateBusinessClientService = async ({
  data,
  actor
}: Request): Promise<BusinessClient> => {
  const normalized = normalizeBusinessClientData(data);
  await ensureBusinessClientQueueWriteAccess(actor, normalized.queueId || null);
  await ensureUniqueIdentification(normalized.normalizedIdentificationNumber);

  const client = await BusinessClient.create({
    ...normalized,
    createdById: Number(actor.id),
    isActive: true
  } as unknown as BusinessClient);

  return client.reload({
    include: [
      { model: Queue, as: "queue", attributes: ["id", "name", "color"] },
      { model: User, as: "createdBy", attributes: ["id", "name"] }
    ]
  });
};

export default CreateBusinessClientService;
