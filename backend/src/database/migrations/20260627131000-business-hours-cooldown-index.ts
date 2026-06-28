import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const indexes = (await queryInterface.showIndex(
      "AfterHoursAutoReplyEvents"
    )) as Array<{ name: string }>;
    if (!indexes.some(index => index.name === "after_hours_cooldown")) {
      await queryInterface.addIndex(
        "AfterHoursAutoReplyEvents",
        ["contactId", "replyType", "status", "createdAt"],
        { name: "after_hours_cooldown" }
      );
    }
  },

  down: async (): Promise<void> => {
    // Conservative migration: the cooldown index is preserved.
  }
};
