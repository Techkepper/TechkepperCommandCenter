import { DataTypes, QueryInterface } from "sequelize";

const hasTable = async (
  queryInterface: QueryInterface,
  tableName: string
): Promise<boolean> => {
  try {
    await queryInterface.describeTable(tableName);
    return true;
  } catch (_error) {
    return false;
  }
};

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await hasTable(queryInterface, "BusinessHoursSpecialDates"))) {
      await queryInterface.createTable("BusinessHoursSpecialDates", {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true
        },
        name: { type: DataTypes.STRING(160), allowNull: false },
        type: { type: DataTypes.STRING(30), allowNull: false },
        startDate: { type: DataTypes.DATEONLY, allowNull: false },
        endDate: { type: DataTypes.DATEONLY, allowNull: false },
        message: { type: DataTypes.TEXT, allowNull: false },
        active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
        deletedAt: { type: DataTypes.DATE, allowNull: true }
      });
      await queryInterface.addIndex(
        "BusinessHoursSpecialDates",
        ["active", "startDate", "endDate"],
        { name: "bh_special_date_range" }
      );
    }

    if (!(await hasTable(queryInterface, "AfterHoursAutoReplyEvents"))) {
      await queryInterface.createTable("AfterHoursAutoReplyEvents", {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true
        },
        contactId: { type: DataTypes.INTEGER, allowNull: false },
        ticketId: { type: DataTypes.INTEGER, allowNull: false },
        replyType: { type: DataTypes.STRING(80), allowNull: false },
        status: { type: DataTypes.STRING(20), allowNull: false },
        detail: { type: DataTypes.STRING(255), allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false }
      });
      await queryInterface.addIndex(
        "AfterHoursAutoReplyEvents",
        ["contactId", "replyType", "status", "createdAt"],
        { name: "after_hours_cooldown" }
      );
    }
  },

  down: async (): Promise<void> => {
    // Conservative migration: operational history is preserved.
  }
};
