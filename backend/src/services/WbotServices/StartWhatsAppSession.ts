import Whatsapp from "../../models/Whatsapp";
import { whatsappProvider } from "../../providers/WhatsApp";
import { logger } from "../../utils/logger";
import { EmitWhatsappSession } from "../../helpers/EmitWhatsappSession";

export const StartWhatsAppSession = async (
  whatsapp: Whatsapp
): Promise<void> => {
  try {
    await whatsapp.update({ status: "OPENING", qrcode: "" });
    EmitWhatsappSession(whatsapp);

    await whatsappProvider.init(whatsapp);
  } catch (err) {
    logger.error(err, "Error starting WhatsApp session");

    await whatsapp.update({ status: "ERROR", qrcode: "" });

    EmitWhatsappSession(whatsapp);
  }
};
