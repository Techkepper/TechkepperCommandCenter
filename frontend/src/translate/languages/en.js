const messages = {
  en: {
    translations: {
      signup: {
        title: "Sign up",
        toasts: {
          success: "User created successfully! Please login!",
          fail: "Error creating user. Check the reported data.",
        },
        form: {
          name: "Name",
          email: "Email",
          password: "Password",
        },
        buttons: {
          submit: "Register",
          login: "Already have an account? Log in!",
        },
      },
      login: {
        title: "Login",
        form: {
          email: "Email",
          password: "Password",
        },
        buttons: {
          submit: "Enter",
          register: "Don't have an account? Register!",
        },
      },
      auth: {
        toasts: {
          success: "Login successfully!",
        },
      },
      dashboard: {
        charts: {
          perDay: {
            title: "Tickets today: ",
          },
        },
        messages: {
          inAttendance: {
            title: "In Service",
          },
          waiting: {
            title: "Waiting",
          },
          closed: {
            title: "Closed",
          },
        },
      },
      connections: {
        title: "Connections",
        toasts: {
          deleted: "WhatsApp connection deleted sucessfully!",
        },
        confirmationModal: {
          deleteTitle: "Delete",
          deleteMessage: "Are you sure? It cannot be reverted.",
          disconnectTitle: "Disconnect",
          disconnectMessage:
            "Are you sure you want to disconnect this official API connection?",
        },
        buttons: {
          add: "Add WhatsApp",
          disconnect: "Disconnect",
          tryAgain: "Try Again",
          connecting: "Connecting",
          metaInfo: "View number verification",
        },
        toolTips: {
          error: {
            title: "Error starting WhatsApp session",
            content:
              "The official WhatsApp API could not be validated. Check the Meta credentials on the server.",
          },
          disconnected: {
            title: "Failed to start WhatsApp session",
            content:
              "Check the token, phone number ID, app secret, and webhook subscription in Meta.",
          },
          connected: {
            title: "Connection established",
          },
          timeout: {
            title: "The official API did not respond",
            content:
              "Check server connectivity to Meta and verify the connection again.",
          },
        },
        table: {
          name: "Name",
          status: "Status",
          lastUpdate: "Last Update",
          default: "Default",
          actions: "Actions",
          session: "Session",
        },
      },
      whatsappModal: {
        title: {
          add: "Add WhatsApp",
          edit: "Edit WhatsApp",
        },
        form: {
          name: "Name",
          default: "Default",
          farewellMessage: "Farewell message",
        },
        buttons: {
          okAdd: "Add",
          okEdit: "Save",
          cancel: "Cancel",
        },
        meta: {
          title: "Meta connection (Cloud API)",
          loading: "Querying Meta...",
          error:
            "Could not fetch the Meta info. Check the token and phone number ID on the server.",
          number: "Number",
          verifiedName: "Verified name",
          phoneNumberId: "Phone number ID (phone_number_id)",
          apiVersion: "API version",
          webhook: "Configured webhook",
        },
        success: "WhatsApp saved successfully.",
      },
      contacts: {
        title: "Contacts",
        toasts: {
          deleted: "Contact deleted sucessfully!",
        },
        searchPlaceholder: "Search ...",
        confirmationModal: {
          deleteTitle: "Delete",
          importTitlte: "Import contacts",
          deleteMessage:
            "Are you sure you want to delete this contact? All related tickets will be lost.",
          importMessage: "Do you want to import all contacts from the phone?",
        },
        buttons: {
          import: "Import Contacts",
          add: "Add Contact",
        },
        table: {
          name: "Name",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Actions",
        },
      },
      contactModal: {
        title: {
          add: "Add contact",
          edit: "Edit contact",
        },
        form: {
          mainInfo: "Contact details",
          extraInfo: "Additional information",
          name: "Name",
          number: "Whatsapp number",
          email: "Email",
          extraName: "Field name",
          extraValue: "Value",
        },
        buttons: {
          addExtraInfo: "Add information",
          okAdd: "Add",
          okEdit: "Save",
          cancel: "Cancel",
        },
        success: "Contact saved successfully.",
      },
      quickAnswersModal: {
        title: {
          add: "Add Quick Reply",
          edit: "Edit Quick Answer",
        },
        form: {
          shortcut: "Shortcut",
          message: "Quick Reply",
        },
        buttons: {
          okAdd: "Add",
          okEdit: "Save",
          cancel: "Cancel",
        },
        success: "Quick Reply saved successfully.",
      },
      queueModal: {
        title: {
          add: "Add queue",
          edit: "Edit queue",
        },
        form: {
          name: "Name",
          color: "Color",
          greetingMessage: "Greeting Message",
        },
        buttons: {
          okAdd: "Add",
          okEdit: "Save",
          cancel: "Cancel",
        },
      },
      userModal: {
        title: {
          add: "Add user",
          edit: "Edit user",
        },
        form: {
          name: "Name",
          email: "Email",
          password: "Password",
          profile: "Profile",
          whatsapp: "Default Connection",
        },
        buttons: {
          okAdd: "Add",
          okEdit: "Save",
          cancel: "Cancel",
        },
        success: "User saved successfully.",
      },
      chat: {
        noTicketMessage: "Select a ticket to start chatting.",
      },
      ticketsManager: {
        buttons: {
          newTicket: "New",
        },
      },
      ticketsQueueSelect: {
        placeholder: "Queues",
        all: "All",
        selected: "{{count}} queues",
      },
      tickets: {
        toasts: {
          deleted: "The ticket you were on has been deleted.",
        },
        notification: {
          message: "Message from",
        },
        tabs: {
          open: { title: "Inbox" },
          closed: { title: "Resolved" },
          search: { title: "Search" },
        },
        search: {
          placeholder: "Search tickets and messages.",
        },
        buttons: {
          showAll: "All",
        },
        ecosystemFilter: {
          all: "All ecosystems",
          placeholder: "Ecosystem",
        },
      },
      transferTicketModal: {
        title: "Transfer Ticket",
        fieldLabel: "Type to search for users",
        fieldQueueLabel: "Transfer to queue",
        fieldConnectionLabel: "Transfer to connection",
        fieldQueuePlaceholder: "Please select a queue",
        fieldConnectionPlaceholder: "Please select a connection",
        noOptions: "No user found with this name",
        unavailableWarning:
          "This user is not currently available. Do you want to assign the conversation anyway?",
        buttons: {
          ok: "Transfer",
          cancel: "Cancel",
        },
      },
      ticketsList: {
        pendingHeader: "Queue",
        assignedHeader: "Working on",
        noTicketsTitle: "Nothing here!",
        noTicketsMessage: "No tickets found with this status or search term.",
        noAvailableAgent: "No agent available",
        connectionTitle: "Connection that is currently being used.",
        buttons: {
          accept: "Accept",
          assign: "Assign",
        },
        deleteSuccess: "Conversation deleted.",
      },
      newTicketModal: {
        title: "Create Ticket",
        fieldLabel: "Type to search for a contact",
        add: "Add",
        buttons: {
          ok: "Save",
          cancel: "Cancel",
        },
      },
      mainDrawer: {
        listItems: {
          dashboard: "Dashboard",
          connections: "Connections",
          tickets: "Tickets",
          contacts: "Contacts",
          businessClients: "Clients",
          collaborators: "Collaborators",
          smartDocuments: "Smart documents",
          commercialProposals: "Proposals",
          quickAnswers: "Quick Answers",
          queues: "Queues",
          administration: "Administration",
          agentHistory: "History by agent",
          users: "Users",
          settings: "Settings",
        },
        listSubheaders: {
          supervision: "Supervision",
        },
        appBar: {
          user: {
            profile: "Profile",
            logout: "Logout",
            language: "Language",
          },
        },
      },
      notifications: {
        noTickets: "No notifications.",
      },
      queues: {
        title: "Queues",
        table: {
          name: "Name",
          color: "Color",
          greeting: "Greeting message",
          status: "Status",
          actions: "Actions",
        },
        buttons: {
          add: "Add queue",
        },
        confirmationModal: {
          deleteTitle: "Delete",
          deleteMessage:
            "Are you sure? It cannot be reverted! Tickets in this queue will still exist, but will not have any queues assigned.",
        },
      },
      queueSelect: {
        inputLabel: "Queues",
      },
      quickAnswers: {
        title: "Quick Answers",
        table: {
          shortcut: "Shortcut",
          message: "Quick Reply",
          actions: "Actions",
        },
        buttons: {
          add: "Add Quick Reply",
        },
        toasts: {
          deleted: "Quick Reply deleted successfully.",
        },
        searchPlaceholder: "Search...",
        confirmationModal: {
          deleteTitle: "Are you sure you want to delete this Quick Reply: ",
          deleteMessage: "This action cannot be undone.",
        },
      },
      users: {
        title: "Users",
        table: {
          name: "Name",
          email: "Email",
          profile: "Profile",
          whatsapp: "Default Connection",
          actions: "Actions",
        },
        buttons: {
          add: "Add user",
        },
        toasts: {
          deleted: "User deleted sucessfully.",
        },
        confirmationModal: {
          deleteTitle: "Delete",
          deleteMessage:
            "All user data will be lost. Users' open tickets will be moved to queue.",
        },
      },
      settings: {
        success: "Settings saved successfully.",
        title: "Settings",
        settings: {
          userCreation: {
            name: "User creation",
            options: {
              enabled: "Enabled",
              disabled: "Disabled",
            },
          },
        },
      },
      messagesList: {
        header: {
          assignedTo: "Assigned to:",
          buttons: {
            return: "Return",
            resolve: "Resolve",
            reopen: "Reopen",
            accept: "Accept",
            assign: "Assign",
          },
        },
      },
      messagesInput: {
        placeholderOpen:
          "Type a message or press ''/'' to use the registered quick responses",
        placeholderClosed: "Reopen or accept this ticket to send a message.",
        placeholderObserver:
          "Observer mode: assign the conversation before replying.",
        signMessage: "Sign",
      },
      contactDrawer: {
        header: "Contact details",
        buttons: {
          edit: "Edit contact",
        },
        extraInfo: "Other information",
      },
      ticketOptionsMenu: {
        delete: "Delete",
        transfer: "Transfer",
        confirmationModal: {
          title: "Delete ticket #",
          titleFrom: "from contact ",
          message: "Attention! All ticket's related messages will be lost.",
        },
        buttons: {
          delete: "Delete",
          cancel: "Cancel",
        },
      },
      confirmationModal: {
        buttons: {
          confirm: "Ok",
          cancel: "Cancel",
        },
      },
      messageOptionsMenu: {
        delete: "Delete",
        reply: "Reply",
        confirmationModal: {
          title: "Delete message?",
          message: "This action cannot be reverted.",
        },
      },
      backendErrors: {
        ERR_NO_OTHER_WHATSAPP:
          "There must be at lest one default WhatsApp connection.",
        ERR_NO_DEF_WAPP_FOUND:
          "No default WhatsApp found. Check connections page.",
        ERR_WAPP_NOT_INITIALIZED:
          "This WhatsApp session is not initialized. Check connections page.",
        ERR_WAPP_CHECK_CONTACT:
          "Could not check WhatsApp contact. Check connections page.",
        ERR_WAPP_INVALID_CONTACT: "This is not a valid whatsapp number.",
        ERR_WAPP_DOWNLOAD_MEDIA:
          "Could not download media from WhatsApp. Check connections page.",
        ERR_INVALID_CREDENTIALS: "Authentication error. Please try again.",
        ERR_SENDING_WAPP_MSG:
          "Error sending WhatsApp message. Check connections page.",
        ERR_CLOUD_API_NOT_CONFIGURED:
          "WhatsApp Cloud API is not configured on the server yet.",
        ERR_CLOUD_API_REQUEST_FAILED:
          "Meta rejected the WhatsApp Cloud API request. Check the token, permissions, and Phone Number ID.",
        ERR_CLOUD_API_PHONE_NOT_REGISTERED:
          "The phone number is not registered on WhatsApp Cloud API. Register it once in Meta for Developers (POST /{phone-number-id}/register) before sending messages.",
        ERR_CLOUD_API_PHONE_NUMBER_ID_INVALID:
          "The Phone Number ID is invalid for this token. In Meta for Developers use the phone number ID (WhatsApp > API Setup), not the business account ID or app ID.",
        ERR_CLOUD_API_TOKEN_INVALID:
          "The Meta access token is invalid or expired. Generate a new one in Meta for Developers.",
        ERR_CLOUD_API_MEDIA_UPLOAD_FAILED:
          "The file could not be uploaded to WhatsApp Cloud API.",
        ERR_CLOUD_API_DELETE_NOT_SUPPORTED:
          "WhatsApp Cloud API cannot delete this message from the platform.",
        ERR_UNSUPPORTED_MEDIA_TYPE: "This file type is not allowed.",
        ERR_MEDIA_TOO_LARGE: "The file exceeds the allowed size.",
        ERR_DELETE_WAPP_MSG: "Couldn't delete message from WhatsApp.",
        ERR_OTHER_OPEN_TICKET:
          "There's already an open ticket for this contact.",
        ERR_SESSION_EXPIRED: "Session expired. Please login.",
        ERR_USER_CREATION_DISABLED:
          "User creation was disabled by administrator.",
        ERR_NO_PERMISSION: "You don't have permission to access this resource.",
        ERR_USER_INACTIVE:
          "Your user is inactive. Please contact an administrator.",
        ERR_USER_EMAIL_ALREADY_EXISTS: "A user with this email already exists.",
        ERR_ASSIGNED_USER_INACTIVE:
          "The conversation cannot be assigned to an inactive user.",
        ERR_CORS_ORIGIN_NOT_ALLOWED: "The request origin is not allowed.",
        ERR_ECOSYSTEM_NAME_REQUIRED: "The ecosystem name is required.",
        ERR_NO_API_TOKEN_FOUND: "The requested API token was not found.",
        ERR_NO_ECOSYSTEM_FOUND: "The requested ecosystem was not found.",
        ERR_NO_MEDIA_DATA: "No media data was found to process.",
        ERR_NO_MESSAGE_FOUND: "The requested message was not found.",
        ERR_NO_QUICK_ANSWER_FOUND: "The requested quick reply was not found.",
        ERR_NO_QUICK_ANSWERS_FOUND: "No quick replies are available.",
        ERR_NUMBER_NOT_ON_WHATSAPP:
          "The provided number is not registered on WhatsApp.",
        ERR_QUEUE_INVALID_COLOR: "Select a valid color for the queue.",
        ERR_QUEUE_INVALID_NAME: "Enter a valid name for the queue.",
        ERR_QUEUE_NAME_ALREADY_EXISTS: "A queue with this name already exists.",
        ERR_QUEUE_NOT_FOUND: "The requested queue was not found.",
        ERR_SENDING_WAPP_MEDIA_MSG:
          "The media file could not be sent via WhatsApp.",
        ERR_TICKET_NO_WHATSAPP:
          "The conversation has no WhatsApp connection assigned.",
        ERR__SHORTCUT_DUPLICATED:
          "A quick reply with this shortcut already exists.",
        ERR_TICKET_ALREADY_ASSIGNED:
          "This conversation has already been assigned to another owner.",
        ERR_DUPLICATED_CONTACT: "A contact with this number already exists.",
        ERR_NO_SETTING_FOUND: "No setting found with this ID.",
        ERR_NO_CONTACT_FOUND: "No contact found with this ID.",
        ERR_NO_TICKET_FOUND: "No ticket found with this ID.",
        ERR_NO_USER_FOUND: "No user found with this ID.",
        ERR_NO_WAPP_FOUND: "No WhatsApp found with this ID.",
        ERR_CREATING_MESSAGE: "Error while creating message on database.",
        ERR_CREATING_TICKET: "Error while creating ticket on database.",
        ERR_FETCH_WAPP_MSG:
          "Error fetching the message in WhtasApp, maybe it is too old.",
        ERR_QUEUE_COLOR_ALREADY_EXISTS:
          "This color is already in use, pick another one.",
        ERR_WAPP_GREETING_REQUIRED:
          "Greeting message is required if there is more than one queue.",
      },
    },
  },
};

export { messages };
