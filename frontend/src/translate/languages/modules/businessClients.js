export const businessClients = {
	es: {
		businessClients: {
			title: "Clientes",
			search: {
				placeholder: "Buscar cliente",
			},
			filters: {
				statusLabel: "Estado",
				statusOptions: {
					active: "Activos",
					inactive: "Inactivos",
					all: "Todos",
				},
			},
			buttons: {
				newClient: "Nuevo cliente",
				cancel: "Cancelar",
				save: "Guardar",
			},
			tabs: {
				all: "Todos",
				legal: "Jurídicos",
				physical: "Físicos",
			},
			install: {
				title: "Instalación pendiente",
				description:
					"El módulo Clientes está integrado, pero la tabla BusinessClients todavía no existe. Ejecute las migraciones del backend (npm run db:migrate) para crearla automáticamente.",
			},
			table: {
				client: "Cliente",
				type: "Tipo",
				identification: "Identificación",
				department: "Departamento",
				contact: "Contacto",
				status: "Estado",
				actions: "Acciones",
			},
			type: {
				legal: "Jurídico",
				physical: "Físico",
			},
			defaults: {
				global: "Global",
				noEmail: "Sin correo",
				noPhone: "Sin teléfono",
			},
			chip: {
				active: "Activo",
				inactive: "Inactivo",
			},
			actions: {
				view: "Ver detalle",
				edit: "Editar",
				deactivate: "Desactivar",
				reactivate: "Reactivar",
			},
			empty: "No hay clientes para mostrar.",
			confirm: {
				deactivateTitle: "Desactivar cliente",
				reactivateTitle: "Reactivar cliente",
				deactivateMessage:
					"El cliente dejará de aparecer entre los clientes activos, pero conservará su historial.",
				reactivateMessage:
					"El cliente volverá a estar disponible para la gestión comercial.",
			},
			toasts: {
				reactivated: "Cliente reactivado correctamente.",
				deactivated: "Cliente desactivado correctamente.",
				saved: "Cliente guardado correctamente.",
				duplicated: "Ya existe un cliente con esa identificación.",
			},
			modal: {
				title: {
					add: "Nuevo cliente",
					edit: "Editar cliente",
				},
				sections: {
					identification: "Identificación",
					legalRepresentation: "Representación legal",
					contactLocation: "Contacto y ubicación",
					internalManagement: "Gestión interna",
				},
				fields: {
					clientType: "Tipo de cliente",
					displayNameLegal: "Nombre para mostrar",
					displayNamePhysical: "Nombre completo",
					legalName: "Razón social",
					tradeName: "Nombre comercial",
					identificationType: "Tipo de identificación",
					identificationNumber: "Número de identificación",
					legalRepresentativeName: "Representante legal",
					legalRepresentativeId: "Identificación del representante",
					legalRepresentativePosition: "Cargo del representante",
					email: "Correo electrónico",
					phone: "Teléfono",
					address: "Dirección",
					country: "País",
					province: "Provincia",
					canton: "Cantón",
					district: "Distrito",
					department: "Departamento",
					globalClient: "Cliente global",
					notes: "Notas internas",
				},
				options: {
					physical: "Persona física",
					legal: "Persona jurídica",
				},
				validation: {
					required: "Requerido",
					minName: "Ingrese al menos 2 caracteres.",
					maxName: "Máximo 255 caracteres.",
					nameRequired: "El nombre es obligatorio.",
					legalNameRequired: "La razón social es obligatoria.",
					identificationTypeRequired: "Seleccione el tipo de identificación.",
					identificationRequired: "La identificación es obligatoria.",
					invalidEmail: "Ingrese un correo válido.",
					departmentRequired: "Seleccione un departamento.",
				},
			},
		},
	},
	en: {
		businessClients: {
			title: "Clients",
			search: {
				placeholder: "Search client",
			},
			filters: {
				statusLabel: "Status",
				statusOptions: {
					active: "Active",
					inactive: "Inactive",
					all: "All",
				},
			},
			buttons: {
				newClient: "New client",
				cancel: "Cancel",
				save: "Save",
			},
			tabs: {
				all: "All",
				legal: "Legal entities",
				physical: "Individuals",
			},
			install: {
				title: "Installation pending",
				description:
					"The Clients module is integrated, but the BusinessClients table does not exist yet. Run the backend migrations (npm run db:migrate) to create it automatically.",
			},
			table: {
				client: "Client",
				type: "Type",
				identification: "Identification",
				department: "Department",
				contact: "Contact",
				status: "Status",
				actions: "Actions",
			},
			type: {
				legal: "Legal entity",
				physical: "Individual",
			},
			defaults: {
				global: "Global",
				noEmail: "No email",
				noPhone: "No phone",
			},
			chip: {
				active: "Active",
				inactive: "Inactive",
			},
			actions: {
				view: "View detail",
				edit: "Edit",
				deactivate: "Deactivate",
				reactivate: "Reactivate",
			},
			empty: "There are no clients to display.",
			confirm: {
				deactivateTitle: "Deactivate client",
				reactivateTitle: "Reactivate client",
				deactivateMessage:
					"The client will no longer appear among active clients, but its history will be preserved.",
				reactivateMessage:
					"The client will be available again for commercial management.",
			},
			toasts: {
				reactivated: "Client reactivated successfully.",
				deactivated: "Client deactivated successfully.",
				saved: "Client saved successfully.",
				duplicated: "A client with that identification already exists.",
			},
			modal: {
				title: {
					add: "New client",
					edit: "Edit client",
				},
				sections: {
					identification: "Identification",
					legalRepresentation: "Legal representation",
					contactLocation: "Contact and location",
					internalManagement: "Internal management",
				},
				fields: {
					clientType: "Client type",
					displayNameLegal: "Display name",
					displayNamePhysical: "Full name",
					legalName: "Legal name",
					tradeName: "Trade name",
					identificationType: "Identification type",
					identificationNumber: "Identification number",
					legalRepresentativeName: "Legal representative",
					legalRepresentativeId: "Representative's identification",
					legalRepresentativePosition: "Representative's position",
					email: "Email",
					phone: "Phone",
					address: "Address",
					country: "Country",
					province: "Province",
					canton: "Canton",
					district: "District",
					department: "Department",
					globalClient: "Global client",
					notes: "Internal notes",
				},
				options: {
					physical: "Individual",
					legal: "Legal entity",
				},
				validation: {
					required: "Required",
					minName: "Enter at least 2 characters.",
					maxName: "Maximum 255 characters.",
					nameRequired: "The name is required.",
					legalNameRequired: "The legal name is required.",
					identificationTypeRequired: "Select the identification type.",
					identificationRequired: "The identification is required.",
					invalidEmail: "Enter a valid email.",
					departmentRequired: "Select a department.",
				},
			},
		},
	},
	pt: {
		businessClients: {
			title: "Clientes",
			search: {
				placeholder: "Buscar cliente",
			},
			filters: {
				statusLabel: "Status",
				statusOptions: {
					active: "Ativos",
					inactive: "Inativos",
					all: "Todos",
				},
			},
			buttons: {
				newClient: "Novo cliente",
				cancel: "Cancelar",
				save: "Salvar",
			},
			tabs: {
				all: "Todos",
				legal: "Jurídicos",
				physical: "Físicos",
			},
			install: {
				title: "Instalação pendente",
				description:
					"O módulo Clientes está integrado, mas a tabela BusinessClients ainda não existe. Execute as migrações do backend (npm run db:migrate) para criá-la automaticamente.",
			},
			table: {
				client: "Cliente",
				type: "Tipo",
				identification: "Identificação",
				department: "Departamento",
				contact: "Contato",
				status: "Status",
				actions: "Ações",
			},
			type: {
				legal: "Jurídica",
				physical: "Física",
			},
			defaults: {
				global: "Global",
				noEmail: "Sem e-mail",
				noPhone: "Sem telefone",
			},
			chip: {
				active: "Ativo",
				inactive: "Inativo",
			},
			actions: {
				view: "Ver detalhe",
				edit: "Editar",
				deactivate: "Desativar",
				reactivate: "Reativar",
			},
			empty: "Não há clientes para exibir.",
			confirm: {
				deactivateTitle: "Desativar cliente",
				reactivateTitle: "Reativar cliente",
				deactivateMessage:
					"O cliente deixará de aparecer entre os clientes ativos, mas manterá seu histórico.",
				reactivateMessage:
					"O cliente voltará a estar disponível para a gestão comercial.",
			},
			toasts: {
				reactivated: "Cliente reativado com sucesso.",
				deactivated: "Cliente desativado com sucesso.",
				saved: "Cliente salvo com sucesso.",
				duplicated: "Já existe um cliente com essa identificação.",
			},
			modal: {
				title: {
					add: "Novo cliente",
					edit: "Editar cliente",
				},
				sections: {
					identification: "Identificação",
					legalRepresentation: "Representação legal",
					contactLocation: "Contato e localização",
					internalManagement: "Gestão interna",
				},
				fields: {
					clientType: "Tipo de cliente",
					displayNameLegal: "Nome de exibição",
					displayNamePhysical: "Nome completo",
					legalName: "Razão social",
					tradeName: "Nome fantasia",
					identificationType: "Tipo de identificação",
					identificationNumber: "Número de identificação",
					legalRepresentativeName: "Representante legal",
					legalRepresentativeId: "Identificação do representante",
					legalRepresentativePosition: "Cargo do representante",
					email: "E-mail",
					phone: "Telefone",
					address: "Endereço",
					country: "País",
					province: "Província",
					canton: "Cantão",
					district: "Distrito",
					department: "Departamento",
					globalClient: "Cliente global",
					notes: "Notas internas",
				},
				options: {
					physical: "Pessoa física",
					legal: "Pessoa jurídica",
				},
				validation: {
					required: "Obrigatório",
					minName: "Insira pelo menos 2 caracteres.",
					maxName: "Máximo de 255 caracteres.",
					nameRequired: "O nome é obrigatório.",
					legalNameRequired: "A razão social é obrigatória.",
					identificationTypeRequired: "Selecione o tipo de identificação.",
					identificationRequired: "A identificação é obrigatória.",
					invalidEmail: "Insira um e-mail válido.",
					departmentRequired: "Selecione um departamento.",
				},
			},
		},
	},
};
