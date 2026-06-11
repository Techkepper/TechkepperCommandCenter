import { Request, Response } from "express";
import { Op } from "sequelize";
import Ticket from "../models/Ticket";
import User from "../models/User";
import Queue from "../models/Queue";
import Whatsapp from "../models/Whatsapp";
import BuildTicketScope from "../services/ReportServices/BuildTicketScope";

const withCondition = (scope: any, condition: any): any => ({
  [Op.and]: [scope, condition]
});

export const index = async (req: Request, res: Response): Promise<Response> => {
  const scope = await BuildTicketScope(req.user.id, req.user.profile);
  const [open, pending, closed, customers, activeAgents, connections, queues] =
    await Promise.all([
      Ticket.count({ where: withCondition(scope, { status: "open" }) }),
      Ticket.count({ where: withCondition(scope, { status: "pending" }) }),
      Ticket.count({ where: withCondition(scope, { status: "closed" }) }),
      Ticket.count({ where: scope, distinct: true, col: "contactId" }),
      User.count({
        where: {
          isActive: true,
          profile: { [Op.in]: ["agent", "supervisor"] }
        }
      }),
      Whatsapp.findAll({
        attributes: ["id", "name", "status", "updatedAt"],
        order: [["isDefault", "DESC"]]
      }),
      Queue.findAll({
        where: { isActive: true },
        order: [["name", "ASC"]]
      })
    ]);

  const queueMetrics = await Promise.all(
    queues.map(async queue => ({
      id: queue.id,
      name: queue.name,
      color: queue.color,
      total: await Ticket.count({
        where: withCondition(scope, { queueId: queue.id })
      })
    }))
  );

  const agents =
    req.user.profile === "agent"
      ? await User.findAll({
          where: { id: Number(req.user.id), isActive: true }
        })
      : await User.findAll({
          where: {
            isActive: true,
            profile: { [Op.in]: ["agent", "supervisor"] }
          },
          order: [["name", "ASC"]]
        });

  const agentMetrics = await Promise.all(
    agents.map(async agent => {
      const agentScope = withCondition(scope, { userId: agent.id });
      const [total, agentOpen, agentPending, agentClosed, responseTickets] =
        await Promise.all([
          Ticket.count({ where: agentScope }),
          Ticket.count({
            where: withCondition(agentScope, { status: "open" })
          }),
          Ticket.count({
            where: withCondition(agentScope, { status: "pending" })
          }),
          Ticket.count({
            where: withCondition(agentScope, { status: "closed" })
          }),
          Ticket.findAll({
            where: withCondition(agentScope, {
              firstResponseAt: { [Op.ne]: null }
            }),
            attributes: ["createdAt", "firstResponseAt"]
          })
        ]);
      const averageResponseMinutes = responseTickets.length
        ? Math.round(
            responseTickets.reduce(
              (sum, ticket) =>
                sum +
                (ticket.firstResponseAt.getTime() -
                  ticket.createdAt.getTime()) /
                  60000,
              0
            ) / responseTickets.length
          )
        : null;

      return {
        id: agent.id,
        name: agent.name,
        profile: agent.profile,
        total,
        open: agentOpen,
        pending: agentPending,
        closed: agentClosed,
        averageResponseMinutes,
        lastActivityAt: agent.lastActivityAt
      };
    })
  );

  agentMetrics.sort((a, b) => b.closed - a.closed);

  return res.json({
    totals: { open, pending, closed, customers, activeAgents },
    connections,
    queues: queueMetrics,
    agents: agentMetrics
  });
};
