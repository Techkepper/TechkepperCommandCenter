// Claves adicionales para páginas "core" (Dashboard, Settings, Connections,
// Users, QuickAnswers) que tenían texto en español hardcodeado. Se fusionan
// (deep-merge) sobre los namespaces existentes en es/en/pt.
export const core = {
	es: {
		dashboard: {
			operational: {
				title: "Centro operativo",
				subtitle: "Estado en tiempo real de la atención Techkepper.",
				loadingConnection: "Cargando conexión",
				noConnectionConfigured: "Sin conexión configurada",
				metrics: {
					inService: "En atención",
					pending: "Pendientes",
					resolved: "Resueltas",
					activeAgents: "Agentes activos",
					whatsappStatus: "Estado de WhatsApp",
					activeQueues: "Departamentos activos",
				},
				queueLoad: "Carga por departamento",
				queueLoadHint:
					"Conversaciones visibles según su rol y departamentos asignados.",
				noQueues: "No hay departamentos activos para mostrar.",
				teamPerformance: "Rendimiento del equipo",
				teamPerformanceHint:
					"Ranking interno por cierres; el tiempo de respuesta se muestra cuando existen marcas suficientes.",
				table: {
					agent: "Agente",
					open: "Abiertas",
					pending: "Pendientes",
					closed: "Cerradas",
					avgResponse: "Resp. promedio",
				},
				noAgents: "No hay actividad de agentes para mostrar.",
				noData: "Sin datos",
				minutes: "{{value}} min",
				statuses: {
					connected: "Conectada",
					connecting: "Conectando",
					configRequired: "Configuración oficial requerida",
					error: "Error de conexión",
					timeout: "Sin respuesta",
					disconnected: "Desconectada",
					unknown: "Estado desconocido",
					loading: "Cargando",
					notConfigured: "Sin configurar",
				},
			},
		},
		settings: {
			operational: {
				title: "Configuración operativa",
				subtitle:
					"Identidad, asignaciones automáticas y acceso a reportes.",
				save: "Guardar cambios",
				saved: "Configuración actualizada.",
				company: "Empresa",
				companyName: "Nombre de empresa",
				companyEmail: "Correo operativo",
				companyPhone: "Canal operativo",
				businessHours: "Horario de atención",
				assignmentTitle: "Mensaje automático de asignación",
				status: "Estado",
				enabled: "Activado",
				disabled: "Desactivado",
				template: "Plantilla",
				templateHelp:
					"Variables: {NOMBRE_AGENTE}, {NOMBRE_CLIENTE}, {DEPARTAMENTO}, {EMPRESA}, {HORARIO_ATENCION}",
				note:
					"La asignación nunca se revierte si falla el envío. El resultado queda registrado en la auditoría interna de la conversación.",
				experience: "Experiencia y permisos",
				defaultTheme: "Tema predeterminado",
				dark: "Oscuro",
				light: "Claro",
				allowAgentHistory: "Agentes pueden ver su historial",
				yes: "Sí",
				no: "No",
			},
		},
		connections: {
			buttons: { verify: "Verificar API oficial" },
			toasts: {
				verifyRequested: "Verificación solicitada a WhatsApp Cloud API.",
			},
			toolTips: {
				configRequired: {
					title: "Falta configurar Meta",
					content:
						"Defina el token, Phone Number ID, versión de Graph API y secretos del webhook en el servidor.",
				},
			},
			table: { verification: "Verificación" },
			statuses: {
				connected: "Conectada",
				verifying: "Verificando con Meta...",
				configRequired: "Configuración requerida",
				timeout: "Sin respuesta",
				disconnected: "Desconectada",
				error: "Error",
				unknown: "Estado desconocido",
			},
			info: {
				officialTitle: "Integración oficial:",
				officialText:
					"esta instalación usa WhatsApp Cloud API de Meta, sin QR ni sesiones de WhatsApp Web.",
				pricing:
					"Las respuestas de servicio dentro de la ventana de 24 horas no tienen cargo; otras categorías pueden tener costo según Meta.",
				webhook:
					"Webhook: /webhooks/whatsapp. Los tokens permanecen únicamente en variables de entorno del servidor.",
			},
			noConnections: "No hay conexiones de WhatsApp configuradas.",
		},
		users: {
			table: { status: "Estado" },
			statuses: { active: "Activo", inactive: "Inactivo" },
		},
		quickAnswers: {
			table: { queue: "Departamento", status: "Estado" },
			defaultQueue: "General",
			statuses: { active: "Activa", inactive: "Inactiva" },
		},
	},
	en: {
		dashboard: {
			operational: {
				title: "Operations center",
				subtitle: "Real-time status of Techkepper support.",
				loadingConnection: "Loading connection",
				noConnectionConfigured: "No connection configured",
				metrics: {
					inService: "In service",
					pending: "Pending",
					resolved: "Resolved",
					activeAgents: "Active agents",
					whatsappStatus: "WhatsApp status",
					activeQueues: "Active departments",
				},
				queueLoad: "Load by department",
				queueLoadHint:
					"Conversations visible according to your role and assigned departments.",
				noQueues: "No active departments to show.",
				teamPerformance: "Team performance",
				teamPerformanceHint:
					"Internal ranking by closures; response time is shown when there are enough timestamps.",
				table: {
					agent: "Agent",
					open: "Open",
					pending: "Pending",
					closed: "Closed",
					avgResponse: "Avg. response",
				},
				noAgents: "No agent activity to show.",
				noData: "No data",
				minutes: "{{value}} min",
				statuses: {
					connected: "Connected",
					connecting: "Connecting",
					configRequired: "Official configuration required",
					error: "Connection error",
					timeout: "No response",
					disconnected: "Disconnected",
					unknown: "Unknown status",
					loading: "Loading",
					notConfigured: "Not configured",
				},
			},
		},
		settings: {
			operational: {
				title: "Operational settings",
				subtitle: "Identity, automatic assignments, and report access.",
				save: "Save changes",
				saved: "Settings updated.",
				company: "Company",
				companyName: "Company name",
				companyEmail: "Operational email",
				companyPhone: "Operational channel",
				businessHours: "Business hours",
				assignmentTitle: "Automatic assignment message",
				status: "Status",
				enabled: "Enabled",
				disabled: "Disabled",
				template: "Template",
				templateHelp:
					"Variables: {NOMBRE_AGENTE}, {NOMBRE_CLIENTE}, {DEPARTAMENTO}, {EMPRESA}, {HORARIO_ATENCION}",
				note:
					"The assignment is never reverted if sending fails. The result is recorded in the conversation's internal audit log.",
				experience: "Experience and permissions",
				defaultTheme: "Default theme",
				dark: "Dark",
				light: "Light",
				allowAgentHistory: "Agents can view their history",
				yes: "Yes",
				no: "No",
			},
		},
		connections: {
			buttons: { verify: "Verify official API" },
			toasts: {
				verifyRequested: "Verification requested from WhatsApp Cloud API.",
			},
			toolTips: {
				configRequired: {
					title: "Meta setup missing",
					content:
						"Set the token, Phone Number ID, Graph API version, and webhook secrets on the server.",
				},
			},
			table: { verification: "Verification" },
			statuses: {
				connected: "Connected",
				verifying: "Verifying with Meta...",
				configRequired: "Configuration required",
				timeout: "No response",
				disconnected: "Disconnected",
				error: "Error",
				unknown: "Unknown status",
			},
			info: {
				officialTitle: "Official integration:",
				officialText:
					"this installation uses Meta's WhatsApp Cloud API, with no QR codes or WhatsApp Web sessions.",
				pricing:
					"Service replies within the 24-hour window are free; other categories may have a cost according to Meta.",
				webhook:
					"Webhook: /webhooks/whatsapp. Tokens remain only in the server's environment variables.",
			},
			noConnections: "No WhatsApp connections configured.",
		},
		users: {
			table: { status: "Status" },
			statuses: { active: "Active", inactive: "Inactive" },
		},
		quickAnswers: {
			table: { queue: "Department", status: "Status" },
			defaultQueue: "General",
			statuses: { active: "Active", inactive: "Inactive" },
		},
	},
	pt: {
		dashboard: {
			operational: {
				title: "Central operacional",
				subtitle: "Status em tempo real do atendimento Techkepper.",
				loadingConnection: "Carregando conexão",
				noConnectionConfigured: "Nenhuma conexão configurada",
				metrics: {
					inService: "Em atendimento",
					pending: "Pendentes",
					resolved: "Resolvidas",
					activeAgents: "Agentes ativos",
					whatsappStatus: "Status do WhatsApp",
					activeQueues: "Departamentos ativos",
				},
				queueLoad: "Carga por departamento",
				queueLoadHint:
					"Conversas visíveis conforme seu perfil e departamentos atribuídos.",
				noQueues: "Não há departamentos ativos para mostrar.",
				teamPerformance: "Desempenho da equipe",
				teamPerformanceHint:
					"Ranking interno por encerramentos; o tempo de resposta aparece quando há marcações suficientes.",
				table: {
					agent: "Agente",
					open: "Abertas",
					pending: "Pendentes",
					closed: "Fechadas",
					avgResponse: "Resp. média",
				},
				noAgents: "Não há atividade de agentes para mostrar.",
				noData: "Sem dados",
				minutes: "{{value}} min",
				statuses: {
					connected: "Conectada",
					connecting: "Conectando",
					configRequired: "Configuração oficial necessária",
					error: "Erro de conexão",
					timeout: "Sem resposta",
					disconnected: "Desconectada",
					unknown: "Status desconhecido",
					loading: "Carregando",
					notConfigured: "Não configurada",
				},
			},
		},
		settings: {
			operational: {
				title: "Configurações operacionais",
				subtitle:
					"Identidade, atribuições automáticas e acesso a relatórios.",
				save: "Salvar alterações",
				saved: "Configurações atualizadas.",
				company: "Empresa",
				companyName: "Nome da empresa",
				companyEmail: "E-mail operacional",
				companyPhone: "Canal operacional",
				businessHours: "Horário de atendimento",
				assignmentTitle: "Mensagem automática de atribuição",
				status: "Status",
				enabled: "Ativado",
				disabled: "Desativado",
				template: "Modelo",
				templateHelp:
					"Variáveis: {NOMBRE_AGENTE}, {NOMBRE_CLIENTE}, {DEPARTAMENTO}, {EMPRESA}, {HORARIO_ATENCION}",
				note:
					"A atribuição nunca é revertida se o envio falhar. O resultado fica registrado na auditoria interna da conversa.",
				experience: "Experiência e permissões",
				defaultTheme: "Tema padrão",
				dark: "Escuro",
				light: "Claro",
				allowAgentHistory: "Agentes podem ver seu histórico",
				yes: "Sim",
				no: "Não",
			},
		},
		connections: {
			buttons: { verify: "Verificar API oficial" },
			toasts: {
				verifyRequested: "Verificação solicitada à WhatsApp Cloud API.",
			},
			toolTips: {
				configRequired: {
					title: "Falta configurar a Meta",
					content:
						"Defina o token, o Phone Number ID, a versão da Graph API e os segredos do webhook no servidor.",
				},
			},
			table: { verification: "Verificação" },
			statuses: {
				connected: "Conectada",
				verifying: "Verificando com a Meta...",
				configRequired: "Configuração necessária",
				timeout: "Sem resposta",
				disconnected: "Desconectada",
				error: "Erro",
				unknown: "Status desconhecido",
			},
			info: {
				officialTitle: "Integração oficial:",
				officialText:
					"esta instalação usa a WhatsApp Cloud API da Meta, sem QR nem sessões do WhatsApp Web.",
				pricing:
					"As respostas de atendimento dentro da janela de 24 horas não têm custo; outras categorias podem ter custo conforme a Meta.",
				webhook:
					"Webhook: /webhooks/whatsapp. Os tokens permanecem apenas nas variáveis de ambiente do servidor.",
			},
			noConnections: "Não há conexões de WhatsApp configuradas.",
		},
		users: {
			table: { status: "Status" },
			statuses: { active: "Ativo", inactive: "Inativo" },
		},
		quickAnswers: {
			table: { queue: "Departamento", status: "Status" },
			defaultQueue: "Geral",
			statuses: { active: "Ativa", inactive: "Inativa" },
		},
	},
};
