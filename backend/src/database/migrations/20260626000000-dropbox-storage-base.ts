import { DataTypes, QueryInterface } from "sequelize";

const addColumnIfMissing = async (
  queryInterface: QueryInterface,
  tableName: string,
  columnName: string,
  definition: Parameters<QueryInterface["addColumn"]>[2]
): Promise<void> => {
  const table = await queryInterface.describeTable(tableName);
  if (!Object.prototype.hasOwnProperty.call(table, columnName)) {
    await queryInterface.addColumn(tableName, columnName, definition);
  }
};

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`ExternalStorageConnections\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`provider\` varchar(50) NOT NULL,
        \`status\` varchar(50) NOT NULL DEFAULT 'not_connected',
        \`encryptedRefreshToken\` text DEFAULT NULL,
        \`accountInfo\` text DEFAULT NULL,
        \`createdById\` int(11) DEFAULT NULL,
        \`updatedById\` int(11) DEFAULT NULL,
        \`lastSyncAt\` datetime DEFAULT NULL,
        \`createdAt\` datetime NOT NULL,
        \`updatedAt\` datetime NOT NULL,
        \`deletedAt\` datetime DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`external_storage_provider_unique\` (\`provider\`),
        KEY \`ExternalStorageConnections_createdById_idx\` (\`createdById\`),
        KEY \`ExternalStorageConnections_updatedById_idx\` (\`updatedById\`),
        CONSTRAINT \`ExternalStorageConnections_createdById_fk\`
          FOREIGN KEY (\`createdById\`) REFERENCES \`Users\` (\`id\`)
          ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT \`ExternalStorageConnections_updatedById_fk\`
          FOREIGN KEY (\`updatedById\`) REFERENCES \`Users\` (\`id\`)
          ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
    `);

    await addColumnIfMissing(
      queryInterface,
      "SmartDocuments",
      "storageProvider",
      {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "local"
      }
    );
    await addColumnIfMissing(
      queryInterface,
      "SmartDocuments",
      "storageFileId",
      {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    );
    await addColumnIfMissing(
      queryInterface,
      "SmartDocuments",
      "externalStoragePath",
      {
        type: DataTypes.STRING(500),
        allowNull: true
      }
    );
    await addColumnIfMissing(
      queryInterface,
      "SmartDocuments",
      "storageSyncedAt",
      {
        type: DataTypes.DATE,
        allowNull: true
      }
    );
    await addColumnIfMissing(
      queryInterface,
      "SmartDocuments",
      "storageStatus",
      {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "pending"
      }
    );
  },

  down: async (): Promise<void> => {
    // Fase 6.2A usa migración idempotente y conservadora; no se elimina data.
  }
};
