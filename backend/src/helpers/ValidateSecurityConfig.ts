const insecureValues = new Set([
  "mysecret",
  "myanothersecret",
  "change-this-development-secret",
  "change-this-development-refresh-secret"
]);

const ValidateSecurityConfig = (): void => {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const requiredSecrets = [
    process.env.JWT_SECRET,
    process.env.JWT_REFRESH_SECRET
  ];

  if (
    requiredSecrets.some(
      value => !value || value.length < 32 || insecureValues.has(value)
    ) ||
    requiredSecrets[0] === requiredSecrets[1]
  ) {
    throw new Error(
      "JWT_SECRET and JWT_REFRESH_SECRET must be unique 32+ character values in production."
    );
  }
};

export default ValidateSecurityConfig;
