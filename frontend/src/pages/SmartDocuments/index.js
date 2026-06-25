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
  Radio,
  RadioGroup,
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
import Autocomplete from "@material-ui/lab/Autocomplete";
import CloudUploadOutlinedIcon from "@material-ui/icons/CloudUploadOutlined";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import GetAppOutlinedIcon from "@material-ui/icons/GetAppOutlined";
import HistoryOutlinedIcon from "@material-ui/icons/HistoryOutlined";
import PlayArrowOutlinedIcon from "@material-ui/icons/PlayArrowOutlined";
import SearchIcon from "@material-ui/icons/Search";
import SwapHorizOutlinedIcon from "@material-ui/icons/SwapHorizOutlined";
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
import { i18n } from "../../translate/i18n";

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
  variableReview: {
    minWidth: 230,
  },
  variableReviewPanel: {
    marginTop: theme.spacing(1),
    padding: theme.spacing(1),
    borderRadius: 8,
    border: "1px solid rgba(95, 175, 58, 0.24)",
    background: "rgba(95, 175, 58, 0.04)",
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

const documentStatusOptions = [
  { value: "draft", color: "#8C9AA8" },
  { value: "generated", color: "#63B246" },
  { value: "in_review", color: "#D9A441" },
  { value: "sent", color: "#4E9FD1" },
  { value: "approved", color: "#45A66B" },
  { value: "rejected", color: "#D0605D" },
  { value: "archived", color: "#707B86" },
  { value: "pending_signature", color: "#9B75D1" },
];

const documentStatusLabel = (status) =>
  i18n.t(`smartDocuments.statuses.${status}`);

const documentEventLabel = (eventType) =>
  i18n.t(`smartDocuments.events.${eventType}`, { defaultValue: eventType });

const getDocumentStatus = (status) =>
  documentStatusOptions.find((option) => option.value === status) ||
  documentStatusOptions.find((option) => option.value === "generated");

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
  { value: "" },
  { value: "contracts" },
  { value: "quotations" },
  { value: "nda" },
  { value: "letters" },
  { value: "delivery" },
  { value: "other" },
];

const documentTypes = [
  { value: "web_contract", purpose: "contracts" },
  { value: "secure_contract", purpose: "contracts" },
  { value: "growth_contract", purpose: "contracts" },
  { value: "automate_contract", purpose: "contracts" },
  { value: "service_contract", purpose: "contracts" },
  { value: "freelance_sales_contract", purpose: "contracts" },
  { value: "nda_mutual", purpose: "nda" },
  { value: "nda_unilateral", purpose: "nda" },
  { value: "quotation", purpose: "quotations" },
  { value: "commercial_proposal", purpose: "quotations" },
  { value: "generic_letter", purpose: "letters" },
  { value: "delivery_record", purpose: "delivery" },
  { value: "other", purpose: "other" },
];

const documentTypeLabel = (value) =>
  i18n.t(`smartDocuments.documentTypes.${value}`, { defaultValue: "" });

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
  web_contract: { ecosystem: "Web", projectPrefix: "Techkepper Web" },
  secure_contract: { ecosystem: "Secure", projectPrefix: "Techkepper Secure" },
  growth_contract: { ecosystem: "Growth", projectPrefix: "Techkepper Growth" },
  automate_contract: {
    ecosystem: "Automate",
    projectPrefix: "Techkepper Automate",
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

const purposeLabel = (value) => {
  const item = documentPurposes.find((entry) => entry.value === value);
  return i18n.t(
    `smartDocuments.purposes.${item ? item.value || "all" : "other"}`
  );
};

const variableLabel = (variable, documentType, recipientMode) => {
  if (recipientMode === "collaborator") {
    const collaboratorLabel = i18n.t(
      `smartDocuments.variablesCollaborator.${variable}`,
      { defaultValue: "" }
    );
    if (collaboratorLabel) return collaboratorLabel;
  }
  if (documentType === "nda_unilateral") {
    const ndaLabel = i18n.t(
      `smartDocuments.variablesNdaUnilateral.${variable}`,
      { defaultValue: "" }
    );
    if (ndaLabel) return ndaLabel;
  }

  const contractConfig = ecosystemContractConfigs[documentType];
  if (variable === "ENTREGABLES" && contractConfig) {
    return i18n.t(`smartDocuments.deliverablesLabels.${documentType}`);
  }
  if (
    contractConfig &&
    (variable === "HERRAMIENTAS_INCLUIDAS" ||
      variable === "HERRAMIENTAS_EXCLUIDAS")
  ) {
    return i18n.t(
      `smartDocuments.ecosystemToolLabels.${documentType}.${variable}`
    );
  }

  const baseLabel = i18n.t(`smartDocuments.variables.${variable}`, {
    defaultValue: "",
  });
  return (
    baseLabel ||
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
    key: "clientData",
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
    key: "commercialData",
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
    key: "ecosystemScope",
    variables: [
      "ENTREGABLES",
      "TIEMPOS_RESPUESTA",
      "HERRAMIENTAS_INCLUIDAS",
      "HERRAMIENTAS_EXCLUIDAS",
      "CONDICIONES_ESPECIALES",
    ],
  },
  {
    key: "signature",
    variables: ["LUGAR_FIRMA", "FECHA_FIRMA"],
  },
];

const ndaUnilateralVariableGroups = [
  {
    key: "recipientData",
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
    key: "agreementPurpose",
    variables: ["PROPOSITO"],
  },
  {
    key: "signature",
    variables: ["FECHA_FIRMA"],
  },
];

const freelanceSalesVariableGroups = [
  {
    key: "freelanceData",
    variables: ["FREELANCE_NOMBRE", "FREELANCE_CEDULA"],
  },
  {
    key: "contractualDenomination",
    variables: ["FREELANCE_DENOMINACION"],
  },
  {
    key: "signature",
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
      key: "additionalVariables",
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

  if (variable === "ENTREGABLES") {
    const deliverablesPlaceholder = i18n.t(
      `smartDocuments.placeholders.entregables.${documentType}`,
      { defaultValue: "" }
    );
    if (deliverablesPlaceholder) return deliverablesPlaceholder;
  }
  if (variable === "CONDICIONES_ESPECIALES" && ecosystem) {
    return i18n.t("smartDocuments.placeholders.condicionesEspeciales", {
      ecosystem,
    });
  }
  if (documentType === "nda_unilateral" && variable === "PROPOSITO") {
    return i18n.t("smartDocuments.placeholders.proposito");
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
  const [documentStatusFilter, setDocumentStatusFilter] = useState("");
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
  const [statusDocument, setStatusDocument] = useState(null);
  const [nextDocumentStatus, setNextDocumentStatus] = useState("");
  const [statusComment, setStatusComment] = useState("");
  const [historyDocument, setHistoryDocument] = useState(null);
  const [documentEvents, setDocumentEvents] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [notificationMode, setNotificationMode] = useState("none");
  const [notificationUsers, setNotificationUsers] = useState([]);
  const [selectedNotificationUsers, setSelectedNotificationUsers] = useState([]);
  const [notificationUsersLoading, setNotificationUsersLoading] =
    useState(false);
  const [expandedVariableTemplateId, setExpandedVariableTemplateId] =
    useState(null);
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
    const documentId = new URLSearchParams(history.location.search).get(
      "documentId"
    );
    if (!documentId) return;
    api
      .get(`/documents/${documentId}`)
      .then(({ data }) => {
        setActiveTab(0);
        setDocumentPurposeFilter("");
        setDocumentStatusFilter("");
        setSearchParam(data.title || data.originalName || "");
        history.replace(history.location.pathname);
      })
      .catch(toastError);
  }, [history, history.location.pathname, history.location.search]);

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
  }, [searchParam, documentPurposeFilter, documentStatusFilter]);

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
            status: documentStatusFilter || undefined,
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
  }, [
    activeTab,
    searchParam,
    pageNumber,
    documentPurposeFilter,
    documentStatusFilter,
  ]);

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
      toast.warn(i18n.t("smartDocuments.toasts.selectFileToUpload"));
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
            i18n.t("smartDocuments.toasts.savedButAssociationRequiresInstall")
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
      toast.success(i18n.t("smartDocuments.toasts.documentSaved"));
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
      toast.warn(i18n.t("smartDocuments.toasts.selectDocxTemplate"));
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
          i18n.t("smartDocuments.toasts.templateSavedMissingVariables", {
            variables: data.missingExpectedVariables.join(", "),
          })
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
      toast.success(i18n.t("smartDocuments.toasts.templateSaved"));
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
      toast.success(i18n.t("smartDocuments.toasts.documentDeleted"));
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
      toast.success(i18n.t("smartDocuments.toasts.templateDeleted"));
    } catch (err) {
      toastError(err);
    } finally {
      setDeletingTemplate(null);
      setTemplateConfirmOpen(false);
    }
  };

  const openStatusDialog = (document) => {
    setStatusDocument(document);
    setNextDocumentStatus(document.status || "generated");
    setStatusComment("");
    setNotificationMode("none");
    setNotificationUsers([]);
    setSelectedNotificationUsers([]);
  };

  const enableInternalNotification = async () => {
    setNotificationMode("users");
    if (notificationUsers.length || !statusDocument) return;
    setNotificationUsersLoading(true);
    try {
      const { data } = await api.get(
        `/documents/${statusDocument.id}/notification-recipients`
      );
      setNotificationUsers(data.users || []);
    } catch (error) {
      setNotificationMode("none");
      toastError(error);
    } finally {
      setNotificationUsersLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (
      notificationMode === "users" &&
      selectedNotificationUsers.length === 0
    ) {
      toast.warn(i18n.t("smartDocuments.toasts.selectUserOrNoNotify"));
      return;
    }
    try {
      const { data } = await api.patch(
        `/documents/${statusDocument.id}/status`,
        {
          status: nextDocumentStatus,
          comment: statusComment,
          notificationUserIds:
            notificationMode === "users"
              ? selectedNotificationUsers.map((recipient) => recipient.id)
              : [],
        }
      );
      setDocuments((current) =>
        current.map((document) =>
          document.id === data.id
            ? { ...document, status: data.status }
            : document
        )
      );
      setStatusDocument(null);
      toast.success(i18n.t("smartDocuments.toasts.statusUpdated"));
    } catch (error) {
      toastError(error);
    }
  };

  const openDocumentHistory = async (document) => {
    setHistoryDocument(document);
    setDocumentEvents([]);
    setHistoryLoading(true);
    try {
      const { data } = await api.get(`/documents/${document.id}/events`);
      setDocumentEvents(data.events || []);
    } catch (error) {
      toastError(error);
      setHistoryDocument(null);
    } finally {
      setHistoryLoading(false);
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
      toast.warn(i18n.t("smartDocuments.toasts.reviewJson"));
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
      toast.warn(i18n.t("smartDocuments.toasts.selectClient"));
      return;
    }
    if (
      requiredRecipientMode === "collaborator" &&
      !generationCollaboratorId
    ) {
      toast.warn(i18n.t("smartDocuments.toasts.selectCollaborator"));
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
      toast.success(i18n.t("smartDocuments.toasts.documentGenerated"));
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
            ? i18n.t("smartDocuments.confirm.deleteDocumentTitle", {
                title: deletingDocument.title,
              })
            : i18n.t("smartDocuments.confirm.deleteDocumentTitleDefault")
        }
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={handleDelete}
      >
        {i18n.t("smartDocuments.confirm.deleteDocumentBody")}
      </ConfirmationModal>

      <Dialog
        open={Boolean(statusDocument)}
        onClose={() => setStatusDocument(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{i18n.t("smartDocuments.statusDialog.title")}</DialogTitle>
        <DialogContent>
          <FormControl variant="outlined" margin="dense" fullWidth>
            <InputLabel>
              {i18n.t("smartDocuments.statusDialog.newStatus")}
            </InputLabel>
            <Select
              value={nextDocumentStatus}
              onChange={(event) => setNextDocumentStatus(event.target.value)}
              label={i18n.t("smartDocuments.statusDialog.newStatus")}
            >
              {documentStatusOptions
                .filter(
                  (option) =>
                    user.profile === "admin" ||
                    option.value !== "pending_signature"
                )
                .map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {documentStatusLabel(option.value)}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
            label={i18n.t("smartDocuments.statusDialog.optionalComment")}
            variant="outlined"
            margin="dense"
            fullWidth
            multiline
            rows={3}
            value={statusComment}
            onChange={(event) => setStatusComment(event.target.value)}
          />
          <div className={classes.generationSection}>
            <Typography
              className={classes.generationSectionTitle}
              variant="subtitle2"
            >
              {i18n.t("smartDocuments.statusDialog.internalNotification")}
            </Typography>
            <RadioGroup
              value={notificationMode}
              onChange={(event) => {
                if (event.target.value === "users") {
                  enableInternalNotification();
                } else {
                  setNotificationMode("none");
                  setSelectedNotificationUsers([]);
                }
              }}
            >
              <FormControlLabel
                value="none"
                control={<Radio color="primary" />}
                label={i18n.t("smartDocuments.statusDialog.notifyNone")}
              />
              <FormControlLabel
                value="users"
                control={<Radio color="primary" />}
                label={i18n.t("smartDocuments.statusDialog.notifyUsers")}
              />
            </RadioGroup>
            {notificationMode === "users" && (
              <Autocomplete
                multiple
                options={notificationUsers}
                value={selectedNotificationUsers}
                loading={notificationUsersLoading}
                getOptionLabel={(option) =>
                  `${option.name} · ${option.email || option.profile}`
                }
                onChange={(_, value) => setSelectedNotificationUsers(value)}
                renderOption={(option) => (
                  <div>
                    <Typography variant="body2">{option.name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {option.email} · {option.profile}
                      {option.queues?.length
                        ? ` · ${option.queues
                            .map((queue) => queue.name)
                            .join(", ")}`
                        : ` · ${i18n.t(
                            "smartDocuments.statusDialog.noDepartment"
                          )}`}
                    </Typography>
                  </div>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={i18n.t("smartDocuments.statusDialog.recipientUsers")}
                    placeholder={i18n.t(
                      "smartDocuments.statusDialog.searchByNameOrEmail"
                    )}
                    variant="outlined"
                    margin="dense"
                    helperText={i18n.t(
                      "smartDocuments.statusDialog.recipientHelper"
                    )}
                  />
                )}
              />
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDocument(null)}>
            {i18n.t("smartDocuments.buttons.cancel")}
          </Button>
          <Button
            color="primary"
            variant="contained"
            disabled={
              !nextDocumentStatus ||
              nextDocumentStatus === (statusDocument?.status || "generated")
            }
            onClick={handleStatusChange}
          >
            {i18n.t("smartDocuments.statusDialog.saveStatus")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(historyDocument)}
        onClose={() => setHistoryDocument(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {i18n.t("smartDocuments.historyDialog.title")} ·{" "}
          {historyDocument?.title ||
            i18n.t("smartDocuments.historyDialog.documentFallback")}
        </DialogTitle>
        <DialogContent dividers>
          {historyLoading && (
            <Typography color="textSecondary">
              {i18n.t("smartDocuments.historyDialog.loading")}
            </Typography>
          )}
          {!historyLoading && documentEvents.length === 0 && (
            <Typography color="textSecondary">
              {i18n.t("smartDocuments.historyDialog.empty")}
            </Typography>
          )}
          {documentEvents.map((event) => (
            <div className={classes.generationSection} key={event.id}>
              <Typography variant="subtitle2">
                {documentEventLabel(event.eventType)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {new Date(event.createdAt).toLocaleString()} ·{" "}
                {event.user?.name ||
                  i18n.t("smartDocuments.historyDialog.system")}
              </Typography>
              {(event.previousStatus || event.newStatus) && (
                <Typography variant="body2">
                  {event.previousStatus
                    ? documentStatusLabel(
                        getDocumentStatus(event.previousStatus).value
                      )
                    : i18n.t("smartDocuments.historyDialog.noPreviousStatus")}
                  {" → "}
                  {event.newStatus
                    ? documentStatusLabel(
                        getDocumentStatus(event.newStatus).value
                      )
                    : i18n.t("smartDocuments.historyDialog.noStatusChange")}
                </Typography>
              )}
              {event.comment && (
                <Typography variant="body2">{event.comment}</Typography>
              )}
            </div>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDocument(null)}>
            {i18n.t("smartDocuments.buttons.close")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(downloadingDocument)}
        onClose={() => setDownloadingDocument(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {i18n.t("smartDocuments.downloadDialog.title")}
        </DialogTitle>
        <DialogContent>
          <Typography color="textSecondary">
            {i18n.t("smartDocuments.downloadDialog.body")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDownloadingDocument(null)}>
            {i18n.t("smartDocuments.buttons.cancel")}
          </Button>
          {canCreateDocuments &&
            downloadingDocument?.mimeType ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && (
            <Button
              color="primary"
              variant="outlined"
              onClick={() => handleDownload(downloadingDocument, "docx")}
            >
              {i18n.t("smartDocuments.buttons.downloadDocx")}
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
              {i18n.t("smartDocuments.buttons.downloadPdf")}
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
                {i18n.t("smartDocuments.buttons.downloadOriginal")}
              </Button>
            )}
        </DialogActions>
      </Dialog>

      <ConfirmationModal
        title={
          deletingTemplate
            ? i18n.t("smartDocuments.confirm.deleteTemplateTitle", {
                name: deletingTemplate.name,
              })
            : i18n.t("smartDocuments.confirm.deleteTemplateTitleDefault")
        }
        open={templateConfirmOpen}
        onClose={setTemplateConfirmOpen}
        onConfirm={handleDeleteTemplate}
      >
        {i18n.t("smartDocuments.confirm.deleteTemplateBody")}
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
            ? i18n.t("smartDocuments.generateDialog.titleReview")
            : generationStage === "success"
            ? i18n.t("smartDocuments.generateDialog.titleSuccess")
            : i18n.t("smartDocuments.generateDialog.titleForm")}
        </DialogTitle>
        <DialogContent>
          {generationStage === "form" && (
            <>
          <Typography color="textSecondary" gutterBottom>
            {i18n.t("smartDocuments.generateDialog.intro")}
          </Typography>
          <FormControl variant="outlined" margin="dense" fullWidth>
            <InputLabel>{i18n.t("smartDocuments.fields.purpose")}</InputLabel>
            <Select
              value={generationPurpose}
              onChange={(event) => {
                setGenerationPurpose(event.target.value);
                setSelectedTemplate(null);
              }}
              label={i18n.t("smartDocuments.fields.purpose")}
            >
              {documentPurposes
                .filter((purpose) => purpose.value)
                .map((purpose) => (
                  <MenuItem key={purpose.value} value={purpose.value}>
                    {purposeLabel(purpose.value)}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl variant="outlined" margin="dense" fullWidth>
            <InputLabel>
              {i18n.t("smartDocuments.generateDialog.documentToGenerate")}
            </InputLabel>
            <Select
              value={selectedTemplate?.id || ""}
              onChange={(event) =>
                selectGenerationTemplate(event.target.value)
              }
              label={i18n.t("smartDocuments.generateDialog.documentToGenerate")}
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
                  {i18n.t("smartDocuments.generateDialog.missingExpectedWarning", {
                    variables:
                      selectedTemplate.missingExpectedVariables.join(", "),
                  })}
                </Typography>
              )}
              {!requiredRecipientMode && (
                <FormControl variant="outlined" margin="dense" fullWidth>
                  <InputLabel>
                    {i18n.t("smartDocuments.fields.recipient")}
                  </InputLabel>
                  <Select
                    value={recipientMode}
                    onChange={(event) =>
                      handleRecipientModeChange(event.target.value)
                    }
                    label={i18n.t("smartDocuments.fields.recipient")}
                  >
                    <MenuItem value="client">
                      {i18n.t("smartDocuments.recipients.client")}
                    </MenuItem>
                    <MenuItem value="collaborator">
                      {i18n.t("smartDocuments.recipients.collaborator")}
                    </MenuItem>
                    {!selectedTemplate.requiresClient && (
                      <MenuItem value="manual">
                        {i18n.t("smartDocuments.recipients.manual")}
                      </MenuItem>
                    )}
                    {selectedTemplate.allowGenericRecipient && (
                      <MenuItem value="generic">
                        {i18n.t("smartDocuments.recipients.generic")}
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              )}
              {recipientMode === "client" && (
                <FormControl variant="outlined" margin="dense" fullWidth>
                  <InputLabel>
                    {i18n.t("smartDocuments.fields.client")}
                  </InputLabel>
                  <Select
                    value={generationBusinessClientId}
                    onChange={(event) =>
                      handleGenerationClientChange(event.target.value)
                    }
                    label={i18n.t("smartDocuments.fields.client")}
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
                  <InputLabel>
                    {i18n.t("smartDocuments.fields.collaborator")}
                  </InputLabel>
                  <Select
                    value={generationCollaboratorId}
                    onChange={(event) =>
                      handleGenerationCollaboratorChange(event.target.value)
                    }
                    label={i18n.t("smartDocuments.fields.collaborator")}
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
            label={i18n.t("smartDocuments.fields.documentName")}
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
                <div className={classes.generationSection} key={group.key}>
                  <Typography
                    className={classes.generationSectionTitle}
                    variant="subtitle2"
                  >
                    {recipientMode === "collaborator" &&
                    ["clientData", "recipientData"].includes(group.key)
                      ? i18n.t("smartDocuments.variableGroups.collaboratorData")
                      : group.key === "ecosystemScope"
                      ? i18n.t(
                          `smartDocuments.scopeLabels.${selectedTemplate.documentType}`,
                          {
                            defaultValue: i18n.t(
                              "smartDocuments.variableGroups.ecosystemScope"
                            ),
                          }
                        )
                      : i18n.t(`smartDocuments.variableGroups.${group.key}`)}
                  </Typography>
                  {group.variables.map((variable) =>
                    variable === "FREELANCE_DENOMINACION" ? (
                      <FormControl
                        key={variable}
                        variant="outlined"
                        margin="dense"
                        fullWidth
                      >
                        <InputLabel>
                          {`${i18n.t(
                            "smartDocuments.fields.contractualDenomination"
                          )} *`}
                        </InputLabel>
                        <Select
                          value={generationValues[variable] || ""}
                          onChange={(event) =>
                            setGenerationValues((current) => ({
                              ...current,
                              [variable]: event.target.value,
                            }))
                          }
                          label={`${i18n.t(
                            "smartDocuments.fields.contractualDenomination"
                          )} *`}
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
                  {i18n.t("smartDocuments.generateDialog.noVisualType")}
                </Typography>
              )}
              <TextField
                label={i18n.t("smartDocuments.generateDialog.variablesJson")}
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
              label={i18n.t("smartDocuments.generateDialog.technicalMode")}
            />
          )}
            </>
          )}
          {generationStage === "summary" && selectedTemplate && (
            <>
              <Typography color="textSecondary">
                {i18n.t("smartDocuments.generateDialog.summaryIntro")}
              </Typography>
              <div className={classes.generationSummary}>
                <div className={classes.generationSummaryCard}>
                  <Typography variant="caption" color="textSecondary">
                    {i18n.t("smartDocuments.generateDialog.summaryDocumentType")}
                  </Typography>
                  <Typography>
                    {documentTypeLabel(selectedTemplate.documentType) ||
                      i18n.t("smartDocuments.generateDialog.otherTechnical")}
                  </Typography>
                </div>
                <div className={classes.generationSummaryCard}>
                  <Typography variant="caption" color="textSecondary">
                    {i18n.t("smartDocuments.generateDialog.summaryTemplate")}
                  </Typography>
                  <Typography>{selectedTemplate.name}</Typography>
                </div>
                <div className={classes.generationSummaryCard}>
                  <Typography variant="caption" color="textSecondary">
                    {i18n.t("smartDocuments.fields.recipient")}
                  </Typography>
                  <Typography>
                    {selectedGenerationClient?.displayName ||
                      selectedGenerationCollaborator?.fullName ||
                      (recipientMode === "generic"
                        ? i18n.t("smartDocuments.recipients.generic")
                        : i18n.t("smartDocuments.recipients.manual"))}
                  </Typography>
                </div>
                <div className={classes.generationSummaryCard}>
                  <Typography variant="caption" color="textSecondary">
                    {i18n.t("smartDocuments.generateDialog.availableFormats")}
                  </Typography>
                  <Typography>
                    {i18n.t("smartDocuments.generateDialog.docxAndPdf")}
                  </Typography>
                </div>
                <div className={classes.generationSummaryCard}>
                  <Typography variant="caption" color="textSecondary">
                    {i18n.t("smartDocuments.generateDialog.completeVariables")}
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
                    {i18n.t("smartDocuments.generateDialog.missingVariables")}
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
                      <Typography>
                        {i18n.t("smartDocuments.generateDialog.noPendingFields")}
                      </Typography>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
          {generationStage === "success" && generatedDocument && (
            <>
              <Typography>
                {i18n.t("smartDocuments.generateDialog.successMessage")}
              </Typography>
              <div className={classes.generationResultActions}>
                {canCreateDocuments && (
                  <Button
                    color="primary"
                    variant="outlined"
                    onClick={() => handleDownload(generatedDocument, "docx")}
                  >
                    {i18n.t("smartDocuments.buttons.downloadDocx")}
                  </Button>
                )}
                <Button
                  color="primary"
                  variant="contained"
                  onClick={() => handleDownload(generatedDocument, "pdf")}
                >
                  {i18n.t("smartDocuments.buttons.downloadPdf")}
                </Button>
                <Button
                  onClick={() => {
                    setGenerateDialogOpen(false);
                    setActiveTab(0);
                  }}
                >
                  {i18n.t("smartDocuments.generateDialog.viewInDocuments")}
                </Button>
                {generatedDocument.businessClient && (
                  <Button onClick={() => history.push("/business-clients")}>
                    {i18n.t("smartDocuments.generateDialog.viewRelatedClient")}
                  </Button>
                )}
                {generatedDocument.collaborator && (
                  <Button onClick={() => history.push("/collaborators")}>
                    {i18n.t(
                      "smartDocuments.generateDialog.viewRelatedCollaborator"
                    )}
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
                {i18n.t("smartDocuments.buttons.cancel")}
              </Button>
              <Button
                color="primary"
                variant="contained"
                disabled={saving || !selectedTemplate}
                onClick={handleReviewGeneration}
              >
                {i18n.t("smartDocuments.buttons.review")}
              </Button>
            </>
          )}
          {generationStage === "summary" && (
            <>
              <Button onClick={() => setGenerationStage("form")}>
                {i18n.t("smartDocuments.buttons.back")}
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
                {saving
                  ? i18n.t("smartDocuments.generateDialog.generating")
                  : i18n.t("smartDocuments.generateDialog.confirmAndGenerate")}
              </Button>
            </>
          )}
          {generationStage === "success" && (
            <Button onClick={() => setGenerateDialogOpen(false)}>
              {i18n.t("smartDocuments.buttons.close")}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <MainHeader>
        <Title>{i18n.t("smartDocuments.title")}</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            placeholder={
              activeTab === 0
                ? i18n.t("smartDocuments.search.document")
                : i18n.t("smartDocuments.search.template")
            }
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
          {activeTab === 0 && (
            <FormControl variant="outlined" size="small">
              <InputLabel>{i18n.t("smartDocuments.filters.status")}</InputLabel>
              <Select
                value={documentStatusFilter}
                onChange={(event) =>
                  setDocumentStatusFilter(event.target.value)
                }
                label={i18n.t("smartDocuments.filters.status")}
              >
                <MenuItem value="">
                  {i18n.t("smartDocuments.filters.allStatuses")}
                </MenuItem>
                {documentStatusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {documentStatusLabel(option.value)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {canCreateDocuments && (
            <Button
              color="primary"
              variant="contained"
              onClick={openGenerationWizard}
            >
              {i18n.t("smartDocuments.buttons.generateDocument")}
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
          <Tab label={i18n.t("smartDocuments.tabs.documents")} />
          {canCreateDocuments && (
            <Tab label={i18n.t("smartDocuments.tabs.templates")} />
          )}
        </Tabs>
      </Paper>

      {installRequired && (
        <Paper className={classes.installWarning} variant="outlined">
          <Typography variant="h6">
            {i18n.t("smartDocuments.install.title")}
          </Typography>
          <Typography color="textSecondary">
            {i18n.t("smartDocuments.install.body")}
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
                  label={purposeLabel(purpose.value)}
                />
              ))}
            </Tabs>
          </Paper>
          {canCreateDocuments && (
          <Paper className={classes.uploadPanel} variant="outlined">
            <TextField
              label={i18n.t("smartDocuments.fields.documentName")}
              variant="outlined"
              size="small"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <TextField
              label={i18n.t("smartDocuments.fields.category")}
              variant="outlined"
              size="small"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
            <FormControl variant="outlined" size="small">
              <InputLabel>{i18n.t("smartDocuments.fields.usage")}</InputLabel>
              <Select
                value={uploadPurpose}
                onChange={(event) => setUploadPurpose(event.target.value)}
                label={i18n.t("smartDocuments.fields.usage")}
              >
                {documentPurposes
                  .filter((purpose) => purpose.value)
                  .map((purpose) => (
                    <MenuItem key={purpose.value} value={purpose.value}>
                      {purposeLabel(purpose.value)}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            {canManageClientLinks && (
              <FormControl variant="outlined" size="small">
                <InputLabel>
                  {i18n.t("smartDocuments.fields.businessClient")}
                </InputLabel>
                <Select
                  value={selectedBusinessClientId}
                  onChange={(event) =>
                    setSelectedBusinessClientId(event.target.value)
                  }
                  label={i18n.t("smartDocuments.fields.businessClient")}
                  disabled={!associationInstalled}
                >
                  <MenuItem value="">
                    {i18n.t("smartDocuments.upload.noClientAssociated")}
                  </MenuItem>
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
                  {file
                    ? i18n.t("smartDocuments.buttons.changeFile")
                    : i18n.t("smartDocuments.buttons.selectFile")}
                </Button>
              </label>
              <Button
                color="primary"
                variant="contained"
                disabled={saving || !file}
                onClick={handleUpload}
              >
                {i18n.t("smartDocuments.buttons.save")}
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
                  <TableCell>{i18n.t("smartDocuments.table.document")}</TableCell>
                  <TableCell>{i18n.t("smartDocuments.table.category")}</TableCell>
                  <TableCell>{i18n.t("smartDocuments.table.usage")}</TableCell>
                  <TableCell>{i18n.t("smartDocuments.table.status")}</TableCell>
                  <TableCell>{i18n.t("smartDocuments.table.client")}</TableCell>
                  <TableCell>
                    {i18n.t("smartDocuments.table.uploadedBy")}
                  </TableCell>
                  <TableCell>{i18n.t("smartDocuments.table.size")}</TableCell>
                  <TableCell>{i18n.t("smartDocuments.table.date")}</TableCell>
                  <TableCell align="center">
                    {i18n.t("smartDocuments.table.actions")}
                  </TableCell>
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
                        i18n.t("smartDocuments.common.general")
                      )}
                    </TableCell>
                    <TableCell>{purposeLabel(document.purpose)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={documentStatusLabel(
                          getDocumentStatus(document.status).value
                        )}
                        style={{
                          color: getDocumentStatus(document.status).color,
                          borderColor: getDocumentStatus(document.status).color,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {document.businessClient?.displayName ||
                        i18n.t("smartDocuments.table.unassigned")}
                    </TableCell>
                    <TableCell>{document.uploadedBy?.name || "-"}</TableCell>
                    <TableCell>{formatSize(document.size)}</TableCell>
                    <TableCell>
                      {new Date(document.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        title={i18n.t("smartDocuments.actions.viewHistory")}
                        onClick={() => openDocumentHistory(document)}
                      >
                        <HistoryOutlinedIcon />
                      </IconButton>
                      {canCreateDocuments && (
                        <IconButton
                          size="small"
                          title={i18n.t("smartDocuments.actions.changeStatus")}
                          onClick={() => openStatusDialog(document)}
                        >
                          <SwapHorizOutlinedIcon />
                        </IconButton>
                      )}
                      {(canCreateDocuments ||
                        [
                          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                          "application/pdf",
                        ].includes(document.mimeType)) && (
                        <IconButton
                          size="small"
                          title={i18n.t(
                            "smartDocuments.actions.downloadDocument"
                          )}
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
                      <TableCell colSpan={9}>
                      <div className={classes.emptyState}>
                        <Typography color="textSecondary">
                          {i18n.t("smartDocuments.emptyDocuments")}
                        </Typography>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {loading && <TableRowSkeleton columns={9} />}
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
                  label={purposeLabel(purpose.value)}
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
              label={i18n.t("smartDocuments.fields.templateName")}
              variant="outlined"
              size="small"
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
            />
            <TextField
              label={i18n.t("smartDocuments.fields.category")}
              variant="outlined"
              size="small"
              value={templateCategory}
              onChange={(event) => setTemplateCategory(event.target.value)}
            />
            <FormControl variant="outlined" size="small">
              <InputLabel>{i18n.t("smartDocuments.fields.purpose")}</InputLabel>
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
                label={i18n.t("smartDocuments.fields.purpose")}
              >
                {documentPurposes
                  .filter((purpose) => purpose.value)
                  .map((purpose) => (
                    <MenuItem key={purpose.value} value={purpose.value}>
                      {purposeLabel(purpose.value)}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <FormControl variant="outlined" size="small">
              <InputLabel>
                {i18n.t("smartDocuments.fields.documentType")}
              </InputLabel>
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
                label={i18n.t("smartDocuments.fields.documentType")}
              >
                {documentTypes
                  .filter((item) => item.purpose === templatePurpose)
                  .map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {documentTypeLabel(item.value)}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            {templatePurpose === "nda" ? (
              <TextField
                label={i18n.t("smartDocuments.fields.ecosystem")}
                value={i18n.t("smartDocuments.template.ndaEcosystem")}
                variant="outlined"
                size="small"
                disabled
              />
            ) : (
              <FormControl variant="outlined" size="small">
                <InputLabel>
                  {i18n.t("smartDocuments.fields.ecosystem")}
                </InputLabel>
                <Select
                  value={templateEcosystemId}
                  onChange={(event) =>
                    setTemplateEcosystemId(event.target.value)
                  }
                  label={i18n.t("smartDocuments.fields.ecosystem")}
                >
                  <MenuItem value="">
                    {i18n.t("smartDocuments.common.general")}
                  </MenuItem>
                  {ecosystems.map((ecosystem) => (
                    <MenuItem key={ecosystem.id} value={ecosystem.id}>
                      {ecosystem.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField
              label={i18n.t("smartDocuments.fields.requiredVariables")}
              placeholder="NOMBRE_CLIENTE, CEDULA_CLIENTE"
              variant="outlined"
              size="small"
              value={templateRequiredVariables}
              onChange={(event) => setTemplateRequiredVariables(event.target.value)}
              helperText={
                getTypeVariables(templateDocumentType).length
                  ? i18n.t("smartDocuments.template.requiredVariablesHelperTyped")
                  : i18n.t("smartDocuments.template.requiredVariablesHelperEmpty")
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
                label={i18n.t("smartDocuments.template.requiresClient")}
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
                label={i18n.t("smartDocuments.template.allowGenericRecipient")}
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
                  {templateFile
                    ? i18n.t("smartDocuments.buttons.changeDocx")
                    : i18n.t("smartDocuments.buttons.selectDocx")}
                </Button>
              </label>
              <Button
                color="primary"
                variant="contained"
                disabled={saving || !templateFile}
                onClick={handleUploadTemplate}
                style={{ marginLeft: 8 }}
              >
                {i18n.t("smartDocuments.buttons.save")}
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
                  <TableCell>{i18n.t("smartDocuments.table.template")}</TableCell>
                  <TableCell>
                    {i18n.t("smartDocuments.table.usageAndType")}
                  </TableCell>
                  <TableCell>
                    {i18n.t("smartDocuments.table.ecosystem")}
                  </TableCell>
                  <TableCell>{i18n.t("smartDocuments.table.category")}</TableCell>
                  <TableCell>
                    {i18n.t("smartDocuments.table.variables")}
                  </TableCell>
                  <TableCell>
                    {i18n.t("smartDocuments.table.createdBy")}
                  </TableCell>
                  <TableCell>{i18n.t("smartDocuments.table.updated")}</TableCell>
                  <TableCell align="center">
                    {i18n.t("smartDocuments.table.actions")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map((template) => {
                  const activeVersion = getActiveVersion(template);
                  const variables = activeVersion?.detectedVariables || [];
                  const requiredVariables =
                    activeVersion?.requiredVariables || [];
                  const missingVariables =
                    template.missingExpectedVariables || [];
                  const completeVariables = Array.from(
                    new Set([...requiredVariables, ...variables])
                  );
                  const expectedVariables = template.expectedVariables || [];
                  const additionalVariables = variables.filter(
                    (variable) =>
                      !expectedVariables.includes(variable) &&
                      !requiredVariables.includes(variable)
                  );
                  const variablesExpanded =
                    expandedVariableTemplateId === template.id;
                  const missingCountLabel = i18n.t(
                    missingVariables.length === 1
                      ? "smartDocuments.template.missingCountOne"
                      : "smartDocuments.template.missingCountMany",
                    { count: missingVariables.length }
                  );
                  const additionalCountLabel = i18n.t(
                    additionalVariables.length === 1
                      ? "smartDocuments.template.additionalCountOne"
                      : "smartDocuments.template.additionalCountMany",
                    { count: additionalVariables.length }
                  );
                  const variableStatus = missingVariables.length
                    ? missingCountLabel
                    : additionalVariables.length
                    ? `${i18n.t(
                        "smartDocuments.template.complete"
                      )} · ${additionalCountLabel}`
                    : i18n.t("smartDocuments.template.complete");
                  return (
                    <TableRow key={template.id}>
                      <TableCell>
                        <Typography className={classes.fileName}>
                          {template.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {i18n.t("smartDocuments.template.version", {
                            version: activeVersion?.version || "-",
                          })}
                        </Typography>
                        {template.missingExpectedVariables?.length > 0 && (
                          <Typography variant="caption" color="error" display="block">
                            {i18n.t(
                              template.missingExpectedVariables.length === 1
                                ? "smartDocuments.template.missingExpectedOne"
                                : "smartDocuments.template.missingExpectedMany",
                              {
                                count:
                                  template.missingExpectedVariables.length,
                              }
                            )}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography>{purposeLabel(template.purpose)}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {documentTypeLabel(template.documentType) ||
                            i18n.t("smartDocuments.template.noSpecificType")}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {template.ecosystem?.name ||
                          i18n.t("smartDocuments.common.general")}
                      </TableCell>
                      <TableCell>
                        {template.category ? (
                          <Chip size="small" label={template.category} />
                        ) : (
                          i18n.t("smartDocuments.common.general")
                        )}
                      </TableCell>
                      <TableCell>
                        <div className={classes.variableReview}>
                          <Button
                            size="small"
                            variant="outlined"
                            color={missingVariables.length ? "secondary" : "primary"}
                            onClick={() =>
                              setExpandedVariableTemplateId(
                                variablesExpanded ? null : template.id
                              )
                            }
                          >
                            {i18n.t("smartDocuments.template.reviewVariables")} ·{" "}
                            {variableStatus}
                          </Button>
                          {variablesExpanded && (
                            <div className={classes.variableReviewPanel}>
                              {[
                                { key: "varUsed", items: variables },
                                { key: "varComplete", items: completeVariables },
                                { key: "varMissing", items: missingVariables },
                                {
                                  key: "varAdditional",
                                  items: additionalVariables,
                                },
                              ].map(({ key, items }) => (
                                <div key={key}>
                                  <Typography
                                    variant="caption"
                                    color="textSecondary"
                                    display="block"
                                  >
                                    {i18n.t(`smartDocuments.template.${key}`)}
                                  </Typography>
                                  <div className={classes.variableList}>
                                    {items.length ? (
                                      items.map((variable) => (
                                        <Chip
                                          key={`${key}-${variable}`}
                                          size="small"
                                          label={variable}
                                        />
                                      ))
                                    ) : (
                                      <Typography variant="caption">
                                        {i18n.t("smartDocuments.common.none")}
                                      </Typography>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
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
                            title={i18n.t(
                              "smartDocuments.actions.deleteTemplate"
                            )}
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
                          {i18n.t("smartDocuments.emptyTemplates")}
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
