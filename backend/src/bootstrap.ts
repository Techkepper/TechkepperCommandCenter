import dotenv from "dotenv";
import path from "path";

const cwd = process.cwd();
const rootEnvDir = path.basename(cwd) === "backend" ? path.resolve(cwd, "..") : cwd;

const envPaths =
  process.env.NODE_ENV === "test"
    ? [path.resolve(rootEnvDir, ".env.test")]
    : process.env.NODE_ENV === "production"
      ? [
          path.resolve(rootEnvDir, ".env.production"),
          path.resolve(cwd, ".env.production")
        ]
      : [path.resolve(rootEnvDir, ".env"), path.resolve(cwd, ".env")];

envPaths.forEach(envPath => {
  dotenv.config({ path: envPath });
});
