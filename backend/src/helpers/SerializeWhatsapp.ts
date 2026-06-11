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

export const SerializeWhatsappQr = (
  whatsapp: WhatsappSource
): Record<string, any> => {
  const plainWhatsapp = toPlainObject(whatsapp);
  return {
    id: plainWhatsapp.id,
    name: plainWhatsapp.name,
    status: plainWhatsapp.status,
    qrcode: plainWhatsapp.qrcode || "",
    retries: plainWhatsapp.retries || 0,
    updatedAt: plainWhatsapp.updatedAt
  };
};
