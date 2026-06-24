import React, { useContext, useEffect, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  makeStyles,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@material-ui/core";
import CloudUploadOutlinedIcon from "@material-ui/icons/CloudUploadOutlined";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import GetAppOutlinedIcon from "@material-ui/icons/GetAppOutlined";
import PlayArrowOutlinedIcon from "@material-ui/icons/PlayArrowOutlined";
import SearchIcon from "@material-ui/icons/Search";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ConfirmationModal from "../../components/ConfirmationModal";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "auto",
    ...theme.scrollbarStyles,
  },
  tabsPaper: {
    marginBottom: theme.spacing(2),
  },
  uploadPanel: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: theme.spacing(1.5),
    alignItems: "center",
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    borderColor: "rgba(95, 175, 58, 0.3)",
    "& > *": {
      minWidth: 0,
    },
    [theme.breakpoints.down("md")]: {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
    [theme.breakpoints.down("sm")]: {
      gridTemplateColumns: "1fr",
    },
  },
  uploadActions: {
    gridColumn: "1 / -1",
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    "& .MuiButton-root": {
      whiteSpace: "nowrap",
    },
  },
  templatePanel: {
    gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
    [theme.breakpoints.down("sm")]: {
      gridTemplateColumns: "1fr",
    },
  },
  templateActions: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  hiddenInput: {
    display: "none",
  },
  emptyState: {
    padding: theme.spacing(4),
    textAlign: "center",
  },
  installWarning: {
    padding: theme.spacing(3),
    borderColor: "rgba(255, 193, 7, 0.35)",
    background: "rgba(255, 193, 7, 0.08)",
  },
  fileName: {
    maxWidth: 320,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  variableList: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(0.5),
  },
  generationSection: {
    marginTop: theme.spacing(2),
    paddingTop: theme.spacing(1),
    borderTop: "1px solid rgba(95, 175, 58, 0.22)",
  },
  generationSectionTitle: {
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(0.5),
  },
  generationSummary: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      gridTemplateColumns: "1fr",
    },
  },
  generationSummaryCard: {
    padding: theme.spacing(1.5),
    border: "1px solid rgba(95, 175, 58, 0.24)",
    borderRadius: 8,
    background: "rgba(95, 175, 58, 0.04)",
  },
  generationResultActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
  },
}));

const formatSize = (size) => {
  if (!size) return "0 KB";
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getErrorCode = (err) =>
  err.response?.data?.error || err.response?.data?.message;

const getActiveVersion = (template) => template.versions?.[0] || null;

const knownVisualDocumentTypes = [
  "web_contract",
  "secure_contract",
  "growth_contract",
  "automate_contract",
  "nda_mutual",
  "nda_unilateral",
  "freelance_sales_contract",
];

const getRequiredRecipientMode = (documentType) => {
  if (
    [
      "web_contract",
      "secure_contract",
      "growth_contract",
      "automate_contract",
      "nda_mutual",
      "nda_unilateral",
    ].includes(documentType)
  ) {
    return "client";
  }
  if (documentType === "freelance_sales_contract") return "collaborator";
  return null;
};

const documentPurposes = [
  { value: "", label: "Todos" },
  { value: "contracts", label: "Contratos" },
  { value: "quotations", label: "Cotizaciones" },
  { value: "nda", label: "NDA" },
  { value: "letters", label: "Cartas" },
  { value: "delivery", label: "Actas" },
  { value: "other", label: "Otros" },
];

const documentTypes = [
  { value: "web_contract", label: "Contrato Techkepper Web", purpose: "contracts" },
  { value: "secure_contract", label: "Contrato Techkepper Secure", purpose: "contracts" },
  { value: "growth_contract", label: "Contrato Techkepper Growth", purpose: "contracts" },
  { value: "automate_contract", label: "Contrato Techkepper Automate", purpose: "contracts" },
  { value: "service_contract", label: "Contrato de servicio", purpose: "contracts" },
  {
    value: "freelance_sales_contract",
    label: "Contrato freelance de ventas",
    purpose: "contracts",
  },
  { value: "nda_mutual", label: "NDA mutuo", purpose: "nda" },
  { value: "nda_unilateral", label: "NDA unilateral", purpose: "nda" },
  { value: "quotation", label: "Cotización", purpose: "quotations" },
  { value: "commercial_proposal", label: "Propuesta comercial", purpose: "quotations" },
  { value: "generic_letter", label: "Carta para quien corresponda", purpose: "letters" },
  { value: "delivery_record", label: "Acta de entrega", purpose: "delivery" },
  { value: "other", label: "Otro", purpose: "other" },
];

const contractRequiredVariables = [
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
  "FECHA_FIRMA",
];
const contractOptionalVariables = ["CLIENTE_TELEFONO"];

const ecosystemContractConfigs = {
  web_contract: {
    ecosystem: "Web",
    projectPrefix: "Techkepper Web",
    scopeLabel: "Alcance de desarrollo web",
    deliverablesLabel: "Entregables web",
    labels: {
      HERRAMIENTAS_INCLUIDAS: "Herramientas/licencias incluidas",
      HERRAMIENTAS_EXCLUIDAS: "Herramientas/licencias excluidas",
    },
  },
  secure_contract: {
    ecosystem: "Secure",
    projectPrefix: "Techkepper Secure",
    scopeLabel: "Alcance de seguridad",
    deliverablesLabel: "Activos evaluados / entregables",
    labels: {
      HERRAMIENTAS_INCLUIDAS: "Herramientas de seguridad incluidas",
      HERRAMIENTAS_EXCLUIDAS: "Herramientas de seguridad excluidas",
    },
  },
  growth_contract: {
    ecosystem: "Growth",
    projectPrefix: "Techkepper Growth",
    scopeLabel: "Alcance de Growth",
    deliverablesLabel: "Entregables Growth",
    labels: {
      HERRAMIENTAS_INCLUIDAS: "Herramientas/licencias incluidas",
      HERRAMIENTAS_EXCLUIDAS: "Herramientas/licencias excluidas",
    },
  },
  automate_contract: {
    ecosystem: "Automate",
    projectPrefix: "Techkepper Automate",
    scopeLabel: "Alcance de automatización",
    deliverablesLabel: "Flujos / automatizaciones",
    labels: {
      HERRAMIENTAS_INCLUIDAS: "Integraciones y herramientas incluidas",
      HERRAMIENTAS_EXCLUIDAS: "Integraciones y herramientas excluidas",
    },
  },
};

const ndaMutualVariables = [
  "CLIENTE_RAZON_SOCIAL",
  "CLIENTE_CEDULA",
  "CLIENTE_REPRESENTANTE",
  "CLIENTE_CEDULA_REPRESENTANTE",
  "CLIENTE_CARGO_REPRESENTANTE",
  "CLIENTE_DOMICILIO",
  "CLIENTE_CORREO",
  "FECHA_FIRMA",
];

const ndaUnilateralVariables = [
  "FECHA_FIRMA",
  "CLIENTE_RAZON_SOCIAL",
  "CLIENTE_CEDULA",
  "CLIENTE_REPRESENTANTE",
  "CLIENTE_CEDULA_REPRESENTANTE",
  "CLIENTE_CARGO_REPRESENTANTE",
  "CLIENTE_DOMICILIO",
  "PROPOSITO",
  "CLIENTE_CORREO",
];

const freelanceSalesVariables = [
  "FREELANCE_NOMBRE",
  "FREELANCE_CEDULA",
  "FREELANCE_DENOMINACION",
  "LUGAR_FIRMA",
  "FECHA_FIRMA",
];

const variableLabels = {
  CLIENTE_RAZON_SOCIAL: "Razón social o nombre completo",
  CLIENTE_CEDULA: "Cédula jurídica o física",
  CLIENTE_REPRESENTANTE: "Representante legal",
  CLIENTE_CEDULA_REPRESENTANTE: "Cédula del representante",
  CLIENTE_CARGO_REPRESENTANTE: "Cargo del representante",
  CLIENTE_DOMICILIO: "Domicilio",
  CLIENTE_CORREO: "Correo electrónico",
  CLIENTE_TELEFONO: "Teléfono",
  ECOSISTEMA: "Ecosistema",
  NOMBRE_PROYECTO: "Nombre del proyecto",
  MONTO: "Monto",
  MONEDA: "Moneda",
  PERIODICIDAD: "Periodicidad",
  PLAZO_MINIMO: "Plazo mínimo",
  FECHA_INICIO: "Fecha de inicio",
  ENTREGABLES: "Entregables",
  TIEMPOS_RESPUESTA: "Tiempos de respuesta",
  HERRAMIENTAS_INCLUIDAS: "Herramientas/licencias incluidas",
  HERRAMIENTAS_EXCLUIDAS: "Herramientas/licencias excluidas",
  CONDICIONES_ESPECIALES: "Condiciones especiales",
  LUGAR_FIRMA: "Lugar de firma",
  FECHA_FIRMA: "Fecha de firma",
  PROPOSITO: "Propósito",
  FREELANCE_NOMBRE: "Nombre completo del freelance",
  FREELANCE_CEDULA: "Cédula del freelance",
  FREELANCE_DENOMINACION: "Denominación contractual",
};

const ndaUnilateralVariableLabels = {
  CLIENTE_RAZON_SOCIAL: "Receptor / cliente",
  CLIENTE_CEDULA: "Cédula física o jurídica",
  CLIENTE_REPRESENTANTE: "Representante legal",
  CLIENTE_CEDULA_REPRESENTANTE: "Cédula del representante",
  CLIENTE_CARGO_REPRESENTANTE: "Cargo del representante",
  CLIENTE_DOMICILIO: "Domicilio contractual",
  CLIENTE_CORREO: "Correo oficial",
  PROPOSITO: "Propósito",
  FECHA_FIRMA: "Fecha de firma",
};

const collaboratorVariableLabels = {
  CLIENTE_RAZON_SOCIAL: "Nombre completo del colaborador",
  CLIENTE_CEDULA: "Cédula del colaborador",
  CLIENTE_DOMICILIO: "Domicilio del colaborador",
  CLIENTE_CORREO: "Correo electrónico del colaborador",
};

const purposeLabel = (value) =>
  documentPurposes.find((item) => item.value === value)?.label || "Otros";

const variableLabel = (variable, documentType, recipientMode) => {
  if (
    recipientMode === "collaborator" &&
    collaboratorVariableLabels[variable]
  ) {
    return collaboratorVariableLabels[variable];
  }
  if (
    documentType === "nda_unilateral" &&
    ndaUnilateralVariableLabels[variable]
  ) {
    return ndaUnilateralVariableLabels[variable];
  }

  const contractConfig = ecosystemContractConfigs[documentType];
  if (variable === "ENTREGABLES" && contractConfig) {
    return contractConfig.deliverablesLabel;
  }
  if (contractConfig?.labels?.[variable]) {
    return contractConfig.labels[variable];
  }
  return (
    variableLabels[variable] ||
  variable
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
};

const currentSignatureDate = () =>
  new Intl.DateTimeFormat("es-CR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

const mapClientVariables = (client) => ({
  CLIENTE_NOMBRE: client.displayName || "",
  CLIENTE_RAZON_SOCIAL: client.legalName || client.displayName || "",
  CLIENTE_NOMBRE_COMERCIAL: client.tradeName || "",
  CLIENTE_CEDULA: client.identificationNumber || "",
  CLIENTE_TIPO_IDENTIFICACION: client.identificationType || "",
  CLIENTE_REPRESENTANTE:
    client.type === "physical"
      ? client.displayName || ""
      : client.legalRepresentativeName || "",
  CLIENTE_CEDULA_REPRESENTANTE:
    client.type === "physical"
      ? client.identificationNumber || ""
      : client.legalRepresentativeId || "",
  CLIENTE_CARGO_REPRESENTANTE:
    client.type === "physical"
      ? "En nombre propio"
      : client.legalRepresentativePosition || "Representante legal",
  CLIENTE_CORREO: client.email || "",
  CLIENTE_TELEFONO: client.phone || "",
  CLIENTE_DIRECCION: client.address || "",
  CLIENTE_DOMICILIO: client.address || "",
});

const mapCollaboratorVariables = (collaborator) => ({
  FREELANCE_NOMBRE: collaborator.fullName || "",
  FREELANCE_CEDULA: collaborator.identificationNumber || "",
  FREELANCE_DENOMINACION:
    collaborator.contractualDenomination || "LA CONTRATISTA",
  CLIENTE_RAZON_SOCIAL: collaborator.fullName || "",
  CLIENTE_CEDULA: collaborator.identificationNumber || "",
  CLIENTE_REPRESENTANTE: collaborator.fullName || "",
  CLIENTE_CEDULA_REPRESENTANTE: collaborator.identificationNumber || "",
  CLIENTE_CARGO_REPRESENTANTE: "En nombre propio",
  CLIENTE_DOMICILIO: collaborator.address || "",
  CLIENTE_CORREO: collaborator.email || "",
});

const getTypeVariables = (documentType) => {
  if (ecosystemContractConfigs[documentType]) {
    return [...contractRequiredVariables, ...contractOptionalVariables];
  }
  if (documentType === "nda_mutual") return ndaMutualVariables;
  if (documentType === "nda_unilateral") return ndaUnilateralVariables;
  if (documentType === "freelance_sales_contract") {
    return freelanceSalesVariables;
  }
  return [];
};

const getRequiredTypeVariables = (documentType) => {
  if (ecosystemContractConfigs[documentType]) return contractRequiredVariables;
  if (documentType === "nda_mutual") return ndaMutualVariables;
  if (documentType === "nda_unilateral") return ndaUnilateralVariables;
  if (documentType === "freelance_sales_contract") {
    return freelanceSalesVariables;
  }
  return [];
};

const getGenerationDefaults = (documentType, clientName = "Cliente") => {
  const config = ecosystemContractConfigs[documentType];
  if (!config) {
    return {
      FECHA_FIRMA: currentSignatureDate(),
      ...(documentType === "freelance_sales_contract"
        ? {
            LUGAR_FIRMA: "Alajuela, Costa Rica",
            FREELANCE_DENOMINACION: "LA CONTRATISTA",
          }
        : {}),
      ...(documentType === "nda_unilateral"
        ? {
            PROPOSITO:
              "la evaluación, negociación, ejecución, soporte, cierre, documentación, auditoría, continuidad o mejora de los servicios contratados con Techkepper",
          }
        : {}),
    };
  }
  return {
    ECOSISTEMA: config.ecosystem,
    NOMBRE_PROYECTO: `${config.projectPrefix} - ${clientName}`,
    MONEDA: "CRC",
    PERIODICIDAD: "Mensual",
    PLAZO_MINIMO: "Un (1) año",
    FECHA_INICIO: "A la firma del contrato",
    LUGAR_FIRMA: "Alajuela, Costa Rica",
    FECHA_FIRMA: currentSignatureDate(),
  };
};

const generationVariableGroups = [
  {
    title: "Datos del cliente",
    variables: [
      "CLIENTE_RAZON_SOCIAL",
      "CLIENTE_CEDULA",
      "CLIENTE_REPRESENTANTE",
      "CLIENTE_CARGO_REPRESENTANTE",
      "CLIENTE_CEDULA_REPRESENTANTE",
      "CLIENTE_CORREO",
      "CLIENTE_TELEFONO",
      "CLIENTE_DOMICILIO",
    ],
  },
  {
    title: "Datos comerciales",
    variables: [
      "ECOSISTEMA",
      "NOMBRE_PROYECTO",
      "MONTO",
      "MONEDA",
      "PERIODICIDAD",
      "PLAZO_MINIMO",
      "FECHA_INICIO",
    ],
  },
  {
    title: "Alcance del ecosistema",
    variables: [
      "ENTREGABLES",
      "TIEMPOS_RESPUESTA",
      "HERRAMIENTAS_INCLUIDAS",
      "HERRAMIENTAS_EXCLUIDAS",
      "CONDICIONES_ESPECIALES",
    ],
  },
  {
    title: "Firma",
    variables: ["LUGAR_FIRMA", "FECHA_FIRMA"],
  },
];

const ndaUnilateralVariableGroups = [
  {
    title: "Datos del receptor",
    variables: [
      "CLIENTE_RAZON_SOCIAL",
      "CLIENTE_CEDULA",
      "CLIENTE_REPRESENTANTE",
      "CLIENTE_CEDULA_REPRESENTANTE",
      "CLIENTE_CARGO_REPRESENTANTE",
      "CLIENTE_DOMICILIO",
      "CLIENTE_CORREO",
    ],
  },
  {
    title: "Propósito del acuerdo",
    variables: ["PROPOSITO"],
  },
  {
    title: "Firma",
    variables: ["FECHA_FIRMA"],
  },
];

const freelanceSalesVariableGroups = [
  {
    title: "Datos del freelance",
    variables: ["FREELANCE_NOMBRE", "FREELANCE_CEDULA"],
  },
  {
    title: "Denominación contractual",
    variables: ["FREELANCE_DENOMINACION"],
  },
  {
    title: "Firma",
    variables: ["LUGAR_FIRMA", "FECHA_FIRMA"],
  },
];

const groupGenerationVariables = (variables, documentType) => {
  const remaining = new Set(variables);
  const groupConfiguration =
    documentType === "nda_unilateral"
      ? ndaUnilateralVariableGroups
      : documentType === "freelance_sales_contract"
      ? freelanceSalesVariableGroups
      : generationVariableGroups;
  const groups = groupConfiguration
    .map((group) => {
      const matching = group.variables.filter((variable) =>
        remaining.has(variable)
      );
      matching.forEach((variable) => remaining.delete(variable));
      return { ...group, variables: matching };
    })
    .filter((group) => group.variables.length);

  if (remaining.size) {
    groups.push({
      title: "Variables adicionales",
      variables: Array.from(remaining),
    });
  }
  return groups;
};

const legalRepresentativeVariables = [
  "CLIENTE_REPRESENTANTE",
  "CLIENTE_CEDULA_REPRESENTANTE",
  "CLIENTE_CARGO_REPRESENTANTE",
];

const getVisibleGenerationVariables = (variables, client, recipientMode) =>
  client?.type === "physical" || recipientMode === "collaborator"
    ? variables.filter(
        (variable) => !legalRepresentativeVariables.includes(variable)
      )
    : variables;

const variablePlaceholder = (variable, documentType) => {
  const ecosystem = ecosystemContractConfigs[documentType]?.ecosystem;
  const placeholders = {
    web_contract: {
      ENTREGABLES:
        "Desarrollo web, UX/UI, WordPress, Elementor Pro, SEO técnico inicial y plataforma editable.",
    },
    secure_contract: {
      ENTREGABLES:
        "Auditorías, hardening, activos evaluados, protección de datos, monitoreo y continuidad.",
    },
    growth_contract: {
      ENTREGABLES:
        "SEO, GEO, AI Search Optimization, contenido, Google Ads, analítica y adquisición multicanal.",
    },
    automate_contract: {
      ENTREGABLES:
        "Flujos inteligentes, CRM, agentes IA, integraciones, software a medida y trazabilidad.",
    },
  };

  if (placeholders[documentType]?.[variable]) {
    return placeholders[documentType][variable];
  }
  if (variable === "CONDICIONES_ESPECIALES" && ecosystem) {
    return `Condiciones particulares del servicio Techkepper ${ecosystem}.`;
  }
  if (documentType === "nda_unilateral" && variable === "PROPOSITO") {
    return "Describa el propósito específico para el cual se compartirá la información confidencial.";
  }
  return "";
};

const SmartDocuments = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user } = useContext(AuthContext);
  const canCreateDocuments =
    user.profile === "admin" || user.profile === "supervisor";
  const canManageTemplates = user.profile === "admin";
  const canManageClientLinks = canCreateDocuments;
  const [activeTab, setActiveTab] = useState(0);
  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [templateSearchParam, setTemplateSearchParam] = useState("");
  const [templatePurposeFilter, setTemplatePurposeFilter] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [templatePageNumber, setTemplatePageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [templatesHasMore, setTemplatesHasMore] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [documentPurposeFilter, setDocumentPurposeFilter] = useState("");
  const [uploadPurpose, setUploadPurpose] = useState("other");
  const [file, setFile] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("");
  const [templatePurpose, setTemplatePurpose] = useState("contracts");
  const [templateDocumentType, setTemplateDocumentType] =
    useState("web_contract");
  const [templateEcosystemId, setTemplateEcosystemId] = useState("");
  const [templateRequiresClient, setTemplateRequiresClient] = useState(true);
  const [templateAllowGenericRecipient, setTemplateAllowGenericRecipient] =
    useState(false);
  const [templateRequiredVariables, setTemplateRequiredVariables] = useState(
    contractRequiredVariables.join(", ")
  );
  const [templateFile, setTemplateFile] = useState(null);
  const [installRequired, setInstallRequired] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [downloadingDocument, setDownloadingDocument] = useState(null);
  const [deletingTemplate, setDeletingTemplate] = useState(null);
  const [templateConfirmOpen, setTemplateConfirmOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generationTitle, setGenerationTitle] = useState("");
  const [generationData, setGenerationData] = useState("{}");
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generationPurpose, setGenerationPurpose] = useState("");
  const [generationValues, setGenerationValues] = useState({});
  const [generationBusinessClientId, setGenerationBusinessClientId] =
    useState("");
  const [generationCollaboratorId, setGenerationCollaboratorId] = useState("");
  const [recipientMode, setRecipientMode] = useState("client");
  const [technicalMode, setTechnicalMode] = useState(false);
  const [generationStage, setGenerationStage] = useState("form");
  const [generatedDocument, setGeneratedDocument] = useState(null);
  const [ecosystems, setEcosystems] = useState([]);
  const [businessClients, setBusinessClients] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [selectedBusinessClientId, setSelectedBusinessClientId] = useState("");
  const [associationInstalled, setAssociationInstalled] = useState(true);
  const generationBusinessClient = businessClients.find(
    (client) => client.id === Number(generationBusinessClientId)
  );
  const requiredRecipientMode = getRequiredRecipientMode(
    selectedTemplate?.documentType
  );
  const selectedGenerationClient = businessClients.find(
    (client) => client.id === Number(generationBusinessClientId)
  );
  const selectedGenerationCollaborator = collaborators.find(
    (collaborator) => collaborator.id === Number(generationCollaboratorId)
  );

  useEffect(() => {
    api
      .get("/ecosystems")
      .then(({ data }) => setEcosystems(data))
      .catch(toastError);
  }, []);

  useEffect(() => {
    if (!canManageClientLinks) return;
    api
      .get("/business-clients", {
        params: { status: "active", pageNumber: 1 },
      })
      .then(({ data }) => setBusinessClients(data.clients))
      .catch(toastError);
  }, [canManageClientLinks]);

  useEffect(() => {
    if (!canCreateDocuments) return;
    api
      .get("/collaborators", {
        params: { status: "active", pageNumber: 1 },
      })
      .then(({ data }) => setCollaborators(data.collaborators))
      .catch((error) => {
        const code =
          error.response?.data?.error || error.response?.data?.message;
        if (code !== "ERR_COLLABORATORS_NOT_INSTALLED") toastError(error);
      });
  }, [canCreateDocuments]);

  useEffect(() => {
    setDocuments([]);
    setPageNumber(1);
  }, [searchParam, documentPurposeFilter]);

  useEffect(() => {
    setTemplates([]);
    setTemplatePageNumber(1);
  }, [templateSearchParam, templatePurposeFilter]);

  useEffect(() => {
    if (activeTab !== 0) return undefined;

    let mounted = true;
    setLoading(true);

    const delay = setTimeout(async () => {
      try {
        const { data } = await api.get("/documents", {
          params: {
            searchParam,
            pageNumber,
            purpose: documentPurposeFilter || undefined,
          },
        });
        if (!mounted) return;
        const documentIds = data.documents.map((document) => document.id);
        const linksResponse = documentIds.length
          ? await api.get("/document-business-client-links", {
              params: { documentIds: documentIds.join(",") },
            })
          : { data: { installed: true, links: [] } };
        if (!mounted) return;
        setAssociationInstalled(linksResponse.data.installed);
        const clientByDocumentId = new Map(
          linksResponse.data.links.map((link) => [
            Number(link.documentId),
            link.businessClient,
          ])
        );
        const documentsWithClient = data.documents.map((document) => ({
          ...document,
          businessClient: clientByDocumentId.get(Number(document.id)) || null,
        }));
        setInstallRequired(false);
        setDocuments((current) => {
          const merged = [...current];
          documentsWithClient.forEach((document) => {
            const index = merged.findIndex((item) => item.id === document.id);
            if (index >= 0) {
              merged[index] = document;
            } else {
              merged.push(document);
            }
          });
          return merged;
        });
        setHasMore(data.hasMore);
      } catch (err) {
        if (getErrorCode(err) === "ERR_SMART_DOCUMENTS_NOT_INSTALLED") {
          setInstallRequired(true);
        } else {
          toastError(err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }, 400);

    return () => {
      mounted = false;
      clearTimeout(delay);
    };
  }, [activeTab, searchParam, pageNumber, documentPurposeFilter]);

  useEffect(() => {
    if (activeTab !== 1) return undefined;

    let mounted = true;
    setLoading(true);

    const delay = setTimeout(async () => {
      try {
        const { data } = await api.get("/document-templates", {
          params: {
            searchParam: templateSearchParam,
            pageNumber: templatePageNumber,
            purpose: templatePurposeFilter || undefined,
          },
        });
        if (!mounted) return;
        setInstallRequired(false);
        setTemplates((current) => {
          const merged = [...current];
          data.templates.forEach((template) => {
            const index = merged.findIndex((item) => item.id === template.id);
            if (index >= 0) {
              merged[index] = template;
            } else {
              merged.push(template);
            }
          });
          return merged;
        });
        setTemplatesHasMore(data.hasMore);
      } catch (err) {
        if (getErrorCode(err) === "ERR_SMART_DOCUMENTS_NOT_INSTALLED") {
          setInstallRequired(true);
        } else {
          toastError(err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }, 400);

    return () => {
      mounted = false;
      clearTimeout(delay);
    };
  }, [
    activeTab,
    templateSearchParam,
    templatePageNumber,
    templatePurposeFilter,
  ]);

  const handleUpload = async () => {
    if (!file) {
      toast.warn("Seleccione un archivo para subir.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title || file.name);
    formData.append("category", category);
    formData.append("purpose", uploadPurpose);

    setSaving(true);
    try {
      const { data } = await api.post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      let savedDocument = data;
      if (selectedBusinessClientId) {
        const linkResponse = await api.put(
          `/documents/${data.id}/business-client`,
          { businessClientId: selectedBusinessClientId }
        );
        setAssociationInstalled(linkResponse.data.installed);
        if (linkResponse.data.installed) {
          savedDocument = {
            ...data,
            businessClient: linkResponse.data.link?.businessClient || null,
          };
        } else {
          toast.warn(
            "Documento guardado, pero la asociación con clientes requiere instalación."
          );
        }
      }
      setInstallRequired(false);
      setDocuments((current) => [
        savedDocument,
        ...current.filter((item) => item.id !== savedDocument.id),
      ]);
      setTitle("");
      setCategory("");
      setUploadPurpose("other");
      setFile(null);
      setSelectedBusinessClientId("");
      toast.success("Documento guardado correctamente.");
    } catch (err) {
      if (getErrorCode(err) === "ERR_SMART_DOCUMENTS_NOT_INSTALLED") {
        setInstallRequired(true);
      } else {
        toastError(err);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUploadTemplate = async () => {
    if (!templateFile) {
      toast.warn("Seleccione una plantilla DOCX.");
      return;
    }

    const formData = new FormData();
    formData.append("file", templateFile);
    formData.append("name", templateName || templateFile.name.replace(/\.docx$/i, ""));
    formData.append("category", templateCategory);
    formData.append("purpose", templatePurpose);
    formData.append("documentType", templateDocumentType);
    formData.append("ecosystemId", templateEcosystemId);
    formData.append("requiresClient", String(templateRequiresClient));
    formData.append(
      "allowGenericRecipient",
      String(templateAllowGenericRecipient)
    );
    formData.append("requiredVariables", templateRequiredVariables);

    setSaving(true);
    try {
      const { data } = await api.post("/document-templates", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setInstallRequired(false);
      setTemplates((current) => [
        data,
        ...current.filter((item) => item.id !== data.id),
      ]);
      if (data.missingExpectedVariables?.length) {
        toast.warn(
          `La plantilla se guardó, pero el DOCX no contiene: ${data.missingExpectedVariables.join(
            ", "
          )}`
        );
      }
      setTemplateName("");
      setTemplateCategory("");
      setTemplatePurpose("contracts");
      setTemplateDocumentType("web_contract");
      setTemplateEcosystemId("");
      setTemplateRequiresClient(true);
      setTemplateAllowGenericRecipient(false);
      setTemplateRequiredVariables(contractRequiredVariables.join(", "));
      setTemplateFile(null);
      toast.success("Plantilla guardada correctamente.");
    } catch (err) {
      if (getErrorCode(err) === "ERR_SMART_DOCUMENTS_NOT_INSTALLED") {
        setInstallRequired(true);
      } else {
        toastError(err);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (document, format = "original") => {
    try {
      const { data } = await api.get(`/documents/${document.id}/download`, {
        params: { format },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = window.document.createElement("a");
      link.href = url;
      const downloadName =
        format === "pdf"
          ? `${document.originalName.replace(/\.[^.]+$/, "")}.pdf`
          : document.originalName;
      link.setAttribute("download", downloadName);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setDownloadingDocument(null);
    } catch (err) {
      toastError(err);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/documents/${deletingDocument.id}`);
      setDocuments((current) =>
        current.filter((document) => document.id !== deletingDocument.id)
      );
      toast.success("Documento eliminado correctamente.");
    } catch (err) {
      toastError(err);
    } finally {
      setDeletingDocument(null);
      setConfirmModalOpen(false);
    }
  };

  const handleDeleteTemplate = async () => {
    try {
      await api.delete(`/document-templates/${deletingTemplate.id}`);
      setTemplates((current) =>
        current.filter((template) => template.id !== deletingTemplate.id)
      );
      toast.success("Plantilla eliminada correctamente.");
    } catch (err) {
      toastError(err);
    } finally {
      setDeletingTemplate(null);
      setTemplateConfirmOpen(false);
    }
  };

  const openGenerateDialog = (template) => {
    const activeVersion = getActiveVersion(template);
    const detectedVariables =
      activeVersion?.detectedVariables?.length > 0
        ? activeVersion.detectedVariables
        : activeVersion?.requiredVariables || [];
    const typeVariables =
      template.expectedVariables?.length > 0
        ? template.expectedVariables
        : getTypeVariables(template.documentType);
    const variables = Array.from(
      new Set([...typeVariables, ...detectedVariables])
    );
    const defaults = getGenerationDefaults(template.documentType);
    const initialData = variables.reduce(
      (acc, variable) => ({
        ...acc,
        [variable]: defaults[variable] || "",
      }),
      {}
    );

    setSelectedTemplate(template);
    setGenerationPurpose(template.purpose || "");
    setGenerationTitle(template.name);
    setGenerationValues(initialData);
    setGenerationData(JSON.stringify(initialData, null, 2));
    setGenerationBusinessClientId("");
    setGenerationCollaboratorId("");
    const requiredMode = getRequiredRecipientMode(template.documentType);
    setRecipientMode(
      requiredMode || (template.requiresClient ? "client" : "manual")
    );
    setTechnicalMode(
      !knownVisualDocumentTypes.includes(template.documentType)
    );
    setGenerationStage("form");
    setGeneratedDocument(null);
    setGenerateDialogOpen(true);
  };

  const openGenerationWizard = async () => {
    try {
      const { data } = await api.get("/document-templates", {
        params: { pageNumber: 1 },
      });
      setTemplates(data.templates);
      setSelectedTemplate(null);
      setGenerationPurpose("");
      setGenerationTitle("");
      setGenerationValues({});
      setGenerationData("{}");
      setGenerationBusinessClientId("");
      setGenerationCollaboratorId("");
      setRecipientMode("client");
      setTechnicalMode(false);
      setGenerationStage("form");
      setGeneratedDocument(null);
      setGenerateDialogOpen(true);
    } catch (error) {
      toastError(error);
    }
  };

  const selectGenerationTemplate = (templateId) => {
    const template = templates.find((item) => item.id === Number(templateId));
    if (!template) {
      setSelectedTemplate(null);
      return;
    }
    openGenerateDialog(template);
  };

  const handleGenerationClientChange = (clientId) => {
    setGenerationBusinessClientId(clientId);
    setGenerationCollaboratorId("");
    const client = businessClients.find((item) => item.id === Number(clientId));
    if (!client) return;
    const mapped = mapClientVariables(client);
    const defaults = getGenerationDefaults(
      selectedTemplate?.documentType,
      client.displayName
    );
    setGenerationValues((current) => {
      const next = { ...current };
      Object.keys(next).forEach((variable) => {
        if (mapped[variable] !== undefined) next[variable] = mapped[variable];
        if (defaults[variable] !== undefined) next[variable] = defaults[variable];
      });
      setGenerationData(JSON.stringify(next, null, 2));
      return next;
    });
  };

  const handleGenerationCollaboratorChange = (collaboratorId) => {
    setGenerationCollaboratorId(collaboratorId);
    setGenerationBusinessClientId("");
    const collaborator = collaborators.find(
      (item) => item.id === Number(collaboratorId)
    );
    if (!collaborator) return;
    const mapped = mapCollaboratorVariables(collaborator);
    setGenerationValues((current) => {
      const next = { ...current };
      Object.keys(next).forEach((variable) => {
        if (mapped[variable] !== undefined) next[variable] = mapped[variable];
      });
      setGenerationData(JSON.stringify(next, null, 2));
      return next;
    });
  };

  const handleRecipientModeChange = (mode) => {
    setRecipientMode(mode);
    if (mode !== "client") setGenerationBusinessClientId("");
    if (mode !== "collaborator") setGenerationCollaboratorId("");
    if (mode !== "generic") return;

    setGenerationValues((current) => {
      const next = { ...current };
      if (Object.prototype.hasOwnProperty.call(next, "CLIENTE_NOMBRE")) {
        next.CLIENTE_NOMBRE = "Para quien corresponda";
      }
      setGenerationData(JSON.stringify(next, null, 2));
      return next;
    });
  };

  const parseGenerationData = () => {
    if (!technicalMode) return generationValues;
    try {
      return JSON.parse(generationData);
    } catch {
      toast.warn("Revise el JSON de variables antes de continuar.");
      return null;
    }
  };

  const getMissingGenerationVariables = (data) =>
    getRequiredTypeVariables(selectedTemplate?.documentType).filter(
      (variable) =>
        data?.[variable] === undefined ||
        data?.[variable] === null ||
        String(data[variable]).trim() === ""
    );

  const handleReviewGeneration = () => {
    const parsedData = parseGenerationData();
    if (!parsedData) return;
    if (requiredRecipientMode === "client" && !generationBusinessClientId) {
      toast.warn("Seleccione un cliente para este documento.");
      return;
    }
    if (
      requiredRecipientMode === "collaborator" &&
      !generationCollaboratorId
    ) {
      toast.warn("Seleccione un colaborador para este documento.");
      return;
    }
    setGenerationStage("summary");
  };

  const handleGenerateDocument = async () => {
    const parsedData = parseGenerationData();
    if (!parsedData) return;

    setSaving(true);
    try {
      const { data } = await api.post(
        `/document-templates/${selectedTemplate.id}/generate`,
        {
          title: generationTitle,
          data: parsedData,
          businessClientId: generationBusinessClientId || null,
          collaboratorId: generationCollaboratorId || null,
          recipientMode,
        }
      );
      const generatedDocument = {
        ...data,
        businessClient: selectedGenerationClient || null,
        collaborator: selectedGenerationCollaborator || null,
      };
      setDocuments((current) => [
        generatedDocument,
        ...current.filter((item) => item.id !== generatedDocument.id),
      ]);
      setGeneratedDocument(generatedDocument);
      setGenerationStage("success");
      toast.success("Documento generado correctamente.");
    } catch (err) {
      toastError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollHeight - (scrollTop + 100) >= clientHeight || loading) return;

    if (activeTab === 0 && hasMore) {
      setPageNumber((current) => current + 1);
    }
    if (activeTab === 1 && templatesHasMore) {
      setTemplatePageNumber((current) => current + 1);
    }
  };

  return (
    <MainContainer>
      <ConfirmationModal
        title={
          deletingDocument
            ? `Eliminar documento ${deletingDocument.title}?`
            : "Eliminar documento"
        }
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={handleDelete}
      >
        Esta acción quitará el documento del módulo y eliminará el archivo
        almacenado.
      </ConfirmationModal>

      <Dialog
        open={Boolean(downloadingDocument)}
        onClose={() => setDownloadingDocument(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Descargar documento</DialogTitle>
        <DialogContent>
          <Typography color="textSecondary">
            Seleccione el formato en que desea descargar el documento.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDownloadingDocument(null)}>Cancelar</Button>
          {canCreateDocuments &&
            downloadingDocument?.mimeType ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && (
            <Button
              color="primary"
              variant="outlined"
              onClick={() => handleDownload(downloadingDocument, "docx")}
            >
              Descargar DOCX
            </Button>
          )}
          {(downloadingDocument?.mimeType ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            downloadingDocument?.mimeType === "application/pdf") && (
            <Button
              color="primary"
              variant="contained"
              onClick={() => handleDownload(downloadingDocument, "pdf")}
            >
              Descargar PDF
            </Button>
          )}
          {canCreateDocuments &&
            downloadingDocument &&
            ![
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              "application/pdf",
            ].includes(downloadingDocument.mimeType) && (
              <Button
                color="primary"
                variant="contained"
                onClick={() =>
                  handleDownload(downloadingDocument, "original")
                }
              >
                Descargar original
              </Button>
            )}
        </DialogActions>
      </Dialog>

      <ConfirmationModal
        title={
          deletingTemplate
            ? `Eliminar plantilla ${deletingTemplate.name}?`
            : "Eliminar plantilla"
        }
        open={templateConfirmOpen}
        onClose={setTemplateConfirmOpen}
        onConfirm={handleDeleteTemplate}
      >
        La plantilla dejará de estar disponible para generar documentos. Los
        documentos creados anteriormente se conservarán.
      </ConfirmationModal>

      <Dialog
        open={generateDialogOpen}
        onClose={() => {
          if (!saving) setGenerateDialogOpen(false);
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {generationStage === "summary"
            ? "Revisar documento"
            : generationStage === "success"
            ? "Documento generado"
            : "Generar documento"}
        </DialogTitle>
        <DialogContent>
          {generationStage === "form" && (
            <>
          <Typography color="textSecondary" gutterBottom>
            Seleccione el propósito y el machote. El formulario solicitará
            únicamente las variables que necesita ese documento.
          </Typography>
          <FormControl variant="outlined" margin="dense" fullWidth>
            <InputLabel>Propósito</InputLabel>
            <Select
              value={generationPurpose}
              onChange={(event) => {
                setGenerationPurpose(event.target.value);
                setSelectedTemplate(null);
              }}
              label="Propósito"
            >
              {documentPurposes
                .filter((purpose) => purpose.value)
                .map((purpose) => (
                  <MenuItem key={purpose.value} value={purpose.value}>
                    {purpose.label}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl variant="outlined" margin="dense" fullWidth>
            <InputLabel>Documento a generar</InputLabel>
            <Select
              value={selectedTemplate?.id || ""}
              onChange={(event) =>
                selectGenerationTemplate(event.target.value)
              }
              label="Documento a generar"
              disabled={!generationPurpose}
            >
              {templates
                .filter(
                  (template) =>
                    !generationPurpose ||
                    template.purpose === generationPurpose
                )
                .map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                    {template.ecosystem?.name
                      ? ` · ${template.ecosystem.name}`
                      : ""}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          {selectedTemplate && (
            <>
              {selectedTemplate.missingExpectedVariables?.length > 0 && (
                <Typography color="error" variant="body2">
                  Aviso: el DOCX no contiene estas variables esperadas:{" "}
                  {selectedTemplate.missingExpectedVariables.join(", ")}.
                </Typography>
              )}
              {!requiredRecipientMode && (
                <FormControl variant="outlined" margin="dense" fullWidth>
                  <InputLabel>Destinatario</InputLabel>
                  <Select
                    value={recipientMode}
                    onChange={(event) =>
                      handleRecipientModeChange(event.target.value)
                    }
                    label="Destinatario"
                  >
                    <MenuItem value="client">Cliente registrado</MenuItem>
                    <MenuItem value="collaborator">
                      Colaborador registrado
                    </MenuItem>
                    {!selectedTemplate.requiresClient && (
                      <MenuItem value="manual">Datos manuales</MenuItem>
                    )}
                    {selectedTemplate.allowGenericRecipient && (
                      <MenuItem value="generic">Para quien corresponda</MenuItem>
                    )}
                  </Select>
                </FormControl>
              )}
              {recipientMode === "client" && (
                <FormControl variant="outlined" margin="dense" fullWidth>
                  <InputLabel>Cliente</InputLabel>
                  <Select
                    value={generationBusinessClientId}
                    onChange={(event) =>
                      handleGenerationClientChange(event.target.value)
                    }
                    label="Cliente"
                  >
                    {businessClients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.displayName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              {recipientMode === "collaborator" && (
                <FormControl variant="outlined" margin="dense" fullWidth>
                  <InputLabel>Colaborador</InputLabel>
                  <Select
                    value={generationCollaboratorId}
                    onChange={(event) =>
                      handleGenerationCollaboratorChange(event.target.value)
                    }
                    label="Colaborador"
                  >
                    {collaborators.map((collaborator) => (
                      <MenuItem key={collaborator.id} value={collaborator.id}>
                        {collaborator.fullName} ·{" "}
                        {collaborator.identificationNumber}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </>
          )}
          <TextField
            label="Nombre del documento"
            variant="outlined"
            margin="dense"
            fullWidth
            value={generationTitle}
            onChange={(event) => setGenerationTitle(event.target.value)}
            disabled={!selectedTemplate}
          />
          {selectedTemplate &&
            !technicalMode &&
            groupGenerationVariables(
              getVisibleGenerationVariables(
                Object.keys(generationValues),
                generationBusinessClient,
                recipientMode
              ),
              selectedTemplate.documentType
            ).map((group) => (
                <div className={classes.generationSection} key={group.title}>
                  <Typography
                    className={classes.generationSectionTitle}
                    variant="subtitle2"
                  >
                    {recipientMode === "collaborator" &&
                    ["Datos del cliente", "Datos del receptor"].includes(
                      group.title
                    )
                      ? "Datos del colaborador"
                      : group.title === "Alcance del ecosistema"
                      ? ecosystemContractConfigs[selectedTemplate.documentType]
                          ?.scopeLabel || group.title
                      : group.title}
                  </Typography>
                  {group.variables.map((variable) =>
                    variable === "FREELANCE_DENOMINACION" ? (
                      <FormControl
                        key={variable}
                        variant="outlined"
                        margin="dense"
                        fullWidth
                      >
                        <InputLabel>Denominación contractual *</InputLabel>
                        <Select
                          value={generationValues[variable] || ""}
                          onChange={(event) =>
                            setGenerationValues((current) => ({
                              ...current,
                              [variable]: event.target.value,
                            }))
                          }
                          label="Denominación contractual *"
                        >
                          <MenuItem value="LA CONTRATISTA">
                            LA CONTRATISTA
                          </MenuItem>
                          <MenuItem value="EL CONTRATISTA">
                            EL CONTRATISTA
                          </MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <TextField
                        key={variable}
                        label={`${variableLabel(
                          variable,
                          selectedTemplate.documentType,
                          recipientMode
                        )}${
                          getRequiredTypeVariables(
                            selectedTemplate.documentType
                          ).includes(variable)
                            ? " *"
                            : ""
                        }`}
                        variant="outlined"
                        margin="dense"
                        fullWidth
                        placeholder={variablePlaceholder(
                          variable,
                          selectedTemplate.documentType
                        )}
                        multiline={[
                          "ENTREGABLES",
                          "TIEMPOS_RESPUESTA",
                          "HERRAMIENTAS_INCLUIDAS",
                          "HERRAMIENTAS_EXCLUIDAS",
                          "CONDICIONES_ESPECIALES",
                          "DESCRIPCION",
                          "ALCANCE",
                          "PROPOSITO",
                        ].includes(variable)}
                        rows={
                          [
                            "ENTREGABLES",
                            "TIEMPOS_RESPUESTA",
                            "HERRAMIENTAS_INCLUIDAS",
                            "HERRAMIENTAS_EXCLUIDAS",
                            "CONDICIONES_ESPECIALES",
                            "PROPOSITO",
                          ].includes(variable)
                            ? 3
                            : undefined
                        }
                        value={generationValues[variable] || ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          setGenerationValues((current) => ({
                            ...current,
                            [variable]: value,
                          }));
                        }}
                      />
                    )
                  )}
                </div>
              )
            )}
          {selectedTemplate && technicalMode && (
            <>
              {!knownVisualDocumentTypes.includes(
                selectedTemplate.documentType
              ) && (
                <Typography color="textSecondary" variant="body2">
                  Esta plantilla no tiene un tipo visual conocido. Complete las
                  variables mediante el modo técnico JSON.
                </Typography>
              )}
              <TextField
                label="Variables JSON"
                variant="outlined"
                margin="dense"
                fullWidth
                multiline
                rows={10}
                value={generationData}
                onChange={(event) => setGenerationData(event.target.value)}
              />
            </>
          )}
          {selectedTemplate &&
            knownVisualDocumentTypes.includes(
              selectedTemplate.documentType
            ) && (
            <FormControlLabel
              control={
                <Switch
                  color="primary"
                  checked={technicalMode}
                  onChange={(event) => {
                    setTechnicalMode(event.target.checked);
                    if (event.target.checked) {
                      setGenerationData(
                        JSON.stringify(generationValues, null, 2)
                      );
                    }
                  }}
                />
              }
              label="Modo técnico JSON"
            />
          )}
            </>
          )}
          {generationStage === "summary" && selectedTemplate && (
            <>
              <Typography color="textSecondary">
                Confirme la información antes de generar el archivo definitivo.
              </Typography>
              <div className={classes.generationSummary}>
                <div className={classes.generationSummaryCard}>
                  <Typography variant="caption" color="textSecondary">
                    Tipo documental
                  </Typography>
                  <Typography>
                    {documentTypes.find(
                      (item) => item.value === selectedTemplate.documentType
                    )?.label || "Otro / modo técnico"}
                  </Typography>
                </div>
                <div className={classes.generationSummaryCard}>
                  <Typography variant="caption" color="textSecondary">
                    Plantilla
                  </Typography>
                  <Typography>{selectedTemplate.name}</Typography>
                </div>
                <div className={classes.generationSummaryCard}>
                  <Typography variant="caption" color="textSecondary">
                    Destinatario
                  </Typography>
                  <Typography>
                    {selectedGenerationClient?.displayName ||
                      selectedGenerationCollaborator?.fullName ||
                      (recipientMode === "generic"
                        ? "Para quien corresponda"
                        : "Datos manuales")}
                  </Typography>
                </div>
                <div className={classes.generationSummaryCard}>
                  <Typography variant="caption" color="textSecondary">
                    Formatos disponibles
                  </Typography>
                  <Typography>DOCX y PDF</Typography>
                </div>
                <div className={classes.generationSummaryCard}>
                  <Typography variant="caption" color="textSecondary">
                    Variables completas
                  </Typography>
                  <Typography>
                    {
                      Object.values(parseGenerationData() || {}).filter(
                        (value) => String(value ?? "").trim() !== ""
                      ).length
                    }
                  </Typography>
                </div>
                <div className={classes.generationSummaryCard}>
                  <Typography variant="caption" color="textSecondary">
                    Variables faltantes
                  </Typography>
                  <div className={classes.variableList}>
                    {getMissingGenerationVariables(
                      parseGenerationData() || {}
                    ).length ? (
                      getMissingGenerationVariables(
                        parseGenerationData() || {}
                      ).map((variable) => (
                        <Chip
                          key={variable}
                          color="secondary"
                          size="small"
                          label={variableLabel(
                            variable,
                            selectedTemplate.documentType,
                            recipientMode
                          )}
                        />
                      ))
                    ) : (
                      <Typography>Sin campos pendientes</Typography>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
          {generationStage === "success" && generatedDocument && (
            <>
              <Typography>
                El documento se generó y quedó asociado correctamente.
              </Typography>
              <div className={classes.generationResultActions}>
                {canCreateDocuments && (
                  <Button
                    color="primary"
                    variant="outlined"
                    onClick={() => handleDownload(generatedDocument, "docx")}
                  >
                    Descargar DOCX
                  </Button>
                )}
                <Button
                  color="primary"
                  variant="contained"
                  onClick={() => handleDownload(generatedDocument, "pdf")}
                >
                  Descargar PDF
                </Button>
                <Button
                  onClick={() => {
                    setGenerateDialogOpen(false);
                    setActiveTab(0);
                  }}
                >
                  Ver en Documentos
                </Button>
                {generatedDocument.businessClient && (
                  <Button onClick={() => history.push("/business-clients")}>
                    Ver cliente relacionado
                  </Button>
                )}
                {generatedDocument.collaborator && (
                  <Button onClick={() => history.push("/collaborators")}>
                    Ver colaborador relacionado
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {generationStage === "form" && (
            <>
              <Button onClick={() => setGenerateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                color="primary"
                variant="contained"
                disabled={saving || !selectedTemplate}
                onClick={handleReviewGeneration}
              >
                Revisar
              </Button>
            </>
          )}
          {generationStage === "summary" && (
            <>
              <Button onClick={() => setGenerationStage("form")}>
                Volver
              </Button>
              <Button
                color="primary"
                variant="contained"
                disabled={
                  saving ||
                  getMissingGenerationVariables(
                    parseGenerationData() || {}
                  ).length > 0
                }
                onClick={handleGenerateDocument}
              >
                {saving ? "Generando..." : "Confirmar y generar"}
              </Button>
            </>
          )}
          {generationStage === "success" && (
            <Button onClick={() => setGenerateDialogOpen(false)}>Cerrar</Button>
          )}
        </DialogActions>
      </Dialog>

      <MainHeader>
        <Title>Documentos inteligentes</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            placeholder={activeTab === 0 ? "Buscar documento" : "Buscar plantilla"}
            type="search"
            variant="outlined"
            size="small"
            value={activeTab === 0 ? searchParam : templateSearchParam}
            onChange={(event) =>
              activeTab === 0
                ? setSearchParam(event.target.value)
                : setTemplateSearchParam(event.target.value)
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: "gray" }} />
                </InputAdornment>
              ),
            }}
          />
          {canCreateDocuments && (
            <Button
              color="primary"
              variant="contained"
              onClick={openGenerationWizard}
            >
              Generar documento
            </Button>
          )}
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <Paper className={classes.tabsPaper} variant="outlined">
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Documentos" />
          {canCreateDocuments && <Tab label="Plantillas" />}
        </Tabs>
      </Paper>

      {installRequired && (
        <Paper className={classes.installWarning} variant="outlined">
          <Typography variant="h6">Instalación pendiente</Typography>
          <Typography color="textSecondary">
            El módulo está integrado, pero faltan tablas o columnas de
            Documentos inteligentes. Revise SQL_MANUAL_STEPS.md antes de
            habilitar el uso operativo.
          </Typography>
        </Paper>
      )}

      {!installRequired && activeTab === 0 && (
        <>
          <Paper className={classes.tabsPaper} variant="outlined">
            <Tabs
              value={documentPurposeFilter}
              onChange={(_, value) => setDocumentPurposeFilter(value)}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
            >
              {documentPurposes.map((purpose) => (
                <Tab
                  key={purpose.value || "all"}
                  value={purpose.value}
                  label={purpose.label}
                />
              ))}
            </Tabs>
          </Paper>
          {canCreateDocuments && (
          <Paper className={classes.uploadPanel} variant="outlined">
            <TextField
              label="Nombre del documento"
              variant="outlined"
              size="small"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <TextField
              label="Categoría"
              variant="outlined"
              size="small"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
            <FormControl variant="outlined" size="small">
              <InputLabel>Uso</InputLabel>
              <Select
                value={uploadPurpose}
                onChange={(event) => setUploadPurpose(event.target.value)}
                label="Uso"
              >
                {documentPurposes
                  .filter((purpose) => purpose.value)
                  .map((purpose) => (
                    <MenuItem key={purpose.value} value={purpose.value}>
                      {purpose.label}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            {canManageClientLinks && (
              <FormControl variant="outlined" size="small">
                <InputLabel>Cliente comercial</InputLabel>
                <Select
                  value={selectedBusinessClientId}
                  onChange={(event) =>
                    setSelectedBusinessClientId(event.target.value)
                  }
                  label="Cliente comercial"
                  disabled={!associationInstalled}
                >
                  <MenuItem value="">Sin cliente asociado</MenuItem>
                  {businessClients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <div className={classes.uploadActions}>
              <input
                accept=".pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
                className={classes.hiddenInput}
                id="smart-document-file"
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
              <label htmlFor="smart-document-file">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<CloudUploadOutlinedIcon />}
                >
                  {file ? "Cambiar archivo" : "Seleccionar archivo"}
                </Button>
              </label>
              <Button
                color="primary"
                variant="contained"
                disabled={saving || !file}
                onClick={handleUpload}
              >
                Guardar
              </Button>
              {file && (
                <Typography variant="caption" display="block">
                  {file.name}
                </Typography>
              )}
            </div>
          </Paper>
          )}

          <Paper
            className={classes.mainPaper}
            variant="outlined"
            onScroll={handleScroll}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Documento</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Uso</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Subido por</TableCell>
                  <TableCell>Tamaño</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <Typography className={classes.fileName}>
                        {document.title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {document.originalName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {document.category ? (
                        <Chip size="small" label={document.category} />
                      ) : (
                        "General"
                      )}
                    </TableCell>
                    <TableCell>{purposeLabel(document.purpose)}</TableCell>
                    <TableCell>
                      {document.businessClient?.displayName || "Sin asociar"}
                    </TableCell>
                    <TableCell>{document.uploadedBy?.name || "-"}</TableCell>
                    <TableCell>{formatSize(document.size)}</TableCell>
                    <TableCell>
                      {new Date(document.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      {(canCreateDocuments ||
                        [
                          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                          "application/pdf",
                        ].includes(document.mimeType)) && (
                        <IconButton
                          size="small"
                          title="Descargar documento"
                          onClick={() => setDownloadingDocument(document)}
                        >
                          <GetAppOutlinedIcon />
                        </IconButton>
                      )}
                      {(user.profile === "admin" ||
                        (user.profile === "supervisor" &&
                          document.uploadedById === Number(user.id))) && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setDeletingDocument(document);
                            setConfirmModalOpen(true);
                          }}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && documents.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={8}>
                      <div className={classes.emptyState}>
                        <Typography color="textSecondary">
                          No hay documentos para mostrar.
                        </Typography>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {loading && <TableRowSkeleton columns={8} />}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}

      {!installRequired && activeTab === 1 && (
        <>
          <Paper className={classes.tabsPaper} variant="outlined">
            <Tabs
              value={templatePurposeFilter}
              onChange={(_, value) => setTemplatePurposeFilter(value)}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
            >
              {documentPurposes.map((purpose) => (
                <Tab
                  key={purpose.value || "all"}
                  value={purpose.value}
                  label={purpose.label}
                />
              ))}
            </Tabs>
          </Paper>
          {canManageTemplates && (
          <Paper
            className={`${classes.uploadPanel} ${classes.templatePanel}`}
            variant="outlined"
          >
            <TextField
              label="Nombre de la plantilla"
              variant="outlined"
              size="small"
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
            />
            <TextField
              label="Categoría"
              variant="outlined"
              size="small"
              value={templateCategory}
              onChange={(event) => setTemplateCategory(event.target.value)}
            />
            <FormControl variant="outlined" size="small">
              <InputLabel>Propósito</InputLabel>
              <Select
                value={templatePurpose}
                onChange={(event) => {
                  const purpose = event.target.value;
                  const nextDocumentType =
                    documentTypes.find((item) => item.purpose === purpose)
                      ?.value || "other";
                  setTemplatePurpose(purpose);
                  if (purpose === "nda") setTemplateEcosystemId("");
                  setTemplateDocumentType(nextDocumentType);
                  const requiredVariables =
                    getRequiredTypeVariables(nextDocumentType);
                  setTemplateRequiredVariables(requiredVariables.join(", "));
                  const contractConfig =
                    ecosystemContractConfigs[nextDocumentType];
                  if (contractConfig) {
                    const ecosystem = ecosystems.find(
                      (item) =>
                        item.name?.toLowerCase() ===
                        contractConfig.ecosystem.toLowerCase()
                    );
                    setTemplateEcosystemId(ecosystem?.id || "");
                  }
                }}
                label="Propósito"
              >
                {documentPurposes
                  .filter((purpose) => purpose.value)
                  .map((purpose) => (
                    <MenuItem key={purpose.value} value={purpose.value}>
                      {purpose.label}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <FormControl variant="outlined" size="small">
              <InputLabel>Tipo de documento</InputLabel>
              <Select
                value={templateDocumentType}
                onChange={(event) => {
                  const documentType = event.target.value;
                  setTemplateDocumentType(documentType);
                  if (documentType === "freelance_sales_contract") {
                    setTemplateRequiresClient(false);
                    setTemplateAllowGenericRecipient(false);
                    setTemplateEcosystemId("");
                  }
                  setTemplateRequiredVariables(
                    getRequiredTypeVariables(documentType).join(", ")
                  );
                  const contractConfig = ecosystemContractConfigs[documentType];
                  if (contractConfig) {
                    const ecosystem = ecosystems.find(
                      (item) =>
                        item.name?.toLowerCase() ===
                        contractConfig.ecosystem.toLowerCase()
                    );
                    setTemplateEcosystemId(ecosystem?.id || "");
                  }
                }}
                label="Tipo de documento"
              >
                {documentTypes
                  .filter((item) => item.purpose === templatePurpose)
                  .map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            {templatePurpose === "nda" ? (
              <TextField
                label="Ecosistema"
                value="General, no requiere ecosistema"
                variant="outlined"
                size="small"
                disabled
              />
            ) : (
              <FormControl variant="outlined" size="small">
                <InputLabel>Ecosistema</InputLabel>
                <Select
                  value={templateEcosystemId}
                  onChange={(event) =>
                    setTemplateEcosystemId(event.target.value)
                  }
                  label="Ecosistema"
                >
                  <MenuItem value="">General</MenuItem>
                  {ecosystems.map((ecosystem) => (
                    <MenuItem key={ecosystem.id} value={ecosystem.id}>
                      {ecosystem.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField
              label="Variables requeridas"
              placeholder="NOMBRE_CLIENTE, CEDULA_CLIENTE"
              variant="outlined"
              size="small"
              value={templateRequiredVariables}
              onChange={(event) => setTemplateRequiredVariables(event.target.value)}
              helperText={
                getTypeVariables(templateDocumentType).length
                  ? "Estas variables se validarán según el tipo documental. Si faltan en el DOCX, se mostrará un aviso."
                  : "Si se deja vacío, se usarán las variables detectadas en el DOCX."
              }
            />
            <div className={classes.templateActions}>
              <FormControlLabel
                control={
                  <Switch
                    color="primary"
                    checked={templateRequiresClient}
                    disabled={
                      templateDocumentType === "freelance_sales_contract"
                    }
                    onChange={(event) =>
                      setTemplateRequiresClient(event.target.checked)
                    }
                  />
                }
                label="Requiere cliente"
              />
              <FormControlLabel
                control={
                  <Switch
                    color="primary"
                    checked={templateAllowGenericRecipient}
                    disabled={
                      templateDocumentType === "freelance_sales_contract"
                    }
                    onChange={(event) =>
                      setTemplateAllowGenericRecipient(event.target.checked)
                    }
                  />
                }
                label="Permitir destinatario genérico"
              />
            </div>
            <div className={classes.templateActions}>
              <input
                accept=".docx"
                className={classes.hiddenInput}
                id="smart-template-file"
                type="file"
                onChange={(event) =>
                  setTemplateFile(event.target.files?.[0] || null)
                }
              />
              <label htmlFor="smart-template-file">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<CloudUploadOutlinedIcon />}
                >
                  {templateFile ? "Cambiar DOCX" : "Seleccionar DOCX"}
                </Button>
              </label>
              <Button
                color="primary"
                variant="contained"
                disabled={saving || !templateFile}
                onClick={handleUploadTemplate}
                style={{ marginLeft: 8 }}
              >
                Guardar
              </Button>
              {templateFile && (
                <Typography variant="caption" display="block">
                  {templateFile.name}
                </Typography>
              )}
            </div>
          </Paper>
          )}

          <Paper
            className={classes.mainPaper}
            variant="outlined"
            onScroll={handleScroll}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Plantilla</TableCell>
                  <TableCell>Uso y tipo</TableCell>
                  <TableCell>Ecosistema</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Variables</TableCell>
                  <TableCell>Creada por</TableCell>
                  <TableCell>Actualización</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map((template) => {
                  const activeVersion = getActiveVersion(template);
                  const variables = activeVersion?.detectedVariables || [];
                  return (
                    <TableRow key={template.id}>
                      <TableCell>
                        <Typography className={classes.fileName}>
                          {template.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Versión {activeVersion?.version || "-"}
                        </Typography>
                        {template.missingExpectedVariables?.length > 0 && (
                          <Typography variant="caption" color="error" display="block">
                            Faltan {template.missingExpectedVariables.length}{" "}
                            variables esperadas en el DOCX
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography>{purposeLabel(template.purpose)}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {documentTypes.find(
                            (item) => item.value === template.documentType
                          )?.label || "Sin tipo específico"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {template.ecosystem?.name || "General"}
                      </TableCell>
                      <TableCell>
                        {template.category ? (
                          <Chip size="small" label={template.category} />
                        ) : (
                          "General"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className={classes.variableList}>
                          {variables.length ? (
                            variables.map((variable) => (
                              <Chip key={variable} size="small" label={variable} />
                            ))
                          ) : (
                            <Typography variant="caption" color="textSecondary">
                              Sin variables detectadas
                            </Typography>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{template.createdBy?.name || "-"}</TableCell>
                      <TableCell>
                        {new Date(template.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          disabled={!activeVersion}
                          onClick={() => openGenerateDialog(template)}
                        >
                          <PlayArrowOutlinedIcon />
                        </IconButton>
                        {canManageTemplates && (
                          <IconButton
                            size="small"
                            title="Eliminar plantilla"
                            onClick={() => {
                              setDeletingTemplate(template);
                              setTemplateConfirmOpen(true);
                            }}
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!loading && templates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className={classes.emptyState}>
                        <Typography color="textSecondary">
                          No hay plantillas para mostrar.
                        </Typography>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {loading && <TableRowSkeleton columns={8} />}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </MainContainer>
  );
};

export default SmartDocuments;
