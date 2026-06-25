import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes("Collaborators")) {
      await queryInterface.createTable("Collaborators", {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        fullName: { type: DataTypes.STRING(255), allowNull: false },
        identificationType: { type: DataTypes.STRING(80), allowNull: false },
        identificationNumber: { type: DataTypes.STRING(80), allowNull: false },
        normalizedIdentificationNumber: {
          type: DataTypes.STRING(80),
          allowNull: false,
          unique: true
        },
        contractualDenomination: {
          type: DataTypes.ENUM("LA CONTRATISTA", "EL CONTRATISTA"),
          allowNull: false
        },
        email: { type: DataTypes.STRING(255), allowNull: true },
        phone: { type: DataTypes.STRING(80), allowNull: true },
        address: { type: DataTypes.STRING(500), allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        queueId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: "Queues", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL"
        },
        createdById: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "Users", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT"
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
        deletedAt: { type: DataTypes.DATE, allowNull: true }
      });
    }

    const refreshedTables = await queryInterface.showAllTables();
    if (!refreshedTables.includes("CollaboratorDocuments")) {
      await queryInterface.createTable("CollaboratorDocuments", {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        collaboratorId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "Collaborators", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE"
        },
        documentId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          unique: true,
          references: { model: "SmartDocuments", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE"
        },
        linkedById: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "Users", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT"
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false }
      });
    }
  },

  down: async (): Promise<void> => {
    // Deliberadamente no destructiva.
  }
};
