import dotenv from "dotenv";
import path from "path";

const envPaths = [
  process.env.NODE_ENV === "test" ? ".env.test" : ".env",
  path.resolve(process.cwd(), "../.env")
];

envPaths.forEach(envPath => {
  dotenv.config({ path: envPath });
});
