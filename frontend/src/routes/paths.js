export const ROUTES = {
  login: "/login",
  dashboard: "/",
  tickets: "/tickets",
  connections: "/connections",
  contacts: "/contacts",
  businessClients: "/business-clients",
  collaborators: "/collaborators",
  smartDocuments: "/smart-documents",
  users: "/users",
  quickAnswers: "/quick-answers",
  settings: "/settings",
  queues: "/queues",
  agentHistory: "/agent-history",
};

export const getHomePath = (profile) =>
  profile === "agent" || profile === "user"
    ? ROUTES.tickets
    : ROUTES.dashboard;
