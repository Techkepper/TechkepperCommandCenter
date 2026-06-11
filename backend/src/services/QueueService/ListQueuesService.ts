import Queue from "../../models/Queue";

const ListQueuesService = async (
  includeInactive = false
): Promise<Queue[]> => {
  const queues = await Queue.findAll({
    where: includeInactive ? undefined : { isActive: true },
    order: [["name", "ASC"]]
  });

  return queues;
};

export default ListQueuesService;
