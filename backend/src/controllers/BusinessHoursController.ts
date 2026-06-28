import { Request, Response } from "express";
import {
  createSpecialDate,
  deleteSpecialDate,
  getBusinessHoursConfig,
  listSpecialDates,
  updateBusinessHoursConfig,
  updateSpecialDate
} from "../services/BusinessHoursServices/BusinessHoursService";

export const show = async (_req: Request, res: Response): Promise<Response> => {
  const [config, specialDates] = await Promise.all([
    getBusinessHoursConfig(),
    listSpecialDates()
  ]);
  return res.status(200).json({ config, specialDates });
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const config = await updateBusinessHoursConfig(req.body);
  return res.status(200).json(config);
};

export const storeSpecialDate = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const specialDate = await createSpecialDate(req.body);
  return res.status(201).json(specialDate);
};

export const updateSpecialDateEntry = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const specialDate = await updateSpecialDate(
    Number(req.params.specialDateId),
    req.body
  );
  return res.status(200).json(specialDate);
};

export const removeSpecialDate = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await deleteSpecialDate(Number(req.params.specialDateId));
  return res.sendStatus(204);
};
