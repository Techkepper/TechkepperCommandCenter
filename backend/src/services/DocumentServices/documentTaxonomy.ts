export const documentPurposes = [
  "contracts",
  "quotations",
  "nda",
  "letters",
  "delivery",
  "other"
] as const;

export type DocumentPurpose = (typeof documentPurposes)[number];

export const contractRequiredVariables = [
  "CLIENTE_RAZON_SOCIAL",
  "CLIENTE_CEDULA",
  "CLIENTE_REPRESENTANTE",
  "CLIENTE_CARGO_REPRESENTANTE",
  "CLIENTE_CEDULA_REPRESENTANTE",
  "CLIENTE_CORREO",
  "CLIENTE_DOMICILIO",
  "ECOSISTEMA",
  "NOMBRE_PROYECTO",
  "MONTO",
  "MONEDA",
  "PERIODICIDAD",
  "PLAZO_MINIMO",
  "FECHA_INICIO",
  "ENTREGABLES",
  "TIEMPOS_RESPUESTA",
  "HERRAMIENTAS_INCLUIDAS",
  "HERRAMIENTAS_EXCLUIDAS",
  "CONDICIONES_ESPECIALES",
  "LUGAR_FIRMA",
  "FECHA_FIRMA"
] as const;

export const contractOptionalVariables = ["CLIENTE_TELEFONO"] as const;

export const ndaMutualRequiredVariables = [
  "CLIENTE_RAZON_SOCIAL",
  "CLIENTE_CEDULA",
  "CLIENTE_REPRESENTANTE",
  "CLIENTE_CEDULA_REPRESENTANTE",
  "CLIENTE_CARGO_REPRESENTANTE",
  "CLIENTE_DOMICILIO",
  "CLIENTE_CORREO",
  "FECHA_FIRMA"
] as const;

export const ndaUnilateralRequiredVariables = [
  "FECHA_FIRMA",
  "CLIENTE_RAZON_SOCIAL",
  "CLIENTE_CEDULA",
  "CLIENTE_REPRESENTANTE",
  "CLIENTE_CEDULA_REPRESENTANTE",
  "CLIENTE_CARGO_REPRESENTANTE",
  "CLIENTE_DOMICILIO",
  "PROPOSITO",
  "CLIENTE_CORREO"
] as const;

export const freelanceSalesRequiredVariables = [
  "FREELANCE_NOMBRE",
  "FREELANCE_CEDULA",
  "FREELANCE_DENOMINACION",
  "LUGAR_FIRMA",
  "FECHA_FIRMA"
] as const;

const contractTypes = {
  web_contract: {
    aliases: ["contract_web", "techkepper_web", "web"],
    ecosystem: "Web"
  },
  secure_contract: {
    aliases: ["contract_secure", "techkepper_secure", "secure"],
    ecosystem: "Secure"
  },
  growth_contract: {
    aliases: ["contract_growth", "techkepper_growth", "growth"],
    ecosystem: "Growth"
  },
  automate_contract: {
    aliases: ["contract_automate", "techkepper_automate", "automate"],
    ecosystem: "Automate"
  }
} as const;

export type EcosystemContractType = keyof typeof contractTypes;
export type DocumentRecipientKind = "client" | "collaborator" | "flexible";

export const documentTypesByPurpose: Record<
  DocumentPurpose,
  readonly string[]
> = {
  contracts: [
    "web_contract",
    "secure_contract",
    "growth_contract",
    "automate_contract",
    "service_contract",
    "freelance_sales_contract"
  ],
  quotations: ["quotation", "commercial_proposal"],
  nda: ["nda_mutual", "nda_unilateral"],
  letters: ["generic_letter"],
  delivery: ["delivery_record"],
  other: ["other"]
};

const documentTypeAliases: Record<string, string> = {
  contract_web: "web_contract",
  techkepper_web: "web_contract",
  web: "web_contract",
  contract_secure: "secure_contract",
  techkepper_secure: "secure_contract",
  secure: "secure_contract",
  contract_growth: "growth_contract",
  techkepper_growth: "growth_contract",
  growth: "growth_contract",
  contract_automate: "automate_contract",
  techkepper_automate: "automate_contract",
  automate: "automate_contract",
  unilateral_nda: "nda_unilateral",
  nda_one_way: "nda_unilateral",
  confidentiality_unilateral: "nda_unilateral",
  acuerdo_confidencialidad_unilateral: "nda_unilateral",
  freelance_contract: "freelance_sales_contract",
  sales_freelance_contract: "freelance_sales_contract",
  contrato_freelance: "freelance_sales_contract",
  contrato_freelance_ventas: "freelance_sales_contract",
  proposal: "commercial_proposal",
  cotizacion: "commercial_proposal",
  propuesta_comercial: "commercial_proposal",
  commercial_quote: "commercial_proposal"
};

export const normalizeDocumentType = (
  value: unknown,
  purpose: DocumentPurpose
): string => {
  if (typeof value !== "string") return "other";
  const normalized = value.trim().toLowerCase();
  const canonical = documentTypeAliases[normalized] || normalized;
  return documentTypesByPurpose[purpose].includes(canonical)
    ? canonical
    : "other";
};

export const isDocumentPurpose = (value: unknown): value is DocumentPurpose =>
  typeof value === "string" &&
  documentPurposes.includes(value as DocumentPurpose);

export const isEcosystemContractType = (
  value: unknown
): value is EcosystemContractType =>
  typeof value === "string" &&
  Object.prototype.hasOwnProperty.call(contractTypes, value);

export const getRequiredVariablesByDocumentType = (
  documentType?: string | null
): string[] => {
  if (isEcosystemContractType(documentType)) {
    return [...contractRequiredVariables];
  }
  if (documentType === "nda_mutual") {
    return [...ndaMutualRequiredVariables];
  }
  if (documentType === "nda_unilateral") {
    return [...ndaUnilateralRequiredVariables];
  }
  if (documentType === "freelance_sales_contract") {
    return [...freelanceSalesRequiredVariables];
  }
  return [];
};

export const getExpectedVariablesByDocumentType = (
  documentType?: string | null
): string[] => {
  const required = getRequiredVariablesByDocumentType(documentType);
  return isEcosystemContractType(documentType)
    ? [...required, ...contractOptionalVariables]
    : required;
};

export const getContractEcosystemName = (
  documentType?: string | null
): string | null =>
  isEcosystemContractType(documentType)
    ? contractTypes[documentType].ecosystem
    : null;

export const getDocumentRecipientKind = (
  documentType?: string | null
): DocumentRecipientKind => {
  if (
    isEcosystemContractType(documentType) ||
    documentType === "nda_mutual" ||
    documentType === "nda_unilateral"
  ) {
    return "client";
  }
  if (documentType === "freelance_sales_contract") {
    return "collaborator";
  }
  return "flexible";
};
