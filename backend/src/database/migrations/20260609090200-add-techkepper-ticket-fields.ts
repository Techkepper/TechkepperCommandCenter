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
    if (!(await hasColumn(queryInterface, "Tickets", "ecosystemId"))) {
      await queryInterface.addColumn("Tickets", "ecosystemId", {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Ecosystems", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      });
    }

    if (!(await hasColumn(queryInterface, "Tickets", "firstResponseAt"))) {
      await queryInterface.addColumn("Tickets", "firstResponseAt", {
        type: DataTypes.DATE,
        allowNull: true
      });
    }

    if (!(await hasColumn(queryInterface, "Tickets", "closedAt"))) {
      await queryInterface.addColumn("Tickets", "closedAt", {
        type: DataTypes.DATE,
        allowNull: true
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    if (await hasColumn(queryInterface, "Tickets", "closedAt")) {
      await queryInterface.removeColumn("Tickets", "closedAt");
    }

    if (await hasColumn(queryInterface, "Tickets", "firstResponseAt")) {
      await queryInterface.removeColumn("Tickets", "firstResponseAt");
    }

    if (await hasColumn(queryInterface, "Tickets", "ecosystemId")) {
      await queryInterface.removeColumn("Tickets", "ecosystemId");
    }
  }
};
