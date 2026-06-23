import { randomBytes } from "crypto";
import { readFile } from "fs/promises";
import { request as httpsRequest } from "https";
import { URL } from "url";
import AppError from "../../../errors/AppError";
import { EmitWhatsappSession } from "../../../helpers/EmitWhatsappSession";
import type { MediaPayload } from "../../../handlers/handleWhatsappEvents";
import Whatsapp from "../../../models/Whatsapp";
import { logger } from "../../../utils/logger";
import type { WhatsappProvider } from "../whatsappProvider";
import type {
  MessageType,
  ProviderContact,
  ProviderMediaInput,
  ProviderMessage,
  SendMediaOptions,
  SendMessageOptions
} from "../types";

interface CloudApiConfig {
  accessToken: string;
  apiVersion: string;
  phoneNumberId: string;
}

interface HttpResponse {
  statusCode: number;
  body: Buffer;
  headers: Record<string, string | string[] | undefined>;
}

const activeSessions = new Map<number, CloudApiConfig>();
const MAX_RESPONSE_BYTES = 20 * 1024 * 1024;

const getSessionEnv = (sessionId: number, key: string): string =>
  process.env[`META_WHATSAPP_${sessionId}_${key}`] ||
  process.env[`META_WHATSAPP_${key}`] ||
  "";

export const getCloudApiConfig = (sessionId: number): CloudApiConfig => ({
  accessToken: getSessionEnv(sessionId, "ACCESS_TOKEN"),
  apiVersion: getSessionEnv(sessionId, "GRAPH_API_VERSION"),
  phoneNumberId: getSessionEnv(sessionId, "PHONE_NUMBER_ID")
});

const requireConfig = (sessionId: number): CloudApiConfig => {
  const config = getCloudApiConfig(sessionId);
  if (!config.accessToken || !config.apiVersion || !config.phoneNumberId) {
    throw new AppError("ERR_CLOUD_API_NOT_CONFIGURED", 503);
  }
  activeSessions.set(sessionId, config);
  return config;
};

const requestBuffer = (
  urlValue: string,
  method: string,
  headers: Record<string, string>,
  body?: Buffer
): Promise<HttpResponse> =>
  new Promise((resolve, reject) => {
    const url = new URL(urlValue);
    if (url.protocol !== "https:") {
      reject(new Error("ERR_INSECURE_REMOTE_URL"));
      return;
    }

    const request = httpsRequest(
      url,
      {
        method,
        headers: {
          ...headers,
          ...(body ? { "Content-Length": String(body.length) } : {})
        }
      },
      response => {
        const chunks: Buffer[] = [];
        let totalBytes = 0;

        response.on("data", (chunk: Buffer) => {
          totalBytes += chunk.length;
          if (totalBytes > MAX_RESPONSE_BYTES) {
            request.destroy(new Error("ERR_REMOTE_RESPONSE_TOO_LARGE"));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => {
          resolve({
            statusCode: response.statusCode || 500,
            body: Buffer.concat(chunks),
            headers: response.headers
          });
        });
      }
    );

    request.on("error", reject);
    request.setTimeout(15000, () => {
      request.destroy(new Error("ERR_REMOTE_REQUEST_TIMEOUT"));
    });
    if (body) request.write(body);
    request.end();
  });

const graphRequest = async <T>(
  config: CloudApiConfig,
  path: string,
  method = "GET",
  payload?: Record<string, unknown>
): Promise<T> => {
  const body = payload ? Buffer.from(JSON.stringify(payload)) : undefined;
  const response = await requestBuffer(
    `https://graph.facebook.com/${config.apiVersion}/${path}`,
    method,
    {
      Authorization: `Bearer ${config.accessToken}`,
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body
  );

  let parsed: any = {};
  try {
    parsed = JSON.parse(response.body.toString("utf8") || "{}");
  } catch (_err) {
    throw new AppError("ERR_CLOUD_API_INVALID_RESPONSE", 502);
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw mapGraphError(parsed, response.statusCode);
  }

  return parsed as T;
};

const mapGraphError = (parsed: any, httpStatus: number): AppError => {
  const code = parsed?.error?.code;
  const graphMessage = parsed?.error?.message || "";

  logger.error(
    {
      statusCode: httpStatus,
      graphErrorCode: code,
      graphErrorType: parsed?.error?.type,
      graphErrorMessage: graphMessage
    },
    "WhatsApp Cloud API request failed"
  );

  if (code === 133010) {
    return new AppError("ERR_CLOUD_API_PHONE_NOT_REGISTERED", 502);
  }
  if (code === 190) {
    return new AppError("ERR_CLOUD_API_TOKEN_INVALID", 502);
  }
  if (
    code === 100 &&
    /does not exist|missing permissions|Unsupported get request/i.test(
      graphMessage
    )
  ) {
    return new AppError("ERR_CLOUD_API_PHONE_NUMBER_ID_INVALID", 502);
  }

  return new AppError("ERR_CLOUD_API_REQUEST_FAILED", 502);
};

const normalizeRecipient = (value: string): string => {
  const normalized = value.split("@")[0].replace(/\D/g, "");
  if (!normalized) throw new AppError("ERR_INVALID_CONTACT_NUMBER", 400);
  return normalized;
};

const persistOutgoingMessage = async (
  sessionId: number,
  message: ProviderMessage,
  mediaPayload?: MediaPayload
): Promise<void> => {
  const { handleMessage } = await import(
    "../../../handlers/handleWhatsappEvents"
  );
  await handleMessage(
    {
      id: message.id,
      body: message.body,
      fromMe: true,
      hasMedia: message.hasMedia,
      type: message.type,
      timestamp: message.timestamp,
      from: message.from,
      to: message.to,
      ack: message.ack
    },
    {
      name: normalizeRecipient(message.to),
      number: normalizeRecipient(message.to),
      isGroup: false
    },
    {
      whatsappId: sessionId,
      unreadMessages: 0
    },
    mediaPayload
  );
};

const init = async (whatsapp: Whatsapp): Promise<void> => {
  activeSessions.delete(whatsapp.id);
  const config = getCloudApiConfig(whatsapp.id);
  const webhookVerifyToken = process.env.META_WHATSAPP_VERIFY_TOKEN || "";
  const appSecret = process.env.META_WHATSAPP_APP_SECRET || "";
  if (
    !config.accessToken ||
    !config.apiVersion ||
    !config.phoneNumberId ||
    webhookVerifyToken.length < 16 ||
    appSecret.length < 16
  ) {
    await whatsapp.update({ status: "CONFIG_REQUIRED", qrcode: "" });
    EmitWhatsappSession(whatsapp);
    return;
  }

  logger.info(
    {
      sessionId: whatsapp.id,
      phoneNumberId: config.phoneNumberId,
      apiVersion: config.apiVersion
    },
    "Initializing WhatsApp Cloud API session"
  );

  await graphRequest(
    config,
    `${config.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`
  );
  activeSessions.set(whatsapp.id, config);
  await whatsapp.update({ status: "CONNECTED", qrcode: "", retries: 0 });
  EmitWhatsappSession(whatsapp);
};

const removeSession = (whatsappId: number): void => {
  activeSessions.delete(whatsappId);
};

const logout = async (sessionId: number): Promise<void> => {
  activeSessions.delete(sessionId);
  const whatsapp = await Whatsapp.findByPk(sessionId);
  if (whatsapp) {
    await whatsapp.update({ status: "DISCONNECTED", qrcode: "" });
    EmitWhatsappSession(whatsapp);
  }
};

const sendMessage = async (
  sessionId: number,
  to: string,
  body: string,
  options?: SendMessageOptions
): Promise<ProviderMessage> => {
  const config = requireConfig(sessionId);
  const recipient = normalizeRecipient(to);
  const response = await graphRequest<{ messages: Array<{ id: string }> }>(
    config,
    `${config.phoneNumberId}/messages`,
    "POST",
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipient,
      type: "text",
      text: {
        body,
        preview_url: Boolean(options?.linkPreview)
      },
      ...(options?.quotedMessageId
        ? { context: { message_id: options.quotedMessageId } }
        : {})
    }
  );

  const message: ProviderMessage = {
    id: response.messages[0].id,
    body,
    fromMe: true,
    hasMedia: false,
    type: "chat",
    timestamp: Math.floor(Date.now() / 1000),
    from: config.phoneNumberId,
    to: recipient,
    ack: 1
  };
  await persistOutgoingMessage(sessionId, message);
  return message;
};

const uploadMedia = async (
  config: CloudApiConfig,
  media: ProviderMediaInput,
  data: Buffer
): Promise<string> => {
  const boundary = `----techkepper-${randomBytes(12).toString("hex")}`;
  const safeFilename = media.filename.replace(/["\r\n]/g, "_");
  const prefix = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="messaging_product"\r\n\r\nwhatsapp\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="type"\r\n\r\n${media.mimetype}\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${safeFilename}"\r\n` +
      `Content-Type: ${media.mimetype}\r\n\r\n`
  );
  const suffix = Buffer.from(`\r\n--${boundary}--\r\n`);
  const response = await requestBuffer(
    `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/media`,
    "POST",
    {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`
    },
    Buffer.concat([prefix, data, suffix])
  );
  const parsed = JSON.parse(response.body.toString("utf8") || "{}");
  if (
    response.statusCode < 200 ||
    response.statusCode >= 300 ||
    !parsed.id
  ) {
    throw new AppError("ERR_CLOUD_API_MEDIA_UPLOAD_FAILED", 502);
  }
  return parsed.id;
};

const getCloudMediaType = (mimetype: string): MessageType => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  return "document";
};

const sendMedia = async (
  sessionId: number,
  to: string,
  media: ProviderMediaInput,
  options?: SendMediaOptions
): Promise<ProviderMessage> => {
  const config = requireConfig(sessionId);
  const recipient = normalizeRecipient(to);
  const data = media.path
    ? await readFile(media.path)
    : media.data || Buffer.alloc(0);
  if (!data.length || data.length > 16 * 1024 * 1024) {
    throw new AppError("ERR_INVALID_MEDIA", 400);
  }

  const mediaId = await uploadMedia(config, media, data);
  const messageType = getCloudMediaType(media.mimetype);
  const mediaObject: Record<string, unknown> = { id: mediaId };
  if (messageType === "document") mediaObject.filename = media.filename;
  if (
    options?.caption &&
    (messageType === "document" ||
      messageType === "image" ||
      messageType === "video")
  ) {
    mediaObject.caption = options.caption;
  }

  const response = await graphRequest<{ messages: Array<{ id: string }> }>(
    config,
    `${config.phoneNumberId}/messages`,
    "POST",
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipient,
      type: messageType,
      [messageType]: mediaObject,
      ...(options?.quotedMessageId
        ? { context: { message_id: options.quotedMessageId } }
        : {})
    }
  );

  const message: ProviderMessage = {
    id: response.messages[0].id,
    body: options?.caption || media.filename,
    fromMe: true,
    hasMedia: true,
    type: messageType,
    timestamp: Math.floor(Date.now() / 1000),
    from: config.phoneNumberId,
    to: recipient,
    ack: 1
  };
  await persistOutgoingMessage(sessionId, message, {
    filename: media.filename,
    mimetype: media.mimetype,
    data: data.toString("base64")
  });
  return message;
};

const deleteMessage = async (): Promise<void> => {
  throw new AppError("ERR_CLOUD_API_DELETE_NOT_SUPPORTED", 400);
};

const checkNumber = async (
  _sessionId: number,
  number: string
): Promise<string> => normalizeRecipient(number);

const getProfilePicUrl = async (): Promise<string> => "";
const getContacts = async (): Promise<ProviderContact[]> => [];
const sendSeen = async (): Promise<void> => undefined;
const fetchChatMessages = async (): Promise<ProviderMessage[]> => [];

export const findCloudApiWhatsappByPhoneNumberId = async (
  phoneNumberId: string
): Promise<Whatsapp | null> => {
  const active = Array.from(activeSessions.entries()).find(
    ([, config]) => config.phoneNumberId === phoneNumberId
  );
  if (active) return Whatsapp.findByPk(active[0]);

  const whatsapps = await Whatsapp.findAll();
  const match = whatsapps.find(
    whatsapp => getCloudApiConfig(whatsapp.id).phoneNumberId === phoneNumberId
  );
  if (match) return match;

  const globalPhoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID || "";
  if (phoneNumberId && phoneNumberId === globalPhoneNumberId) {
    return (
      whatsapps.find(whatsapp => whatsapp.isDefault) ||
      whatsapps[0] ||
      null
    );
  }

  return null;
};

const isAllowedMediaHost = (hostname: string): boolean =>
  hostname === "lookaside.fbsbx.com" ||
  hostname.endsWith(".fbcdn.net") ||
  hostname.endsWith(".facebook.com") ||
  hostname.endsWith(".whatsapp.net");

export const downloadCloudApiMedia = async (
  sessionId: number,
  mediaId: string
): Promise<MediaPayload> => {
  const config = requireConfig(sessionId);
  const metadata = await graphRequest<{
    url: string;
    mime_type: string;
  }>(config, mediaId);
  const mediaUrl = new URL(metadata.url);
  if (mediaUrl.protocol !== "https:" || !isAllowedMediaHost(mediaUrl.hostname)) {
    throw new AppError("ERR_CLOUD_API_INVALID_MEDIA_URL", 502);
  }

  const response = await requestBuffer(metadata.url, "GET", {
    Authorization: `Bearer ${config.accessToken}`
  });
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new AppError("ERR_CLOUD_API_MEDIA_DOWNLOAD_FAILED", 502);
  }
  return {
    filename: mediaId,
    mimetype: metadata.mime_type,
    data: response.body.toString("base64")
  };
};

export const CloudApiProvider: WhatsappProvider = {
  init,
  removeSession,
  logout,
  sendMessage,
  sendMedia,
  deleteMessage,
  checkNumber,
  getProfilePicUrl,
  getContacts,
  sendSeen,
  fetchChatMessages
};
