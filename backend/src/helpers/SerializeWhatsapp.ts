import Whatsapp from "../models/Whatsapp";

type WhatsappSource = Whatsapp | Record<string, any>;

const toPlainObject = (whatsapp: WhatsappSource): Record<string, any> =>
  typeof (whatsapp as Whatsapp).get === "function"
    ? (whatsapp as Whatsapp).get({ plain: true })
    : { ...whatsapp };

export const SerializeWhatsapp = (
  whatsapp: WhatsappSource
): Record<string, any> => {
  const { session: _session, qrcode: _qrcode, ...safeWhatsapp } =
    toPlainObject(whatsapp);
  return safeWhatsapp;
};
