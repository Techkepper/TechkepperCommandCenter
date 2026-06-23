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
    if (!(await hasColumn(queryInterface, "Users", "isActive"))) {
      await queryInterface.addColumn("Users", "isActive", {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
    }

    if (!(await hasColumn(queryInterface, "Users", "theme"))) {
      await queryInterface.addColumn("Users", "theme", {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "dark"
      });
    }

    if (!(await hasColumn(queryInterface, "Users", "lastActivityAt"))) {
      await queryInterface.addColumn("Users", "lastActivityAt", {
        type: DataTypes.DATE,
        allowNull: true
      });
    }

    await queryInterface.sequelize.query(
      "UPDATE Users SET profile = 'agent' WHERE profile = 'user'"
    );
  },

  down: async (queryInterface: QueryInterface) => {
    if (await hasColumn(queryInterface, "Users", "lastActivityAt")) {
      await queryInterface.removeColumn("Users", "lastActivityAt");
    }

    if (await hasColumn(queryInterface, "Users", "theme")) {
      await queryInterface.removeColumn("Users", "theme");
    }

    if (await hasColumn(queryInterface, "Users", "isActive")) {
      await queryInterface.removeColumn("Users", "isActive");
    }
  }
};
