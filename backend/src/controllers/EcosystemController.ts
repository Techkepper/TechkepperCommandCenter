import { Request, Response } from "express";
import Ecosystem from "../models/Ecosystem";
import AppError from "../errors/AppError";

export const index = async (_req: Request, res: Response): Promise<Response> =>
  res.json(
    await Ecosystem.findAll({
      where: { isActive: true },
      order: [["name", "ASC"]]
    })
  );

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { name, color = "#8ee63f", isActive = true } = req.body;
  if (!name) throw new AppError("ERR_ECOSYSTEM_NAME_REQUIRED");
  return res.status(201).json(
    await Ecosystem.create({ name, color, isActive } as any)
  );
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const ecosystem = await Ecosystem.findByPk(req.params.ecosystemId);
  if (!ecosystem) throw new AppError("ERR_NO_ECOSYSTEM_FOUND", 404);
  await ecosystem.update(req.body);
  return res.json(ecosystem);
};
