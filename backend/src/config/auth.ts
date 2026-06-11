export default {
  secret: process.env.JWT_SECRET || "change-this-development-secret",
  expiresIn: "15m",
  refreshSecret:
    process.env.JWT_REFRESH_SECRET || "change-this-development-refresh-secret",
  refreshExpiresIn: "7d",
  issuer: process.env.JWT_ISSUER || "techkepper-command-center",
  audience: process.env.JWT_AUDIENCE || "techkepper-web"
};
