import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes("SmartDocuments") || !tables.includes("Users")) {
      throw new Error(
        "SmartDocuments and Users tables are required before notification setup"
      );
    }

    if (!tables.includes("InternalNotifications")) {
      await queryInterface.createTable("InternalNotifications", {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "Users", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE"
        },
        createdById: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: "Users", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL"
        },
        type: { type: DataTypes.STRING(80), allowNull: false },
        title: { type: DataTypes.STRING(255), allowNull: false },
        message: { type: DataTypes.TEXT, allowNull: false },
        documentId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "SmartDocuments", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE"
        },
        status: { type: DataTypes.STRING(50), allowNull: false },
        comment: { type: DataTypes.TEXT, allowNull: true },
        readAt: { type: DataTypes.DATE, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false }
      });
    }

    const indexes = (await queryInterface.showIndex(
      "InternalNotifications"
    )) as Array<{ name: string }>;
    const names = indexes.map(index => index.name);
    const addIndex = async (fields: string[], name: string): Promise<void> => {
      if (!names.includes(name)) {
        await queryInterface.addIndex("InternalNotifications", fields, {
          name
        });
      }
    };
    await addIndex(["userId"], "idx_internal_notifications_user");
    await addIndex(["createdById"], "idx_internal_notifications_creator");
    await addIndex(["documentId"], "idx_internal_notifications_document");
    await addIndex(["type"], "idx_internal_notifications_type");
    await addIndex(["readAt"], "idx_internal_notifications_read");
    await addIndex(["createdAt"], "idx_internal_notifications_created");
  },

  down: async (): Promise<void> => {
    // Deliberadamente no destructiva para preservar avisos y auditoría.
  }
};
