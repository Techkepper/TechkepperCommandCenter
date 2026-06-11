import { createHmac, timingSafeEqual } from "crypto";
import { Request, Response } from "express";
import {
  downloadCloudApiMedia,
  findCloudApiWhatsappByPhoneNumberId
} from "../providers/WhatsApp/Implementations/cloudapi";
import {
  handleMessage,
  handleMessageAck,
  MessagePayload
} from "../handlers/handleWhatsappEvents";
import { MessageAck, MessageType } from "../providers/WhatsApp/types";
import { logger } from "../utils/logger";

const safeEqual = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
};

export const verify = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const mode = String(req.query["hub.mode"] || "");
  const token = String(req.query["hub.verify_token"] || "");
  const challenge = String(req.query["hub.challenge"] || "");
  const verifyToken = process.env.META_WHATSAPP_VERIFY_TOKEN || "";

  if (
    mode !== "subscribe" ||
    !verifyToken ||
    !safeEqual(token, verifyToken)
  ) {
    return res.sendStatus(403);
  }
  return res.status(200).send(challenge);
};

const verifySignature = (body: Buffer, signature: string): boolean => {
  const appSecret = process.env.META_WHATSAPP_APP_SECRET || "";
  if (!appSecret || !signature.startsWith("sha256=")) return false;
  const expected = `sha256=${createHmac("sha256", appSecret)
    .update(body)
    .digest("hex")}`;
  return safeEqual(signature, expected);
};

const getMessageBody = (message: any): string => {
  if (message.type === "text") return message.text?.body || "";
  if (message.type === "button") return message.button?.text || "";
  if (message.type === "interactive") {
    return (
      message.interactive?.button_reply?.title ||
      message.interactive?.list_reply?.title ||
      ""
    );
  }
  if (message.type === "location") {
    const { latitude, longitude, name, address } = message.location || {};
    const link = `https://maps.google.com/maps?q=${latitude},${longitude}`;
    return `|${link}|${name || address || `${latitude}, ${longitude}`}`;
  }
  if (message.type === "contacts") {
    const contact = message.contacts?.[0] || {};
    const phone = contact.phones?.[0]?.phone || "";
    return `BEGIN:VCARD\nVERSION:3.0\nFN:${contact.name?.formatted_name || phone}\nTEL:${phone}\nEND:VCARD`;
  }
  return (
    message.image?.caption ||
    message.video?.caption ||
    message.document?.caption ||
    ""
  );
};

const getMessageType = (message: any): MessageType => {
  const supported: Record<string, MessageType> = {
    text: "chat",
    button: "chat",
    interactive: "chat",
    image: "image",
    video: "video",
    audio: "audio",
    document: "document",
    sticker: "sticker",
    location: "location",
    contacts: "vcard"
  };
  return supported[message.type] || "chat";
};

const getMediaId = (message: any): string =>
  message.image?.id ||
  message.video?.id ||
  message.audio?.id ||
  message.document?.id ||
  message.sticker?.id ||
  "";

const statusToAck = (status: string): MessageAck => {
  if (status === "read") return 3;
  if (status === "delivered") return 2;
  if (status === "sent") return 1;
  return 0;
};

const processWebhook = async (payload: any): Promise<void> => {
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== "messages") continue;
      const value = change.value || {};
      const phoneNumberId = String(value.metadata?.phone_number_id || "");
      const whatsapp = await findCloudApiWhatsappByPhoneNumberId(phoneNumberId);
      if (!whatsapp) {
        logger.warn("Ignoring webhook for an unknown WhatsApp phone number ID");
        continue;
      }

      for (const status of value.statuses || []) {
        if (status.id) {
          await handleMessageAck(status.id, statusToAck(status.status));
        }
      }

      for (const message of value.messages || []) {
        const contact = (value.contacts || []).find(
          (item: any) => item.wa_id === message.from
        );
        const mediaId = getMediaId(message);
        const mediaPayload = mediaId
          ? await downloadCloudApiMedia(whatsapp.id, mediaId)
          : undefined;
        const messagePayload: MessagePayload = {
          id: message.id,
          body: getMessageBody(message),
          fromMe: false,
          hasMedia: Boolean(mediaId),
          type: getMessageType(message),
          timestamp: Number(message.timestamp || Date.now() / 1000),
          from: message.from,
          to: value.metadata?.display_phone_number || phoneNumberId,
          hasQuotedMsg: Boolean(message.context?.id),
          quotedMsgId: message.context?.id
        };

        await handleMessage(
          messagePayload,
          {
            name: contact?.profile?.name || message.from,
            number: message.from,
            isGroup: false
          },
          {
            whatsappId: whatsapp.id,
            unreadMessages: 1
          },
          mediaPayload
        );
      }
    }
  }
};

export const receive = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const rawBody = req.body as Buffer;
  const signature = String(req.headers["x-hub-signature-256"] || "");
  if (!Buffer.isBuffer(rawBody) || !verifySignature(rawBody, signature)) {
    return res.sendStatus(401);
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch (_err) {
    return res.sendStatus(400);
  }

  try {
    await processWebhook(payload);
    return res.sendStatus(200);
  } catch (err) {
    logger.error({ err }, "Failed to process WhatsApp Cloud API webhook");
    return res.sendStatus(500);
  }
};
