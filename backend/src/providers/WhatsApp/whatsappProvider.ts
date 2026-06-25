import Whatsapp from "../../models/Whatsapp";
import {
  ProviderMessage,
  ProviderMediaInput,
  ProviderContact,
  SendMessageOptions,
  SendMediaOptions
} from "./types";
import { CloudApiProvider } from "./Implementations/cloudapi";

export interface WhatsappProvider {
  init(whatsapp: Whatsapp): Promise<void>;
  removeSession(whatsappId: number): void;
  logout(sessionId: number): Promise<void>;
  sendMessage(
    sessionId: number,
    to: string,
    body: string,
    options?: SendMessageOptions
  ): Promise<ProviderMessage>;
  sendMedia(
    sessionId: number,
    to: string,
    media: ProviderMediaInput,
    options?: SendMediaOptions
  ): Promise<ProviderMessage>;
  deleteMessage(
    sessionId: number,
    chatId: string,
    messageId: string,
    fromMe: boolean
  ): Promise<void>;
  checkNumber(sessionId: number, number: string): Promise<string>;
  getProfilePicUrl(sessionId: number, number: string): Promise<string>;
  getContacts(sessionId: number): Promise<ProviderContact[]>;
  sendSeen(sessionId: number, chatId: string): Promise<void>;
  sendTyping(
    sessionId: number,
    messageId: string,
    to?: string
  ): Promise<void>;
  fetchChatMessages(
    sessionId: number,
    chatId: string,
    limit: number
  ): Promise<ProviderMessage[]>;
}

const provider = process.env.WHATSAPP_PROVIDER || "cloudapi";

const providersMap: Record<string, WhatsappProvider> = {
  cloudapi: CloudApiProvider
};

const whatsappProvider = providersMap[provider];
if (!whatsappProvider) {
  throw new Error(`Unsupported WHATSAPP_PROVIDER: ${provider}`);
}

export { whatsappProvider };
