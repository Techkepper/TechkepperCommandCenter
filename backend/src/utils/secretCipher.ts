import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes
} from "crypto";

import AppError from "../errors/AppError";

const algorithm = "aes-256-gcm";
const version = "v1";

const getEncryptionKey = (): Buffer => {
  const material = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;

  if (!material || material.length < 32) {
    throw new AppError(
      "Configure ENCRYPTION_KEY con al menos 32 caracteres para proteger secretos.",
      500
    );
  }

  return createHash("sha256").update(material).digest();
};

export const encryptSecret = (plainText: string): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  return [
    version,
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64")
  ].join(":");
};

export const decryptSecret = (encryptedSecret: string): string => {
  const [storedVersion, ivValue, authTagValue, encryptedValue] =
    encryptedSecret.split(":");

  if (
    storedVersion !== version ||
    !ivValue ||
    !authTagValue ||
    !encryptedValue
  ) {
    throw new AppError("El secreto cifrado no tiene un formato válido.", 500);
  }

  const decipher = createDecipheriv(
    algorithm,
    getEncryptionKey(),
    Buffer.from(ivValue, "base64")
  );
  decipher.setAuthTag(Buffer.from(authTagValue, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64")),
    decipher.final()
  ]).toString("utf8");
};
