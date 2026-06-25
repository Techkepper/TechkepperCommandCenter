import React, { useCallback, useContext, useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";

import { toast } from "react-toastify";
import openSocket from "../../services/socket-io";
import clsx from "clsx";

import { Box, Chip, Paper, Typography, makeStyles } from "@material-ui/core";

import ContactDrawer from "../ContactDrawer";
import MessageInput from "../MessageInput/";
import TicketHeader from "../TicketHeader";
import TicketInfo from "../TicketInfo";
import TicketActionButtons from "../TicketActionButtons";
import MessagesList from "../MessagesList";
import api from "../../services/api";
import { ReplyMessageProvider } from "../../context/ReplyingMessage/ReplyingMessageContext";
import toastError from "../../errors/toastError";
import AssignmentAudit from "../AssignmentAudit";
import { AuthContext } from "../../context/Auth/AuthContext";
import { i18n } from "../../translate/i18n";

const drawerWidth = 320;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    height: "100%",
    position: "relative",
    overflow: "hidden",
  },

  ticketInfo: {
    maxWidth: "50%",
    flexBasis: "50%",
    [theme.breakpoints.down("sm")]: {
      maxWidth: "80%",
      flexBasis: "80%",
    },
  },
  ticketActionButtons: {
    maxWidth: "50%",
    flexBasis: "50%",
    display: "flex",
    [theme.breakpoints.down("sm")]: {
      maxWidth: "100%",
      flexBasis: "100%",
      marginBottom: "5px",
    },
  },

  mainWrapper: {
    flex: 1,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeft: "0",
    marginRight: -drawerWidth,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },

  mainWrapperShift: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: 0,
  },
}));

const Ticket = () => {
  const { ticketId } = useParams();
  const history = useHistory();
  const classes = useStyles();
  const { user } = useContext(AuthContext);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState({});
  const [ticket, setTicket] = useState({});

  const resolveCanReply = useCallback(nextTicket => {
    if (typeof nextTicket.canReply === "boolean") return nextTicket.canReply;
    return (
      nextTicket.status === "open" &&
      Number(nextTicket.userId) === Number(user?.id)
    );
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchTicket = async () => {
        try {
          const { data } = await api.get("/tickets/" + ticketId);

          setContact(data.contact);
          setTicket({
            ...data,
            canReply: resolveCanReply(data),
          });
          setLoading(false);
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      };
      fetchTicket();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [ticketId, history, resolveCanReply]);

  useEffect(() => {
    const socket = openSocket();

    socket.on("connect", () => socket.emit("joinChatBox", ticketId));

    socket.on("ticket", (data) => {
      if (data.action === "update") {
        setTicket((current) => ({
          ...data.ticket,
          readOnly: Boolean(current.readOnly || data.ticket.readOnly),
          canReply: resolveCanReply(data.ticket),
        }));
      }

      if (data.action === "delete") {
        toast.success(i18n.t("ticketView.deleted"));
        history.push("/tickets");
      }
    });

    socket.on("contact", (data) => {
      if (data.action === "update") {
        setContact((prevState) => {
          if (prevState.id === data.contact?.id) {
            return { ...prevState, ...data.contact };
          }
          return prevState;
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [ticketId, history, resolveCanReply]);

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const isObserver = !ticket.readOnly && ticket.canReply === false;

  return (
    <div className={classes.root} id="drawer-container">
      <Paper
        variant="outlined"
        elevation={0}
        className={clsx(classes.mainWrapper, {
          [classes.mainWrapperShift]: drawerOpen,
        })}
      >
        <TicketHeader loading={loading}>
          <div className={classes.ticketInfo}>
            <TicketInfo
              contact={contact}
              ticket={ticket}
              onClick={handleDrawerOpen}
            />
          </div>
          <div className={classes.ticketActionButtons}>
            {!ticket.readOnly && <TicketActionButtons ticket={ticket} />}
          </div>
        </TicketHeader>
        {ticket.readOnly && (
          <Box
            px={2}
            py={1}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="body2" color="textSecondary">
              {i18n.t("ticketView.readOnlyNotice")}
            </Typography>
            <Chip size="small" label={i18n.t("ticketView.readOnly")} />
          </Box>
        )}
        {isObserver && (
          <Box
            px={2}
            py={1}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="body2" color="textSecondary">
              {i18n.t("ticketView.observerNotice")}
            </Typography>
            <Chip size="small" label={i18n.t("ticketView.observer")} />
          </Box>
        )}
        <AssignmentAudit ticketId={ticketId} />
        <ReplyMessageProvider>
          <MessagesList
            ticketId={ticketId}
            isGroup={ticket.isGroup}
          ></MessagesList>
          {!ticket.readOnly && (
            <MessageInput
              ticketStatus={ticket.status}
              canReply={ticket.canReply !== false}
            />
          )}
        </ReplyMessageProvider>
      </Paper>
      <ContactDrawer
        open={drawerOpen}
        handleDrawerClose={handleDrawerClose}
        contact={contact}
        loading={loading}
      />
    </div>
  );
};

export default Ticket;
