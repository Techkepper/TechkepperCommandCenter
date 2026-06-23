const configuredOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  process.env.CORS_ALLOWED_ORIGINS || ""
]
  .join(",")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

const allowedHostSuffixes = [".ngrok-free.app", ".ngrok.io"];

export const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin) return true;
  if (configuredOrigins.includes(origin)) return true;

  try {
    const url = new URL(origin);
    return (
      url.protocol === "https:" &&
      allowedHostSuffixes.some(suffix => url.hostname.endsWith(suffix))
    );
  } catch (_err) {
    return false;
  }
};

export const getAllowedOrigins = (): string[] => configuredOrigins;
