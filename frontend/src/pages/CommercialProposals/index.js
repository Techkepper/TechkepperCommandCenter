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
import { i18n } from "../../translate/i18n";
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

const statusValues = [
  "draft",
  "in_review",
  "sent",
  "accepted",
  "rejected",
  "expired",
  "converted_to_contract",
  "archived",
];

const statusLabel = (value) =>
  i18n.t(`commercialProposals.statuses.${value}`);

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
    {
      name: i18n.t("commercialProposals.defaults.milestoneInitial"),
      percentage: 40,
      description: "",
    },
    {
      name: i18n.t("commercialProposals.defaults.milestoneSecond"),
      percentage: 30,
      description: "",
    },
    {
      name: i18n.t("commercialProposals.defaults.milestoneFinal"),
      percentage: 30,
      description: "",
    },
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
        toast.warn(i18n.t("commercialProposals.toasts.commissionMargin"));
        return;
      }
      const payload = serializeForm(form);
      if (editingId) {
        await api.put(`/commercial-proposals/${editingId}`, payload);
      } else {
        await api.post("/commercial-proposals", payload);
      }
      toast.success(i18n.t("commercialProposals.toasts.saved"));
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
          ? i18n.t("commercialProposals.toasts.quickGenerated")
          : i18n.t("commercialProposals.toasts.formalGenerated"),
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
      toast.success(i18n.t("commercialProposals.toasts.statusUpdated"));
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
      toast.success(i18n.t("commercialProposals.toasts.deleted"));
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
        <Title>{i18n.t("commercialProposals.title")}</Title>
        <MainHeaderButtonsWrapper>
          <div className={classes.headerActions}>
          <TextField
            size="small"
            variant="outlined"
            placeholder={i18n.t("commercialProposals.search.placeholder")}
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
              {i18n.t("commercialProposals.buttons.newProposal")}
            </Button>
          )}
          </div>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <div className={classes.filters}>
        <FormControl variant="outlined" size="small">
          <InputLabel>{i18n.t("commercialProposals.filters.status")}</InputLabel>
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            label={i18n.t("commercialProposals.filters.status")}
          >
            <MenuItem value="">
              {i18n.t("commercialProposals.options.all")}
            </MenuItem>
            {statusValues.map((value) => (
              <MenuItem value={value} key={value}>
                {statusLabel(value)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl variant="outlined" size="small">
          <InputLabel>{i18n.t("commercialProposals.filters.client")}</InputLabel>
          <Select
            value={clientFilter}
            onChange={(event) => setClientFilter(event.target.value)}
            label={i18n.t("commercialProposals.filters.client")}
          >
            <MenuItem value="">
              {i18n.t("commercialProposals.options.all")}
            </MenuItem>
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
          label={i18n.t("commercialProposals.filters.dateFrom")}
          InputLabelProps={{ shrink: true }}
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
        />
        <TextField
          size="small"
          variant="outlined"
          type="date"
          label={i18n.t("commercialProposals.filters.dateTo")}
          InputLabelProps={{ shrink: true }}
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
        />
        <FormControl variant="outlined" size="small">
          <InputLabel>
            {i18n.t("commercialProposals.filters.currency")}
          </InputLabel>
          <Select
            value={currencyFilter}
            onChange={(event) => setCurrencyFilter(event.target.value)}
            label={i18n.t("commercialProposals.filters.currency")}
          >
            <MenuItem value="">
              {i18n.t("commercialProposals.options.allCurrencies")}
            </MenuItem>
            <MenuItem value="CRC">CRC</MenuItem>
            <MenuItem value="USD">USD</MenuItem>
          </Select>
        </FormControl>
      </div>

      <Paper className={classes.paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{i18n.t("commercialProposals.table.number")}</TableCell>
              <TableCell>{i18n.t("commercialProposals.table.client")}</TableCell>
              <TableCell>{i18n.t("commercialProposals.table.title")}</TableCell>
              <TableCell>{i18n.t("commercialProposals.table.total")}</TableCell>
              <TableCell>{i18n.t("commercialProposals.table.status")}</TableCell>
              <TableCell>{i18n.t("commercialProposals.table.date")}</TableCell>
              <TableCell>{i18n.t("commercialProposals.table.creator")}</TableCell>
              <TableCell align="center">
                {i18n.t("commercialProposals.table.actions")}
              </TableCell>
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
                      statusValues.includes(proposal.status)
                        ? statusLabel(proposal.status)
                        : proposal.status
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
                          title={i18n.t("commercialProposals.confirm.deleteTitle")}
                          aria-label={i18n.t("commercialProposals.table.deleteAria", {
                            number: proposal.proposalNumber,
                          })}
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
                  {i18n.t("commercialProposals.table.empty")}
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
          {editingId
            ? i18n.t("commercialProposals.editor.editTitle")
            : i18n.t("commercialProposals.editor.createTitle")}
        </DialogTitle>
        <DialogContent dividers>
          <ExpansionPanel defaultExpanded className={classes.section}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>
                {i18n.t("commercialProposals.sections.clientHeader")}
              </Typography>
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
                  label={i18n.t("commercialProposals.fields.manualMode")}
                />
                {!form.manualMode ? (
                  <FormControl variant="outlined">
                    <InputLabel>
                      {i18n.t("commercialProposals.fields.registeredClient")}
                    </InputLabel>
                    <Select
                      value={form.businessClientId}
                      onChange={(event) =>
                        change("businessClientId", event.target.value)
                      }
                      label={i18n.t("commercialProposals.fields.registeredClient")}
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
                      label={i18n.t("commercialProposals.fields.clientName")}
                      variant="outlined"
                      value={form.manualClientName}
                      onChange={(event) =>
                        change("manualClientName", event.target.value)
                      }
                    />
                    <TextField
                      label={i18n.t("commercialProposals.fields.identification")}
                      variant="outlined"
                      value={form.manualClientIdentification}
                      onChange={(event) =>
                        change("manualClientIdentification", event.target.value)
                      }
                    />
                    <TextField
                      label={i18n.t("commercialProposals.fields.email")}
                      variant="outlined"
                      value={form.manualClientEmail}
                      onChange={(event) =>
                        change("manualClientEmail", event.target.value)
                      }
                    />
                    <TextField
                      label={i18n.t("commercialProposals.fields.phone")}
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
                    <InputLabel>
                      {i18n.t("commercialProposals.fields.department")}
                    </InputLabel>
                    <Select
                      value={form.queueId}
                      onChange={(event) =>
                        change("queueId", event.target.value)
                      }
                      label={i18n.t("commercialProposals.fields.department")}
                    >
                      {user.profile === "admin" && (
                        <MenuItem value="">
                          {i18n.t("commercialProposals.options.global")}
                        </MenuItem>
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
                  label={i18n.t("commercialProposals.fields.clientNumber")}
                  variant="outlined"
                  value={form.clientNumber}
                  onChange={(event) =>
                    change("clientNumber", event.target.value)
                  }
                />
                <TextField
                  label={i18n.t("commercialProposals.fields.proposalNumber")}
                  variant="outlined"
                  value={
                    editingId
                      ? form.proposalNumber
                      : `PROP-${new Date().getFullYear()}-###`
                  }
                  disabled
                  helperText={
                    editingId
                      ? i18n.t("commercialProposals.helpers.proposalNumberEditing")
                      : i18n.t("commercialProposals.helpers.proposalNumberNew")
                  }
                />
                <TextField
                  label={i18n.t("commercialProposals.fields.offerDate")}
                  type="date"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  value={form.offerDate}
                  onChange={(event) => change("offerDate", event.target.value)}
                />
                <TextField
                  label={i18n.t("commercialProposals.fields.title")}
                  variant="outlined"
                  value={form.title}
                  onChange={(event) => change("title", event.target.value)}
                />
              </div>
            </ExpansionPanelDetails>
          </ExpansionPanel>

          <ExpansionPanel className={classes.section}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>
                {i18n.t("commercialProposals.sections.introduction")}
              </Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
              <div className={classes.grid}>
                {[
                  ["introduction", i18n.t("commercialProposals.fields.introductionText")],
                  ["identifiedNeed", i18n.t("commercialProposals.fields.identifiedNeed")],
                  ["generalScope", i18n.t("commercialProposals.fields.generalScope")],
                  ["investmentAnalysis", i18n.t("commercialProposals.fields.investmentAnalysis")],
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
              <Typography>
                {i18n.t("commercialProposals.sections.items")}
              </Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails style={{ display: "block" }}>
              {form.items.map((item, index) => (
                <div className={classes.itemCard} key={`item-${index}`}>
                  <div className={classes.grid}>
                    <TextField
                      label={i18n.t("commercialProposals.fields.itemTitle", {
                        number: index + 1,
                      })}
                      variant="outlined"
                      value={item.title}
                      onChange={(event) =>
                        updateItem(index, "title", event.target.value)
                      }
                    />
                    <TextField
                      label={i18n.t("commercialProposals.fields.subtotal")}
                      type="number"
                      variant="outlined"
                      value={item.subtotal}
                      onChange={(event) =>
                        updateItem(index, "subtotal", event.target.value)
                      }
                    />
                    <TextField
                      className={classes.full}
                      label={i18n.t("commercialProposals.fields.description")}
                      variant="outlined"
                      multiline
                      value={item.description}
                      onChange={(event) =>
                        updateItem(index, "description", event.target.value)
                      }
                    />
                    <TextField
                      className={classes.full}
                      label={i18n.t("commercialProposals.fields.includedItems")}
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
                      label={i18n.t("commercialProposals.fields.isIncluded")}
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
                {i18n.t("commercialProposals.buttons.addItem")}
              </Button>
            </ExpansionPanelDetails>
          </ExpansionPanel>

          <ExpansionPanel defaultExpanded className={classes.section}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>
                {i18n.t("commercialProposals.sections.calculator")}
              </Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
              <div className={classes.grid}>
                <FormControl variant="outlined">
                  <InputLabel>
                    {i18n.t("commercialProposals.fields.currency")}
                  </InputLabel>
                  <Select
                    value={form.currency}
                    onChange={(event) => change("currency", event.target.value)}
                    label={i18n.t("commercialProposals.fields.currency")}
                  >
                    <MenuItem value="CRC">CRC</MenuItem>
                    <MenuItem value="USD">USD</MenuItem>
                  </Select>
                </FormControl>
                {[
                  ["desiredNetAmount", i18n.t("commercialProposals.fields.desiredNetAmount")],
                  ["sellerCommissionRate", i18n.t("commercialProposals.fields.sellerCommissionRate")],
                  ["externalCosts", i18n.t("commercialProposals.fields.externalCosts")],
                  ["thirdPartyLicenses", i18n.t("commercialProposals.fields.thirdPartyLicenses")],
                  ["additionalMarginRate", i18n.t("commercialProposals.fields.additionalMarginRate")],
                  ["discountAmount", i18n.t("commercialProposals.fields.discountAmount")],
                  ["ivaRate", i18n.t("commercialProposals.fields.ivaRate")],
                  ["manualSubtotal", i18n.t("commercialProposals.fields.manualSubtotal")],
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
                  label={i18n.t("commercialProposals.fields.roundFinalPrice")}
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
                  label={i18n.t("commercialProposals.fields.showIvi")}
                />
                <div className={`${classes.totals} ${classes.full}`}>
                  {totals.invalid ? (
                    <Typography className={classes.warning}>
                      {i18n.t("commercialProposals.totals.invalid")}
                    </Typography>
                  ) : (
                    <>
                      <Typography>
                        {i18n.t("commercialProposals.totals.recommendedSubtotal", {
                          value: money(totals.recommendedSubtotal, form.currency),
                        })}
                      </Typography>
                      <Typography>
                        {i18n.t("commercialProposals.totals.finalSubtotal", {
                          value: money(totals.subtotal, form.currency),
                        })}
                      </Typography>
                      <Typography>
                        {i18n.t("commercialProposals.totals.estimatedCommission", {
                          value: money(totals.commission, form.currency),
                        })}
                      </Typography>
                      <Typography>
                        {i18n.t("commercialProposals.totals.netTechkepper", {
                          value: money(totals.net, form.currency),
                        })}
                      </Typography>
                      <Typography>
                        {i18n.t("commercialProposals.totals.iva", {
                          value: money(totals.iva, form.currency),
                        })}
                      </Typography>
                      <Typography variant="h6">
                        {i18n.t("commercialProposals.totals.clientTotal", {
                          value: money(totals.total, form.currency),
                        })}
                      </Typography>
                      {totals.belowDesired && (
                        <Typography className={classes.warning}>
                          {i18n.t("commercialProposals.totals.belowDesired")}
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
              <Typography>
                {i18n.t("commercialProposals.sections.payment")}
              </Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails style={{ display: "block" }}>
              {form.milestones.map((milestone, index) => (
                <div className={classes.itemCard} key={`milestone-${index}`}>
                  <div className={classes.grid}>
                    <TextField
                      label={i18n.t("commercialProposals.fields.milestoneName")}
                      variant="outlined"
                      value={milestone.name}
                      onChange={(event) =>
                        updateMilestone(index, "name", event.target.value)
                      }
                    />
                    <TextField
                      label={i18n.t("commercialProposals.fields.percentage")}
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
                      label={i18n.t("commercialProposals.fields.description")}
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
                {i18n.t("commercialProposals.totals.totalPercentages", {
                  value: form.milestones.reduce(
                    (sum, item) => sum + Number(item.percentage || 0),
                    0,
                  ),
                })}
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() =>
                  change("milestones", [...form.milestones, emptyMilestone()])
                }
              >
                {i18n.t("commercialProposals.buttons.addMilestone")}
              </Button>
            </ExpansionPanelDetails>
          </ExpansionPanel>

          <ExpansionPanel className={classes.section}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>
                {i18n.t("commercialProposals.sections.terms")}
              </Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
              <div className={classes.grid}>
                <TextField
                  label={i18n.t("commercialProposals.fields.projectTimeline")}
                  variant="outlined"
                  value={form.projectTimeline}
                  onChange={(event) =>
                    change("projectTimeline", event.target.value)
                  }
                />
                {[
                  ["paymentTermsText", i18n.t("commercialProposals.fields.paymentTermsText")],
                  ["termsText", i18n.t("commercialProposals.fields.termsText")],
                  ["futureRecommendation", i18n.t("commercialProposals.fields.futureRecommendation")],
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
          <Button onClick={() => setEditorOpen(false)}>
            {i18n.t("commercialProposals.buttons.cancel")}
          </Button>
          <Button
            color="primary"
            variant="contained"
            disabled={saving}
            onClick={save}
          >
            {i18n.t("commercialProposals.buttons.saveDraft")}
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
                    {i18n.t("commercialProposals.detail.internalProfitability")}
                  </Typography>
                  <Typography>
                    {i18n.t("commercialProposals.totals.estimatedCommission", {
                      value: money(detail.estimatedCommission, detail.currency),
                    })}
                  </Typography>
                  <Typography>
                    {i18n.t("commercialProposals.totals.netTechkepper", {
                      value: money(detail.estimatedNetAmount, detail.currency),
                    })}
                  </Typography>
                </div>
              )}
              <Typography variant="subtitle2">
                {i18n.t("commercialProposals.detail.items")}
              </Typography>
              {detail.items.map((item) => (
                <Typography key={item.id}>
                  {item.title}: {money(item.subtotal, detail.currency)}
                </Typography>
              ))}
              <Typography variant="subtitle2" style={{ marginTop: 16 }}>
                {i18n.t("commercialProposals.detail.history")}
              </Typography>
              {events.map((event) => (
                <div className={classes.event} key={event.id}>
                  <Typography variant="body2">
                    {event.eventType} ·{" "}
                    {event.user?.name ||
                      i18n.t("commercialProposals.detail.system")}
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
                {i18n.t("commercialProposals.buttons.generateFormal")}
              </Button>
              <Button onClick={() => generate(detail.id, "quick")}>
                {i18n.t("commercialProposals.buttons.generateQuick")}
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
          <Button onClick={() => setDetail(null)}>
            {i18n.t("commercialProposals.buttons.close")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(statusProposal)}
        onClose={() => setStatusProposal(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{i18n.t("commercialProposals.status.title")}</DialogTitle>
        <DialogContent>
          <FormControl variant="outlined" margin="dense" fullWidth>
            <InputLabel>
              {i18n.t("commercialProposals.status.newStatus")}
            </InputLabel>
            <Select
              value={nextStatus}
              onChange={(event) => setNextStatus(event.target.value)}
              label={i18n.t("commercialProposals.status.newStatus")}
            >
              {statusValues
                .filter(
                  (value) =>
                    user.profile === "admin" ||
                    (value !== "archived" && value !== "converted_to_contract"),
                )
                .map((value) => (
                  <MenuItem key={value} value={value}>
                    {statusLabel(value)}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
            label={i18n.t("commercialProposals.status.comment")}
            variant="outlined"
            margin="dense"
            multiline
            fullWidth
            value={statusComment}
            onChange={(event) => setStatusComment(event.target.value)}
          />
          <FormControl variant="outlined" margin="dense" fullWidth>
            <InputLabel>
              {i18n.t("commercialProposals.status.notifyUsers")}
            </InputLabel>
            <Select
              multiple
              value={notificationUserIds}
              onChange={(event) => setNotificationUserIds(event.target.value)}
              label={i18n.t("commercialProposals.status.notifyUsers")}
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
          <Button onClick={() => setStatusProposal(null)}>
            {i18n.t("commercialProposals.buttons.cancel")}
          </Button>
          <Button
            color="primary"
            variant="contained"
            disabled={nextStatus === statusProposal?.status}
            onClick={submitStatus}
          >
            {i18n.t("commercialProposals.buttons.saveStatus")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(proposalToDelete)}
        onClose={() => setProposalToDelete(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {i18n.t("commercialProposals.confirm.deleteTitle")}
        </DialogTitle>
        <DialogContent dividers>
          <Typography>
            {i18n.t("commercialProposals.confirm.deleteMessage")}{" "}
            <strong>{proposalToDelete?.proposalNumber}</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {i18n.t("commercialProposals.confirm.deleteHelper")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProposalToDelete(null)}>
            {i18n.t("commercialProposals.buttons.cancel")}
          </Button>
          <Button
            color="secondary"
            variant="contained"
            onClick={removeProposal}
          >
            {i18n.t("commercialProposals.buttons.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </MainContainer>
  );
};

export default CommercialProposals;
