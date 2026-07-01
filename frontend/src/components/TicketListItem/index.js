import React, { useState, useEffect, useRef, useContext } from "react";

import { useHistory, useParams } from "react-router-dom";
import { parseISO, format, isSameDay } from "date-fns";
import clsx from "clsx";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Typography from "@material-ui/core/Typography";
import Avatar from "@material-ui/core/Avatar";
import Divider from "@material-ui/core/Divider";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import MarkdownWrapper from "../MarkdownWrapper";
import { Tooltip } from "@material-ui/core";
import IconButton from "@material-ui/core/IconButton";
import DeleteOutline from "@material-ui/icons/DeleteOutline";
import { AuthContext } from "../../context/Auth/AuthContext";
import toastError from "../../errors/toastError";
import TransferTicketModal from "../TransferTicketModal";
import ConfirmationModal from "../ConfirmationModal";
import { toast } from "react-toastify";

const useStyles = makeStyles(() => ({
  ticket: {
    position: "relative",
  },

  pendingTicket: {
    cursor: "unset",
  },

  noTicketsDiv: {
    display: "flex",
    height: "100px",
    margin: 40,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  noTicketsText: {
    textAlign: "center",
    color: "rgb(104, 121, 146)",
    fontSize: "14px",
    lineHeight: "1.4",
  },

  noTicketsTitle: {
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0px",
  },

  contactNameWrapper: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },

  metaRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 4,
    flexShrink: 0,
    marginLeft: "auto",
  },

  metaTop: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },

  lastMessageTime: {
    whiteSpace: "nowrap",
  },

  closedTag: {
    alignSelf: "center",
    flexShrink: 0,
    padding: "2px 8px",
    borderRadius: 10,
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#fff",
    backgroundColor: "#1976d2",
  },

  contactLastMessage: {
    paddingRight: 0,
    flex: 1,
    minWidth: 0,
  },

  unreadCount: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 20,
    height: 20,
    padding: "0 6px",
    borderRadius: 10,
    fontSize: "0.75rem",
    fontWeight: 600,
    lineHeight: 1,
    color: "#fff",
    backgroundColor: green[500],
    flexShrink: 0,
  },

  acceptButton: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },

  deleteButton: {
    backgroundColor: "rgba(244, 67, 54, 0.08)",
  },

  ticketQueueColor: {
    flex: "none",
    width: "8px",
    height: "100%",
    position: "absolute",
    top: "0%",
    left: "0%",
  },

  userTag: {
    maxWidth: 140,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    background: "#2576D2",
    color: "#ffffff",
    border: "1px solid #CCC",
    padding: "1px 8px",
    borderRadius: 10,
    fontSize: "0.75rem",
  },

  noAvailableAgentTag: {
    whiteSpace: "nowrap",
    color: "#D9A441",
    fontSize: "0.72rem",
    fontWeight: 600,
  },
}));

const TicketListItem = ({ ticket }) => {
  const classes = useStyles();
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [transferTicketModalOpen, setTransferTicketModalOpen] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const { ticketId } = useParams();
  const isMounted = useRef(true);
  const { user } = useContext(AuthContext);
  const isManager = user?.profile === "admin" || user?.profile === "supervisor";
  const isAdmin = user?.profile === "admin";

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleAcepptTicket = async (e, id) => {
    e.stopPropagation();
    const forceAssignUnavailable = user?.availabilityStatus !== "available";
    if (
      forceAssignUnavailable &&
      !window.confirm(i18n.t("transferTicketModal.unavailableWarning"))
    ) {
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.put(`/tickets/${id}`, {
        status: "open",
        userId: user?.id,
        forceAssignUnavailable,
      });
      history.push(`/tickets/${data.id}`);
    } catch (err) {
      setLoading(false);
      toastError(err);
      return;
    }
    if (isMounted.current) {
      setLoading(false);
    }
  };

  const handleSelectTicket = (id) => {
    history.push(`/tickets/${id}`);
  };

  const handleOpenTransferModal = (e) => {
    e.stopPropagation();
    setTransferTicketModalOpen(true);
  };

  const handleOpenDeleteConfirmation = (e) => {
    e.stopPropagation();
    setDeleteConfirmationOpen(true);
  };

  const handleDeleteTicket = async () => {
    try {
      await api.delete(`/tickets/${ticket.id}`);
      toast.success(i18n.t("ticketsList.deleteSuccess"));
      if (ticketId && +ticketId === ticket.id) {
        history.push("/tickets");
      }
    } catch (err) {
      toastError(err);
    } finally {
      if (isMounted.current) {
        setDeleteConfirmationOpen(false);
      }
    }
  };

  return (
    <React.Fragment key={ticket.id}>
      <ListItem
        dense
        button
        onClick={() => {
          if (ticket.status === "pending" && !isManager) return;
          handleSelectTicket(ticket.id);
        }}
        selected={ticketId && +ticketId === ticket.id}
        className={clsx(classes.ticket, {
          [classes.pendingTicket]: ticket.status === "pending",
        })}
      >
        <Tooltip
          arrow
          placement="right"
          title={ticket.queue?.name || "Sin departamento"}
        >
          <span
            style={{ backgroundColor: ticket.queue?.color || "#7C7C7C" }}
            className={classes.ticketQueueColor}
          ></span>
        </Tooltip>
        <ListItemAvatar>
          <Avatar src={ticket?.contact?.profilePicUrl} />
        </ListItemAvatar>
        <ListItemText
          disableTypography
          primary={
            <span className={classes.contactNameWrapper}>
              <Typography
                noWrap
                component="span"
                variant="body2"
                color="textPrimary"
              >
                {ticket.contact.name}
              </Typography>
              {ticket.status === "closed" && (
                <span className={classes.closedTag}>closed</span>
              )}
              <span className={classes.metaRight}>
                <span className={classes.metaTop}>
                  {ticket.lastMessage && (
                    <Typography
                      className={classes.lastMessageTime}
                      component="span"
                      variant="body2"
                      color="textSecondary"
                    >
                      {isSameDay(parseISO(ticket.updatedAt), new Date()) ? (
                        <>{format(parseISO(ticket.updatedAt), "HH:mm")}</>
                      ) : (
                        <>{format(parseISO(ticket.updatedAt), "dd/MM/yyyy")}</>
                      )}
                    </Typography>
                  )}
                  {ticket.unreadMessages > 0 && (
                    <span className={classes.unreadCount}>
                      {ticket.unreadMessages}
                    </span>
                  )}
                </span>
                {ticket.whatsappId && (
                  <div
                    className={classes.userTag}
                    title={i18n.t("ticketsList.connectionTitle")}
                  >
                    {ticket.whatsapp?.name}
                  </div>
                )}
              </span>
            </span>
          }
          secondary={
            <span className={classes.contactNameWrapper}>
              <Typography
                className={classes.contactLastMessage}
                noWrap
                component="span"
                variant="body2"
                color="textSecondary"
              >
                {ticket.lastMessage ? (
                  <MarkdownWrapper>{ticket.lastMessage}</MarkdownWrapper>
                ) : (
                  <br />
                )}
              </Typography>
              {ticket.noAvailableAgent && (
                <span className={classes.noAvailableAgentTag}>
                  {i18n.t("ticketsList.noAvailableAgent")}
                </span>
              )}
            </span>
          }
        />
        {ticket.status === "closed" && isAdmin && (
          <span className={classes.acceptButton}>
            <Tooltip title={i18n.t("ticketOptionsMenu.delete")}>
              <IconButton
                size="small"
                className={classes.deleteButton}
                onClick={handleOpenDeleteConfirmation}
              >
                <DeleteOutline fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          </span>
        )}
        {ticket.status === "pending" && (
          <span className={classes.acceptButton}>
            <ButtonWithSpinner
              color="primary"
              variant="contained"
              size="small"
              loading={loading}
              onClick={(e) =>
                isManager
                  ? handleOpenTransferModal(e)
                  : handleAcepptTicket(e, ticket.id)
              }
            >
              {isManager
                ? i18n.t("ticketsList.buttons.assign")
                : i18n.t("ticketsList.buttons.accept")}
            </ButtonWithSpinner>
            {isAdmin && (
              <Tooltip title={i18n.t("ticketOptionsMenu.delete")}>
                <IconButton
                  size="small"
                  className={classes.deleteButton}
                  onClick={handleOpenDeleteConfirmation}
                >
                  <DeleteOutline fontSize="small" color="error" />
                </IconButton>
              </Tooltip>
            )}
          </span>
        )}
      </ListItem>
      <Divider variant="inset" component="li" />
      <TransferTicketModal
        modalOpen={transferTicketModalOpen}
        onClose={() => setTransferTicketModalOpen(false)}
        ticketid={ticket.id}
        ticketWhatsappId={ticket.whatsappId}
        ticketEcosystemId={ticket.ecosystemId}
      />
      <ConfirmationModal
        title={`${i18n.t("ticketOptionsMenu.confirmationModal.title")}${
          ticket.id
        } ${i18n.t("ticketOptionsMenu.confirmationModal.titleFrom")}${
          ticket.contact.name
        }?`}
        open={deleteConfirmationOpen}
        onClose={setDeleteConfirmationOpen}
        onConfirm={handleDeleteTicket}
      >
        {i18n.t("ticketOptionsMenu.confirmationModal.message")}
      </ConfirmationModal>
    </React.Fragment>
  );
};

export default TicketListItem;
