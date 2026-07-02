require("../bootstrap");

const sslEnabled = String(process.env.DB_SSL || "false").toLowerCase() === "true";
const sslRejectUnauthorized =
  process.env.DB_SSL_REJECT_UNAUTHORIZED !== undefined
    ? String(process.env.DB_SSL_REJECT_UNAUTHORIZED).toLowerCase() === "true"
    : false;
const dialectOptions = sslEnabled
  ? {
      ssl: {
        rejectUnauthorized: sslRejectUnauthorized
      }
    }
  : undefined;

const baseConfig = {
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_bin"
  },
  // Rastrea los seeds aplicados en la tabla SequelizeData para que
  // `sequelize db:seed:all` sea idempotente y pueda ejecutarse en cada arranque
  // sin reinsertar datos (evita errores de clave duplicada al reiniciar).
  seederStorage: "sequelize",
  seederStorageTableName: "SequelizeData",
  dialect: "mysql",
  timezone: process.env.DB_TIMEZONE || "-03:00",
  logging: false,
  ...(dialectOptions ? { dialectOptions } : {})
};

const databaseUrl = process.env.DATABASE_URL?.trim();

module.exports = databaseUrl
  ? {
      ...baseConfig,
      url: databaseUrl
    }
  : {
      ...baseConfig,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASS
    };
