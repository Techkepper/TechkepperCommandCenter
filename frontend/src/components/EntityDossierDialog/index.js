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

const documentStatusLabels = {
  draft: "Borrador",
  generated: "Generado",
  in_review: "En revisión",
  sent: "Enviado",
  approved: "Aprobado",
  rejected: "Rechazado",
  archived: "Archivado",
  pending_signature: "Pendiente de firma",
};

const proposalStatusLabels = {
  draft: "Borrador",
  in_review: "En revisión",
  sent: "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
  expired: "Vencida",
  converted_to_contract: "Convertida a contrato",
  archived: "Archivada",
};

const purposeLabels = {
  contracts: "Contratos",
  nda: "NDA",
  quotations: "Cotizaciones",
  freelance: "Freelance",
  other: "Otros",
};

const eventLabels = {
  created: "Documento creado",
  generated: "Documento generado",
  uploaded: "Documento subido",
  status_changed: "Estado documental actualizado",
  archived: "Documento archivado",
  updated: "Documento actualizado",
  deleted: "Documento eliminado",
  comment_added: "Comentario agregado",
  downloaded_pdf: "PDF descargado",
  downloaded_docx: "DOCX descargado",
  associated_client: "Documento asociado al cliente",
  associated_collaborator: "Documento asociado al colaborador",
  proposal_created: "Propuesta creada",
  proposal_updated: "Propuesta actualizada",
  proposal_status_changed: "Estado comercial actualizado",
  proposal_generated: "Propuesta generada",
  docx_generated: "Documento comercial generado",
  items_added: "Rubros agregados a la propuesta",
  items_updated: "Rubros de la propuesta actualizados",
  calculation_updated: "Cálculo comercial actualizado",
  proposal_deleted: "Propuesta eliminada",
  internal_notification: "Notificación interna",
};

const formatDate = (value, includeTime = false) =>
  value
    ? new Date(value).toLocaleString("es-CR", includeTime ? undefined : {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "No disponible";

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
      (proposal ? proposalStatusLabels[value] : documentStatusLabels[value]) ||
      value
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
      toast.success("Estado documental actualizado.");
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
            <TableCell>Documento</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Creado por</TableCell>
            <TableCell>Fecha</TableCell>
            <TableCell align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((document) => (
            <TableRow key={document.id}>
              <TableCell>{document.title}</TableCell>
              <TableCell>
                {purposeLabels[document.purpose] ||
                  document.category ||
                  "Documento"}
              </TableCell>
              <TableCell>
                <StatusChip value={document.status} />
              </TableCell>
              <TableCell>{document.uploadedBy?.name || "Sistema"}</TableCell>
              <TableCell>{formatDate(document.createdAt)}</TableCell>
              <TableCell align="center" className={classes.actions}>
                <Tooltip title="Abrir documento">
                  <IconButton
                    size="small"
                    aria-label={`Abrir documento ${document.title}`}
                    onClick={() =>
                      history.push(`/smart-documents?documentId=${document.id}`)
                    }
                  >
                    <VisibilityOutlinedIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Descargar PDF">
                  <IconButton
                    size="small"
                    aria-label={`Descargar PDF ${document.title}`}
                    onClick={() => download(document, "pdf")}
                  >
                    <GetAppOutlinedIcon />
                  </IconButton>
                </Tooltip>
                {dossier.permissions.canDownloadDocx && (
                  <Button
                    size="small"
                    aria-label={`Descargar DOCX ${document.title}`}
                    onClick={() => download(document, "docx")}
                  >
                    DOCX
                  </Button>
                )}
                {dossier.permissions.canManageDocuments && (
                  <Tooltip title="Cambiar estado">
                    <IconButton
                      size="small"
                      aria-label={`Cambiar estado ${document.title}`}
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
                No hay documentos para mostrar.
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
        <DialogTitle>Expediente · {entityName}</DialogTitle>
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
            <Tab label="Resumen" />
            <Tab label="Documentos" />
            {isClient && <Tab label="Propuestas" />}
            <Tab label="Historial" />
            <Tab label="Pendientes" />
          </Tabs>

          {tab === 0 && (
            <div className={classes.summaryGrid}>
              <Paper className={`${classes.card} ${classes.entityCard}`}>
                <Typography variant="h6">{entityName}</Typography>
                <Typography color="textSecondary">
                  {isClient
                    ? `${entity.type === "legal" ? "Persona jurídica" : "Persona física"} · ${entity.identificationNumber}`
                    : `${entity.identificationNumber} · ${entity.contractualDenomination}`}
                </Typography>
                <Typography>
                  {entity.queue?.name || "Global"} ·{" "}
                  {entity.isActive ? "Activo" : "Inactivo"}
                </Typography>
                <Typography color="textSecondary">
                  {entity.email || "Sin correo"} · {entity.phone || "Sin teléfono"}
                </Typography>
              </Paper>
              {[
                ["Documentos", dossier.summary.documentCount],
                ["Propuestas", dossier.summary.proposalCount],
                ["Pendientes", dossier.summary.pendingCount],
                [
                  "Última actividad",
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
                  Último documento
                </Typography>
                <Typography>
                  {dossier.summary.lastDocument?.title || "Sin documentos"}
                </Typography>
              </Paper>
              {isClient && (
                <Paper className={classes.card}>
                  <Typography variant="caption" color="textSecondary">
                    Última propuesta
                  </Typography>
                  <Typography>
                    {dossier.summary.lastProposal?.proposalNumber ||
                      "Sin propuestas"}
                  </Typography>
                </Paper>
              )}
            </div>
          )}

          {tab === 1 && (
            <>
              <div className={classes.filters}>
                <TextField
                  label="Buscar documento"
                  variant="outlined"
                  size="small"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <FormControl variant="outlined" size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={purpose}
                    label="Tipo"
                    onChange={(event) => setPurpose(event.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {Object.entries(purposeLabels).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl variant="outlined" size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={status}
                    label="Estado"
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {Object.entries(documentStatusLabels).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  type="date"
                  label="Fecha"
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
                  label="Buscar propuesta"
                  variant="outlined"
                  size="small"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <FormControl variant="outlined" size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={status}
                    label="Estado"
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {Object.entries(proposalStatusLabels).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  type="date"
                  label="Fecha"
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
                      <TableCell>Número</TableCell>
                      <TableCell>Título</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell align="center">Acciones</TableCell>
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
                          <Tooltip title="Ver propuesta">
                            <IconButton
                              size="small"
                              aria-label={`Ver propuesta ${proposal.proposalNumber}`}
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
                            <Tooltip title="Editar propuesta">
                              <IconButton
                                size="small"
                                aria-label={`Editar propuesta ${proposal.proposalNumber}`}
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
                            aria-label={`Descargar PDF ${proposal.proposalNumber}`}
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
                          No hay propuestas para mostrar.
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
                    {eventLabels[event.eventType] || event.eventType}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {formatDate(event.createdAt, true)} ·{" "}
                    {event.user?.name || "Sistema"} ·{" "}
                    {event.entityType === "proposal" ? "Propuesta" : "Documento"}
                  </Typography>
                  {(event.previousStatus || event.newStatus) && (
                    <Typography variant="body2">
                      {event.previousStatus || "Sin estado"} →{" "}
                      {event.newStatus || "Sin estado"}
                    </Typography>
                  )}
                  {event.comment && (
                    <Typography variant="body2">{event.comment}</Typography>
                  )}
                </Paper>
              ))}
              {!dossier.activity.length && (
                <Typography className={classes.empty} color="textSecondary">
                  No hay actividad registrada.
                </Typography>
              )}
            </div>
          )}

          {tab === (isClient ? 4 : 3) && (
            <>
              <div className={classes.pendingSection}>
                <Typography variant="h6">Documentos pendientes</Typography>
                {documentTable(dossier.pending.documents)}
              </div>
              {isClient && (
                <div>
                  <Typography variant="h6">Propuestas pendientes</Typography>
                  {(dossier.pending.proposals || []).map((proposal) => (
                    <Paper className={classes.activity} key={proposal.id}>
                      <Typography>{proposal.proposalNumber}</Typography>
                      <Typography color="textSecondary">
                        {proposal.title} ·{" "}
                        {proposalStatusLabels[proposal.status] || proposal.status}
                      </Typography>
                    </Paper>
                  ))}
                  {!dossier.pending.proposals.length && (
                    <Typography color="textSecondary">
                      No hay propuestas pendientes.
                    </Typography>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(statusDocument)}
        onClose={() => setStatusDocument(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Cambiar estado documental</DialogTitle>
        <DialogContent>
          <FormControl variant="outlined" margin="dense" fullWidth>
            <InputLabel>Estado</InputLabel>
            <Select
              value={nextStatus}
              label="Estado"
              onChange={(event) => setNextStatus(event.target.value)}
            >
              {Object.entries(documentStatusLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDocument(null)}>Cancelar</Button>
          <Button
            color="primary"
            variant="contained"
            disabled={!nextStatus || nextStatus === statusDocument?.status}
            onClick={updateDocumentStatus}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EntityDossierDialog;
