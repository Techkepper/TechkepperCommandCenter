const agentPermissions = [];

const rules = {
  user: { static: agentPermissions },
  agent: { static: agentPermissions },
  supervisor: {
    static: [
      "drawer-supervisor-items:view",
      "tickets-manager:showall",
      "user-modal:editQueues",
      "contacts-page:deleteContact",
    ],
  },
  admin: {
    static: [
      "drawer-admin-items:view",
      "drawer-supervisor-items:view",
      "tickets-manager:showall",
      "user-modal:editProfile",
      "user-modal:editQueues",
      "ticket-options:deleteTicket",
      "ticket-options:transferWhatsapp",
      "contacts-page:deleteContact",
    ],
  },
};

export default rules;
