import fs from "fs";
import path from "path";
import { request } from "https";
import { createHmac } from "crypto";
import { stringify } from "querystring";
import { URL } from "url";

import AppError from "../../errors/AppError";
import ExternalStorageConnection from "../../models/ExternalStorageConnection";
import SmartDocument from "../../models/SmartDocument";
import { logger } from "../../utils/logger";
import { decryptSecret, encryptSecret } from "../../utils/secretCipher";
import { resolveDocumentPath } from "../DocumentServices/documentStorage";
import {
  normalizeDocumentStatus,
  recordDocumentEvent
} from "../DocumentServices/DocumentLifecycleService";

const provider = "dropbox";
const oauthBaseUrl = "https://www.dropbox.com/oauth2/authorize";
const tokenUrl = "https://api.dropboxapi.com/oauth2/token";
const apiBaseUrl = "https://api.dropboxapi.com/2";
const contentBaseUrl = "https://content.dropboxapi.com/2";
const stateMaxAgeMs = 10 * 60 * 1000;

type DropboxStatus = {
  provider: "dropbox";
  enabled: boolean;
  configured: boolean;
  connected: boolean;
  status: string;
  accountInfo: Record<string, unknown> | null;
  lastSyncAt: Date | null;
};

type HttpResponse<T> = {
  statusCode: number;
  data: T;
};

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  uid?: string;
  account_id?: string;
  error?: string;
  error_description?: string;
};

type DropboxUploadResponse = {
  id?: string;
  name?: string;
  path_display?: string;
  path_lower?: string;
};

const isDropboxEnabled = (): boolean =>
  String(process.env.DROPBOX_STORAGE_ENABLED || "false").toLowerCase() ===
  "true";

const getDropboxConfig = () => ({
  appKey: process.env.DROPBOX_APP_KEY || "",
  appSecret: process.env.DROPBOX_APP_SECRET || "",
  redirectUri:
    process.env.DROPBOX_REDIRECT_URI ||
    "http://localhost:8081/dropbox/oauth/callback"
});

const hasDropboxOAuthConfig = (): boolean => {
  const config = getDropboxConfig();
  return Boolean(config.appKey && config.appSecret && config.redirectUri);
};

const safeJsonParse = (
  value?: string | null
): Record<string, unknown> | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

const encodeBasicAuth = (appKey: string, appSecret: string): string =>
  Buffer.from(`${appKey}:${appSecret}`).toString("base64");

const ensureOAuthConfig = (): ReturnType<typeof getDropboxConfig> => {
  const config = getDropboxConfig();
  if (!config.appKey || !config.appSecret || !config.redirectUri) {
    throw new AppError(
      "Configure las variables DROPBOX_APP_KEY, DROPBOX_APP_SECRET y DROPBOX_REDIRECT_URI antes de conectar Dropbox.",
      400
    );
  }
  return config;
};

const buildStateSignature = (userId: string, timestamp: number): string => {
  const secret = process.env.JWT_SECRET || process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 16) {
    throw new AppError("No hay una clave segura para firmar OAuth.", 500);
  }
  return createHmac("sha256", secret)
    .update(`${userId}:${timestamp}`)
    .digest("hex");
};

const createOAuthState = (userId: string): string => {
  const timestamp = Date.now();
  const signature = buildStateSignature(userId, timestamp);
  return Buffer.from(`${userId}:${timestamp}:${signature}`, "utf8").toString(
    "base64url"
  );
};

const parseOAuthState = (state: unknown): { userId: string } => {
  if (typeof state !== "string" || !state) {
    throw new AppError("El estado OAuth no es válido.", 400);
  }
  const decoded = Buffer.from(state, "base64url").toString("utf8");
  const [userId, timestampValue, signature] = decoded.split(":");
  const timestamp = Number(timestampValue);
  if (!userId || !Number.isFinite(timestamp) || !signature) {
    throw new AppError("El estado OAuth no es válido.", 400);
  }
  if (Date.now() - timestamp > stateMaxAgeMs) {
    throw new AppError(
      "La autorización de Dropbox expiró. Intente de nuevo.",
      400
    );
  }
  if (buildStateSignature(userId, timestamp) !== signature) {
    throw new AppError("El estado OAuth no coincide.", 400);
  }
  return { userId };
};

const requestBuffer = <T>({
  url,
  method = "POST",
  headers = {},
  body
}: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: Buffer | string;
}): Promise<HttpResponse<T>> =>
  new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const payload =
      typeof body === "string" ? Buffer.from(body, "utf8") : body || undefined;
    const req = request(
      {
        method,
        hostname: parsedUrl.hostname,
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        protocol: parsedUrl.protocol,
        headers: {
          ...headers,
          ...(payload ? { "Content-Length": String(payload.length) } : {})
        }
      },
      res => {
        const chunks: Buffer[] = [];
        res.on("data", chunk => chunks.push(Buffer.from(chunk)));
        res.on("end", () => {
          const responseBuffer = Buffer.concat(chunks);
          const text = responseBuffer.toString("utf8");
          const contentType = String(res.headers["content-type"] || "");
          const statusCode = res.statusCode || 500;
          const data = contentType.includes("application/json")
            ? JSON.parse(text || "{}")
            : (responseBuffer as unknown);
          resolve({ statusCode, data: data as T });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });

const requestDropboxJson = async <T>({
  url,
  accessToken,
  body = {}
}: {
  url: string;
  accessToken: string;
  body?: Record<string, unknown>;
}): Promise<T> => {
  const response = await requestBuffer<T>({
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new AppError(
      "Dropbox rechazó la solicitud. Valide la conexión.",
      502
    );
  }
  return response.data;
};

const requestDropboxToken = async (
  params: Record<string, string>
): Promise<TokenResponse> => {
  const config = ensureOAuthConfig();
  const response = await requestBuffer<TokenResponse>({
    url: tokenUrl,
    headers: {
      Authorization: `Basic ${encodeBasicAuth(
        config.appKey,
        config.appSecret
      )}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: stringify(params)
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new AppError(
      "Dropbox no aceptó la autorización. Revise la app y los permisos configurados.",
      400
    );
  }
  return response.data;
};

const getConnection = async (): Promise<ExternalStorageConnection | null> =>
  ExternalStorageConnection.findOne({ where: { provider } });

const getActiveConnection = async (): Promise<ExternalStorageConnection> => {
  const connection = await getConnection();
  if (!connection?.encryptedRefreshToken || connection.status !== "connected") {
    throw new AppError("Dropbox no está conectado.", 409);
  }
  return connection;
};

export const getDropboxStatus = async (): Promise<DropboxStatus> => {
  const connection = await getConnection();
  return {
    provider,
    enabled: isDropboxEnabled(),
    configured: hasDropboxOAuthConfig(),
    connected: Boolean(connection?.encryptedRefreshToken),
    status: connection?.status || "not_connected",
    accountInfo: safeJsonParse(connection?.accountInfo),
    lastSyncAt: connection?.lastSyncAt || null
  };
};

export const generateDropboxOAuthUrl = async (
  userId: string
): Promise<string> => {
  const config = ensureOAuthConfig();
  const url = new URL(oauthBaseUrl);
  url.searchParams.set("client_id", config.appKey);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("token_access_type", "offline");
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", createOAuthState(userId));
  return url.toString();
};

export const handleDropboxOAuthCallback = async ({
  code,
  state
}: {
  code: unknown;
  state: unknown;
}): Promise<DropboxStatus> => {
  if (typeof code !== "string" || !code) {
    throw new AppError("Dropbox no devolvió un código de autorización.", 400);
  }
  const { userId } = parseOAuthState(state);
  const config = ensureOAuthConfig();
  const token = await requestDropboxToken({
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri
  });

  if (!token.refresh_token) {
    throw new AppError(
      "Dropbox no devolvió refresh token. Revise que la app use token_access_type=offline.",
      400
    );
  }

  const accountInfo = token.access_token
    ? await requestDropboxJson<Record<string, unknown>>({
        url: `${apiBaseUrl}/users/get_current_account`,
        accessToken: token.access_token
      })
    : null;

  const existing = await getConnection();
  const payload = {
    provider,
    status: "connected",
    encryptedRefreshToken: encryptSecret(token.refresh_token),
    accountInfo: accountInfo ? JSON.stringify(accountInfo) : null,
    updatedById: Number(userId),
    lastSyncAt: new Date()
  };

  if (existing) {
    await existing.update(payload);
  } else {
    await ExternalStorageConnection.create({
      ...payload,
      createdById: Number(userId)
    } as unknown as ExternalStorageConnection);
  }

  return getDropboxStatus();
};

export const renewDropboxAccessToken = async (): Promise<string> => {
  const connection = await getActiveConnection();
  const refreshToken = decryptSecret(
    connection.encryptedRefreshToken as string
  );
  const token = await requestDropboxToken({
    refresh_token: refreshToken,
    grant_type: "refresh_token"
  });
  if (!token.access_token) {
    throw new AppError("Dropbox no devolvió un access token válido.", 502);
  }
  return token.access_token;
};

export const validateDropboxConnection = async (): Promise<DropboxStatus> => {
  const accessToken = await renewDropboxAccessToken();
  const accountInfo = await requestDropboxJson<Record<string, unknown>>({
    url: `${apiBaseUrl}/users/get_current_account`,
    accessToken
  });
  const connection = await getActiveConnection();
  await connection.update({
    status: "connected",
    accountInfo: JSON.stringify(accountInfo),
    lastSyncAt: new Date()
  });
  return getDropboxStatus();
};

export const uploadFileToDropbox = async ({
  buffer,
  dropboxPath
}: {
  buffer: Buffer;
  dropboxPath: string;
}): Promise<DropboxUploadResponse> => {
  const accessToken = await renewDropboxAccessToken();
  const response = await requestBuffer<DropboxUploadResponse>({
    url: `${contentBaseUrl}/files/upload`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({
        path: dropboxPath,
        mode: "add",
        autorename: true,
        mute: false,
        strict_conflict: false
      })
    },
    body: buffer
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new AppError(
      "No fue posible sincronizar el documento con Dropbox.",
      502
    );
  }
  return response.data;
};

export const downloadFileFromDropbox = async (
  storageFileId: string
): Promise<Buffer> => {
  const accessToken = await renewDropboxAccessToken();
  const response = await requestBuffer<Buffer>({
    url: `${contentBaseUrl}/files/download`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({ path: storageFileId })
    }
  });
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new AppError(
      "No fue posible descargar el archivo desde Dropbox.",
      502
    );
  }
  return response.data as unknown as Buffer;
};

const sanitizeDropboxSegment = (value: string): string =>
  path
    .basename(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/./g, character =>
      character.charCodeAt(0) < 32 ? "-" : character
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);

const resolveDocumentDropboxFolder = (
  document: SmartDocument,
  preferredFolder?: string
): string => {
  if (preferredFolder) {
    return `/TechkepperCommandCenter/documents/${preferredFolder}`;
  }
  if (document.storagePath?.startsWith("generated/")) {
    return document.mimeType === "application/pdf"
      ? "/TechkepperCommandCenter/generated/pdf"
      : "/TechkepperCommandCenter/generated/docx";
  }
  if (document.purpose === "quotations") {
    return "/TechkepperCommandCenter/documents/proposals";
  }
  return "/TechkepperCommandCenter/documents/clients";
};

export const syncSmartDocumentToDropbox = async ({
  documentId,
  userId,
  preferredFolder
}: {
  documentId: number;
  userId?: string | number | null;
  preferredFolder?: "clients" | "collaborators" | "proposals" | "templates";
}): Promise<SmartDocument | null> => {
  if (!isDropboxEnabled()) return null;

  const document = await SmartDocument.findByPk(documentId);
  if (!document) return null;

  try {
    const connection = await getConnection();
    if (
      !connection?.encryptedRefreshToken ||
      connection.status !== "connected"
    ) {
      return null;
    }

    const localPath = resolveDocumentPath(document.storagePath);
    const buffer = await fs.promises.readFile(localPath);
    const dropboxFolder = resolveDocumentDropboxFolder(
      document,
      preferredFolder
    );
    const dropboxPath = `${dropboxFolder}/${sanitizeDropboxSegment(
      document.originalName || document.storedName
    )}`;
    const uploaded = await uploadFileToDropbox({ buffer, dropboxPath });
    await document.update({
      storageProvider: provider,
      storageStatus: "synced",
      storageFileId: uploaded.id || uploaded.path_display || dropboxPath,
      externalStoragePath: uploaded.path_display || dropboxPath,
      storageSyncedAt: new Date()
    });
    await connection.update({ lastSyncAt: new Date(), status: "connected" });
    await recordDocumentEvent({
      documentId: document.id,
      userId,
      eventType: "dropbox_sync_success",
      newStatus: normalizeDocumentStatus(document.status),
      metadata: {
        provider,
        storageFileId: uploaded.id || null,
        externalStoragePath: uploaded.path_display || dropboxPath
      }
    });
    return document.reload();
  } catch (err) {
    logger.warn(
      {
        documentId: document.id,
        provider,
        errorName: (err as Error).name
      },
      "Dropbox document sync failed"
    );
    await document.update({
      storageProvider: provider,
      storageStatus: "sync_failed"
    });
    await recordDocumentEvent({
      documentId: document.id,
      userId,
      eventType: "dropbox_sync_failed",
      newStatus: normalizeDocumentStatus(document.status),
      metadata: { provider }
    });
    return document.reload();
  }
};
