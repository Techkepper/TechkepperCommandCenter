import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Users", "isActive", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
    await queryInterface.addColumn("Users", "theme", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "dark"
    });
    await queryInterface.addColumn("Users", "lastActivityAt", {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.sequelize.query(
      "UPDATE Users SET profile = 'agent' WHERE profile = 'user'"
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Users", "lastActivityAt");
    await queryInterface.removeColumn("Users", "theme");
    await queryInterface.removeColumn("Users", "isActive");
  }
};
