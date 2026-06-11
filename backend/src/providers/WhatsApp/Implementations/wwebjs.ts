import qrCode from "qrcode-terminal";
import { existsSync, promises as fs } from "fs";
import { isAbsolute, resolve } from "path";
import {
  Client,
  LocalAuth,
  MessageMedia,
  Message as WbotMessage,
  Contact as WbotContact,
  MessageSendOptions
} from "whatsapp-web.js";
import Whatsapp from "../../../models/Whatsapp";
import AppError from "../../../errors/AppError";
import { logger } from "../../../utils/logger";
import { WhatsappProvider } from "../whatsappProvider";
import {
  ProviderMessage,
  ProviderMediaInput,
  SendMessageOptions,
  SendMediaOptions,
  MessageType,
  MessageAck,
  ProviderContact
} from "../types";
import {
  handleMessage,
  handleMessageAck,
  ContactPayload,
  MessagePayload,
  MediaPayload,
  WhatsappContextPayload
} from "../../../handlers/handleWhatsappEvents";
import { EmitWhatsappSession } from "../../../helpers/EmitWhatsappSession";

interface Session extends Client {
  id?: number;
}

const sessions: Session[] = [];
const initializingSessions = new Map<number, Promise<void>>();
const authDirectory = resolve(".wwebjs_auth");

const defaultChromeArgs = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-accelerated-2d-canvas",
  "--no-first-run",
  "--no-zygote",
  "--disable-gpu"
];

const chromeExecutableCandidates = [
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome"
];

const resolveChromeExecutable = (): string | undefined => {
  const configuredPath =
    process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN;

  if (configuredPath && existsSync(configuredPath)) {
    return configuredPath;
  }

  const detectedPath = chromeExecutableCandidates.find(candidate =>
    existsSync(candidate)
  );

  if (detectedPath) {
    if (configuredPath && configuredPath !== detectedPath) {
      logger.warn(
        `Chrome executable "${configuredPath}" was not found. Using "${detectedPath}".`
      );
    }
    return detectedPath;
  }

  if (configuredPath && isAbsolute(configuredPath)) {
    throw new Error(
      `Browser was not found at the configured executablePath (${configuredPath})`
    );
  }

  return configuredPath || undefined;
};

const getWbot = (whatsappId: number): Session => {
  const sessionIndex = sessions.findIndex(s => s.id === whatsappId);

  if (sessionIndex === -1) {
    throw new AppError("ERR_WAPP_NOT_INITIALIZED");
  }
  return sessions[sessionIndex];
};

const mapMessageType = (wbotType: any): MessageType => {
  const typeMap: Record<string, MessageType> = {
    chat: "chat",
    audio: "audio",
    ptt: "ptt",
    video: "video",
    image: "image",
    document: "document",
    vcard: "vcard",
    sticker: "sticker",
    location: "location"
  };
  return typeMap[wbotType] || "chat";
};

const mapMessageAck = (wbotAck: any): MessageAck => {
  const ackMap: Record<number, MessageAck> = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4
  };
  return ackMap[wbotAck] || 0;
};

const convertToProviderMessage = (
  wbotMessage: WbotMessage
): ProviderMessage => {
  return {
    id: wbotMessage.id.id,
    body: wbotMessage.body,
    fromMe: wbotMessage.fromMe,
    hasMedia: wbotMessage.hasMedia,
    type: mapMessageType(wbotMessage.type),
    timestamp: wbotMessage.timestamp,
    from: wbotMessage.from,
    to: wbotMessage.to,
    hasQuotedMsg: wbotMessage.hasQuotedMsg,
    ack: mapMessageAck(wbotMessage.ack)
  };
};

const getSerializedMessageId = (
  chatId: string,
  fromMe: boolean,
  messageId: string
): string => {
  const serializedMsgId = `${fromMe}_${chatId}_${messageId}`;

  return serializedMsgId;
};

const convertToContactPayload = async (
  msgContact: WbotContact
): Promise<ContactPayload> => {
  const profilePicUrl = await msgContact.getProfilePicUrl();

  return {
    name: msgContact.name || msgContact.pushname || msgContact.id.user,
    number: msgContact.id.user,
    profilePicUrl,
    isGroup: msgContact.isGroup
  };
};

const verifyQuotedMessage = async (
  msg: WbotMessage
): Promise<string | undefined> => {
  if (!msg.hasQuotedMsg) return undefined;

  const wbotQuotedMsg = await msg.getQuotedMessage();
  return wbotQuotedMsg.id.id;
};

const prepareLocation = (msg: WbotMessage): WbotMessage => {
  const { location } = msg as any;
  const gmapsUrl = `https://maps.google.com/maps?q=${location.latitude}%2C${location.longitude}&z=17&hl=pt-BR`;

  msg.body = `data:image/png;base64,${msg.body}|${gmapsUrl}`;
  msg.body += `|${
    location.description
      ? location.description
      : `${location.latitude}, ${location.longitude}`
  }`;

  return msg;
};

const convertToMessagePayload = async (
  msg: WbotMessage
): Promise<MessagePayload> => {
  let processedMsg = msg;
  if (msg.type === "location") {
    processedMsg = prepareLocation(msg);
  }

  const quotedMsgId = await verifyQuotedMessage(processedMsg);

  return {
    id: processedMsg.id.id,
    body: processedMsg.body,
    fromMe: processedMsg.fromMe,
    hasMedia: processedMsg.hasMedia,
    type: mapMessageType(processedMsg.type),
    timestamp: processedMsg.timestamp,
    from: processedMsg.from,
    to: processedMsg.to,
    hasQuotedMsg: processedMsg.hasQuotedMsg,
    quotedMsgId
  };
};

const convertToMediaPayload = async (
  msg: WbotMessage
): Promise<MediaPayload | undefined> => {
  if (!msg.hasMedia) return undefined;

  const media = await msg.downloadMedia();
  if (!media) return undefined;

  return {
    filename: media.filename || "",
    mimetype: media.mimetype,
    data: media.data
  };
};

const shouldHandleMessage = (msg: WbotMessage): boolean => {
  if (msg.from === "status@broadcast") return false;

  if (
    !(
      msg.type === "chat" ||
      msg.type === "audio" ||
      msg.type === "ptt" ||
      msg.type === "video" ||
      msg.type === "image" ||
      msg.type === "document" ||
      msg.type === "vcard" ||
      msg.type === "sticker" ||
      msg.type === "location"
    )
  ) {
    return false;
  }

  // Check for Unicode direction mark
  if (/\u200e/.test(msg.body[0])) return false;

  // Additional validation for messages from me
  if (msg.fromMe) {
    if (
      !msg.hasMedia &&
      msg.type !== "location" &&
      msg.type !== "chat" &&
      msg.type !== "vcard"
    ) {
      return false;
    }
  }

  return true;
};

const getMessageData = async (
  msg: WbotMessage,
  wbot: Session
): Promise<{
  messagePayload: MessagePayload;
  contactPayload: ContactPayload;
  contextPayload: WhatsappContextPayload;
  mediaPayload: MediaPayload | undefined;
}> => {
  let msgContact: WbotContact;
  let groupContact: ContactPayload | undefined;

  if (msg.fromMe) {
    msgContact = await wbot.getContactById(msg.to);
  } else {
    msgContact = await msg.getContact();
  }

  const chat = await msg.getChat();

  if (chat.isGroup) {
    let msgGroupContact;

    if (msg.fromMe) {
      msgGroupContact = await wbot.getContactById(msg.to);
    } else {
      msgGroupContact = await wbot.getContactById(msg.from);
    }

    groupContact = await convertToContactPayload(msgGroupContact);
  }

  const unreadMessages = msg.fromMe ? 0 : chat.unreadCount;

  const contactPayload = await convertToContactPayload(msgContact);
  const messagePayload = await convertToMessagePayload(msg);
  const mediaPayload = await convertToMediaPayload(msg);

  const contextPayload: WhatsappContextPayload = {
    whatsappId: wbot.id!,
    unreadMessages,
    groupContact
  };

  return {
    messagePayload,
    contactPayload,
    contextPayload,
    mediaPayload
  };
};

const syncUnreadMessages = async (wbot: Session) => {
  try {
    const chats = await wbot.getChats();

    /* eslint-disable no-restricted-syntax */
    /* eslint-disable no-await-in-loop */
    for (const chat of chats) {
      if (chat.unreadCount > 0) {
        const unreadMessages = await chat.fetchMessages({
          limit: chat.unreadCount
        });

        for (const msg of unreadMessages) {
          if (shouldHandleMessage(msg)) {
            const {
              messagePayload,
              contactPayload,
              contextPayload,
              mediaPayload
            } = await getMessageData(msg, wbot);

            handleMessage(
              messagePayload,
              contactPayload,
              contextPayload,
              mediaPayload
            );
          }
        }

        await chat.sendSeen();
      }
    }
  } catch (err) {
    logger.error(err, "Error syncing unread messages");
  }
};

const destroySession = async (whatsappId: number): Promise<void> => {
  const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
  if (sessionIndex === -1) return;

  const [session] = sessions.splice(sessionIndex, 1);
  session.removeAllListeners("disconnected");

  try {
    await session.destroy();
  } catch (err) {
    logger.warn(err, `Could not gracefully destroy WhatsApp session ${whatsappId}`);
  }
};

const removeStaleProfileLocks = async (whatsappId: number): Promise<void> => {
  const sessionDirectory = resolve(authDirectory, `session-bd_${whatsappId}`);
  const lockFiles = ["SingletonLock", "SingletonCookie", "SingletonSocket"];

  await Promise.all(
    lockFiles.map(async lockFile => {
      const lockPath = resolve(sessionDirectory, lockFile);

      try {
        await fs.unlink(lockPath);
        logger.warn(`Removed stale Chromium profile lock: ${lockPath}`);
      } catch (err) {
        const error = err as NodeJS.ErrnoException;
        if (error.code !== "ENOENT") {
          throw err;
        }
      }
    })
  );
};

const removeSession = (whatsappId: number): void => {
  destroySession(whatsappId).catch(err => {
    logger.error(err, "Error destroying WhatsApp session");
  });
};

const sendMessage = async (
  sessionId: number,
  to: string,
  body: string,
  options?: SendMessageOptions
): Promise<ProviderMessage> => {
  const wbot = getWbot(sessionId);

  const quotedMsgSerializedId = options?.quotedMessageId
    ? getSerializedMessageId(
        to,
        Boolean(options?.quotedMessageFromMe),
        options?.quotedMessageId
      )
    : "";

  const sentMessage = await wbot.sendMessage(to, body, {
    quotedMessageId: quotedMsgSerializedId,
    linkPreview: options?.linkPreview
  });

  return convertToProviderMessage(sentMessage);
};

const sendMedia = async (
  sessionId: number,
  to: string,
  media: ProviderMediaInput,
  options?: SendMediaOptions
): Promise<ProviderMessage> => {
  const wbot = getWbot(sessionId);

  const messageMedia = media.path
    ? MessageMedia.fromFilePath(media.path)
    : new MessageMedia(
        media.mimetype,
        media.data?.toString("base64") || "",
        media.filename
      );

  const mediaOptions: MessageSendOptions = {
    caption: options?.caption,
    sendAudioAsVoice: options?.sendAudioAsVoice,
    quotedMessageId: options?.quotedMessageId
  };

  if (
    messageMedia.mimetype.startsWith("image/") &&
    !/^.*\.(jpe?g|png|gif)?$/i.exec(media.filename)
  ) {
    mediaOptions.sendMediaAsDocument = options?.sendMediaAsDocument || true;
  }

  const sentMessage = await wbot.sendMessage(to, messageMedia, mediaOptions);
  return convertToProviderMessage(sentMessage);
};

const checkNumber = async (
  sessionId: number,
  number: string
): Promise<string> => {
  const wbot = getWbot(sessionId);
  const validNumber = await wbot.getNumberId(`${number}@c.us`);

  return validNumber?.user || "";
};

const getProfilePicUrl = async (
  sessionId: number,
  number: string
): Promise<string> => {
  const wbot = getWbot(sessionId);
  const profilePicUrl = await wbot.getProfilePicUrl(`${number}@c.us`);
  return profilePicUrl;
};

const sendSeen = async (sessionId: number, chatId: string): Promise<void> => {
  const wbot = getWbot(sessionId);
  const chat = await wbot.getChatById(chatId);
  await chat.sendSeen();
};

const fetchChatMessages = async (
  sessionId: number,
  chatId: string,
  limit = 100
): Promise<ProviderMessage[]> => {
  const wbot = getWbot(sessionId);
  const chat = await wbot.getChatById(chatId);
  const messages = await chat.fetchMessages({ limit });

  return messages.map(convertToProviderMessage);
};

const getContacts = async (sessionId: number): Promise<ProviderContact[]> => {
  const wbot = getWbot(sessionId);
  const contacts = await wbot.getContacts();

  return contacts.map(contact => ({
    id: contact.id.user,
    name: contact.name || contact.pushname,
    pushname: contact.pushname,
    number: contact.id.user,
    profilePicUrl: undefined,
    isGroup: contact.isGroup
  }));
};

const logout = async (sessionId: number): Promise<void> => {
  const wbot = getWbot(sessionId);
  await wbot.logout();
};

const deleteMessage = async (
  sessionId: number,
  chatId: string,
  messageId: string,
  fromMe: boolean
): Promise<void> => {
  const wbot = getWbot(sessionId);

  const serializedMsgId = getSerializedMessageId(chatId, fromMe, messageId);

  const message = await wbot.getMessageById(serializedMsgId);

  await message.delete(true);
};

const initializeSession = async (whatsapp: Whatsapp): Promise<void> => {
  const sessionName = whatsapp.name;

  const updateSession = async (
    status: string,
    values: Record<string, unknown> = {}
  ): Promise<void> => {
    await whatsapp.update({ status, ...values });
    EmitWhatsappSession(whatsapp);
  };

  try {
    await destroySession(whatsapp.id);
    await removeStaleProfileLocks(whatsapp.id);

    const sessionCfg = whatsapp?.session ? JSON.parse(whatsapp.session) : {};
    const configuredArgs = (process.env.CHROME_ARGS || "")
      .split(/\s+/)
      .filter(Boolean);
    const args = Array.from(
      new Set([...defaultChromeArgs, ...configuredArgs])
    );
    const browserWSEndpoint = process.env.CHROME_WS || undefined;
    const executablePath = browserWSEndpoint
      ? undefined
      : resolveChromeExecutable();

    logger.info(
      `Starting WhatsApp session "${sessionName}" with browser ${
        executablePath || browserWSEndpoint || "bundled Chromium"
      }`
    );

    const wbot: Session = new Client({
      session: sessionCfg,
      authStrategy: new LocalAuth({ clientId: `bd_${whatsapp.id}` }),
      puppeteer: {
        executablePath,
        browserWSEndpoint,
        headless: true,
        args
      }
    } as any);

    wbot.id = whatsapp.id;
    sessions.push(wbot);

    wbot.on("qr", async qr => {
      logger.info("Session:", sessionName);
      qrCode.generate(qr, { small: true });
      await updateSession("qrcode", { qrcode: qr, retries: 0 });
    });

    wbot.on("authenticated", async () => {
      logger.info(`Session: ${sessionName} AUTHENTICATED`);
      await updateSession("PAIRING", { qrcode: "" });
    });

    wbot.on("auth_failure", async msg => {
      logger.error(
        `Session: ${sessionName} authentication failure. Reason: ${msg}`
      );

      if (whatsapp.retries > 1) {
        await whatsapp.update({ session: "", retries: 0 });
      }

      await updateSession("ERROR", {
        qrcode: "",
        retries: (whatsapp.retries || 0) + 1
      });
    });

    wbot.on("ready", async () => {
      logger.info(`Session: ${sessionName} READY`);

      try {
        await updateSession("CONNECTED", {
          qrcode: "",
          retries: 0
        });

        wbot.sendPresenceAvailable();
        await syncUnreadMessages(wbot);
      } catch (err) {
        logger.error(err, "Error on whatsapp ready event");
      }
    });

    wbot.on("change_state", async newState => {
      logger.info(`Monitor session: ${sessionName}, ${newState}`);
      try {
        await updateSession(newState);
      } catch (err) {
        logger.error(err, "Error on whatsapp change state event");
      }
    });

    wbot.on("disconnected", async reason => {
      logger.info(`Disconnected session: ${sessionName}, reason: ${reason}`);
      try {
        const sessionIndex = sessions.findIndex(s => s.id === whatsapp.id);
        if (sessionIndex !== -1) {
          sessions.splice(sessionIndex, 1);
        }
        await updateSession("DISCONNECTED", {
          qrcode: "",
          session: ""
        });
      } catch (err) {
        logger.error(err, "Error on whatsapp disconnected event");
      }
    });

    (wbot as any).on("error", async (error: Error) => {
      logger.error(error, `Error on WhatsApp session "${sessionName}"`);
      try {
        await updateSession("ERROR", { qrcode: "" });
      } catch (updateError) {
        logger.error(updateError, "Error updating WhatsApp error status");
      }
    });

    wbot.on("message_create", async msg => {
      if (!shouldHandleMessage(msg)) return;

      try {
        const { messagePayload, contactPayload, contextPayload, mediaPayload } =
          await getMessageData(msg, wbot);

        await handleMessage(
          messagePayload,
          contactPayload,
          contextPayload,
          mediaPayload
        );
      } catch (err) {
        logger.error(err, "Error on whatsapp message create event");
      }
    });

    wbot.on("media_uploaded", async msg => {
      if (!shouldHandleMessage(msg)) return;

      try {
        const { messagePayload, contactPayload, contextPayload, mediaPayload } =
          await getMessageData(msg, wbot);

        await handleMessage(
          messagePayload,
          contactPayload,
          contextPayload,
          mediaPayload
        );
      } catch (err) {
        logger.error(err, "Error on whatsapp media uploaded event");
      }
    });

    wbot.on("message_ack", async (msg, ack) => {
      handleMessageAck(msg.id.id, mapMessageAck(ack));
    });

    await wbot.initialize();
  } catch (err) {
    logger.error(err, "Error on whatsapp session");
    await destroySession(whatsapp.id);
    await updateSession("ERROR", { qrcode: "" });
  }
};

const init = async (whatsapp: Whatsapp): Promise<void> => {
  const pendingInitialization = initializingSessions.get(whatsapp.id);

  if (pendingInitialization) {
    logger.info(
      `WhatsApp session "${whatsapp.name}" is already initializing; reusing the active request.`
    );
    await pendingInitialization;
    return;
  }

  const initialization = initializeSession(whatsapp).finally(() => {
    if (initializingSessions.get(whatsapp.id) === initialization) {
      initializingSessions.delete(whatsapp.id);
    }
  });

  initializingSessions.set(whatsapp.id, initialization);
  await initialization;
};

export const WhatsappWebJsProvider: WhatsappProvider = {
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
