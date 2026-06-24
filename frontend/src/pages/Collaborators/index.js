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
import { toast } from "react-toastify";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

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
      .get("/queues")
      .then(({ data }) => setQueues(Array.isArray(data) ? data : data.queues || []))
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
          ? "Colaborador actualizado correctamente."
          : "Colaborador creado correctamente."
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
          ? "Colaborador desactivado correctamente."
          : "Colaborador reactivado correctamente."
      );
      await loadCollaborators();
    } catch (error) {
      toastError(error);
    }
  };

  return (
    <MainContainer>
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingId ? "Editar colaborador" : "Nuevo colaborador"}
        </DialogTitle>
        <DialogContent dividers>
          <div className={classes.formGrid}>
            <TextField
              label="Nombre completo"
              variant="outlined"
              margin="dense"
              value={form.fullName}
              onChange={(event) =>
                setForm({ ...form, fullName: event.target.value })
              }
            />
            <FormControl variant="outlined" margin="dense">
              <InputLabel>Denominación contractual</InputLabel>
              <Select
                value={form.contractualDenomination}
                label="Denominación contractual"
                onChange={(event) =>
                  setForm({
                    ...form,
                    contractualDenomination: event.target.value,
                  })
                }
              >
                <MenuItem value="LA CONTRATISTA">LA CONTRATISTA</MenuItem>
                <MenuItem value="EL CONTRATISTA">EL CONTRATISTA</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Tipo de identificación"
              variant="outlined"
              margin="dense"
              value={form.identificationType}
              onChange={(event) =>
                setForm({ ...form, identificationType: event.target.value })
              }
            />
            <TextField
              label="Número de identificación"
              variant="outlined"
              margin="dense"
              value={form.identificationNumber}
              onChange={(event) =>
                setForm({ ...form, identificationNumber: event.target.value })
              }
            />
            <TextField
              label="Correo electrónico"
              variant="outlined"
              margin="dense"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
            />
            <TextField
              label="Teléfono"
              variant="outlined"
              margin="dense"
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
            />
            <FormControl variant="outlined" margin="dense">
              <InputLabel>Departamento</InputLabel>
              <Select
                value={form.queueId}
                label="Departamento"
                onChange={(event) =>
                  setForm({ ...form, queueId: event.target.value })
                }
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
            <TextField
              className={classes.fullWidth}
              label="Dirección"
              variant="outlined"
              margin="dense"
              value={form.address}
              onChange={(event) =>
                setForm({ ...form, address: event.target.value })
              }
            />
            <TextField
              className={classes.fullWidth}
              label="Notas internas"
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
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
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
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <MainHeader>
        <Title>Colaboradores</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            placeholder="Buscar colaborador"
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
            <InputLabel>Estado</InputLabel>
            <Select
              value={status}
              label="Estado"
              onChange={(event) => setStatus(event.target.value)}
            >
              <MenuItem value="active">Activos</MenuItem>
              <MenuItem value="inactive">Inactivos</MenuItem>
              <MenuItem value="all">Todos</MenuItem>
            </Select>
          </FormControl>
          {canManage && !installRequired && (
            <Button color="primary" variant="contained" onClick={openCreate}>
              Nuevo colaborador
            </Button>
          )}
        </MainHeaderButtonsWrapper>
      </MainHeader>

      {installRequired ? (
        <Paper className={classes.warning} variant="outlined">
          <Typography variant="h6">Instalación pendiente</Typography>
          <Typography color="textSecondary">
            El módulo Colaboradores requiere ejecutar la migración incluida.
          </Typography>
        </Paper>
      ) : (
        <Paper className={classes.paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Colaborador</TableCell>
                <TableCell>Identificación</TableCell>
                <TableCell>Denominación</TableCell>
                <TableCell>Departamento</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {collaborators.map((collaborator) => (
                <TableRow key={collaborator.id}>
                  <TableCell>{collaborator.fullName}</TableCell>
                  <TableCell>{collaborator.identificationNumber}</TableCell>
                  <TableCell>{collaborator.contractualDenomination}</TableCell>
                  <TableCell>{collaborator.queue?.name || "Global"}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {collaborator.email || "Sin correo"}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {collaborator.phone || "Sin teléfono"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      variant="outlined"
                      color={collaborator.isActive ? "primary" : "default"}
                      label={collaborator.isActive ? "Activo" : "Inactivo"}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {canManage && (
                      <>
                        <IconButton
                          size="small"
                          title="Editar"
                          onClick={() => openEdit(collaborator)}
                        >
                          <EditOutlinedIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          title={
                            collaborator.isActive ? "Desactivar" : "Reactivar"
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
                      No hay colaboradores para mostrar.
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
