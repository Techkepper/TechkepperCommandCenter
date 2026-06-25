// Claves sueltas que estaban hardcodeadas: validaciones de formularios,
// MessagesList, vista de Ticket, auditoría de asignación, QueueModal y Login.
export const misc = {
	es: {
		validation: {
			min2: "Ingrese al menos 2 caracteres.",
			max50: "Ingrese como máximo 50 caracteres.",
			nameRequired: "El nombre es obligatorio.",
			min8digits: "Ingrese al menos 8 dígitos.",
			numberTooLong: "El número es demasiado largo.",
			invalidEmail: "Ingrese un correo electrónico válido.",
			colorInvalid: "Seleccione un color válido.",
			colorRequired: "El color es obligatorio.",
		},
		messagesList: {
			sayHello: "¡Salude a su nuevo contacto!",
			download: "Descargar",
			unsupported: "Mensaje no compatible",
		},
		ticketView: {
			deleted: "Conversación eliminada correctamente.",
			readOnlyNotice:
				"Consulta histórica: esta conversación está disponible en modo solo lectura.",
			readOnly: "Solo lectura",
			observerNotice:
				"Modo observador: puedes ver esta conversación en tiempo real sin participar ni notificar al cliente.",
			observer: "Observador",
		},
		assignmentAudit: {
			lastAssignmentPrefix: "Última asignación:",
			takenBy: "Conversación tomada por {{name}}",
			agent: "agente",
			reassigned: "Reasignado de {{from}} a {{to}}",
			unassigned: "sin asignar",
			assignedTo: "Asignado a {{name}}",
			removed: "Asignación removida",
			notice: "Aviso: {{status}}",
			noticeStatuses: {
				sent: "enviado",
				pending: "pendiente",
				failed: "fallido",
				skipped: "omitido",
				none: "sin estado",
			},
			by: "Por {{name}}",
			user: "usuario",
		},
		queueModalExtra: {
			saved: "Departamento guardado correctamente.",
			active: "Departamento activo",
			inactive: "Departamento inactivo",
		},
		login: {
			protectedChip: "Operación interna protegida",
			heroTitle1: "Atención inteligente.",
			heroTitle2: "Control operativo real.",
			heroSubtitle:
				"Ventas, soporte, desarrollo y ciberseguridad coordinados desde un único centro multiagente para WhatsApp Business.",
			credentialsHint:
				"Ingrese con las credenciales asignadas por administración.",
			emailLabel: "Correo corporativo",
			passwordLabel: "Contraseña",
			submit: "Ingresar al centro de comando",
			footer:
				"El registro público está deshabilitado. Solicite acceso a un administrador de Techkepper.",
		},
	},
	en: {
		validation: {
			min2: "Enter at least 2 characters.",
			max50: "Enter at most 50 characters.",
			nameRequired: "Name is required.",
			min8digits: "Enter at least 8 digits.",
			numberTooLong: "The number is too long.",
			invalidEmail: "Enter a valid email address.",
			colorInvalid: "Select a valid color.",
			colorRequired: "Color is required.",
		},
		messagesList: {
			sayHello: "Say hello to your new contact!",
			download: "Download",
			unsupported: "Unsupported message",
		},
		ticketView: {
			deleted: "Conversation deleted successfully.",
			readOnlyNotice:
				"Historical view: this conversation is available in read-only mode.",
			readOnly: "Read only",
			observerNotice:
				"Observer mode: you can view this conversation in real time without participating or notifying the customer.",
			observer: "Observer",
		},
		assignmentAudit: {
			lastAssignmentPrefix: "Last assignment:",
			takenBy: "Conversation taken by {{name}}",
			agent: "agent",
			reassigned: "Reassigned from {{from}} to {{to}}",
			unassigned: "unassigned",
			assignedTo: "Assigned to {{name}}",
			removed: "Assignment removed",
			notice: "Notice: {{status}}",
			noticeStatuses: {
				sent: "sent",
				pending: "pending",
				failed: "failed",
				skipped: "skipped",
				none: "no status",
			},
			by: "By {{name}}",
			user: "user",
		},
		queueModalExtra: {
			saved: "Department saved successfully.",
			active: "Active department",
			inactive: "Inactive department",
		},
		login: {
			protectedChip: "Protected internal operation",
			heroTitle1: "Intelligent support.",
			heroTitle2: "Real operational control.",
			heroSubtitle:
				"Sales, support, development, and cybersecurity coordinated from a single multi-agent center for WhatsApp Business.",
			credentialsHint:
				"Sign in with the credentials assigned by administration.",
			emailLabel: "Corporate email",
			passwordLabel: "Password",
			submit: "Enter the command center",
			footer:
				"Public registration is disabled. Request access from a Techkepper administrator.",
		},
	},
	pt: {
		validation: {
			min2: "Insira ao menos 2 caracteres.",
			max50: "Insira no máximo 50 caracteres.",
			nameRequired: "O nome é obrigatório.",
			min8digits: "Insira ao menos 8 dígitos.",
			numberTooLong: "O número é muito longo.",
			invalidEmail: "Insira um e-mail válido.",
			colorInvalid: "Selecione uma cor válida.",
			colorRequired: "A cor é obrigatória.",
		},
		messagesList: {
			sayHello: "Diga olá ao seu novo contato!",
			download: "Baixar",
			unsupported: "Mensagem não compatível",
		},
		ticketView: {
			deleted: "Conversa excluída com sucesso.",
			readOnlyNotice:
				"Consulta histórica: esta conversa está disponível em modo somente leitura.",
			readOnly: "Somente leitura",
			observerNotice:
				"Modo observador: você pode ver esta conversa em tempo real sem participar nem notificar o cliente.",
			observer: "Observador",
		},
		assignmentAudit: {
			lastAssignmentPrefix: "Última atribuição:",
			takenBy: "Conversa assumida por {{name}}",
			agent: "agente",
			reassigned: "Reatribuído de {{from}} para {{to}}",
			unassigned: "sem atribuição",
			assignedTo: "Atribuído a {{name}}",
			removed: "Atribuição removida",
			notice: "Aviso: {{status}}",
			noticeStatuses: {
				sent: "enviado",
				pending: "pendente",
				failed: "falhou",
				skipped: "ignorado",
				none: "sem status",
			},
			by: "Por {{name}}",
			user: "usuário",
		},
		queueModalExtra: {
			saved: "Departamento salvo com sucesso.",
			active: "Departamento ativo",
			inactive: "Departamento inativo",
		},
		login: {
			protectedChip: "Operação interna protegida",
			heroTitle1: "Atendimento inteligente.",
			heroTitle2: "Controle operacional real.",
			heroSubtitle:
				"Vendas, suporte, desenvolvimento e cibersegurança coordenados a partir de um único centro multiagente para o WhatsApp Business.",
			credentialsHint:
				"Entre com as credenciais atribuídas pela administração.",
			emailLabel: "E-mail corporativo",
			passwordLabel: "Senha",
			submit: "Entrar no centro de comando",
			footer:
				"O registro público está desabilitado. Solicite acesso a um administrador da Techkepper.",
		},
	},
};
