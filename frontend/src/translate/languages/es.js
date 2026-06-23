const messages = {
  es: {
    translations: {
      signup: {
        title: "Registro",
        toasts: {
          success:
            "¡El usuario ha sido creado satisfactoriamente! ¡Ahora inicia sesión!",
          fail: "Error creando el usuario. Verifica la data reportada.",
        },
        form: {
          name: "Nombre",
          email: "Correo Electrónico",
          password: "Contraseña",
        },
        buttons: {
          submit: "Regístrate",
          login: "¿Ya tienes una cuenta? ¡Inicia sesión!",
        },
      },
      login: {
        title: "Iniciar sesión",
        form: {
          email: "Correo Electrónico",
          password: "Contraseña",
        },
        buttons: {
          submit: "Ingresar",
          register: "¿No tienes cuenta? ¡Regístrate!",
        },
      },
      auth: {
        toasts: {
          success: "Sesión iniciada correctamente.",
        },
      },
      dashboard: {
        charts: {
          perDay: {
            title: "Conversaciones de hoy: ",
          },
        },
        messages: {
          inAttendance: {
            title: "En servicio"
          },
          waiting: {
            title: "Esperando"
          },
          closed: {
            title: "Finalizado"
          }
        }
      },
      connections: {
        title: "Conexión WhatsApp",
        toasts: {
          deleted:
            "La conexión de WhatsApp se eliminó correctamente.",
        },
        confirmationModal: {
          deleteTitle: "Borrar",
          deleteMessage: "¿Confirma que desea eliminar esta conexión? Esta acción no se puede deshacer.",
          disconnectTitle: "Desconectar",
          disconnectMessage: "¿Confirma que desea desconectar esta conexión de la API oficial?",
        },
        buttons: {
          add: "Agregar conexión",
          disconnect: "Desconectar",
          tryAgain: "Reintentar",
          connecting: "Conectando",
        },
        toolTips: {
          error: {
            title: "Error al iniciar sesión de WhatsApp",
            content:
              "No fue posible validar la API oficial de WhatsApp. Revise las credenciales de Meta en el servidor.",
          },
          disconnected: {
            title: "No se pudo iniciar la sesión de WhatsApp",
            content:
              "Revise el token, el identificador del número, el secreto de la aplicación y la suscripción del webhook en Meta.",
          },
          connected: {
            title: "Conexión establecida",
          },
          timeout: {
            title: "La API oficial no respondió",
            content:
              "Revise la conectividad del servidor con Meta y vuelva a verificar la conexión.",
          },
        },
        table: {
          name: "Nombre",
          status: "Estado",
          lastUpdate: "Última actualización",
          default: "Predeterminada",
          actions: "Acciones",
          session: "Sesión",
        },
      },
      whatsappModal: {
        title: {
          add: "Agregar conexión de WhatsApp",
          edit: "Editar conexión de WhatsApp",
        },
        form: {
          name: "Nombre",
          default: "Predeterminada",
          farewellMessage: "Mensaje de despedida",
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
        success: "Conexión de WhatsApp guardada correctamente.",
      },
      contacts: {
        title: "Contactos",
        toasts: {
          deleted: "Contacto eliminado correctamente.",
        },
        searchPlaceholder: "Buscar...",
        confirmationModal: {
          deleteTitle: "Borrar",
          importTitlte: "Importar contactos",
          deleteMessage:
            "¿Confirma que desea eliminar este contacto? También se eliminarán sus conversaciones relacionadas.",
          importMessage:
            "¿Quieres importar todos los contactos desde tu teléfono?",
        },
        buttons: {
          import: "Importar contactos",
          add: "Agregar contacto",
        },
        table: {
          name: "Nombre",
          whatsapp: "WhatsApp",
          email: "Correo electrónico",
          actions: "Acciones",
        },
      },
      contactModal: {
        title: {
          add: "Agregar contacto",
          edit: "Editar contacto",
        },
        form: {
          mainInfo: "Detalles del contacto",
          extraInfo: "Información adicional",
          name: "Nombre",
          number: "Número de Whatsapp",
          email: "Correo electrónico",
          extraName: "Nombre del campo",
          extraValue: "Valor",
        },
        buttons: {
          addExtraInfo: "Agregar información",
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
        success: "Contacto guardado correctamente.",
      },
      quickAnswersModal: {
        title: {
          add: "Agregar respuesta rápida",
          edit: "Editar respuesta rápida",
        },
        form: {
          shortcut: "Atajo",
          message: "Respuesta rápida",
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
        success: "Respuesta rápida guardada correctamente.",
      },
      queueModal: {
        title: {
          add: "Agregar departamento",
          edit: "Editar departamento",
        },
        form: {
          name: "Nombre",
          color: "Color",
          greetingMessage: "Mensaje de saludo",
        },
        buttons: {
          okAdd: "Añadir",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
      },
      userModal: {
        title: {
          add: "Agregar usuario",
          edit: "Editar usuario",
        },
        form: {
          name: "Nombre",
          email: "Correo electrónico",
          password: "Contraseña",
          profile: "Perfil",
          whatsapp: "Conexión estándar",
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
        success: "Usuario guardado correctamente.",
      },
      chat: {
        noTicketMessage: "Seleccione una conversación para comenzar la atención.",
      },
      ticketsManager: {
        buttons: {
          newTicket: "Nueva conversación",
        },
      },
      ticketsQueueSelect: {
        placeholder: "Departamentos",
      },
      tickets: {
        toasts: {
          deleted: "La conversación seleccionada fue eliminada.",
        },
        notification: {
          message: "Mensaje de",
        },
        tabs: {
          open: { title: "Bandeja" },
          closed: { title: "Resueltos" },
          search: { title: "Buscar" },
        },
        search: {
          placeholder: "Buscar conversaciones y mensajes.",
        },
        buttons: {
          showAll: "Todos",
        },
      },
      transferTicketModal: {
        title: "Transferir conversación",
        fieldLabel: "Escriba para buscar usuarios",
        fieldQueueLabel: "Transferir al departamento",
        fieldConnectionLabel: "Transferir a la conexión",
        fieldQueuePlaceholder: "Seleccione un departamento",
        fieldConnectionPlaceholder: "Seleccione una conexión",
        noOptions: "No se encontraron usuarios con ese nombre",
        buttons: {
          ok: "Transferir",
          cancel: "Cancelar",
        },
      },
      ticketsList: {
        pendingHeader: "Pendientes",
        assignedHeader: "Responsable",
        noTicketsTitle: "No hay conversaciones disponibles",
        connectionTitle: "Conexión que se está utilizando actualmente.",
        noTicketsMessage:
          "No se encontraron conversaciones con el estado o término indicado.",
        buttons: {
          accept: "Aceptar",
        },
      },
      newTicketModal: {
        title: "Crear conversación",
        fieldLabel: "Escribe para buscar un contacto",
        add: "Añadir",
        buttons: {
          ok: "Guardar",
          cancel: "Cancelar",
        },
      },
      mainDrawer: {
        listItems: {
          dashboard: "Centro operativo",
          connections: "Conexión WhatsApp",
          tickets: "Conversaciones",
          contacts: "Contactos",
          quickAnswers: "Respuestas rápidas",
          queues: "Departamentos",
          administration: "Administración",
          users: "Usuarios",
          settings: "Configuración",
        },
        appBar: {
          user: {
            profile: "Perfil",
            logout: "Cerrar sesión",
          },
        },
      },
      notifications: {
        noTickets: "Sin notificaciones.",
      },
      queues: {
        title: "Departamentos",
        table: {
          name: "Nombre",
          color: "Color",
          greeting: "Mensaje de saludo",
          status: "Estado",
          actions: "Acciones",
        },
        buttons: {
          add: "Agregar departamento",
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage:
            "¿Confirma que desea eliminar este departamento? Las conversaciones existentes quedarán sin departamento asignado.",
        },
      },
      queueSelect: {
        inputLabel: "Departamentos",
      },
      quickAnswers: {
        title: "Respuestas rápidas",
        table: {
          shortcut: "Atajo",
          message: "Respuesta rápida",
          actions: "Acciones",
        },
        buttons: {
          add: "Agregar respuesta rápida",
        },
        toasts: {
          deleted: "Respuesta rápida eliminada correctamente",
        },
        searchPlaceholder: "Buscar ...",
        confirmationModal: {
          deleteTitle:
            "¿Está seguro de que desea eliminar esta respuesta rápida?",
          deleteMessage: "Esta acción no se puede deshacer.",
        },
      },
      users: {
        title: "Agentes y usuarios",
        table: {
          name: "Nombre",
          email: "Correo electrónico",
          profile: "Perfil",
          whatsapp: "Conexión estándar",
          actions: "Acciones",
        },
        buttons: {
          add: "Agregar usuario",
        },
        toasts: {
          deleted: "Usuario eliminado correctamente.",
        },
        confirmationModal: {
          deleteTitle: "Borrar",
          deleteMessage:
            "Se eliminará la información del usuario. Sus conversaciones abiertas quedarán disponibles para reasignación.",
        },
      },
      settings: {
        success: "Configuración guardada correctamente.",
        title: "Configuración",
        settings: {
          userCreation: {
            name: "Creación de usuarios",
            options: {
              enabled: "Habilitado",
              disabled: "Deshabilitado",
            },
          },
        },
      },
      messagesList: {
        header: {
          assignedTo: "Asignado a:",
          buttons: {
            return: "Devolver",
            resolve: "Resolver",
            reopen: "Reabrir",
            accept: "Aceptar",
          },
        },
      },
      messagesInput: {
        placeholderOpen: "Escriba un mensaje o presione '' / '' para usar las respuestas rápidas registradas",
        placeholderClosed:
          "Reabra o acepte esta conversación para enviar un mensaje.",
        signMessage: "Firmar",
      },
      contactDrawer: {
        header: "Detalles del contacto",
        buttons: {
          edit: "Editar contacto",
        },
        extraInfo: "Otra información",
      },
      ticketOptionsMenu: {
        delete: "Borrar",
        transfer: "Transferir",
        confirmationModal: {
          title: "¿Eliminar conversación #",
          titleFrom: "del contacto ",
          message:
            "Se eliminarán todos los mensajes relacionados con esta conversación.",
        },
        buttons: {
          delete: "Borrar",
          cancel: "Cancelar",
        },
      },
      confirmationModal: {
        buttons: {
          confirm: "Confirmar",
          cancel: "Cancelar",
        },
      },
      messageOptionsMenu: {
        delete: "Borrar",
        reply: "Responder",
        confirmationModal: {
          title: "¿Borrar mensaje?",
          message: "Esta acción no puede ser revertida.",
        },
      },
      backendErrors: {
        ERR_NO_OTHER_WHATSAPP:
          "Debe haber al menos una conexión de WhatsApp predeterminada.",
        ERR_NO_DEF_WAPP_FOUND:
          "No se encontró WhatsApp predeterminado. Verifique la página de conexiones.",
        ERR_WAPP_NOT_INITIALIZED:
          "Esta sesión de WhatsApp no ​​está inicializada. Verifique la página de conexiones.",
        ERR_WAPP_CHECK_CONTACT:
          "No se pudo verificar el contacto de WhatsApp. Verifique la página de conexiones.",
        ERR_WAPP_INVALID_CONTACT: "Este no es un número de whatsapp válido.",
        ERR_WAPP_DOWNLOAD_MEDIA:
          "No se pudieron descargar los medios de WhatsApp. Verifique la página de conexiones.",
        ERR_INVALID_CREDENTIALS: "Error de autenticación. Vuelva a intentarlo.",
        ERR_SENDING_WAPP_MSG:
          "Error al enviar el mensaje de WhatsApp. Verifique la página de conexiones.",
        ERR_CLOUD_API_NOT_CONFIGURED:
          "WhatsApp Cloud API aún no está configurada en el servidor.",
        ERR_CLOUD_API_REQUEST_FAILED:
          "Meta rechazó la solicitud de WhatsApp Cloud API. Verifique token, permisos y Phone Number ID.",
        ERR_CLOUD_API_PHONE_NOT_REGISTERED:
          "El número no está registrado en WhatsApp Cloud API. Regístrelo una vez en Meta for Developers (POST /{phone-number-id}/register) antes de enviar mensajes.",
        ERR_CLOUD_API_PHONE_NUMBER_ID_INVALID:
          "El Phone Number ID no es válido para este token. En Meta for Developers use el ID del número (WhatsApp > Inicio rápido de la API), no el ID de la cuenta comercial ni el de la app.",
        ERR_CLOUD_API_TOKEN_INVALID:
          "El token de acceso de Meta es inválido o expiró. Genere uno nuevo en Meta for Developers.",
        ERR_CLOUD_API_MEDIA_UPLOAD_FAILED:
          "No fue posible subir el archivo a WhatsApp Cloud API.",
        ERR_CLOUD_API_DELETE_NOT_SUPPORTED:
          "WhatsApp Cloud API no permite borrar este mensaje desde la plataforma.",
        ERR_UNSUPPORTED_MEDIA_TYPE:
          "El tipo de archivo seleccionado no está permitido.",
        ERR_MEDIA_TOO_LARGE: "El archivo supera el límite permitido.",
        ERR_DELETE_WAPP_MSG: "No se pudo borrar el mensaje de WhatsApp.",
        ERR_OTHER_OPEN_TICKET:
          "Ya existe una conversación abierta para este contacto.",
        ERR_SESSION_EXPIRED: "Sesión caducada. Inicie sesión.",
        ERR_USER_CREATION_DISABLED:
          "La creación de usuarios fue deshabilitada por el administrador.",
        ERR_NO_PERMISSION: "No cuenta con permisos para acceder a este recurso.",
        ERR_USER_INACTIVE:
          "Su usuario está inactivo. Comuníquese con un administrador.",
        ERR_USER_EMAIL_ALREADY_EXISTS:
          "Ya existe un usuario con este correo electrónico.",
        ERR_ASSIGNED_USER_INACTIVE:
          "No es posible asignar la conversación a un usuario inactivo.",
        ERR_CORS_ORIGIN_NOT_ALLOWED:
          "El origen de la solicitud no está autorizado.",
        ERR_ECOSYSTEM_NAME_REQUIRED:
          "El nombre del ecosistema es obligatorio.",
        ERR_NO_API_TOKEN_FOUND: "No se encontró el token de API solicitado.",
        ERR_NO_ECOSYSTEM_FOUND: "No se encontró el ecosistema solicitado.",
        ERR_NO_MEDIA_DATA: "No se encontraron datos multimedia para procesar.",
        ERR_NO_MESSAGE_FOUND: "No se encontró el mensaje solicitado.",
        ERR_NO_QUICK_ANSWER_FOUND:
          "No se encontró la respuesta rápida solicitada.",
        ERR_NO_QUICK_ANSWERS_FOUND:
          "No hay respuestas rápidas disponibles.",
        ERR_NUMBER_NOT_ON_WHATSAPP:
          "El número indicado no está registrado en WhatsApp.",
        ERR_QUEUE_INVALID_COLOR:
          "Seleccione un color válido para el departamento.",
        ERR_QUEUE_INVALID_NAME:
          "Ingrese un nombre válido para el departamento.",
        ERR_QUEUE_NAME_ALREADY_EXISTS:
          "Ya existe un departamento con este nombre.",
        ERR_QUEUE_NOT_FOUND: "No se encontró el departamento solicitado.",
        ERR_SENDING_WAPP_MEDIA_MSG:
          "No fue posible enviar el archivo multimedia por WhatsApp.",
        ERR_TICKET_NO_WHATSAPP:
          "La conversación no tiene una conexión de WhatsApp asignada.",
        ERR__SHORTCUT_DUPLICATED:
          "Ya existe una respuesta rápida con este atajo.",
        ERR_DUPLICATED_CONTACT: "Ya existe un contacto con este número.",
        ERR_NO_SETTING_FOUND:
          "No se encontró ninguna configuración con este ID.",
        ERR_NO_CONTACT_FOUND: "No se encontró ningún contacto con este ID.",
        ERR_NO_TICKET_FOUND:
          "No se encontró una conversación con este identificador.",
        ERR_NO_USER_FOUND: "No se encontró ningún usuario con este ID.",
        ERR_NO_WAPP_FOUND: "No se encontró WhatsApp con este ID.",
        ERR_CREATING_MESSAGE: "Error al crear el mensaje en la base de datos.",
        ERR_CREATING_TICKET:
          "No fue posible crear la conversación en la base de datos.",
        ERR_FETCH_WAPP_MSG:
          "No fue posible obtener el mensaje de WhatsApp; puede ser demasiado antiguo.",
        ERR_QUEUE_COLOR_ALREADY_EXISTS:
          "Este color ya está en uso, elija otro.",
        ERR_WAPP_GREETING_REQUIRED:
          "El mensaje de saludo es obligatorio cuando hay más de un departamento.",
      },
    },
  },
};

export { messages };
