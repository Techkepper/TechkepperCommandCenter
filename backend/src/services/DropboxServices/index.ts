import fs from "fs";
import path from "path";
import { request } from "https";
import { stringify } from "querystring";
import { URL } from "url";

import { Op } from "sequelize";

import AppError from "../../errors/AppError";
import ExternalStorageConnection from "../../models/ExternalStorageConnection";
import SmartDocument from "../../models/SmartDocument";
import { logger } from "../../utils/logger";
import { resolveDocumentPath } from "../DocumentServices/documentStorage";
import {
  normalizeDocumentStatus,
  recordDocumentEvent
} from "../DocumentServices/DocumentLifecycleService";

const provider = "dropbox";
const tokenUrl = "https://api.dropboxapi.com/oauth2/token";
const apiBaseUrl = "https://api.dropboxapi.com/2";
const contentBaseUrl = "https://content.dropboxapi.com/2";

type DropboxStatus = {
  provider: "dropbox";
  mode: "env";
  storageMode: "env";
  enabled: boolean;
  configured: boolean;
  connected: boolean;
  status: string;
  lastValidatedAt: Date | null;
};

type HttpResponse<T> = {
  statusCode: number;
  data: T;
};

type TokenResponse = {
  access_token?: string;
};

type DropboxUploadResponse = {
  id?: string;
  path_display?: string;
};

const isDropboxEnabled = (): boolean =>
  String(process.env.DROPBOX_STORAGE_ENABLED || "false").toLowerCase() ===
  "true";

const getDropboxConfig = () => ({
  mode: String(process.env.DROPBOX_STORAGE_MODE || "env").toLowerCase(),
  appKey: process.env.DROPBOX_APP_KEY || "",
  appSecret: process.env.DROPBOX_APP_SECRET || "",
  refreshToken: process.env.DROPBOX_REFRESH_TOKEN || "",
  redirectUri: process.env.DROPBOX_REDIRECT_URI || ""
});

const hasDropboxEnvConfig = (): boolean => {
  const config = getDropboxConfig();
  return Boolean(
    config.mode === "env" &&
      config.appKey &&
      config.appSecret &&
      config.refreshToken &&
      config.redirectUri
  );
};

const ensureEnvConfig = (): ReturnType<typeof getDropboxConfig> => {
  const config = getDropboxConfig();
  if (!isDropboxEnabled() || !hasDropboxEnvConfig()) {
    throw new AppError(
      "La configuración de Dropbox en el servidor está incompleta.",
      409
    );
  }
  return config;
};

const encodeBasicAuth = (appKey: string, appSecret: string): string =>
  Buffer.from(`${appKey}:${appSecret}`).toString("base64");

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
          const contentType = String(res.headers["content-type"] || "");
          const statusCode = res.statusCode || 500;
          let data: T;
          if (contentType.includes("application/json")) {
            try {
              data = JSON.parse(responseBuffer.toString("utf8") || "{}") as T;
            } catch {
              reject(
                new AppError("Dropbox devolvió una respuesta inválida.", 502)
              );
              return;
            }
          } else {
            data = responseBuffer as unknown as T;
          }
          resolve({ statusCode, data });
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

const getConnection = async (): Promise<ExternalStorageConnection | null> =>
  ExternalStorageConnection.findOne({ where: { provider } });

const persistConnectionStatus = async ({
  status,
  accountInfo,
  validated = false
}: {
  status: string;
  accountInfo?: Record<string, unknown> | null;
  validated?: boolean;
}): Promise<void> => {
  const existing = await getConnection();
  const values = {
    status,
    encryptedRefreshToken: null,
    ...(accountInfo !== undefined
      ? { accountInfo: accountInfo ? JSON.stringify(accountInfo) : null }
      : {}),
    ...(validated ? { lastSyncAt: new Date() } : {})
  };
  if (existing) {
    await existing.update(values);
    return;
  }
  await ExternalStorageConnection.create({
    provider,
    accountInfo: null,
    createdById: null,
    updatedById: null,
    lastSyncAt: null,
    ...values
  } as unknown as ExternalStorageConnection);
};

export const getDropboxStatus = async (): Promise<DropboxStatus> => {
  let connection = await getConnection();
  if (connection?.encryptedRefreshToken) {
    await connection.update({
      encryptedRefreshToken: null,
      status: "not_connected",
      accountInfo: null,
      lastSyncAt: null
    });
    connection = await getConnection();
  }
  const enabled = isDropboxEnabled();
  const configured = hasDropboxEnvConfig();
  const connected = Boolean(
    enabled && configured && connection?.status === "connected"
  );
  return {
    provider,
    mode: "env",
    storageMode: "env",
    enabled,
    configured,
    connected,
    status: connected ? "connected" : connection?.status || "not_connected",
    lastValidatedAt: connection?.lastSyncAt || null
  };
};

export const renewDropboxAccessToken = async (): Promise<string> => {
  const config = ensureEnvConfig();
  const response = await requestBuffer<TokenResponse>({
    url: tokenUrl,
    headers: {
      Authorization: `Basic ${encodeBasicAuth(
        config.appKey,
        config.appSecret
      )}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: stringify({
      refresh_token: config.refreshToken,
      grant_type: "refresh_token"
    })
  });
  if (
    response.statusCode < 200 ||
    response.statusCode >= 300 ||
    !response.data.access_token
  ) {
    throw new AppError(
      "Dropbox no pudo renovar la sesión. Revise la configuración del servidor.",
      502
    );
  }
  return response.data.access_token;
};

export const validateDropboxConnection = async (): Promise<DropboxStatus> => {
  try {
    const accessToken = await renewDropboxAccessToken();
    const accountInfo = await requestDropboxJson<Record<string, unknown>>({
      url: `${apiBaseUrl}/users/get_current_account`,
      accessToken
    });
    await persistConnectionStatus({
      status: "connected",
      accountInfo,
      validated: true
    });
    return getDropboxStatus();
  } catch (error) {
    await persistConnectionStatus({ status: "error" });
    logger.warn(
      { provider, errorName: (error as Error).name },
      "Dropbox env connection validation failed"
    );
    if (error instanceof AppError) throw error;
    throw new AppError("No fue posible validar la conexión con Dropbox.", 502);
  }
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
        mode: "overwrite",
        autorename: false,
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
  const document = await SmartDocument.findByPk(documentId);
  if (!document || document.storageStatus === "synced") return document;
  if (!isDropboxEnabled()) return document;

  await document.update({ storageProvider: provider });
  try {
    ensureEnvConfig();
    const localPath = resolveDocumentPath(document.storagePath);
    const buffer = await fs.promises.readFile(localPath);
    const dropboxFolder = resolveDocumentDropboxFolder(
      document,
      preferredFolder
    );
    const deterministicPath = `${dropboxFolder}/${
      document.id
    }-${sanitizeDropboxSegment(document.originalName || document.storedName)}`;
    const dropboxPath =
      document.externalStoragePath ||
      document.storageFileId ||
      deterministicPath;
    const uploaded = await uploadFileToDropbox({ buffer, dropboxPath });
    await document.update({
      storageProvider: provider,
      storageStatus: "synced",
      storageFileId: uploaded.id || document.storageFileId || dropboxPath,
      externalStoragePath: uploaded.path_display || dropboxPath,
      storageSyncedAt: new Date()
    });
    await recordDocumentEvent({
      documentId: document.id,
      userId,
      eventType: "dropbox_sync_success",
      newStatus: normalizeDocumentStatus(document.status),
      metadata: { provider }
    });
    return document.reload();
  } catch (error) {
    logger.warn(
      { documentId: document.id, provider, errorName: (error as Error).name },
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

export const retryPendingDropboxDocuments = async (): Promise<number> => {
  if (!isDropboxEnabled() || !hasDropboxEnvConfig()) return 0;
  const documents = await SmartDocument.findAll({
    where: {
      storageStatus: { [Op.in]: ["pending", "sync_failed"] }
    },
    order: [["updatedAt", "ASC"]],
    limit: 50
  });
  logger.info(
    { provider, candidatesFound: documents.length },
    "Dropbox document retry candidates loaded"
  );
  await documents.reduce(
    (previous, document) =>
      previous.then(async () => {
        const candidateContext = {
          documentId: document.id,
          storageProvider: document.storageProvider,
          storageStatus: document.storageStatus
        };
        logger.info(candidateContext, "Dropbox document retry started");
        const result = await syncSmartDocumentToDropbox({
          documentId: document.id,
          userId: null
        });
        const succeeded = result?.storageStatus === "synced";
        const resultContext = {
          ...candidateContext,
          result: succeeded ? "success" : "failed",
          resultingStorageProvider: result?.storageProvider || null,
          resultingStorageStatus: result?.storageStatus || null
        };
        if (succeeded) {
          logger.info(resultContext, "Dropbox document retry finished");
        } else {
          logger.warn(resultContext, "Dropbox document retry finished");
        }
        return result;
      }),
    Promise.resolve<SmartDocument | null>(null)
  );
  return documents.length;
};
