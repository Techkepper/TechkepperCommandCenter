import { Request, Response } from "express";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";

import CreateWhatsAppService from "../services/WhatsappService/CreateWhatsAppService";
import DeleteWhatsAppService from "../services/WhatsappService/DeleteWhatsAppService";
import ListWhatsAppsService from "../services/WhatsappService/ListWhatsAppsService";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import UpdateWhatsAppService from "../services/WhatsappService/UpdateWhatsAppService";
import { whatsappProvider } from "../providers/WhatsApp";
import {
  EmitWhatsapp
} from "../helpers/EmitWhatsappSession";
import {
  SerializeWhatsapp
} from "../helpers/SerializeWhatsapp";

interface WhatsappData {
  name: string;
  queueIds: number[];
  greetingMessage?: string;
  farewellMessage?: string;
  status?: string;
  isDefault?: boolean;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const whatsapps = await ListWhatsAppsService();

  return res.status(200).json(whatsapps.map(SerializeWhatsapp));
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const {
    name,
    status,
    isDefault,
    greetingMessage,
    farewellMessage,
    queueIds
  }: WhatsappData = req.body;

  const { whatsapp, oldDefaultWhatsapp } = await CreateWhatsAppService({
    name,
    status,
    isDefault,
    greetingMessage,
    farewellMessage,
    queueIds
  });

  StartWhatsAppSession(whatsapp);

  EmitWhatsapp("update", whatsapp);

  if (oldDefaultWhatsapp) {
    EmitWhatsapp("update", oldDefaultWhatsapp);
  }

  return res.status(200).json(SerializeWhatsapp(whatsapp));
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;

  const whatsapp = await ShowWhatsAppService(whatsappId);

  return res.status(200).json(SerializeWhatsapp(whatsapp));
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;
  const whatsappData = req.body;

  const { whatsapp, oldDefaultWhatsapp } = await UpdateWhatsAppService({
    whatsappData,
    whatsappId
  });

  EmitWhatsapp("update", whatsapp);

  if (oldDefaultWhatsapp) {
    EmitWhatsapp("update", oldDefaultWhatsapp);
  }

  return res.status(200).json(SerializeWhatsapp(whatsapp));
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;

  const replacementDefaultWhatsapp = await DeleteWhatsAppService(whatsappId);
  whatsappProvider.removeSession(+whatsappId);

  EmitWhatsapp("delete", undefined, +whatsappId);
  if (replacementDefaultWhatsapp) {
    EmitWhatsapp("update", replacementDefaultWhatsapp);
  }

  return res.status(200).json({ message: "Whatsapp deleted." });
};
