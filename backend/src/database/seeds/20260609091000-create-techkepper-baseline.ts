import { QueryInterface, QueryTypes } from "sequelize";

const now = new Date();

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert("Queues", [
      {
        name: "Ventas",
        color: "#8ee63f",
        greetingMessage: "Gracias por contactar a Techkepper Ventas.",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Soporte Técnico",
        color: "#29b6f6",
        greetingMessage: "El equipo de soporte revisará su solicitud.",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Desarrollo Web",
        color: "#7c4dff",
        greetingMessage: "Nuestro equipo web dará seguimiento a su proyecto.",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Ciberseguridad",
        color: "#ff7043",
        greetingMessage: "Su solicitud de seguridad sera atendida con prioridad.",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Administración",
        color: "#78909c",
        greetingMessage: "Administración Techkepper ha recibido su mensaje.",
        createdAt: now,
        updatedAt: now
      }
    ]);

    await queryInterface.bulkInsert("Ecosystems", [
      { name: "Techkepper Web", color: "#7c4dff", isActive: true, createdAt: now, updatedAt: now },
      { name: "Techkepper Secure", color: "#ff7043", isActive: true, createdAt: now, updatedAt: now },
      { name: "Techkepper Growth", color: "#8ee63f", isActive: true, createdAt: now, updatedAt: now },
      { name: "Techkepper Automate", color: "#29b6f6", isActive: true, createdAt: now, updatedAt: now },
      { name: "Techkepper Green", color: "#43a047", isActive: true, createdAt: now, updatedAt: now }
    ]);

    const queues = (await queryInterface.sequelize.query(
      "SELECT id, name FROM Queues",
      { type: QueryTypes.SELECT }
    )) as Array<{ id: number; name: string }>;
    const queueId = (name: string) =>
      queues.find(queue => queue.name === name)?.id || null;

    await queryInterface.bulkInsert("QuickAnswers", [
      { shortcut: "/saludo", message: "Hola, le saluda Techkepper. Gracias por contactarnos. Con gusto revisamos su solicitud.", queueId: null, isActive: true, createdAt: now, updatedAt: now },
      { shortcut: "/datos", message: "Para brindarle una atención más precisa, por favor indíquenos su nombre, empresa y el detalle de la solicitud.", queueId: null, isActive: true, createdAt: now, updatedAt: now },
      { shortcut: "/recibido", message: "Hemos recibido su información correctamente. Nuestro equipo revisará el caso y le dará seguimiento por este medio.", queueId: null, isActive: true, createdAt: now, updatedAt: now },
      { shortcut: "/horario", message: "Nuestro horario de atención es de lunes a viernes de 9:00 a.m. a 5:00 p.m. Si su solicitud ingresa fuera de horario, será atendida el siguiente día hábil.", queueId: null, isActive: true, createdAt: now, updatedAt: now },
      { shortcut: "/agenda", message: "Con gusto podemos coordinar una reunión para revisar su necesidad con mayor detalle. Por favor indíquenos qué horario le funciona mejor.", queueId: queueId("Ventas"), isActive: true, createdAt: now, updatedAt: now },
      { shortcut: "/seguimiento", message: "Estamos dando seguimiento a su solicitud para poder avanzar de forma ordenada. Quedamos atentos a su confirmación para continuar con el proceso.", queueId: queueId("Ventas"), isActive: true, createdAt: now, updatedAt: now },
      { shortcut: "/cierre", message: "Su solicitud ha sido atendida. Procederemos a cerrar este caso, quedando siempre atentos si requiere apoyo adicional.", queueId: null, isActive: true, createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert("Settings", [
      { key: "assignmentAutoMessage", value: process.env.ENABLE_ASSIGNMENT_AUTO_MESSAGE === "false" ? "disabled" : "enabled", createdAt: now, updatedAt: now },
      { key: "assignmentMessageTemplate", value: "Hola, le saluda {EMPRESA}. Su solicitud ha sido asignada a {NOMBRE_AGENTE}, quien estará a cargo de brindarle seguimiento. Con gusto le atenderemos por este medio.", createdAt: now, updatedAt: now },
      { key: "companyName", value: process.env.COMPANY_NAME || "Techkepper", createdAt: now, updatedAt: now },
      { key: "companyEmail", value: process.env.COMPANY_EMAIL || "ventas@techkeppercr.com", createdAt: now, updatedAt: now },
      { key: "companyPhone", value: process.env.COMPANY_PHONE || "+506 72259973", createdAt: now, updatedAt: now },
      { key: "businessHours", value: "lunes a viernes de 9:00 a.m. a 5:00 p.m.", createdAt: now, updatedAt: now },
      { key: "defaultTheme", value: process.env.DEFAULT_THEME || "dark", createdAt: now, updatedAt: now },
      { key: "allowAgentHistory", value: "disabled", createdAt: now, updatedAt: now }
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete("QuickAnswers", {
      shortcut: ["/saludo", "/datos", "/recibido", "/horario", "/agenda", "/seguimiento", "/cierre"]
    });
    await queryInterface.bulkDelete("Settings", {
      key: [
        "assignmentAutoMessage",
        "assignmentMessageTemplate",
        "companyName",
        "companyEmail",
        "companyPhone",
        "businessHours",
        "defaultTheme",
        "allowAgentHistory"
      ]
    });
    await queryInterface.bulkDelete("Ecosystems", {});
    await queryInterface.bulkDelete("Queues", {
      name: [
        "Ventas",
        "Soporte Técnico",
        "Desarrollo Web",
        "Ciberseguridad",
        "Administración"
      ]
    });
  }
};
