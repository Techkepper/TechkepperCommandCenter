import { getIO } from "../libs/socket";
import Whatsapp from "../models/Whatsapp";
import {
  SerializeWhatsapp
} from "./SerializeWhatsapp";

export const EmitWhatsappSession = (whatsapp: Whatsapp): void => {
  const io = getIO();

  io.emit("whatsappSession", {
    action: "update",
    session: SerializeWhatsapp(whatsapp)
  });
};

export const EmitWhatsapp = (
  action: "create" | "update" | "delete",
  whatsapp?: Whatsapp,
  whatsappId?: number
): void => {
  const payload: Record<string, unknown> = { action };
  if (whatsapp) payload.whatsapp = SerializeWhatsapp(whatsapp);
  if (whatsappId) payload.whatsappId = whatsappId;
  getIO().emit("whatsapp", payload);
};
