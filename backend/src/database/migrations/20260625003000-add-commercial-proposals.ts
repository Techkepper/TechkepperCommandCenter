import { DataTypes, QueryInterface } from "sequelize";

const timestamps = {
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false }
};

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tables = await queryInterface.showAllTables();
    if (
      !tables.includes("Users") ||
      !tables.includes("BusinessClients") ||
      !tables.includes("SmartDocuments")
    ) {
      throw new Error(
        "Users, BusinessClients and SmartDocuments are required before proposals"
      );
    }

    if (!tables.includes("CommercialProposals")) {
      await queryInterface.createTable("CommercialProposals", {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        businessClientId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: "BusinessClients", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL"
        },
        manualClientName: { type: DataTypes.STRING(255), allowNull: true },
        manualClientEmail: { type: DataTypes.STRING(255), allowNull: true },
        manualClientPhone: { type: DataTypes.STRING(80), allowNull: true },
        manualClientIdentification: {
          type: DataTypes.STRING(80),
          allowNull: true
        },
        clientNumber: { type: DataTypes.STRING(80), allowNull: false },
        proposalNumber: {
          type: DataTypes.STRING(80),
          allowNull: false,
          unique: true
        },
        offerDate: { type: DataTypes.DATEONLY, allowNull: false },
        title: { type: DataTypes.STRING(255), allowNull: false },
        introduction: { type: DataTypes.TEXT, allowNull: true },
        identifiedNeed: { type: DataTypes.TEXT, allowNull: true },
        generalScope: { type: DataTypes.TEXT, allowNull: true },
        investmentAnalysis: { type: DataTypes.TEXT, allowNull: true },
        currency: { type: DataTypes.STRING(3), allowNull: false },
        desiredNetAmount: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0
        },
        sellerCommissionRate: {
          type: DataTypes.DECIMAL(7, 4),
          allowNull: false,
          defaultValue: 0
        },
        externalCosts: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0
        },
        thirdPartyLicenses: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0
        },
        additionalMarginRate: {
          type: DataTypes.DECIMAL(7, 4),
          allowNull: false,
          defaultValue: 0
        },
        recommendedSubtotal: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0
        },
        discountAmount: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0
        },
        ivaRate: {
          type: DataTypes.DECIMAL(7, 4),
          allowNull: false,
          defaultValue: 13
        },
        subtotal: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0
        },
        ivaAmount: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0
        },
        total: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0
        },
        estimatedCommission: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0
        },
        estimatedNetAmount: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0
        },
        roundFinalPrice: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        showIvi: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        paymentTermsText: { type: DataTypes.TEXT, allowNull: true },
        projectTimeline: { type: DataTypes.STRING(255), allowNull: true },
        termsText: { type: DataTypes.TEXT, allowNull: true },
        futureRecommendation: { type: DataTypes.TEXT, allowNull: true },
        status: {
          type: DataTypes.STRING(50),
          allowNull: false,
          defaultValue: "draft"
        },
        queueId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: "Queues", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL"
        },
        generatedDocumentId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: "SmartDocuments", key: "id" },
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
        updatedById: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: "Users", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL"
        },
        ...timestamps,
        deletedAt: { type: DataTypes.DATE, allowNull: true }
      });
    }

    if (!tables.includes("CommercialProposalItems")) {
      await queryInterface.createTable("CommercialProposalItems", {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        proposalId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "CommercialProposals", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE"
        },
        sortOrder: { type: DataTypes.INTEGER, allowNull: false },
        title: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        includedItems: { type: DataTypes.TEXT, allowNull: false },
        subtotal: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
        isIncluded: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        ...timestamps
      });
    }

    if (!tables.includes("CommercialProposalPaymentMilestones")) {
      await queryInterface.createTable("CommercialProposalPaymentMilestones", {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        proposalId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "CommercialProposals", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE"
        },
        sortOrder: { type: DataTypes.INTEGER, allowNull: false },
        name: { type: DataTypes.STRING(255), allowNull: false },
        percentage: { type: DataTypes.DECIMAL(7, 4), allowNull: false },
        amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        ...timestamps
      });
    }

    if (!tables.includes("CommercialProposalEvents")) {
      await queryInterface.createTable("CommercialProposalEvents", {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        proposalId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "CommercialProposals", key: "id" },
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
        ...timestamps
      });
    }

    const notificationColumns = tables.includes("InternalNotifications")
      ? await queryInterface.describeTable("InternalNotifications")
      : null;
    if (notificationColumns) {
      if (!notificationColumns.proposalId) {
        await queryInterface.addColumn("InternalNotifications", "proposalId", {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: "CommercialProposals", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE"
        });
      }
      if (notificationColumns.documentId.allowNull === false) {
        await queryInterface.changeColumn(
          "InternalNotifications",
          "documentId",
          {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "SmartDocuments", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE"
          }
        );
      }
    }

    const addIndex = async (
      table: string,
      fields: string[],
      name: string
    ): Promise<void> => {
      const indexes = (await queryInterface.showIndex(table)) as Array<{
        name: string;
      }>;
      if (!indexes.some(index => index.name === name)) {
        await queryInterface.addIndex(table, fields, { name });
      }
    };
    await addIndex("CommercialProposals", ["status"], "idx_proposals_status");
    await addIndex(
      "CommercialProposals",
      ["businessClientId"],
      "idx_proposals_client"
    );
    await addIndex("CommercialProposals", ["queueId"], "idx_proposals_queue");
    await addIndex(
      "CommercialProposals",
      ["offerDate"],
      "idx_proposals_offer_date"
    );
    await addIndex(
      "CommercialProposalItems",
      ["proposalId"],
      "idx_proposal_items_proposal"
    );
    await addIndex(
      "CommercialProposalPaymentMilestones",
      ["proposalId"],
      "idx_proposal_milestones_proposal"
    );
    await addIndex(
      "CommercialProposalEvents",
      ["proposalId"],
      "idx_proposal_events_proposal"
    );
    if (notificationColumns) {
      await addIndex(
        "InternalNotifications",
        ["proposalId"],
        "idx_internal_notifications_proposal"
      );
    }
  },

  down: async (): Promise<void> => {
    // No destructiva para preservar propuestas comerciales e historial.
  }
};
