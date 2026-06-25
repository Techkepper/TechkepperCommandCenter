require("../bootstrap");

module.exports = {
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_bin"
  },
  // Rastrea los seeds aplicados en la tabla SequelizeData para que
  // `sequelize db:seed:all` sea idempotente y pueda ejecutarse en cada arranque
  // sin reinsertar datos (evita errores de clave duplicada al reiniciar).
  seederStorage: "sequelize",
  seederStorageTableName: "SequelizeData",
  dialect: process.env.DB_DIALECT || "mysql",
  timezone: "-03:00",
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  logging: false
};
