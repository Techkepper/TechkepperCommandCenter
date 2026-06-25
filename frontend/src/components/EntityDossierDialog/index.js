import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  makeStyles,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@material-ui/core";
import EditOutlinedIcon from "@material-ui/icons/EditOutlined";
import GetAppOutlinedIcon from "@material-ui/icons/GetAppOutlined";
import HistoryOutlinedIcon from "@material-ui/icons/HistoryOutlined";
import VisibilityOutlinedIcon from "@material-ui/icons/VisibilityOutlined";
import { useHistory } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  tabs: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    marginBottom: theme.spacing(2),
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: theme.spacing(1.5),
    [theme.breakpoints.down("sm")]: {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
    [theme.breakpoints.down("xs")]: { gridTemplateColumns: "1fr" },
  },
  card: {
    padding: theme.spacing(1.5),
    borderRadius: 12,
    border: `1px solid ${theme.palette.divider}`,
    background:
      theme.palette.type === "dark"
        ? "rgba(255, 255, 255, 0.025)"
        : theme.palette.background.paper,
  },
  entityCard: { gridColumn: "1 / -1" },
  filters: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1.5),
    "& .MuiFormControl-root, & .MuiTextField-root": {
      minWidth: 160,
      flex: "1 1 180px",
    },
  },
  tablePaper: {
    overflowX: "auto",
    borderRadius: 12,
  },
  actions: { whiteSpace: "nowrap" },
  activity: {
    padding: theme.spacing(1.5),
    borderLeft: `3px solid ${theme.palette.primary.main}`,
    marginBottom: theme.spacing(1),
  },
  pendingSection: { marginBottom: theme.spacing(2) },
  empty: { padding: theme.spacing(4), textAlign: "center" },
}));

const getDocumentStatusLabels = () => ({
  draft: i18n.t("entityDossier.statusDraft"),
  generated: i18n.t("entityDossier.statusGenerated"),
  in_review: i18n.t("entityDossier.statusInReview"),
  sent: i18n.t("entityDossier.statusSent"),
  approved: i18n.t("entityDossier.statusApproved"),
  rejected: i18n.t("entityDossier.statusRejected"),
  archived: i18n.t("entityDossier.statusArchived"),
  pending_signature: i18n.t("entityDossier.statusPendingSignature"),
});

const getProposalStatusLabels = () => ({
  draft: i18n.t("entityDossier.proposalStatusDraft"),
  in_review: i18n.t("entityDossier.proposalStatusInReview"),
  sent: i18n.t("entityDossier.proposalStatusSent"),
  accepted: i18n.t("entityDossier.proposalStatusAccepted"),
  rejected: i18n.t("entityDossier.proposalStatusRejected"),
  expired: i18n.t("entityDossier.proposalStatusExpired"),
  converted_to_contract: i18n.t("entityDossier.proposalStatusConvertedToContract"),
  archived: i18n.t("entityDossier.proposalStatusArchived"),
});

const getPurposeLabels = () => ({
  contracts: i18n.t("entityDossier.purposeContracts"),
  nda: i18n.t("entityDossier.purposeNda"),
  quotations: i18n.t("entityDossier.purposeQuotations"),
  freelance: i18n.t("entityDossier.purposeFreelance"),
  other: i18n.t("entityDossier.purposeOther"),
});

const getEventLabels = () => ({
  created: i18n.t("entityDossier.eventCreated"),
  generated: i18n.t("entityDossier.eventGenerated"),
  uploaded: i18n.t("entityDossier.eventUploaded"),
  status_changed: i18n.t("entityDossier.eventStatusChanged"),
  archived: i18n.t("entityDossier.eventArchived"),
  updated: i18n.t("entityDossier.eventUpdated"),
  deleted: i18n.t("entityDossier.eventDeleted"),
  comment_added: i18n.t("entityDossier.eventCommentAdded"),
  downloaded_pdf: i18n.t("entityDossier.eventDownloadedPdf"),
  downloaded_docx: i18n.t("entityDossier.eventDownloadedDocx"),
  associated_client: i18n.t("entityDossier.eventAssociatedClient"),
  associated_collaborator: i18n.t("entityDossier.eventAssociatedCollaborator"),
  proposal_created: i18n.t("entityDossier.eventProposalCreated"),
  proposal_updated: i18n.t("entityDossier.eventProposalUpdated"),
  proposal_status_changed: i18n.t("entityDossier.eventProposalStatusChanged"),
  proposal_generated: i18n.t("entityDossier.eventProposalGenerated"),
  docx_generated: i18n.t("entityDossier.eventDocxGenerated"),
  items_added: i18n.t("entityDossier.eventItemsAdded"),
  items_updated: i18n.t("entityDossier.eventItemsUpdated"),
  calculation_updated: i18n.t("entityDossier.eventCalculationUpdated"),
  proposal_deleted: i18n.t("entityDossier.eventProposalDeleted"),
  internal_notification: i18n.t("entityDossier.eventInternalNotification"),
});

const formatDate = (value, includeTime = false) =>
  value
    ? new Date(value).toLocaleString("es-CR", includeTime ? undefined : {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : i18n.t("entityDossier.notAvailable");

const StatusChip = ({ value, proposal = false }) => (
  <Chip
    size="small"
    variant="outlined"
    color={
      ["approved", "accepted", "generated"].includes(value)
        ? "primary"
        : "default"
    }
    label={
      (proposal
        ? getProposalStatusLabels()[value]
        : getDocumentStatusLabels()[value]) || value
    }
  />
);

const EntityDossierDialog = ({ dossier, open, onClose, onReload }) => {
  const classes = useStyles();
  const history = useHistory();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [purpose, setPurpose] = useState("");
  const [date, setDate] = useState("");
  const [statusDocument, setStatusDocument] = useState(null);
  const [nextStatus, setNextStatus] = useState("");

  const isClient = dossier?.entityType === "businessClient";
  const documents = useMemo(
    () =>
      (dossier?.documents || []).filter((document) => {
        const matchesSearch =
          !search ||
          [document.title, document.originalName, document.category].some(
            (value) => value?.toLowerCase().includes(search.toLowerCase())
          );
        return (
          matchesSearch &&
          (!status || document.status === status) &&
          (!purpose || document.purpose === purpose) &&
          (!date || String(document.createdAt).slice(0, 10) === date)
        );
      }),
    [date, dossier, purpose, search, status]
  );
  const proposals = useMemo(
    () =>
      (dossier?.proposals || []).filter(
        (proposal) =>
          (!search ||
            [proposal.proposalNumber, proposal.title].some((value) =>
              value?.toLowerCase().includes(search.toLowerCase())
            )) &&
          (!status || proposal.status === status) &&
          (!date || String(proposal.offerDate).slice(0, 10) === date)
      ),
    [date, dossier, search, status]
  );

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setPurpose("");
    setDate("");
  };

  useEffect(() => {
    if (!open || !dossier?.entity?.id) return;
    setTab(0);
    setSearch("");
    setStatus("");
    setPurpose("");
    setDate("");
  }, [dossier?.entity?.id, open]);

  const changeTab = (_, value) => {
    setTab(value);
    resetFilters();
  };

  const download = async (document, format) => {
    try {
      const { data } = await api.get(`/documents/${document.id}/download`, {
        params: { format },
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([data]));
      const link = window.document.createElement("a");
      link.href = url;
      link.download =
        format === "pdf"
          ? `${document.originalName.replace(/\.[^.]+$/, "")}.pdf`
          : document.originalName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toastError(error);
    }
  };

  const downloadProposal = async (proposal) => {
    try {
      if (!proposal.generatedDocumentId) {
        await api.post(`/commercial-proposals/${proposal.id}/generate`, {
          variant: "formal",
        });
      }
      const { data } = await api.get(
        `/commercial-proposals/${proposal.id}/download`,
        { params: { format: "pdf" }, responseType: "blob" }
      );
      const url = URL.createObjectURL(new Blob([data]));
      const link = window.document.createElement("a");
      link.href = url;
      link.download = `${proposal.proposalNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      if (onReload) await onReload();
    } catch (error) {
      toastError(error);
    }
  };

  const updateDocumentStatus = async () => {
    try {
      await api.patch(`/documents/${statusDocument.id}/status`, {
        status: nextStatus,
        notificationUserIds: [],
      });
      toast.success(i18n.t("entityDossier.statusUpdatedToast"));
      setStatusDocument(null);
      if (onReload) await onReload();
    } catch (error) {
      toastError(error);
    }
  };

  if (!dossier) return null;
  const entity = dossier.entity;
  const entityName = isClient ? entity.displayName : entity.fullName;

  const documentTable = (rows) => (
    <Paper className={classes.tablePaper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{i18n.t("entityDossier.columnDocument")}</TableCell>
            <TableCell>{i18n.t("entityDossier.columnType")}</TableCell>
            <TableCell>{i18n.t("entityDossier.columnStatus")}</TableCell>
            <TableCell>{i18n.t("entityDossier.columnCreatedBy")}</TableCell>
            <TableCell>{i18n.t("entityDossier.columnDate")}</TableCell>
            <TableCell align="center">
              {i18n.t("entityDossier.columnActions")}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((document) => (
            <TableRow key={document.id}>
              <TableCell>{document.title}</TableCell>
              <TableCell>
                {getPurposeLabels()[document.purpose] ||
                  document.category ||
                  i18n.t("entityDossier.columnDocument")}
              </TableCell>
              <TableCell>
                <StatusChip value={document.status} />
              </TableCell>
              <TableCell>
                {document.uploadedBy?.name || i18n.t("entityDossier.systemUser")}
              </TableCell>
              <TableCell>{formatDate(document.createdAt)}</TableCell>
              <TableCell align="center" className={classes.actions}>
                <Tooltip title={i18n.t("entityDossier.openDocument")}>
                  <IconButton
                    size="small"
                    aria-label={i18n.t("entityDossier.openDocumentAria", {
                      title: document.title,
                    })}
                    onClick={() =>
                      history.push(`/smart-documents?documentId=${document.id}`)
                    }
                  >
                    <VisibilityOutlinedIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={i18n.t("entityDossier.downloadPdf")}>
                  <IconButton
                    size="small"
                    aria-label={i18n.t("entityDossier.downloadPdfDocumentAria", {
                      title: document.title,
                    })}
                    onClick={() => download(document, "pdf")}
                  >
                    <GetAppOutlinedIcon />
                  </IconButton>
                </Tooltip>
                {dossier.permissions.canDownloadDocx && (
                  <Button
                    size="small"
                    aria-label={i18n.t("entityDossier.downloadDocxDocumentAria", {
                      title: document.title,
                    })}
                    onClick={() => download(document, "docx")}
                  >
                    DOCX
                  </Button>
                )}
                {dossier.permissions.canManageDocuments && (
                  <Tooltip title={i18n.t("entityDossier.changeStatus")}>
                    <IconButton
                      size="small"
                      aria-label={i18n.t("entityDossier.changeStatusAria", {
                        title: document.title,
                      })}
                      onClick={() => {
                        setStatusDocument(document);
                        setNextStatus(document.status);
                      }}
                    >
                      <HistoryOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
          {!rows.length && (
            <TableRow>
              <TableCell colSpan={6} className={classes.empty}>
                {i18n.t("entityDossier.emptyDocuments")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          {i18n.t("entityDossier.dialogTitle", { name: entityName })}
        </DialogTitle>
        <DialogContent dividers>
          <Tabs
            className={classes.tabs}
            value={tab}
            onChange={changeTab}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label={i18n.t("entityDossier.tabSummary")} />
            <Tab label={i18n.t("entityDossier.tabDocuments")} />
            {isClient && <Tab label={i18n.t("entityDossier.tabProposals")} />}
            <Tab label={i18n.t("entityDossier.tabHistory")} />
            <Tab label={i18n.t("entityDossier.tabPending")} />
          </Tabs>

          {tab === 0 && (
            <div className={classes.summaryGrid}>
              <Paper className={`${classes.card} ${classes.entityCard}`}>
                <Typography variant="h6">{entityName}</Typography>
                <Typography color="textSecondary">
                  {isClient
                    ? `${entity.type === "legal" ? i18n.t("entityDossier.personLegal") : i18n.t("entityDossier.personPhysical")} · ${entity.identificationNumber}`
                    : `${entity.identificationNumber} · ${entity.contractualDenomination}`}
                </Typography>
                <Typography>
                  {entity.queue?.name || i18n.t("entityDossier.queueGlobal")} ·{" "}
                  {entity.isActive
                    ? i18n.t("entityDossier.active")
                    : i18n.t("entityDossier.inactive")}
                </Typography>
                <Typography color="textSecondary">
                  {entity.email || i18n.t("entityDossier.noEmail")} ·{" "}
                  {entity.phone || i18n.t("entityDossier.noPhone")}
                </Typography>
              </Paper>
              {[
                [i18n.t("entityDossier.tabDocuments"), dossier.summary.documentCount],
                [i18n.t("entityDossier.tabProposals"), dossier.summary.proposalCount],
                [i18n.t("entityDossier.tabPending"), dossier.summary.pendingCount],
                [
                  i18n.t("entityDossier.summaryLastActivity"),
                  formatDate(
                    dossier.activity[0]?.createdAt ||
                      dossier.summary.lastDocument?.createdAt
                  ),
                ],
              ].map(([label, value]) => (
                <Paper className={classes.card} key={label}>
                  <Typography variant="caption" color="textSecondary">
                    {label}
                  </Typography>
                  <Typography variant="h6">{value}</Typography>
                </Paper>
              ))}
              <Paper className={classes.card}>
                <Typography variant="caption" color="textSecondary">
                  {i18n.t("entityDossier.lastDocument")}
                </Typography>
                <Typography>
                  {dossier.summary.lastDocument?.title ||
                    i18n.t("entityDossier.noDocuments")}
                </Typography>
              </Paper>
              {isClient && (
                <Paper className={classes.card}>
                  <Typography variant="caption" color="textSecondary">
                    {i18n.t("entityDossier.lastProposal")}
                  </Typography>
                  <Typography>
                    {dossier.summary.lastProposal?.proposalNumber ||
                      i18n.t("entityDossier.noProposals")}
                  </Typography>
                </Paper>
              )}
            </div>
          )}

          {tab === 1 && (
            <>
              <div className={classes.filters}>
                <TextField
                  label={i18n.t("entityDossier.searchDocument")}
                  variant="outlined"
                  size="small"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <FormControl variant="outlined" size="small">
                  <InputLabel>{i18n.t("entityDossier.columnType")}</InputLabel>
                  <Select
                    value={purpose}
                    label={i18n.t("entityDossier.columnType")}
                    onChange={(event) => setPurpose(event.target.value)}
                  >
                    <MenuItem value="">{i18n.t("entityDossier.filterAll")}</MenuItem>
                    {Object.entries(getPurposeLabels()).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl variant="outlined" size="small">
                  <InputLabel>{i18n.t("entityDossier.columnStatus")}</InputLabel>
                  <Select
                    value={status}
                    label={i18n.t("entityDossier.columnStatus")}
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    <MenuItem value="">{i18n.t("entityDossier.filterAll")}</MenuItem>
                    {Object.entries(getDocumentStatusLabels()).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  type="date"
                  label={i18n.t("entityDossier.columnDate")}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
              {documentTable(documents)}
            </>
          )}

          {isClient && tab === 2 && (
            <>
              <div className={classes.filters}>
                <TextField
                  label={i18n.t("entityDossier.searchProposal")}
                  variant="outlined"
                  size="small"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <FormControl variant="outlined" size="small">
                  <InputLabel>{i18n.t("entityDossier.columnStatus")}</InputLabel>
                  <Select
                    value={status}
                    label={i18n.t("entityDossier.columnStatus")}
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    <MenuItem value="">{i18n.t("entityDossier.filterAll")}</MenuItem>
                    {Object.entries(getProposalStatusLabels()).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  type="date"
                  label={i18n.t("entityDossier.columnDate")}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
              <Paper className={classes.tablePaper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{i18n.t("entityDossier.columnNumber")}</TableCell>
                      <TableCell>{i18n.t("entityDossier.columnTitle")}</TableCell>
                      <TableCell>{i18n.t("entityDossier.columnStatus")}</TableCell>
                      <TableCell>{i18n.t("entityDossier.columnTotal")}</TableCell>
                      <TableCell>{i18n.t("entityDossier.columnDate")}</TableCell>
                      <TableCell align="center">
                        {i18n.t("entityDossier.columnActions")}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {proposals.map((proposal) => (
                      <TableRow key={proposal.id}>
                        <TableCell>{proposal.proposalNumber}</TableCell>
                        <TableCell>{proposal.title}</TableCell>
                        <TableCell>
                          <StatusChip value={proposal.status} proposal />
                        </TableCell>
                        <TableCell>
                          {proposal.currency}{" "}
                          {Number(proposal.total || 0).toLocaleString("es-CR")}
                        </TableCell>
                        <TableCell>{formatDate(proposal.offerDate)}</TableCell>
                        <TableCell align="center" className={classes.actions}>
                          <Tooltip title={i18n.t("entityDossier.viewProposal")}>
                            <IconButton
                              size="small"
                              aria-label={i18n.t("entityDossier.viewProposalAria", {
                                number: proposal.proposalNumber,
                              })}
                              onClick={() =>
                                history.push(
                                  `/commercial-proposals?proposalId=${proposal.id}`
                                )
                              }
                            >
                              <VisibilityOutlinedIcon />
                            </IconButton>
                          </Tooltip>
                          {dossier.permissions.canManageProposals && (
                            <Tooltip title={i18n.t("entityDossier.editProposal")}>
                              <IconButton
                                size="small"
                                aria-label={i18n.t("entityDossier.editProposalAria", {
                                  number: proposal.proposalNumber,
                                })}
                                onClick={() =>
                                  history.push(
                                    `/commercial-proposals?editProposalId=${proposal.id}`
                                  )
                                }
                              >
                                <EditOutlinedIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Button
                            size="small"
                            aria-label={i18n.t("entityDossier.downloadPdfProposalAria", {
                              number: proposal.proposalNumber,
                            })}
                            startIcon={<GetAppOutlinedIcon />}
                            onClick={() => downloadProposal(proposal)}
                          >
                            PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!proposals.length && (
                      <TableRow>
                        <TableCell colSpan={6} className={classes.empty}>
                          {i18n.t("entityDossier.emptyProposals")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </>
          )}

          {tab === (isClient ? 3 : 2) && (
            <div>
              {dossier.activity.map((event) => (
                <Paper className={classes.activity} key={event.id}>
                  <Typography variant="subtitle2">
                    {getEventLabels()[event.eventType] || event.eventType}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {formatDate(event.createdAt, true)} ·{" "}
                    {event.user?.name || i18n.t("entityDossier.systemUser")} ·{" "}
                    {event.entityType === "proposal"
                      ? i18n.t("entityDossier.entityProposal")
                      : i18n.t("entityDossier.entityDocument")}
                  </Typography>
                  {(event.previousStatus || event.newStatus) && (
                    <Typography variant="body2">
                      {event.previousStatus || i18n.t("entityDossier.noStatus")} →{" "}
                      {event.newStatus || i18n.t("entityDossier.noStatus")}
                    </Typography>
                  )}
                  {event.comment && (
                    <Typography variant="body2">{event.comment}</Typography>
                  )}
                </Paper>
              ))}
              {!dossier.activity.length && (
                <Typography className={classes.empty} color="textSecondary">
                  {i18n.t("entityDossier.emptyActivity")}
                </Typography>
              )}
            </div>
          )}

          {tab === (isClient ? 4 : 3) && (
            <>
              <div className={classes.pendingSection}>
                <Typography variant="h6">
                  {i18n.t("entityDossier.pendingDocuments")}
                </Typography>
                {documentTable(dossier.pending.documents)}
              </div>
              {isClient && (
                <div>
                  <Typography variant="h6">
                    {i18n.t("entityDossier.pendingProposals")}
                  </Typography>
                  {(dossier.pending.proposals || []).map((proposal) => (
                    <Paper className={classes.activity} key={proposal.id}>
                      <Typography>{proposal.proposalNumber}</Typography>
                      <Typography color="textSecondary">
                        {proposal.title} ·{" "}
                        {getProposalStatusLabels()[proposal.status] ||
                          proposal.status}
                      </Typography>
                    </Paper>
                  ))}
                  {!dossier.pending.proposals.length && (
                    <Typography color="textSecondary">
                      {i18n.t("entityDossier.emptyPendingProposals")}
                    </Typography>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{i18n.t("entityDossier.close")}</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(statusDocument)}
        onClose={() => setStatusDocument(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{i18n.t("entityDossier.changeStatusTitle")}</DialogTitle>
        <DialogContent>
          <FormControl variant="outlined" margin="dense" fullWidth>
            <InputLabel>{i18n.t("entityDossier.columnStatus")}</InputLabel>
            <Select
              value={nextStatus}
              label={i18n.t("entityDossier.columnStatus")}
              onChange={(event) => setNextStatus(event.target.value)}
            >
              {Object.entries(getDocumentStatusLabels()).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDocument(null)}>
            {i18n.t("entityDossier.cancel")}
          </Button>
          <Button
            color="primary"
            variant="contained"
            disabled={!nextStatus || nextStatus === statusDocument?.status}
            onClick={updateDocumentStatus}
          >
            {i18n.t("entityDossier.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EntityDossierDialog;
