import { QueryInterface } from "sequelize";
import { hash } from "bcryptjs";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const email = process.env.INITIAL_ADMIN_EMAIL;
    const password = process.env.INITIAL_ADMIN_PASSWORD;
    const name = process.env.INITIAL_ADMIN_NAME || "Administrador Techkepper";

    if (!email || !password) {
      // An administrator is intentionally not created with public credentials.
      return Promise.resolve();
    }
    if (password.length < 12) {
      throw new Error("INITIAL_ADMIN_PASSWORD must contain at least 12 characters.");
    }

    return queryInterface.bulkInsert(
      "Users",
      [
        {
          name,
          email,
          passwordHash: await hash(password, 10),
          profile: "admin",
          tokenVersion: 0,
          isActive: true,
          theme: "dark",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      {}
    );
  },

  down: (queryInterface: QueryInterface) =>
    process.env.INITIAL_ADMIN_EMAIL
      ? queryInterface.bulkDelete("Users", {
          email: process.env.INITIAL_ADMIN_EMAIL
        })
      : Promise.resolve()
};
