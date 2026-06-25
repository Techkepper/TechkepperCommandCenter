import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  makeStyles,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditOutlinedIcon from "@material-ui/icons/EditOutlined";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import GetAppOutlinedIcon from "@material-ui/icons/GetAppOutlined";
import HistoryOutlinedIcon from "@material-ui/icons/HistoryOutlined";
import VisibilityOutlinedIcon from "@material-ui/icons/VisibilityOutlined";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";

import { AuthContext } from "../../context/Auth/AuthContext";
import toastError from "../../errors/toastError";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import api from "../../services/api";

const useStyles = makeStyles((theme) => ({
  paper: { flex: 1, overflow: "auto", ...theme.scrollbarStyles },
  headerActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    flex: "1 1 420px",
    "& .MuiTextField-root": {
      flex: "1 1 260px",
      minWidth: 220,
      maxWidth: 360,
    },
    "& .MuiButton-root": {
      minWidth: 168,
      whiteSpace: "nowrap",
    },
    [theme.breakpoints.down("xs")]: {
      flexBasis: "100%",
      "& .MuiTextField-root, & .MuiButton-root": {
        flex: "1 1 100%",
        minWidth: "100%",
        maxWidth: "100%",
      },
    },
  },
  filters: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: theme.spacing(1.25),
    padding: theme.spacing(1.25),
    marginBottom: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 12,
    backgroundColor:
      theme.palette.type === "dark"
        ? "rgba(255, 255, 255, 0.025)"
        : theme.palette.background.paper,
    "& .MuiFormControl-root": {
      flex: "1 1 150px",
      minWidth: 150,
      maxWidth: 220,
    },
    "& .MuiTextField-root": {
      flex: "1 1 165px",
      minWidth: 165,
      maxWidth: 210,
    },
    [theme.breakpoints.down("xs")]: {
      "& .MuiFormControl-root, & .MuiTextField-root": {
        flex: "1 1 100%",
        minWidth: "100%",
        maxWidth: "100%",
      },
    },
  },
  section: { marginBottom: theme.spacing(1) },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: theme.spacing(1),
    width: "100%",
    [theme.breakpoints.down("sm")]: { gridTemplateColumns: "1fr" },
  },
  full: { gridColumn: "1 / -1" },
  itemCard: {
    padding: theme.spacing(1.5),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    marginBottom: theme.spacing(1),
  },
  actions: { display: "flex", gap: theme.spacing(1), flexWrap: "wrap" },
  totals: {
    padding: theme.spacing(2),
    border: "1px solid rgba(95, 175, 58, 0.35)",
    borderRadius: 8,
    background: "rgba(95, 175, 58, 0.06)",
  },
  warning: { color: theme.palette.warning.main },
  event: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1, 0),
  },
}));

const statuses = [
  ["draft", "Borrador"],
  ["in_review", "En revisión"],
  ["sent", "Enviada"],
  ["accepted", "Aceptada"],
  ["rejected", "Rechazada"],
  ["expired", "Vencida"],
  ["converted_to_contract", "Convertida a contrato"],
  ["archived", "Archivada"],
];

const emptyItem = () => ({
  title: "",
  description: "",
  includedItemsText: "",
  subtotal: 0,
  isIncluded: true,
});

const emptyMilestone = () => ({
  name: "",
  percentage: 0,
  description: "",
});

const initialForm = () => ({
  businessClientId: "",
  manualMode: false,
  manualClientName: "",
  manualClientEmail: "",
  manualClientPhone: "",
  manualClientIdentification: "",
  clientNumber: "",
  proposalNumber: "",
  offerDate: new Date().toISOString().slice(0, 10),
  title: "",
  introduction: "",
  identifiedNeed: "",
  generalScope: "",
  investmentAnalysis: "",
  currency: "USD",
  desiredNetAmount: 0,
  sellerCommissionRate: 0,
  externalCosts: 0,
  thirdPartyLicenses: 0,
  additionalMarginRate: 0,
  discountAmount: 0,
  ivaRate: 13,
  manualSubtotal: "",
  roundFinalPrice: false,
  showIvi: false,
  paymentTermsText: "",
  projectTimeline: "",
  termsText: "",
  futureRecommendation: "",
  queueId: "",
  items: [emptyItem()],
  milestones: [
    { name: "Pago inicial", percentage: 40, description: "" },
    {
      name: "Segundo pago contra avance funcional",
      percentage: 30,
      description: "",
    },
    { name: "Pago final contra entrega", percentage: 30, description: "" },
  ],
});

const calculate = (form) => {
  const n = (value) => Number(value || 0);
  const divisor =
    1 - n(form.sellerCommissionRate) / 100 - n(form.additionalMarginRate) / 100;
  if (divisor <= 0) return { invalid: true };
  let recommendedSubtotal =
    (n(form.desiredNetAmount) +
      n(form.externalCosts) +
      n(form.thirdPartyLicenses)) /
    divisor;
  if (form.roundFinalPrice)
    recommendedSubtotal = Math.ceil(recommendedSubtotal);
  const itemSubtotal = form.items
    .filter((item) => item.isIncluded)
    .reduce((sum, item) => sum + n(item.subtotal), 0);
  const base =
    form.manualSubtotal !== ""
      ? n(form.manualSubtotal)
      : itemSubtotal > 0
        ? itemSubtotal
        : recommendedSubtotal;
  const subtotal = Math.max(0, base - n(form.discountAmount));
  const commission = subtotal * (n(form.sellerCommissionRate) / 100);
  const net =
    subtotal - commission - n(form.externalCosts) - n(form.thirdPartyLicenses);
  const iva = subtotal * (n(form.ivaRate) / 100);
  return {
    recommendedSubtotal,
    subtotal,
    commission,
    net,
    iva,
    total: subtotal + iva,
    belowDesired: net < n(form.desiredNetAmount),
    invalid: false,
  };
};

const money = (value, currency) =>
  `${currency} ${Number(value || 0).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const serializeForm = (form) => ({
  ...form,
  businessClientId: form.manualMode
    ? null
    : Number(form.businessClientId) || null,
  manualClientName: form.manualMode ? form.manualClientName : null,
  manualClientEmail: form.manualMode ? form.manualClientEmail : null,
  manualClientPhone: form.manualMode ? form.manualClientPhone : null,
  manualClientIdentification: form.manualMode
    ? form.manualClientIdentification
    : null,
  queueId: Number(form.queueId) || null,
  manualSubtotal:
    form.manualSubtotal === "" ? null : Number(form.manualSubtotal),
  items: form.items.map(({ includedItemsText, ...item }) => ({
    ...item,
    subtotal: Number(item.subtotal || 0),
    includedItems: includedItemsText
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean),
  })),
  milestones: form.milestones.map((milestone) => ({
    ...milestone,
    percentage: Number(milestone.percentage || 0),
  })),
});

const proposalToForm = (proposal) => ({
  ...initialForm(),
  ...proposal,
  businessClientId: proposal.businessClientId || "",
  manualMode: !proposal.businessClientId,
  queueId: proposal.queueId || "",
  manualSubtotal:
    Number(proposal.subtotal || 0) + Number(proposal.discountAmount || 0) || "",
  items: proposal.items.map((item) => ({
    ...item,
    includedItemsText: (() => {
      try {
        return JSON.parse(item.includedItems || "[]").join("\n");
      } catch {
        return "";
      }
    })(),
  })),
  milestones: proposal.milestones,
});

const CommercialProposals = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const canManage = user.profile === "admin" || user.profile === "supervisor";
  const canArchive = user.profile === "admin";
  const [proposals, setProposals] = useState([]);
  const [clients, setClients] = useState([]);
  const [queues, setQueues] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchParam, setSearchParam] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState(initialForm());
  const [editingId, setEditingId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [events, setEvents] = useState([]);
  const [statusProposal, setStatusProposal] = useState(null);
  const [nextStatus, setNextStatus] = useState("");
  const [statusComment, setStatusComment] = useState("");
  const [notificationUserIds, setNotificationUserIds] = useState([]);
  const [proposalToDelete, setProposalToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const totals = useMemo(() => calculate(form), [form]);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/commercial-proposals", {
        params: {
          searchParam,
          status: statusFilter || undefined,
          currency: currencyFilter || undefined,
          businessClientId: clientFilter || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        },
      });
      setProposals(data.proposals);
    } catch (error) {
      toastError(error);
    }
  }, [
    searchParam,
    statusFilter,
    currencyFilter,
    clientFilter,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    const delay = setTimeout(() => load(), 250);
    return () => clearTimeout(delay);
  }, [load]);

  useEffect(() => {
    api
      .get("/business-clients", { params: { status: "active" } })
      .then(({ data }) => setClients(data.clients))
      .catch(toastError);
    api
      .get("/queue")
      .then(({ data }) => {
        const allowedQueues =
          user.profile === "admin"
            ? data
            : data.filter((queue) =>
                (user.queues || []).some(
                  (assignedQueue) => assignedQueue.id === queue.id,
                ),
              );
        setQueues(allowedQueues);
      })
      .catch(toastError);
  }, [user.profile, user.queues]);

  useEffect(() => {
    const proposalId = new URLSearchParams(location.search).get("proposalId");
    if (proposalId) openDetail(proposalId);
    const editProposalId = new URLSearchParams(location.search).get(
      "editProposalId"
    );
    if (editProposalId && canManage) openEdit(editProposalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const change = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const updateItem = (index, field, value) =>
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));

  const updateMilestone = (index, field, value) =>
    setForm((current) => ({
      ...current,
      milestones: current.milestones.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...initialForm(),
      queueId:
        user.profile === "supervisor" && queues.length === 1
          ? queues[0].id
          : "",
    });
    setEditorOpen(true);
  };

  const openEdit = async (proposalId) => {
    try {
      const { data } = await api.get(`/commercial-proposals/${proposalId}`);
      setEditingId(proposalId);
      setForm(proposalToForm(data));
      setEditorOpen(true);
    } catch (error) {
      toastError(error);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      if (totals.invalid) {
        toast.warn(
          "La comisión y el margen adicional deben sumar menos de 100%.",
        );
        return;
      }
      const payload = serializeForm(form);
      if (editingId) {
        await api.put(`/commercial-proposals/${editingId}`, payload);
      } else {
        await api.post("/commercial-proposals", payload);
      }
      toast.success("Propuesta guardada correctamente.");
      setEditorOpen(false);
      await load();
    } catch (error) {
      toastError(error);
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (proposalId) => {
    try {
      const [proposalResponse, eventsResponse] = await Promise.all([
        api.get(`/commercial-proposals/${proposalId}`),
        api.get(`/commercial-proposals/${proposalId}/events`),
      ]);
      setDetail(proposalResponse.data);
      setEvents(eventsResponse.data.events);
    } catch (error) {
      toastError(error);
    }
  };

  const generate = async (proposalId, variant) => {
    try {
      await api.post(`/commercial-proposals/${proposalId}/generate`, {
        variant,
      });
      toast.success(
        variant === "quick"
          ? "Cotización rápida generada con el machote oficial."
          : "Propuesta comercial generada con el machote oficial.",
      );
      await load();
      if (detail?.id === proposalId) await openDetail(proposalId);
    } catch (error) {
      toastError(error);
    }
  };

  const download = async (proposal, format) => {
    try {
      const { data } = await api.get(
        `/commercial-proposals/${proposal.id}/download`,
        { params: { format }, responseType: "blob" },
      );
      const url = URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${proposal.proposalNumber}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toastError(error);
    }
  };

  const openStatus = async (proposal) => {
    setStatusProposal(proposal);
    setNextStatus(proposal.status);
    setStatusComment("");
    setNotificationUserIds([]);
    try {
      const { data } = await api.get(
        `/commercial-proposals/${proposal.id}/notification-recipients`,
      );
      setUsers(data.users);
    } catch (error) {
      setUsers([]);
      toastError(error);
    }
  };

  const submitStatus = async () => {
    try {
      await api.patch(`/commercial-proposals/${statusProposal.id}/status`, {
        status: nextStatus,
        comment: statusComment,
        notificationUserIds,
      });
      toast.success("Estado comercial actualizado.");
      setStatusProposal(null);
      await load();
    } catch (error) {
      toastError(error);
    }
  };

  const removeProposal = async () => {
    if (!proposalToDelete) return;
    try {
      await api.delete(`/commercial-proposals/${proposalToDelete.id}`);
      toast.success("Propuesta eliminada correctamente.");
      setProposalToDelete(null);
      if (detail?.id === proposalToDelete.id) setDetail(null);
      await load();
    } catch (error) {
      toastError(error);
    }
  };

  return (
    <MainContainer>
      <MainHeader>
        <Title>Propuestas comerciales</Title>
        <MainHeaderButtonsWrapper>
          <div className={classes.headerActions}>
          <TextField
            size="small"
            variant="outlined"
            placeholder="Buscar propuesta"
            value={searchParam}
            onChange={(event) => setSearchParam(event.target.value)}
          />
          {canManage && (
            <Button
              color="primary"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreate}
            >
              Nueva propuesta
            </Button>
          )}
          </div>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <div className={classes.filters}>
        <FormControl variant="outlined" size="small">
          <InputLabel>Estado</InputLabel>
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            label="Estado"
          >
            <MenuItem value="">Todos</MenuItem>
            {statuses.map(([value, label]) => (
              <MenuItem value={value} key={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl variant="outlined" size="small">
          <InputLabel>Cliente</InputLabel>
          <Select
            value={clientFilter}
            onChange={(event) => setClientFilter(event.target.value)}
            label="Cliente"
          >
            <MenuItem value="">Todos</MenuItem>
            {clients.map((client) => (
              <MenuItem key={client.id} value={client.id}>
                {client.displayName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          variant="outlined"
          type="date"
          label="Desde"
          InputLabelProps={{ shrink: true }}
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
        />
        <TextField
          size="small"
          variant="outlined"
          type="date"
          label="Hasta"
          InputLabelProps={{ shrink: true }}
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
        />
        <FormControl variant="outlined" size="small">
          <InputLabel>Moneda</InputLabel>
          <Select
            value={currencyFilter}
            onChange={(event) => setCurrencyFilter(event.target.value)}
            label="Moneda"
          >
            <MenuItem value="">Todas</MenuItem>
            <MenuItem value="CRC">CRC</MenuItem>
            <MenuItem value="USD">USD</MenuItem>
          </Select>
        </FormControl>
      </div>

      <Paper className={classes.paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Título</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Creador</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proposals.map((proposal) => (
              <TableRow key={proposal.id}>
                <TableCell>{proposal.proposalNumber}</TableCell>
                <TableCell>
                  {proposal.businessClient?.displayName ||
                    proposal.manualClientName}
                </TableCell>
                <TableCell>{proposal.title}</TableCell>
                <TableCell>
                  {money(proposal.total, proposal.currency)}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={
                      statuses.find(
                        ([value]) => value === proposal.status,
                      )?.[1] || proposal.status
                    }
                  />
                </TableCell>
                <TableCell>{proposal.offerDate}</TableCell>
                <TableCell>{proposal.createdBy?.name}</TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => openDetail(proposal.id)}
                  >
                    <VisibilityOutlinedIcon />
                  </IconButton>
                  {canManage && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => openEdit(proposal.id)}
                      >
                        <EditOutlinedIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => openStatus(proposal)}
                      >
                        <HistoryOutlinedIcon />
                      </IconButton>
                      {canArchive && (
                        <IconButton
                          size="small"
                          title="Eliminar propuesta"
                          aria-label={`Eliminar ${proposal.proposalNumber}`}
                          onClick={() => setProposalToDelete(proposal)}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      )}
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!proposals.length && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No hay propuestas para mostrar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {editingId ? "Editar propuesta" : "Nueva propuesta comercial"}
        </DialogTitle>
        <DialogContent dividers>
          <ExpansionPanel defaultExpanded className={classes.section}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Datos del cliente y encabezado</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
              <div className={classes.grid}>
                <FormControlLabel
                  className={classes.full}
                  control={
                    <Switch
                      color="primary"
                      checked={form.manualMode}
                      onChange={(event) =>
                        change("manualMode", event.target.checked)
                      }
                    />
                  }
                  label="Propuesta rápida con cliente manual"
                />
                {!form.manualMode ? (
                  <FormControl variant="outlined">
                    <InputLabel>Cliente registrado</InputLabel>
                    <Select
                      value={form.businessClientId}
                      onChange={(event) =>
                        change("businessClientId", event.target.value)
                      }
                      label="Cliente registrado"
                    >
                      {clients.map((client) => (
                        <MenuItem key={client.id} value={client.id}>
                          {client.displayName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <>
                    <TextField
                      label="Nombre del cliente"
                      variant="outlined"
                      value={form.manualClientName}
                      onChange={(event) =>
                        change("manualClientName", event.target.value)
                      }
                    />
                    <TextField
                      label="Identificación"
                      variant="outlined"
                      value={form.manualClientIdentification}
                      onChange={(event) =>
                        change("manualClientIdentification", event.target.value)
                      }
                    />
                    <TextField
                      label="Correo"
                      variant="outlined"
                      value={form.manualClientEmail}
                      onChange={(event) =>
                        change("manualClientEmail", event.target.value)
                      }
                    />
                    <TextField
                      label="Teléfono"
                      variant="outlined"
                      value={form.manualClientPhone}
                      onChange={(event) =>
                        change("manualClientPhone", event.target.value)
                      }
                    />
                  </>
                )}
                {(form.manualMode || user.profile === "admin") && (
                  <FormControl variant="outlined">
                    <InputLabel>Departamento</InputLabel>
                    <Select
                      value={form.queueId}
                      onChange={(event) =>
                        change("queueId", event.target.value)
                      }
                      label="Departamento"
                    >
                      {user.profile === "admin" && (
                        <MenuItem value="">Global</MenuItem>
                      )}
                      {queues.map((queue) => (
                        <MenuItem key={queue.id} value={queue.id}>
                          {queue.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                <TextField
                  label="Número de cliente"
                  variant="outlined"
                  value={form.clientNumber}
                  onChange={(event) =>
                    change("clientNumber", event.target.value)
                  }
                />
                <TextField
                  label="Número de presupuesto"
                  variant="outlined"
                  value={
                    editingId
                      ? form.proposalNumber
                      : `PROP-${new Date().getFullYear()}-###`
                  }
                  disabled
                  helperText={
                    editingId
                      ? "El consecutivo no se puede modificar."
                      : "Se asignará automáticamente al guardar."
                  }
                />
                <TextField
                  label="Fecha de oferta"
                  type="date"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  value={form.offerDate}
                  onChange={(event) => change("offerDate", event.target.value)}
                />
                <TextField
                  label="Título de la propuesta"
                  variant="outlined"
                  value={form.title}
                  onChange={(event) => change("title", event.target.value)}
                />
              </div>
            </ExpansionPanelDetails>
          </ExpansionPanel>

          <ExpansionPanel className={classes.section}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Carta introductoria y alcance</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
              <div className={classes.grid}>
                {[
                  ["introduction", "Introducción"],
                  ["identifiedNeed", "Necesidad identificada"],
                  ["generalScope", "Alcance general"],
                  ["investmentAnalysis", "Análisis de inversión recomendada"],
                ].map(([field, label]) => (
                  <TextField
                    key={field}
                    className={classes.full}
                    label={label}
                    variant="outlined"
                    multiline
                    rows={3}
                    value={form[field]}
                    onChange={(event) => change(field, event.target.value)}
                  />
                ))}
              </div>
            </ExpansionPanelDetails>
          </ExpansionPanel>

          <ExpansionPanel defaultExpanded className={classes.section}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Rubros y fases</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails style={{ display: "block" }}>
              {form.items.map((item, index) => (
                <div className={classes.itemCard} key={`item-${index}`}>
                  <div className={classes.grid}>
                    <TextField
                      label={`Rubro ${index + 1}`}
                      variant="outlined"
                      value={item.title}
                      onChange={(event) =>
                        updateItem(index, "title", event.target.value)
                      }
                    />
                    <TextField
                      label="Subtotal"
                      type="number"
                      variant="outlined"
                      value={item.subtotal}
                      onChange={(event) =>
                        updateItem(index, "subtotal", event.target.value)
                      }
                    />
                    <TextField
                      className={classes.full}
                      label="Descripción"
                      variant="outlined"
                      multiline
                      value={item.description}
                      onChange={(event) =>
                        updateItem(index, "description", event.target.value)
                      }
                    />
                    <TextField
                      className={classes.full}
                      label="Incluye, un elemento por línea"
                      variant="outlined"
                      multiline
                      value={item.includedItemsText}
                      onChange={(event) =>
                        updateItem(
                          index,
                          "includedItemsText",
                          event.target.value,
                        )
                      }
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          color="primary"
                          checked={item.isIncluded}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "isIncluded",
                              event.target.checked,
                            )
                          }
                        />
                      }
                      label="Incluido"
                    />
                    {form.items.length > 1 && (
                      <IconButton
                        onClick={() =>
                          change(
                            "items",
                            form.items.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    )}
                  </div>
                </div>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => change("items", [...form.items, emptyItem()])}
              >
                Agregar rubro
              </Button>
            </ExpansionPanelDetails>
          </ExpansionPanel>

          <ExpansionPanel defaultExpanded className={classes.section}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Calculadora de rentabilidad</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
              <div className={classes.grid}>
                <FormControl variant="outlined">
                  <InputLabel>Moneda</InputLabel>
                  <Select
                    value={form.currency}
                    onChange={(event) => change("currency", event.target.value)}
                    label="Moneda"
                  >
                    <MenuItem value="CRC">CRC</MenuItem>
                    <MenuItem value="USD">USD</MenuItem>
                  </Select>
                </FormControl>
                {[
                  ["desiredNetAmount", "Neto deseado Techkepper"],
                  ["sellerCommissionRate", "Comisión vendedor %"],
                  ["externalCosts", "Costos externos"],
                  ["thirdPartyLicenses", "Licencias / terceros"],
                  ["additionalMarginRate", "Margen adicional %"],
                  ["discountAmount", "Descuento comercial"],
                  ["ivaRate", "IVA %"],
                  ["manualSubtotal", "Subtotal manual opcional"],
                ].map(([field, label]) => (
                  <TextField
                    key={field}
                    label={label}
                    type="number"
                    variant="outlined"
                    value={form[field]}
                    onChange={(event) => change(field, event.target.value)}
                  />
                ))}
                <FormControlLabel
                  control={
                    <Switch
                      color="primary"
                      checked={form.roundFinalPrice}
                      onChange={(event) =>
                        change("roundFinalPrice", event.target.checked)
                      }
                    />
                  }
                  label="Redondear precio recomendado"
                />
                <FormControlLabel
                  control={
                    <Switch
                      color="primary"
                      checked={form.showIvi}
                      onChange={(event) =>
                        change("showIvi", event.target.checked)
                      }
                    />
                  }
                  label="Mostrar IVI"
                />
                <div className={`${classes.totals} ${classes.full}`}>
                  {totals.invalid ? (
                    <Typography className={classes.warning}>
                      Comisión + margen debe ser menor de 100%.
                    </Typography>
                  ) : (
                    <>
                      <Typography>
                        Subtotal recomendado:{" "}
                        {money(totals.recommendedSubtotal, form.currency)}
                      </Typography>
                      <Typography>
                        Subtotal final: {money(totals.subtotal, form.currency)}
                      </Typography>
                      <Typography>
                        Comisión estimada:{" "}
                        {money(totals.commission, form.currency)}
                      </Typography>
                      <Typography>
                        Neto Techkepper: {money(totals.net, form.currency)}
                      </Typography>
                      <Typography>
                        IVA: {money(totals.iva, form.currency)}
                      </Typography>
                      <Typography variant="h6">
                        Total cliente: {money(totals.total, form.currency)}
                      </Typography>
                      {totals.belowDesired && (
                        <Typography className={classes.warning}>
                          El neto final queda por debajo de la meta deseada.
                        </Typography>
                      )}
                    </>
                  )}
                </div>
              </div>
            </ExpansionPanelDetails>
          </ExpansionPanel>

          <ExpansionPanel className={classes.section}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Condiciones de pago</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails style={{ display: "block" }}>
              {form.milestones.map((milestone, index) => (
                <div className={classes.itemCard} key={`milestone-${index}`}>
                  <div className={classes.grid}>
                    <TextField
                      label="Hito"
                      variant="outlined"
                      value={milestone.name}
                      onChange={(event) =>
                        updateMilestone(index, "name", event.target.value)
                      }
                    />
                    <TextField
                      label="Porcentaje"
                      type="number"
                      variant="outlined"
                      value={milestone.percentage}
                      onChange={(event) =>
                        updateMilestone(index, "percentage", event.target.value)
                      }
                      helperText={money(
                        totals.total *
                          (Number(milestone.percentage || 0) / 100),
                        form.currency,
                      )}
                    />
                    <TextField
                      className={classes.full}
                      label="Descripción"
                      variant="outlined"
                      value={milestone.description}
                      onChange={(event) =>
                        updateMilestone(
                          index,
                          "description",
                          event.target.value,
                        )
                      }
                    />
                  </div>
                </div>
              ))}
              <Typography
                className={
                  Math.abs(
                    form.milestones.reduce(
                      (sum, item) => sum + Number(item.percentage || 0),
                      0,
                    ) - 100,
                  ) > 0.01
                    ? classes.warning
                    : ""
                }
              >
                Total porcentajes:{" "}
                {form.milestones.reduce(
                  (sum, item) => sum + Number(item.percentage || 0),
                  0,
                )}
                %
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() =>
                  change("milestones", [...form.milestones, emptyMilestone()])
                }
              >
                Agregar hito
              </Button>
            </ExpansionPanelDetails>
          </ExpansionPanel>

          <ExpansionPanel className={classes.section}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Plazos, términos y recomendación</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
              <div className={classes.grid}>
                <TextField
                  label="Plazo estimado"
                  variant="outlined"
                  value={form.projectTimeline}
                  onChange={(event) =>
                    change("projectTimeline", event.target.value)
                  }
                />
                {[
                  ["paymentTermsText", "Condiciones generales de pago"],
                  ["termsText", "Términos"],
                  ["futureRecommendation", "Recomendación posterior"],
                ].map(([field, label]) => (
                  <TextField
                    key={field}
                    className={classes.full}
                    label={label}
                    variant="outlined"
                    multiline
                    rows={3}
                    value={form[field]}
                    onChange={(event) => change(field, event.target.value)}
                  />
                ))}
              </div>
            </ExpansionPanelDetails>
          </ExpansionPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditorOpen(false)}>Cancelar</Button>
          <Button
            color="primary"
            variant="contained"
            disabled={saving}
            onClick={save}
          >
            Guardar borrador
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{detail?.title}</DialogTitle>
        <DialogContent dividers>
          {detail && (
            <>
              <Typography>
                {detail.proposalNumber} ·{" "}
                {detail.businessClient?.displayName || detail.manualClientName}
              </Typography>
              <Typography variant="h5">
                {money(detail.total, detail.currency)}
              </Typography>
              {canManage && detail.estimatedNetAmount !== undefined && (
                <div className={classes.totals}>
                  <Typography variant="subtitle2">
                    Rentabilidad interna
                  </Typography>
                  <Typography>
                    Comisión estimada:{" "}
                    {money(detail.estimatedCommission, detail.currency)}
                  </Typography>
                  <Typography>
                    Neto Techkepper:{" "}
                    {money(detail.estimatedNetAmount, detail.currency)}
                  </Typography>
                </div>
              )}
              <Typography variant="subtitle2">Rubros</Typography>
              {detail.items.map((item) => (
                <Typography key={item.id}>
                  {item.title}: {money(item.subtotal, detail.currency)}
                </Typography>
              ))}
              <Typography variant="subtitle2" style={{ marginTop: 16 }}>
                Historial
              </Typography>
              {events.map((event) => (
                <div className={classes.event} key={event.id}>
                  <Typography variant="body2">
                    {event.eventType} · {event.user?.name || "Sistema"}
                  </Typography>
                  <Typography variant="caption">
                    {new Date(event.createdAt).toLocaleString()}
                    {event.comment ? ` · ${event.comment}` : ""}
                  </Typography>
                </div>
              ))}
            </>
          )}
        </DialogContent>
        <DialogActions>
          {canManage && (
            <>
              <Button onClick={() => generate(detail.id, "formal")}>
                Generar propuesta formal
              </Button>
              <Button onClick={() => generate(detail.id, "quick")}>
                Generar cotización rápida
              </Button>
            </>
          )}
          {detail?.generatedDocumentId && (
            <>
              {canManage && (
                <Button
                  startIcon={<GetAppOutlinedIcon />}
                  onClick={() => download(detail, "docx")}
                >
                  DOCX
                </Button>
              )}
              <Button
                color="primary"
                variant="contained"
                onClick={() => download(detail, "pdf")}
              >
                PDF
              </Button>
            </>
          )}
          <Button onClick={() => setDetail(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(statusProposal)}
        onClose={() => setStatusProposal(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cambiar estado comercial</DialogTitle>
        <DialogContent>
          <FormControl variant="outlined" margin="dense" fullWidth>
            <InputLabel>Nuevo estado</InputLabel>
            <Select
              value={nextStatus}
              onChange={(event) => setNextStatus(event.target.value)}
              label="Nuevo estado"
            >
              {statuses
                .filter(
                  ([value]) =>
                    user.profile === "admin" ||
                    (value !== "archived" && value !== "converted_to_contract"),
                )
                .map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
            label="Comentario"
            variant="outlined"
            margin="dense"
            multiline
            fullWidth
            value={statusComment}
            onChange={(event) => setStatusComment(event.target.value)}
          />
          <FormControl variant="outlined" margin="dense" fullWidth>
            <InputLabel>Notificar usuarios internos</InputLabel>
            <Select
              multiple
              value={notificationUserIds}
              onChange={(event) => setNotificationUserIds(event.target.value)}
              label="Notificar usuarios internos"
            >
              {users.map((recipient) => (
                <MenuItem key={recipient.id} value={recipient.id}>
                  {recipient.name} · {recipient.profile}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusProposal(null)}>Cancelar</Button>
          <Button
            color="primary"
            variant="contained"
            disabled={nextStatus === statusProposal?.status}
            onClick={submitStatus}
          >
            Guardar estado
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(proposalToDelete)}
        onClose={() => setProposalToDelete(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Eliminar propuesta</DialogTitle>
        <DialogContent dividers>
          <Typography>
            ¿Desea eliminar la propuesta{" "}
            <strong>{proposalToDelete?.proposalNumber}</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Dejará de aparecer en el listado, pero se conservará un registro
            recuperable para auditoría.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProposalToDelete(null)}>Cancelar</Button>
          <Button
            color="secondary"
            variant="contained"
            onClick={removeProposal}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </MainContainer>
  );
};

export default CommercialProposals;
