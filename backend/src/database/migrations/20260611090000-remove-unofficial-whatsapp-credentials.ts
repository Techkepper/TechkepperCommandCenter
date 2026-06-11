import { DataTypes, QueryInterface } from "sequelize";

const hasTable = async (
  queryInterface: QueryInterface,
  tableName: string
): Promise<boolean> => {
  const tables = (await queryInterface.showAllTables()).map(table =>
    typeof table === "string" ? table : String(table)
  );
  return tables.some(table => table.toLowerCase() === tableName.toLowerCase());
};

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkUpdate(
      "Whatsapps",
      { session: "", qrcode: "", retries: 0 },
      {}
    );

    if (await hasTable(queryInterface, "WppKeys")) {
      await queryInterface.dropTable("WppKeys");
    }
  },

  down: async (queryInterface: QueryInterface) => {
    if (await hasTable(queryInterface, "WppKeys")) return;

    await queryInterface.createTable("WppKeys", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      connectionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Whatsapps",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      type: { type: DataTypes.TEXT, allowNull: false },
      keyId: { type: DataTypes.TEXT, allowNull: false },
      value: { type: DataTypes.TEXT, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex(
      "WppKeys",
      ["connectionId", "type", "keyId"],
      {
        unique: true,
        name: "wpp_keys_connection_type_key_unique"
      }
    );
  }
};
