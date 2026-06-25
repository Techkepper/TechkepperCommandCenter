import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes("InternalNotificationsV2")) {
      await queryInterface.createTable("InternalNotificationsV2", {
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
          allowNull: true,
          references: { model: "SmartDocuments", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE"
        },
        proposalId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: "CommercialProposals", key: "id" },
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
      "InternalNotificationsV2"
    )) as Array<{ name: string }>;
    const addIndex = async (fields: string[], name: string): Promise<void> => {
      if (!indexes.some(index => index.name === name)) {
        await queryInterface.addIndex("InternalNotificationsV2", fields, {
          name
        });
      }
    };
    await addIndex(["userId"], "idx_internal_notifications_v2_user");
    await addIndex(["documentId"], "idx_internal_notifications_v2_document");
    await addIndex(["proposalId"], "idx_internal_notifications_v2_proposal");
    await addIndex(["readAt"], "idx_internal_notifications_v2_read");

    if (tables.includes("InternalNotifications")) {
      await queryInterface.sequelize.query(`
        INSERT IGNORE INTO InternalNotificationsV2 (
          id, userId, createdById, type, title, message, documentId,
          proposalId, status, comment, readAt, createdAt, updatedAt
        )
        SELECT
          id, userId, createdById, type, title, message, documentId,
          proposalId, status, comment, readAt, createdAt, updatedAt
        FROM InternalNotifications
      `);
    }
  },

  down: async (): Promise<void> => {
    // No destructiva: se conserva la tabla V2 y la tabla original.
  }
};
