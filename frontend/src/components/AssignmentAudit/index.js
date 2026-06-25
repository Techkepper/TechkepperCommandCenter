import React, { useEffect, useState } from "react";
import { Box, Chip, Collapse, IconButton, Paper, Typography } from "@material-ui/core";
import { ExpandLess, ExpandMore, HistoryOutlined } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import clsx from "clsx";
import api from "../../services/api";
import openSocket from "../../services/socket-io";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  root: {
    borderRadius: 0,
    borderLeft: 0,
    borderRight: 0,
    borderTop: 0,
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(0.75, 2),
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
  },
  event: {
    padding: theme.spacing(1, 0),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  statusChip: {
    height: 24,
    fontWeight: 600,
    color: theme.palette.text.secondary,
    backgroundColor:
      theme.palette.type === "dark"
        ? "rgba(255, 255, 255, 0.05)"
        : "rgba(0, 0, 0, 0.04)",
    border: `1px solid ${theme.palette.divider}`,
  },
  statusChipSent: {
    color: theme.palette.primary.main,
    borderColor:
      theme.palette.type === "dark"
        ? "rgba(142, 230, 63, 0.28)"
        : "rgba(95, 175, 58, 0.28)",
    backgroundColor:
      theme.palette.type === "dark"
        ? "rgba(142, 230, 63, 0.08)"
        : "rgba(95, 175, 58, 0.08)",
  },
}));

const actionText = (event) => {
  if (event.action === "take") {
    return i18n.t("assignmentAudit.takenBy", {
      name: event.newUser?.name || i18n.t("assignmentAudit.agent"),
    });
  }
  if (event.action === "reassignment") {
    return i18n.t("assignmentAudit.reassigned", {
      from: event.oldUser?.name || i18n.t("assignmentAudit.unassigned"),
      to: event.newUser?.name || i18n.t("assignmentAudit.unassigned"),
    });
  }
  return event.newUser
    ? i18n.t("assignmentAudit.assignedTo", { name: event.newUser.name })
    : i18n.t("assignmentAudit.removed");
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
    sent: i18n.t("assignmentAudit.noticeStatuses.sent"),
    pending: i18n.t("assignmentAudit.noticeStatuses.pending"),
    failed: i18n.t("assignmentAudit.noticeStatuses.failed"),
    skipped: i18n.t("assignmentAudit.noticeStatuses.skipped"),
  };

  return (
    <Paper variant="outlined" className={classes.root}>
      <Box display="flex" alignItems="center">
        <HistoryOutlined fontSize="small" color="action" />
        <Box ml={1} flex={1}>
          <Typography variant="caption">
            {i18n.t("assignmentAudit.lastAssignmentPrefix")}{" "}
            {actionText(events[0])}
          </Typography>
        </Box>
        <Chip
          size="small"
          className={clsx(classes.statusChip, {
            [classes.statusChipSent]: events[0].autoMessageStatus === "sent",
          })}
          label={i18n.t("assignmentAudit.notice", {
            status:
              noticeStatus[events[0].autoMessageStatus] ||
              i18n.t("assignmentAudit.noticeStatuses.none"),
          })}
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
              {i18n.t("assignmentAudit.by", {
                name:
                  event.performedByUser?.name || i18n.t("assignmentAudit.user"),
              })}{" "}
              · {new Date(event.createdAt).toLocaleString()}
              {event.autoMessageError ? ` · ${event.autoMessageError}` : ""}
            </Typography>
          </div>
        ))}
      </Collapse>
    </Paper>
  );
};

export default AssignmentAudit;
