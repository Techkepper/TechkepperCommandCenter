import { QueryInterface, DataTypes } from "sequelize";

const hasColumn = async (
  queryInterface: QueryInterface,
  tableName: string,
  columnName: string
) => {
  const table = await queryInterface.describeTable(tableName);
  return Boolean(table[columnName]);
};

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    if (!(await hasColumn(queryInterface, "Tickets", "lastCustomerMessageId"))) {
      await queryInterface.addColumn("Tickets", "lastCustomerMessageId", {
        type: DataTypes.STRING,
        allowNull: true
      });
    }

    await queryInterface.sequelize.query(`
      UPDATE Tickets t
      SET lastCustomerMessageId = (
        SELECT m.id
        FROM Messages m
        WHERE m.ticketId = t.id
          AND m.fromMe = false
          AND m.isDeleted = false
          AND m.id LIKE 'wamid.%'
        ORDER BY m.createdAt DESC
        LIMIT 1
      )
      WHERE t.lastCustomerMessageId IS NULL
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    if (await hasColumn(queryInterface, "Tickets", "lastCustomerMessageId")) {
      await queryInterface.removeColumn("Tickets", "lastCustomerMessageId");
    }
  }
};
