import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Button,
  Container,
  Grid,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Box,
} from "@material-ui/core";
import { GetAppOutlined, FilterListOutlined } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles((theme) => ({
  root: { paddingTop: theme.spacing(4), paddingBottom: theme.spacing(5) },
  filters: { padding: theme.spacing(2), margin: theme.spacing(3, 0, 2) },
  metric: { padding: theme.spacing(2), height: "100%" },
  table: { marginTop: theme.spacing(2), overflowX: "auto" },
  empty: { padding: theme.spacing(6), textAlign: "center" },
}));

const initialFilters = {
  agentId: "",
  searchParam: "",
  startDate: "",
  endDate: "",
  queueId: "",
  status: "",
  ecosystemId: "",
};

const statusLabels = {
  open: "En atención",
  pending: "Pendiente",
  closed: "Resuelta",
};

const AgentHistory = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const canReviewTeam = user.profile === "admin" || user.profile === "supervisor";
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [result, setResult] = useState({ rows: [], metrics: {} });
  const [users, setUsers] = useState([]);
  const [queues, setQueues] = useState([]);
  const [ecosystems, setEcosystems] = useState([]);

  useEffect(() => {
    const usersRequest = canReviewTeam
      ? api.get("/users")
      : Promise.resolve({ data: { users: [user] } });
    Promise.all([usersRequest, api.get("/queue"), api.get("/ecosystems")])
      .then(([usersResponse, queuesResponse, ecosystemsResponse]) => {
        setUsers(usersResponse.data.users || []);
        setQueues(queuesResponse.data);
        setEcosystems(ecosystemsResponse.data);
      })
      .catch(toastError);
  }, [canReviewTeam, user]);

  useEffect(() => {
    api
      .get("/reports/agent-history", { params: appliedFilters })
      .then(({ data }) => setResult(data))
      .catch(toastError);
  }, [appliedFilters]);

  const metrics = useMemo(
    () => [
      ["Clientes", result.metrics.customers],
      ["Conversaciones", result.metrics.conversations],
      ["Cerradas", result.metrics.closed],
      ["Reasignaciones", result.metrics.reassignments],
      ["Tomadas manualmente", result.metrics.manualTakes],
    ],
    [result.metrics]
  );

  const setFilter = (name) => (event) =>
    setFilters((current) => ({ ...current, [name]: event.target.value }));

  const exportCsv = async () => {
    try {
      const response = await api.get("/reports/agent-history.csv", {
        params: appliedFilters,
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "historial-agentes-techkepper.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toastError(error);
    }
  };

  return (
    <Container maxWidth="xl" className={classes.root}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <div>
          <Typography variant="h4">Historial por agente</Typography>
          <Typography color="textSecondary">
            Clientes atendidos, carga operativa y trazabilidad del equipo.
          </Typography>
        </div>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<GetAppOutlined />}
          onClick={exportCsv}
        >
          Exportar CSV
        </Button>
      </Box>

      <Paper className={classes.filters}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              variant="outlined"
              label="Agente"
              value={canReviewTeam ? filters.agentId : user.id || ""}
              onChange={setFilter("agentId")}
              disabled={!canReviewTeam}
            >
              {canReviewTeam && <MenuItem value="">Todos</MenuItem>}
              {users.map((user) => (
                <MenuItem value={user.id} key={user.id}>
                  {user.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              variant="outlined"
              label="Cliente o número"
              value={filters.searchParam}
              onChange={setFilter("searchParam")}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              type="date"
              variant="outlined"
              label="Desde"
              InputLabelProps={{ shrink: true }}
              value={filters.startDate}
              onChange={setFilter("startDate")}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              type="date"
              variant="outlined"
              label="Hasta"
              InputLabelProps={{ shrink: true }}
              value={filters.endDate}
              onChange={setFilter("endDate")}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              style={{ height: 56 }}
              variant="contained"
              color="primary"
              startIcon={<FilterListOutlined />}
              onClick={() => setAppliedFilters(filters)}
            >
              Aplicar
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              variant="outlined"
              label="Departamento"
              value={filters.queueId}
              onChange={setFilter("queueId")}
            >
              <MenuItem value="">Todos</MenuItem>
              {queues.map((queue) => (
                <MenuItem value={queue.id} key={queue.id}>
                  {queue.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              variant="outlined"
              label="Estado"
              value={filters.status}
              onChange={setFilter("status")}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="open">En atención</MenuItem>
              <MenuItem value="pending">Pendiente</MenuItem>
              <MenuItem value="closed">Cerrado</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              variant="outlined"
              label="Ecosistema"
              value={filters.ecosystemId}
              onChange={setFilter("ecosystemId")}
            >
              <MenuItem value="">Todos</MenuItem>
              {ecosystems.map((ecosystem) => (
                <MenuItem value={ecosystem.id} key={ecosystem.id}>
                  {ecosystem.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        {metrics.map(([label, value]) => (
          <Grid item xs={6} md key={label}>
            <Paper className={classes.metric}>
              <Typography variant="caption" color="textSecondary">
                {label}
              </Typography>
              <Typography variant="h5">{value ?? 0}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper className={classes.table}>
        {result.rows.length ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>WhatsApp</TableCell>
                <TableCell>Agente</TableCell>
                <TableCell>Última conversación</TableCell>
                <TableCell>Departamento</TableCell>
                <TableCell>Ecosistema</TableCell>
                <TableCell align="right">Conversaciones</TableCell>
                <TableCell>Última interacción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.rows.map((row) => (
                <TableRow key={row.contactId}>
                  <TableCell>{row.contactName}</TableCell>
                  <TableCell>{row.number}</TableCell>
                  <TableCell>{row.agent}</TableCell>
                  <TableCell>
                    #{row.lastTicket?.id} ·{" "}
                    {statusLabels[row.lastTicket?.status] || "Sin estado"}
                  </TableCell>
                  <TableCell>{row.lastTicket?.queue || "—"}</TableCell>
                  <TableCell>{row.lastTicket?.ecosystem || "—"}</TableCell>
                  <TableCell align="right">{row.total}</TableCell>
                  <TableCell>
                    {new Date(row.lastInteractionAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className={classes.empty}>
            <Typography color="textSecondary">
              No hay datos para los filtros seleccionados.
            </Typography>
          </div>
        )}
      </Paper>
    </Container>
  );
};

export default AgentHistory;
