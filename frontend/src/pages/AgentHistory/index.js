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
import {
  GetAppOutlined,
  FilterListOutlined,
  VisibilityOutlined,
} from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import { useHistory } from "react-router-dom";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
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

const AgentHistory = () => {
  const classes = useStyles();
  const history = useHistory();
  const statusLabels = {
    open: i18n.t("agentHistory.statuses.open"),
    pending: i18n.t("agentHistory.statuses.pending"),
    closed: i18n.t("agentHistory.statuses.closed"),
  };
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
      [i18n.t("agentHistory.metrics.customers"), result.metrics.customers],
      [
        i18n.t("agentHistory.metrics.conversations"),
        result.metrics.conversations,
      ],
      [i18n.t("agentHistory.metrics.closed"), result.metrics.closed],
      [
        i18n.t("agentHistory.metrics.reassignments"),
        result.metrics.reassignments,
      ],
      [
        i18n.t("agentHistory.metrics.manualTakes"),
        result.metrics.manualTakes,
      ],
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
          <Typography variant="h4">{i18n.t("agentHistory.title")}</Typography>
          <Typography color="textSecondary">
            {i18n.t("agentHistory.subtitle")}
          </Typography>
        </div>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<GetAppOutlined />}
          onClick={exportCsv}
        >
          {i18n.t("agentHistory.exportCsv")}
        </Button>
      </Box>

      <Paper className={classes.filters}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              variant="outlined"
              label={i18n.t("agentHistory.filters.agent")}
              value={canReviewTeam ? filters.agentId : user.id || ""}
              onChange={setFilter("agentId")}
              disabled={!canReviewTeam}
            >
              {canReviewTeam && (
                <MenuItem value="">{i18n.t("agentHistory.filters.all")}</MenuItem>
              )}
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
              label={i18n.t("agentHistory.filters.customerOrNumber")}
              value={filters.searchParam}
              onChange={setFilter("searchParam")}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              type="date"
              variant="outlined"
              label={i18n.t("agentHistory.filters.from")}
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
              label={i18n.t("agentHistory.filters.to")}
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
              {i18n.t("agentHistory.filters.apply")}
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              variant="outlined"
              label={i18n.t("agentHistory.filters.queue")}
              value={filters.queueId}
              onChange={setFilter("queueId")}
            >
              <MenuItem value="">{i18n.t("agentHistory.filters.all")}</MenuItem>
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
              label={i18n.t("agentHistory.filters.status")}
              value={filters.status}
              onChange={setFilter("status")}
            >
              <MenuItem value="">{i18n.t("agentHistory.filters.all")}</MenuItem>
              <MenuItem value="open">
                {i18n.t("agentHistory.statuses.open")}
              </MenuItem>
              <MenuItem value="pending">
                {i18n.t("agentHistory.statuses.pending")}
              </MenuItem>
              <MenuItem value="closed">
                {i18n.t("agentHistory.statuses.closedFilter")}
              </MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              variant="outlined"
              label={i18n.t("agentHistory.filters.ecosystem")}
              value={filters.ecosystemId}
              onChange={setFilter("ecosystemId")}
            >
              <MenuItem value="">{i18n.t("agentHistory.filters.all")}</MenuItem>
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
                <TableCell>{i18n.t("agentHistory.table.customer")}</TableCell>
                <TableCell>{i18n.t("agentHistory.table.whatsapp")}</TableCell>
                <TableCell>{i18n.t("agentHistory.table.agent")}</TableCell>
                <TableCell>
                  {i18n.t("agentHistory.table.lastConversation")}
                </TableCell>
                <TableCell>{i18n.t("agentHistory.table.queue")}</TableCell>
                <TableCell>{i18n.t("agentHistory.table.ecosystem")}</TableCell>
                <TableCell align="right">
                  {i18n.t("agentHistory.table.conversations")}
                </TableCell>
                <TableCell>
                  {i18n.t("agentHistory.table.lastInteraction")}
                </TableCell>
                <TableCell align="right">
                  {i18n.t("agentHistory.table.conversation")}
                </TableCell>
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
                    {statusLabels[row.lastTicket?.status] ||
                      i18n.t("agentHistory.statuses.none")}
                  </TableCell>
                  <TableCell>{row.lastTicket?.queue || "—"}</TableCell>
                  <TableCell>{row.lastTicket?.ecosystem || "—"}</TableCell>
                  <TableCell align="right">{row.total}</TableCell>
                  <TableCell>
                    {new Date(row.lastInteractionAt).toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      color="primary"
                      startIcon={<VisibilityOutlined />}
                      disabled={!row.lastTicket?.id}
                      onClick={() =>
                        history.push(`/tickets/${row.lastTicket.id}`)
                      }
                    >
                      {i18n.t("agentHistory.open")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className={classes.empty}>
            <Typography color="textSecondary">
              {i18n.t("agentHistory.noData")}
            </Typography>
          </div>
        )}
      </Paper>
    </Container>
  );
};

export default AgentHistory;
