import React, { useContext, useEffect, useState } from "react";
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
import { i18n } from "../../translate/i18n";
import { WhatsAppsContext } from "../../context/WhatsApp/WhatsAppsContext";

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
  const { whatsApps, loading } = useContext(WhatsAppsContext);
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
  const connections =
    whatsApps && whatsApps.length > 0 ? whatsApps : data.connections;
  const connection =
    connections.find((item) => item.status === "CONNECTED") ||
    connections.find((item) => item.isDefault) ||
    connections[0];
  const connectionLabels = {
    CONNECTED: i18n.t("dashboard.operational.statuses.connected"),
    OPENING: i18n.t("dashboard.operational.statuses.connecting"),
    CONFIG_REQUIRED: i18n.t("dashboard.operational.statuses.configRequired"),
    ERROR: i18n.t("dashboard.operational.statuses.error"),
    TIMEOUT: i18n.t("dashboard.operational.statuses.timeout"),
    DISCONNECTED: i18n.t("dashboard.operational.statuses.disconnected"),
  };
  const connectionStatus = connection
    ? connectionLabels[connection.status] ||
      i18n.t("dashboard.operational.statuses.unknown")
    : loading
    ? i18n.t("dashboard.operational.statuses.loading")
    : i18n.t("dashboard.operational.statuses.notConfigured");

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
          <Typography variant="h4">
            {i18n.t("dashboard.operational.title")}
          </Typography>
          <Typography color="textSecondary">
            {i18n.t("dashboard.operational.subtitle")}
          </Typography>
        </div>
        <Chip
          icon={<WifiOutlined />}
          label={
            connection
              ? `${connection.name}: ${connectionStatus}`
              : loading
              ? i18n.t("dashboard.operational.loadingConnection")
              : i18n.t("dashboard.operational.noConnectionConfigured")
          }
          color={connection?.status === "CONNECTED" ? "primary" : "default"}
          variant="outlined"
        />
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={4}>
          <MetricCard
            title={i18n.t("dashboard.operational.metrics.inService")}
            value={data.totals.open}
            icon={<ForumOutlined />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <MetricCard
            title={i18n.t("dashboard.operational.metrics.pending")}
            value={data.totals.pending}
            icon={<HourglassEmptyOutlined />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <MetricCard
            title={i18n.t("dashboard.operational.metrics.resolved")}
            value={data.totals.closed}
            icon={<CheckCircleOutline />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <MetricCard
            title={i18n.t("dashboard.operational.metrics.activeAgents")}
            value={data.totals.activeAgents}
            icon={<PeopleOutline />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <MetricCard
            title={i18n.t("dashboard.operational.metrics.whatsappStatus")}
            value={connectionStatus}
            icon={<WifiOutlined />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <MetricCard
            title={i18n.t("dashboard.operational.metrics.activeQueues")}
            value={data.queues.length}
            icon={<AccountTreeOutlined />}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper className={classes.section}>
            <Typography variant="h6">
              {i18n.t("dashboard.operational.queueLoad")}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {i18n.t("dashboard.operational.queueLoadHint")}
            </Typography>
            {data.queues.length === 0 && (
              <Typography
                variant="body2"
                color="textSecondary"
                className={classes.queueRow}
              >
                {i18n.t("dashboard.operational.noQueues")}
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
            <Typography variant="h6">
              {i18n.t("dashboard.operational.teamPerformance")}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {i18n.t("dashboard.operational.teamPerformanceHint")}
            </Typography>
            <div className={classes.tableWrap}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      {i18n.t("dashboard.operational.table.agent")}
                    </TableCell>
                    <TableCell align="right">
                      {i18n.t("dashboard.operational.table.open")}
                    </TableCell>
                    <TableCell align="right">
                      {i18n.t("dashboard.operational.table.pending")}
                    </TableCell>
                    <TableCell align="right">
                      {i18n.t("dashboard.operational.table.closed")}
                    </TableCell>
                    <TableCell align="right">
                      {i18n.t("dashboard.operational.table.avgResponse")}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.agents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        {i18n.t("dashboard.operational.noAgents")}
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
                          ? i18n.t("dashboard.operational.noData")
                          : i18n.t("dashboard.operational.minutes", {
                              value: agent.averageResponseMinutes,
                            })}
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
