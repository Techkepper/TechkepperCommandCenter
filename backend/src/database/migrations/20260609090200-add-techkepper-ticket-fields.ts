import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Tickets", "ecosystemId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Ecosystems", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
    await queryInterface.addColumn("Tickets", "firstResponseAt", {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.addColumn("Tickets", "closedAt", {
      type: DataTypes.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Tickets", "closedAt");
    await queryInterface.removeColumn("Tickets", "firstResponseAt");
    await queryInterface.removeColumn("Tickets", "ecosystemId");
  }
};
