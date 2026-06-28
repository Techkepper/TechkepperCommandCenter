import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const users = await queryInterface.describeTable("Users");
    if (!Object.prototype.hasOwnProperty.call(users, "availabilityStatus")) {
      await queryInterface.addColumn("Users", "availabilityStatus", {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "available"
      });
    }
    await queryInterface.sequelize.query(`
      UPDATE \`Users\`
      SET \`availabilityStatus\` = 'available'
      WHERE \`availabilityStatus\` IS NULL
         OR \`availabilityStatus\` NOT IN
           ('available', 'busy', 'away', 'unavailable', 'offline')
    `);
  },

  down: async (): Promise<void> => {
    // Conservative migration: availability data is preserved.
  }
};
