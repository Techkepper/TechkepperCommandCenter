import { Request, Response } from "express";
import AgentHistoryService, {
  AgentHistoryFilters
} from "../services/ReportServices/AgentHistoryService";

export const agentHistory = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const data = await AgentHistoryService(
    req.user.id,
    req.user.profile,
    req.query as AgentHistoryFilters
  );
  return res.json(data);
};

const escapeCsv = (value: unknown): string =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

export const agentHistoryCsv = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const data = await AgentHistoryService(
    req.user.id,
    req.user.profile,
    req.query as AgentHistoryFilters
  );
  const headers = [
    "Cliente",
    "WhatsApp",
    "Agente",
    "Ultimo ticket",
    "Estado",
    "Departamento",
    "Ecosistema",
    "Primera atencion",
    "Ultima interaccion",
    "Conversaciones",
    "Abiertas",
    "Pendientes",
    "Cerradas"
  ];
  const lines = data.rows.map(row =>
    [
      row.contactName,
      row.number,
      row.agent,
      row.lastTicket?.id,
      row.lastTicket?.status,
      row.lastTicket?.queue,
      row.lastTicket?.ecosystem,
      row.firstServiceAt,
      row.lastInteractionAt,
      row.total,
      row.open,
      row.pending,
      row.closed
    ]
      .map(escapeCsv)
      .join(",")
  );

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="historial-agentes-techkepper.csv"'
  );
  return res.send(`\uFEFF${headers.map(escapeCsv).join(",")}\n${lines.join("\n")}`);
};
