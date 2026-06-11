import React, { useEffect, useState } from "react";
import {
  Box,
  Chip,
  Container,
  Grid,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import {
  ForumOutlined,
  HourglassEmptyOutlined,
  CheckCircleOutline,
  PeopleOutline,
  WifiOutlined,
  AccountTreeOutlined,
} from "@material-ui/icons";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  container: { paddingTop: theme.spacing(4), paddingBottom: theme.spacing(5) },
  heading: { marginBottom: theme.spacing(3) },
  metric: {
    height: "100%",
    padding: theme.spacing(2.5),
    border: `1px solid ${theme.palette.divider}`,
  },
  metricIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    background:
      theme.palette.type === "dark"
        ? "rgba(142,230,63,.12)"
        : "rgba(95,175,58,.11)",
    color: theme.palette.primary.main,
  },
  section: {
    padding: theme.spacing(2.5),
    height: "100%",
    border: `1px solid ${theme.palette.divider}`,
  },
  queueRow: { marginTop: theme.spacing(2) },
  tableWrap: { overflowX: "auto" },
}));

const MetricCard = ({ title, value, icon }) => {
  const classes = useStyles();
  return (
    <Paper className={classes.metric}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <div>
          <Typography color="textSecondary" variant="body2">
            {title}
          </Typography>
          <Typography variant="h4">{value ?? "—"}</Typography>
        </div>
        <div className={classes.metricIcon}>{icon}</div>
      </Box>
    </Paper>
  );
};

const Dashboard = () => {
  const classes = useStyles();
  const [data, setData] = useState({
    totals: {},
    connections: [],
    queues: [],
    agents: [],
  });

  useEffect(() => {
    api
      .get("/dashboard/metrics")
      .then(({ data: metrics }) => setData(metrics))
      .catch(toastError);
  }, []);

  const maxQueue = Math.max(...data.queues.map((queue) => queue.total), 1);
  const connection = data.connections[0];
  const connectionLabels = {
    CONNECTED: "Conectada",
    OPENING: "Conectando",
    PAIRING: "Vinculando",
    qrcode: "Esperando código QR",
    TIMEOUT: "Sin respuesta",
    DISCONNECTED: "Desconectada",
  };
  const connectionStatus = connection
    ? connectionLabels[connection.status] || "Estado desconocido"
    : "Sin configurar";

  return (
    <Container maxWidth="xl" className={classes.container}>
      <Box
        className={classes.heading}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
      >
        <div>
          <Typography variant="h4">Centro operativo</Typography>
          <Typography color="textSecondary">
            Estado en tiempo real de la atención Techkepper.
          </Typography>
        </div>
        <Chip
          icon={<WifiOutlined />}
          label={
            connection
              ? `${connection.name}: ${connectionStatus}`
              : "Sin conexión configurada"
          }
          color={connection?.status === "CONNECTED" ? "primary" : "default"}
          variant="outlined"
        />
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={4}>
          <MetricCard
            title="En atención"
            value={data.totals.open}
            icon={<ForumOutlined />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <MetricCard
            title="Pendientes"
            value={data.totals.pending}
            icon={<HourglassEmptyOutlined />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <MetricCard
            title="Resueltas"
            value={data.totals.closed}
            icon={<CheckCircleOutline />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <MetricCard
            title="Agentes activos"
            value={data.totals.activeAgents}
            icon={<PeopleOutline />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <MetricCard
            title="Estado de WhatsApp"
            value={connectionStatus}
            icon={<WifiOutlined />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <MetricCard
            title="Departamentos activos"
            value={data.queues.length}
            icon={<AccountTreeOutlined />}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper className={classes.section}>
            <Typography variant="h6">Carga por departamento</Typography>
            <Typography variant="body2" color="textSecondary">
              Conversaciones visibles según su rol y departamentos asignados.
            </Typography>
            {data.queues.length === 0 && (
              <Typography
                variant="body2"
                color="textSecondary"
                className={classes.queueRow}
              >
                No hay departamentos activos para mostrar.
              </Typography>
            )}
            {data.queues.map((queue) => (
              <div className={classes.queueRow} key={queue.id}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">{queue.name}</Typography>
                  <Typography variant="body2">{queue.total}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(queue.total / maxQueue) * 100}
                  style={{ height: 8, borderRadius: 8, marginTop: 6 }}
                />
              </div>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper className={classes.section}>
            <Typography variant="h6">Rendimiento del equipo</Typography>
            <Typography variant="body2" color="textSecondary">
              Ranking interno por cierres; el tiempo de respuesta se muestra
              cuando existen marcas suficientes.
            </Typography>
            <div className={classes.tableWrap}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Agente</TableCell>
                    <TableCell align="right">Abiertas</TableCell>
                    <TableCell align="right">Pendientes</TableCell>
                    <TableCell align="right">Cerradas</TableCell>
                    <TableCell align="right">Resp. promedio</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.agents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No hay actividad de agentes para mostrar.
                      </TableCell>
                    </TableRow>
                  )}
                  {data.agents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <Typography variant="body2">{agent.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {agent.profile}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{agent.open}</TableCell>
                      <TableCell align="right">{agent.pending}</TableCell>
                      <TableCell align="right">{agent.closed}</TableCell>
                      <TableCell align="right">
                        {agent.averageResponseMinutes == null
                          ? "Sin datos"
                          : `${agent.averageResponseMinutes} min`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
