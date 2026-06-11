import React, { useEffect, useState } from "react";
import { Box, Chip, Collapse, IconButton, Paper, Typography } from "@material-ui/core";
import { ExpandLess, ExpandMore, HistoryOutlined } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import api from "../../services/api";
import openSocket from "../../services/socket-io";

const useStyles = makeStyles((theme) => ({
  root: {
    borderRadius: 0,
    borderLeft: 0,
    borderRight: 0,
    padding: theme.spacing(0.75, 2),
    background:
      theme.palette.type === "dark"
        ? "rgba(142,230,63,.05)"
        : "rgba(95,175,58,.05)",
  },
  event: {
    padding: theme.spacing(1, 0),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
}));

const actionText = (event) => {
  if (event.action === "take") {
    return `Conversación tomada por ${event.newUser?.name || "agente"}`;
  }
  if (event.action === "reassignment") {
    return `Reasignado de ${event.oldUser?.name || "sin asignar"} a ${
      event.newUser?.name || "sin asignar"
    }`;
  }
  return event.newUser
    ? `Asignado a ${event.newUser.name}`
    : "Asignación removida";
};

const AssignmentAudit = ({ ticketId }) => {
  const classes = useStyles();
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ticketId) return;
    api
      .get(`/tickets/${ticketId}/assignment-events`)
      .then(({ data }) => setEvents(data))
      .catch(() => setEvents([]));

    const socket = openSocket();
    socket.on("connect", () => socket.emit("joinChatBox", ticketId));
    socket.on("assignmentEvent", ({ event }) =>
      setEvents((current) => [event, ...current])
    );
    return () => socket.disconnect();
  }, [ticketId]);

  if (!events.length) return null;
  const noticeStatus = {
    sent: "enviado",
    pending: "pendiente",
    failed: "fallido",
    skipped: "omitido",
  };

  return (
    <Paper variant="outlined" className={classes.root}>
      <Box display="flex" alignItems="center">
        <HistoryOutlined fontSize="small" color="primary" />
        <Box ml={1} flex={1}>
          <Typography variant="caption">
            Última asignación: {actionText(events[0])}
          </Typography>
        </Box>
        <Chip
          size="small"
          variant="outlined"
          color={events[0].autoMessageStatus === "sent" ? "primary" : "default"}
          label={`Aviso: ${
            noticeStatus[events[0].autoMessageStatus] || "sin estado"
          }`}
        />
        <IconButton size="small" onClick={() => setOpen((value) => !value)}>
          {open ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      <Collapse in={open}>
        {events.slice(0, 10).map((event) => (
          <div className={classes.event} key={event.id}>
            <Typography variant="body2">{actionText(event)}</Typography>
            <Typography variant="caption" color="textSecondary">
              Por {event.performedByUser?.name || "usuario"} ·{" "}
              {new Date(event.createdAt).toLocaleString()}
              {event.autoMessageError ? ` · ${event.autoMessageError}` : ""}
            </Typography>
          </div>
        ))}
      </Collapse>
    </Paper>
  );
};

export default AssignmentAudit;
