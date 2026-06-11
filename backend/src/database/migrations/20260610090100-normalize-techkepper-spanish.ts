import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(
      "UPDATE Queues SET name = 'Soporte Técnico', greetingMessage = 'El equipo de soporte revisará su solicitud.' WHERE name = 'Soporte Tecnico'"
    );
    await queryInterface.sequelize.query(
      "UPDATE Queues SET greetingMessage = 'Nuestro equipo web dará seguimiento a su proyecto.' WHERE name = 'Desarrollo Web'"
    );
    await queryInterface.sequelize.query(
      "UPDATE Queues SET name = 'Administración', greetingMessage = 'Administración Techkepper ha recibido su mensaje.' WHERE name = 'Administracion'"
    );
    await queryInterface.sequelize.query(
      "UPDATE QuickAnswers SET message = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(message, 'atencion', 'atención'), 'indiquenos', 'indíquenos'), 'informacion', 'información'), 'revisara', 'revisará'), 'dara', 'dará'), 'dia habil', 'día hábil'), 'reunion', 'reunión'), 'confirmacion', 'confirmación')"
    );
    await queryInterface.sequelize.query(
      "UPDATE Settings SET value = REPLACE(REPLACE(value, 'estara', 'estará'), 'atencion', 'atención') WHERE `key` = 'assignmentMessageTemplate'"
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(
      "UPDATE Queues SET name = 'Soporte Tecnico' WHERE name = 'Soporte Técnico'"
    );
    await queryInterface.sequelize.query(
      "UPDATE Queues SET name = 'Administracion' WHERE name = 'Administración'"
    );
  }
};
