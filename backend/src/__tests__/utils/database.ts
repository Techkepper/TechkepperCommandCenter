import database from "../../database";

const truncate = async (): Promise<void> => {
  await database.query("SET FOREIGN_KEY_CHECKS = 0");

  try {
    for (const model of Object.values(database.models)) {
      await model.destroy({ truncate: true, force: true });
    }
  } finally {
    await database.query("SET FOREIGN_KEY_CHECKS = 1");
  }
};

const disconnect = async (): Promise<void> => {
  return database.connectionManager.close();
};

export { truncate, disconnect };
