const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

export const getPublicBackendOrigin = (
  env: NodeJS.ProcessEnv = process.env
): string => {
  const configured = env.PUBLIC_BACKEND_URL?.trim();
  if (!configured) {
    throw new Error("PUBLIC_BACKEND_URL is required");
  }

  return trimTrailingSlash(configured);
};

export const getDropboxRedirectUri = (
  env: NodeJS.ProcessEnv = process.env
): string => {
  const configured = env.DROPBOX_REDIRECT_URI?.trim();
  if (configured) {
    return configured;
  }

  return `${getPublicBackendOrigin(env)}/dropbox/oauth/callback`;
};

export const isPublicBackendSecure = (
  env: NodeJS.ProcessEnv = process.env
): boolean => getPublicBackendOrigin(env).startsWith("https://");
