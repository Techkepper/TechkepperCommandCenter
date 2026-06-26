import React, { useContext, useEffect, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import SearchIcon from "@material-ui/icons/Search";
import EditOutlinedIcon from "@material-ui/icons/EditOutlined";
import PowerSettingsNewOutlinedIcon from "@material-ui/icons/PowerSettingsNewOutlined";
import ReplayOutlinedIcon from "@material-ui/icons/ReplayOutlined";
import VisibilityOutlinedIcon from "@material-ui/icons/VisibilityOutlined";
import { toast } from "react-toastify";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import EntityDossierDialog from "../../components/EntityDossierDialog";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  paper: { flex: 1, padding: theme.spacing(1), overflowY: "auto" },
  filter: { minWidth: 130 },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: theme.spacing(1),
    [theme.breakpoints.down("sm")]: { gridTemplateColumns: "1fr" },
  },
  fullWidth: { gridColumn: "1 / -1" },
  warning: {
    padding: theme.spacing(3),
    borderColor: "rgba(255, 193, 7, 0.35)",
  },
}));

const emptyForm = {
  fullName: "",
  identificationType: "Cédula de identidad",
  identificationNumber: "",
  contractualDenomination: "LA CONTRATISTA",
  sex: "unspecified",
  email: "",
  phone: "",
  address: "",
  notes: "",
  queueId: "",
};

const Collaborators = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const canManage = user.profile === "admin" || user.profile === "supervisor";
  const [collaborators, setCollaborators] = useState([]);
  const [queues, setQueues] = useState([]);
  const [searchParam, setSearchParam] = useState("");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);
  const [installRequired, setInstallRequired] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [dossier, setDossier] = useState(null);

  const loadCollaborators = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/collaborators", {
        params: { searchParam, status, pageNumber: 1 },
      });
      setCollaborators(data.collaborators);
      setInstallRequired(false);
    } catch (error) {
      const code = error.response?.data?.error || error.response?.data?.message;
      if (code === "ERR_COLLABORATORS_NOT_INSTALLED") {
        setInstallRequired(true);
        setCollaborators([]);
      } else {
        toastError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadCollaborators, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam, status]);

  useEffect(() => {
    api
      .get("/queue")
      .then(({ data }) =>
        setQueues(Array.isArray(data) ? data : data.queues || []),
      )
      .catch(toastError);
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (collaborator) => {
    setEditingId(collaborator.id);
    setForm({
      fullName: collaborator.fullName || "",
      identificationType:
        collaborator.identificationType || "Cédula de identidad",
      identificationNumber: collaborator.identificationNumber || "",
      contractualDenomination:
        collaborator.contractualDenomination || "LA CONTRATISTA",
      sex: collaborator.sex || "unspecified",
      email: collaborator.email || "",
      phone: collaborator.phone || "",
      address: collaborator.address || "",
      notes: collaborator.notes || "",
      queueId: collaborator.queueId || "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    try {
      const payload = { ...form, queueId: form.queueId || null };
      if (editingId) {
        await api.put(`/collaborators/${editingId}`, payload);
      } else {
        await api.post("/collaborators", payload);
      }
      setDialogOpen(false);
      toast.success(
        editingId
          ? i18n.t("collaborators.toasts.updated")
          : i18n.t("collaborators.toasts.created"),
      );
      await loadCollaborators();
    } catch (error) {
      toastError(error);
    }
  };

  const toggleStatus = async (collaborator) => {
    try {
      await api.patch(`/collaborators/${collaborator.id}/status`, {
        isActive: !collaborator.isActive,
      });
      toast.success(
        collaborator.isActive
          ? i18n.t("collaborators.toasts.deactivated")
          : i18n.t("collaborators.toasts.reactivated"),
      );
      await loadCollaborators();
    } catch (error) {
      toastError(error);
    }
  };

  const openDossier = async (collaboratorId) => {
    try {
      const { data } = await api.get(
        `/collaborators/${collaboratorId}/dossier`,
      );
      setDossier(data);
    } catch (error) {
      toastError(error);
    }
  };

  const reloadDossier = async () => {
    if (dossier?.entity?.id) await openDossier(dossier.entity.id);
  };

  return (
    <MainContainer>
      <EntityDossierDialog
        open={Boolean(dossier)}
        dossier={dossier}
        onClose={() => setDossier(null)}
        onReload={reloadDossier}
      />
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingId
            ? i18n.t("collaborators.dialog.editTitle")
            : i18n.t("collaborators.newCollaborator")}
        </DialogTitle>
        <DialogContent dividers>
          <div className={classes.formGrid}>
            <TextField
              label={i18n.t("collaborators.fields.fullName")}
              variant="outlined"
              margin="dense"
              value={form.fullName}
              onChange={(event) =>
                setForm({ ...form, fullName: event.target.value })
              }
            />
            <FormControl variant="outlined" margin="dense">
              <InputLabel>{i18n.t("collaborators.fields.sex")}</InputLabel>
              <Select
                value={form.sex}
                label={i18n.t("collaborators.fields.sex")}
                onChange={(event) => {
                  const sex = event.target.value;
                  setForm({
                    ...form,
                    sex,
                    contractualDenomination:
                      sex === "female"
                        ? "LA CONTRATISTA"
                        : sex === "male"
                          ? "EL CONTRATISTA"
                          : form.contractualDenomination,
                  });
                }}
              >
                <MenuItem value="female">
                  {i18n.t("collaborators.sex.female")}
                </MenuItem>
                <MenuItem value="male">
                  {i18n.t("collaborators.sex.male")}
                </MenuItem>
                <MenuItem value="unspecified">
                  {i18n.t("collaborators.sex.unspecified")}
                </MenuItem>
              </Select>
            </FormControl>
            <FormControl variant="outlined" margin="dense">
              <InputLabel>
                {i18n.t("collaborators.fields.contractualDenomination")}
              </InputLabel>
              <Select
                value={form.contractualDenomination}
                label={i18n.t("collaborators.fields.contractualDenomination")}
                onChange={(event) =>
                  setForm({
                    ...form,
                    contractualDenomination: event.target.value,
                  })
                }
                disabled={form.sex !== "unspecified"}
              >
                <MenuItem value="LA CONTRATISTA">LA CONTRATISTA</MenuItem>
                <MenuItem value="EL CONTRATISTA">EL CONTRATISTA</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={i18n.t("collaborators.fields.identificationType")}
              variant="outlined"
              margin="dense"
              value={form.identificationType}
              onChange={(event) =>
                setForm({ ...form, identificationType: event.target.value })
              }
            />
            <TextField
              label={i18n.t("collaborators.fields.identificationNumber")}
              variant="outlined"
              margin="dense"
              value={form.identificationNumber}
              onChange={(event) =>
                setForm({ ...form, identificationNumber: event.target.value })
              }
            />
            <TextField
              label={i18n.t("collaborators.fields.email")}
              variant="outlined"
              margin="dense"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
            />
            <TextField
              label={i18n.t("collaborators.fields.phone")}
              variant="outlined"
              margin="dense"
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
            />
            <FormControl variant="outlined" margin="dense">
              <InputLabel>
                {i18n.t("collaborators.fields.department")}
              </InputLabel>
              <Select
                value={form.queueId}
                label={i18n.t("collaborators.fields.department")}
                onChange={(event) =>
                  setForm({ ...form, queueId: event.target.value })
                }
              >
                {user.profile === "admin" && (
                  <MenuItem value="">{i18n.t("collaborators.global")}</MenuItem>
                )}
                {queues.map((queue) => (
                  <MenuItem key={queue.id} value={queue.id}>
                    {queue.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              className={classes.fullWidth}
              label={i18n.t("collaborators.fields.address")}
              variant="outlined"
              margin="dense"
              value={form.address}
              onChange={(event) =>
                setForm({ ...form, address: event.target.value })
              }
            />
            <TextField
              className={classes.fullWidth}
              label={i18n.t("collaborators.fields.notes")}
              variant="outlined"
              margin="dense"
              multiline
              rows={3}
              value={form.notes}
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            {i18n.t("collaborators.buttons.cancel")}
          </Button>
          <Button
            color="primary"
            variant="contained"
            onClick={save}
            disabled={
              !form.fullName.trim() ||
              !form.identificationType.trim() ||
              !form.identificationNumber.trim()
            }
          >
            {i18n.t("collaborators.buttons.save")}
          </Button>
        </DialogActions>
      </Dialog>

      <MainHeader>
        <Title>{i18n.t("collaborators.title")}</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            placeholder={i18n.t("collaborators.searchPlaceholder")}
            type="search"
            variant="outlined"
            size="small"
            value={searchParam}
            onChange={(event) => setSearchParam(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: "gray" }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl
            className={classes.filter}
            variant="outlined"
            size="small"
          >
            <InputLabel>{i18n.t("collaborators.fields.status")}</InputLabel>
            <Select
              value={status}
              label={i18n.t("collaborators.fields.status")}
              onChange={(event) => setStatus(event.target.value)}
            >
              <MenuItem value="active">
                {i18n.t("collaborators.statusFilter.active")}
              </MenuItem>
              <MenuItem value="inactive">
                {i18n.t("collaborators.statusFilter.inactive")}
              </MenuItem>
              <MenuItem value="all">
                {i18n.t("collaborators.statusFilter.all")}
              </MenuItem>
            </Select>
          </FormControl>
          {canManage && !installRequired && (
            <Button color="primary" variant="contained" onClick={openCreate}>
              {i18n.t("collaborators.newCollaborator")}
            </Button>
          )}
        </MainHeaderButtonsWrapper>
      </MainHeader>

      {installRequired ? (
        <Paper className={classes.warning} variant="outlined">
          <Typography variant="h6">
            {i18n.t("collaborators.install.title")}
          </Typography>
          <Typography color="textSecondary">
            {i18n.t("collaborators.install.description")}
          </Typography>
        </Paper>
      ) : (
        <Paper className={classes.paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  {i18n.t("collaborators.table.collaborator")}
                </TableCell>
                <TableCell>
                  {i18n.t("collaborators.table.identification")}
                </TableCell>
                <TableCell>{i18n.t("collaborators.fields.sex")}</TableCell>
                <TableCell>
                  {i18n.t("collaborators.table.denomination")}
                </TableCell>
                <TableCell>
                  {i18n.t("collaborators.fields.department")}
                </TableCell>
                <TableCell>{i18n.t("collaborators.table.contact")}</TableCell>
                <TableCell>{i18n.t("collaborators.fields.status")}</TableCell>
                <TableCell align="center">
                  {i18n.t("collaborators.table.actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {collaborators.map((collaborator) => (
                <TableRow key={collaborator.id}>
                  <TableCell>{collaborator.fullName}</TableCell>
                  <TableCell>{collaborator.identificationNumber}</TableCell>
                  <TableCell>
                    {i18n.t(
                      `collaborators.sex.${collaborator.sex || "unspecified"}`,
                    )}
                  </TableCell>
                  <TableCell>{collaborator.contractualDenomination}</TableCell>
                  <TableCell>
                    {collaborator.queue?.name || i18n.t("collaborators.global")}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {collaborator.email ||
                        i18n.t("collaborators.table.noEmail")}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {collaborator.phone ||
                        i18n.t("collaborators.table.noPhone")}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      variant="outlined"
                      color={collaborator.isActive ? "primary" : "default"}
                      label={
                        collaborator.isActive
                          ? i18n.t("collaborators.chip.active")
                          : i18n.t("collaborators.chip.inactive")
                      }
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      title={i18n.t("collaborators.tooltips.viewDossier")}
                      onClick={() => openDossier(collaborator.id)}
                    >
                      <VisibilityOutlinedIcon />
                    </IconButton>
                    {canManage && (
                      <>
                        <IconButton
                          size="small"
                          title={i18n.t("collaborators.tooltips.edit")}
                          onClick={() => openEdit(collaborator)}
                        >
                          <EditOutlinedIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          title={
                            collaborator.isActive
                              ? i18n.t("collaborators.tooltips.deactivate")
                              : i18n.t("collaborators.tooltips.reactivate")
                          }
                          onClick={() => toggleStatus(collaborator)}
                        >
                          {collaborator.isActive ? (
                            <PowerSettingsNewOutlinedIcon />
                          ) : (
                            <ReplayOutlinedIcon />
                          )}
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && collaborators.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary">
                      {i18n.t("collaborators.table.empty")}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </MainContainer>
  );
};

export default Collaborators;
