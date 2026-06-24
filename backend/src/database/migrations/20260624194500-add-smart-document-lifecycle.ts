import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes("SmartDocuments")) {
      throw new Error(
        "SmartDocuments table is required before lifecycle setup"
      );
    }

    const documentColumns = await queryInterface.describeTable(
      "SmartDocuments"
    );
    if (!documentColumns.status) {
      await queryInterface.addColumn("SmartDocuments", "status", {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "generated"
      });
    }
    await queryInterface.sequelize.query(
      "UPDATE `SmartDocuments` SET `status` = 'generated' WHERE `status` IS NULL OR `status` = ''"
    );

    if (!tables.includes("SmartDocumentEvents")) {
      await queryInterface.createTable("SmartDocumentEvents", {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        documentId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "SmartDocuments", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE"
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: "Users", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL"
        },
        eventType: { type: DataTypes.STRING(80), allowNull: false },
        previousStatus: { type: DataTypes.STRING(50), allowNull: true },
        newStatus: { type: DataTypes.STRING(50), allowNull: true },
        comment: { type: DataTypes.TEXT, allowNull: true },
        metadata: { type: DataTypes.TEXT, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false }
      });
    }

    const indexes = (await queryInterface.showIndex(
      "SmartDocumentEvents"
    )) as Array<{ name: string }>;
    const indexNames = indexes.map(index => index.name);
    const addIndex = async (fields: string[], name: string): Promise<void> => {
      if (!indexNames.includes(name)) {
        await queryInterface.addIndex("SmartDocumentEvents", fields, { name });
      }
    };
    await addIndex(["documentId"], "idx_smart_document_events_document");
    await addIndex(["userId"], "idx_smart_document_events_user");
    await addIndex(["eventType"], "idx_smart_document_events_type");
    await addIndex(["createdAt"], "idx_smart_document_events_created");
    await addIndex(["newStatus"], "idx_smart_document_events_status");

    const documentIndexes = (await queryInterface.showIndex(
      "SmartDocuments"
    )) as Array<{ name: string }>;
    if (
      !documentIndexes.some(
        index => index.name === "idx_smart_documents_status"
      )
    ) {
      await queryInterface.addIndex("SmartDocuments", ["status"], {
        name: "idx_smart_documents_status"
      });
    }
  },

  down: async (): Promise<void> => {
    // Deliberadamente no destructiva para preservar trazabilidad.
  }
};
