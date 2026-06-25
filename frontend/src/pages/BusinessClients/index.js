import React, {
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import {
  Button,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
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
  Typography,
} from "@material-ui/core";
import EditOutlinedIcon from "@material-ui/icons/EditOutlined";
import PowerSettingsNewOutlinedIcon from "@material-ui/icons/PowerSettingsNewOutlined";
import ReplayOutlinedIcon from "@material-ui/icons/ReplayOutlined";
import SearchIcon from "@material-ui/icons/Search";
import VisibilityOutlinedIcon from "@material-ui/icons/VisibilityOutlined";
import { toast } from "react-toastify";

import BusinessClientModal from "../../components/BusinessClientModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import EntityDossierDialog from "../../components/EntityDossierDialog";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import Title from "../../components/Title";
import { AuthContext } from "../../context/Auth/AuthContext";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import openSocket from "../../services/socket-io";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "auto",
    ...theme.scrollbarStyles,
  },
  filter: {
    minWidth: 150,
  },
  tabsPaper: {
    marginBottom: theme.spacing(2),
  },
  installWarning: {
    padding: theme.spacing(3),
    borderColor: "rgba(255, 193, 7, 0.35)",
    background: "rgba(255, 193, 7, 0.08)",
  },
}));

const reducer = (state, action) => {
  if (action.type === "RESET") return [];
  if (action.type === "LOAD") {
    const merged = [...state];
    action.payload.forEach((client) => {
      const index = merged.findIndex((item) => item.id === client.id);
      if (index >= 0) merged[index] = client;
      else merged.push(client);
    });
    return merged;
  }
  if (action.type === "UPSERT") {
    const index = state.findIndex((item) => item.id === action.payload.id);
    if (index < 0) return [action.payload, ...state];
    const next = [...state];
    next[index] = action.payload;
    return next;
  }
  if (action.type === "REMOVE") {
    return state.filter((item) => item.id !== action.payload);
  }
  return state;
};

const getErrorCode = (error) =>
  error.response?.data?.error || error.response?.data?.message;

const clientMatchesFilters = (client, status, searchParam, type) => {
  const statusMatches =
    status === "all" ||
    (status === "active" && client.isActive) ||
    (status === "inactive" && !client.isActive);
  const typeMatches = !type || client.type === type;
  const search = searchParam.trim().toLowerCase();
  const searchMatches =
    !search ||
    [
      client.displayName,
      client.legalName,
      client.tradeName,
      client.identificationNumber,
      client.email,
      client.phone,
    ].some((value) => value?.toLowerCase().includes(search));

  return statusMatches && typeMatches && searchMatches;
};

const BusinessClients = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const canManage = user.profile === "admin" || user.profile === "supervisor";
  const isAdmin = user.profile === "admin";
  const [clients, dispatch] = useReducer(reducer, []);
  const [loading, setLoading] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [status, setStatus] = useState("active");
  const [type, setType] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [installRequired, setInstallRequired] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [statusClient, setStatusClient] = useState(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedClientId(null);
  }, []);
  const markInstallRequired = useCallback(() => {
    setInstallRequired(true);
  }, []);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam, status, type]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const delay = setTimeout(async () => {
      try {
        const { data } = await api.get("/business-clients", {
          params: { searchParam, pageNumber, status, type: type || undefined },
        });
        if (!mounted) return;
        setInstallRequired(false);
        dispatch({ type: "LOAD", payload: data.clients });
        setHasMore(data.hasMore);
      } catch (error) {
        if (getErrorCode(error) === "ERR_BUSINESS_CLIENTS_NOT_INSTALLED") {
          setInstallRequired(true);
          dispatch({ type: "RESET" });
        } else {
          toastError(error);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }, 400);

    return () => {
      mounted = false;
      clearTimeout(delay);
    };
  }, [pageNumber, searchParam, status, type]);

  useEffect(() => {
    const socket = openSocket();
    socket.on("businessClient", ({ client }) => {
      if (clientMatchesFilters(client, status, searchParam, type)) {
        dispatch({ type: "UPSERT", payload: client });
      } else {
        dispatch({ type: "REMOVE", payload: client.id });
      }
    });
    return () => socket.disconnect();
  }, [searchParam, status, type]);

  const openCreate = () => {
    setSelectedClientId(null);
    setModalOpen(true);
  };

  const openEdit = (clientId) => {
    setSelectedClientId(clientId);
    setModalOpen(true);
  };

  const openDetail = async (clientId) => {
    try {
      const { data } = await api.get(`/business-clients/${clientId}/dossier`);
      setDossier(data);
    } catch (error) {
      toastError(error);
    }
  };

  const reloadDossier = async () => {
    if (dossier?.entity?.id) await openDetail(dossier.entity.id);
  };

  const changeStatus = async () => {
    try {
      const { data } = await api.patch(
        `/business-clients/${statusClient.id}/status`,
        { isActive: !statusClient.isActive }
      );
      dispatch({
        type: clientMatchesFilters(data, status, searchParam, type)
          ? "UPSERT"
          : "REMOVE",
        payload: clientMatchesFilters(data, status, searchParam, type)
          ? data
          : data.id,
      });
      toast.success(
        data.isActive
          ? "Cliente reactivado correctamente."
          : "Cliente desactivado correctamente."
      );
    } catch (error) {
      toastError(error);
    } finally {
      setStatusClient(null);
      setConfirmationOpen(false);
    }
  };

  const handleScroll = (event) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      setPageNumber((current) => current + 1);
    }
  };

  return (
    <MainContainer>
      <BusinessClientModal
        open={modalOpen}
        onClose={closeModal}
        clientId={selectedClientId}
        isAdmin={isAdmin}
        onSaved={(client) =>
          dispatch({
            type: clientMatchesFilters(client, status, searchParam, type)
              ? "UPSERT"
              : "REMOVE",
            payload: clientMatchesFilters(client, status, searchParam, type)
              ? client
              : client.id,
          })
        }
        onInstallRequired={markInstallRequired}
      />

      <ConfirmationModal
        open={confirmationOpen}
        onClose={setConfirmationOpen}
        onConfirm={changeStatus}
        title={
          statusClient?.isActive ? "Desactivar cliente" : "Reactivar cliente"
        }
      >
        {statusClient?.isActive
          ? "El cliente dejará de aparecer entre los clientes activos, pero conservará su historial."
          : "El cliente volverá a estar disponible para la gestión comercial."}
      </ConfirmationModal>

      <EntityDossierDialog
        open={Boolean(dossier)}
        dossier={dossier}
        onClose={() => setDossier(null)}
        onReload={reloadDossier}
      />

      <MainHeader>
        <Title>Clientes</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            placeholder="Buscar cliente"
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
              onChange={(event) => setStatus(event.target.value)}
              label="Estado"
            >
              <MenuItem value="active">Activos</MenuItem>
              <MenuItem value="inactive">Inactivos</MenuItem>
              <MenuItem value="all">Todos</MenuItem>
            </Select>
          </FormControl>
          {canManage && !installRequired && (
            <Button color="primary" variant="contained" onClick={openCreate}>
              Nuevo cliente
            </Button>
          )}
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <Paper className={classes.tabsPaper} variant="outlined">
        <Tabs
          value={type}
          onChange={(_, value) => setType(value)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab value="" label="Todos" />
          <Tab value="legal" label="Jurídicos" />
          <Tab value="physical" label="Físicos" />
        </Tabs>
      </Paper>

      {installRequired ? (
        <Paper className={classes.installWarning} variant="outlined">
          <Typography variant="h6">Instalación pendiente</Typography>
          <Typography color="textSecondary">
            El módulo Clientes está integrado, pero la tabla BusinessClients
            todavía no existe. Revise SQL_MANUAL_STEPS.md y ejecute únicamente
            el bloque correspondiente en la base correcta.
          </Typography>
        </Paper>
      ) : (
        <Paper
          className={classes.mainPaper}
          variant="outlined"
          onScroll={handleScroll}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Identificación</TableCell>
                <TableCell>Departamento</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} hover>
                  <TableCell>
                    <Typography>{client.displayName}</Typography>
                    {client.tradeName && (
                      <Typography variant="caption" color="textSecondary">
                        {client.tradeName}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {client.type === "legal" ? "Jurídico" : "Físico"}
                  </TableCell>
                  <TableCell>{client.identificationNumber}</TableCell>
                  <TableCell>{client.queue?.name || "Global"}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {client.email || "Sin correo"}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {client.phone || "Sin teléfono"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      variant="outlined"
                      color={client.isActive ? "primary" : "default"}
                      label={client.isActive ? "Activo" : "Inactivo"}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      title="Ver detalle"
                      onClick={() => openDetail(client.id)}
                    >
                      <VisibilityOutlinedIcon />
                    </IconButton>
                    {canManage && (
                      <>
                        <IconButton
                          size="small"
                          title="Editar"
                          onClick={() => openEdit(client.id)}
                        >
                          <EditOutlinedIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          title={client.isActive ? "Desactivar" : "Reactivar"}
                          onClick={() => {
                            setStatusClient(client);
                            setConfirmationOpen(true);
                          }}
                        >
                          {client.isActive ? (
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
              {!loading && clients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary">
                      No hay clientes para mostrar.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {loading && <TableRowSkeleton columns={7} />}
            </TableBody>
          </Table>
        </Paper>
      )}
    </MainContainer>
  );
};

export default BusinessClients;
