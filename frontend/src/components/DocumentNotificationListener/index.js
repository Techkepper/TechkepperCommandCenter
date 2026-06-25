import React, { useCallback, useEffect, useRef } from "react";
import { Button, Typography } from "@material-ui/core";
import { useHistory } from "react-router-dom";
import { toast } from "react-toastify";
import useSound from "use-sound";

import alertSound from "../../assets/sound.mp3";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import openSocket from "../../services/socket-io";

const DocumentNotificationToast = ({ notification, onOpen, onClose }) => (
  <div>
    <Typography variant="subtitle2">{notification.title}</Typography>
    <Typography variant="body2">{notification.message}</Typography>
    {notification.comment && (
      <Typography variant="caption" display="block">
        Comentario: {notification.comment}
      </Typography>
    )}
    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
      <Button size="small" color="primary" variant="contained" onClick={onOpen}>
        Ver documento
      </Button>
      <Button size="small" onClick={onClose}>
        Cerrar
      </Button>
    </div>
  </div>
);

const DocumentNotificationListener = () => {
  const history = useHistory();
  const shownNotificationIds = useRef(new Set());
  const [play] = useSound(alertSound, { volume: 0.35 });
  const playRef = useRef(play);

  useEffect(() => {
    playRef.current = play;
  }, [play]);

  const markRead = useCallback(async (notificationId) => {
    try {
      await api.patch(`/internal-notifications/${notificationId}/read`);
    } catch (error) {
      toastError(error);
    }
  }, []);

  const showNotification = useCallback(
    (notification, playSound = true) => {
      if (
        !notification?.id ||
        shownNotificationIds.current.has(notification.id)
      ) {
        return;
      }
      shownNotificationIds.current.add(notification.id);
      const toastId = `document-notification-${notification.id}`;
      const closeNotification = () => toast.dismiss(toastId);
      const openDocument = async () => {
        try {
          if (notification.proposalId) {
            await api.get(`/commercial-proposals/${notification.proposalId}`);
            history.push(
              `/commercial-proposals?proposalId=${notification.proposalId}`,
            );
            closeNotification();
            return;
          }
          await api.get(`/documents/${notification.documentId}`);
          history.push(
            `/smart-documents?documentId=${notification.documentId}`,
          );
          closeNotification();
        } catch (error) {
          toastError(error);
        }
      };

      toast.info(
        <DocumentNotificationToast
          notification={notification}
          onOpen={openDocument}
          onClose={closeNotification}
        />,
        {
          toastId,
          autoClose: false,
          closeOnClick: false,
          onClose: () => markRead(notification.id),
        },
      );
      if (playSound) {
        try {
          playRef.current();
        } catch (_error) {
          // El navegador puede bloquear audio hasta la primera interacción.
        }
      }
    },
    [history, markRead],
  );

  useEffect(() => {
    let mounted = true;
    api
      .get("/internal-notifications")
      .then(({ data }) => {
        if (!mounted) return;
        (data.notifications || []).forEach((notification, index) =>
          showNotification(notification, index === 0),
        );
      })
      .catch(toastError);

    const socket = openSocket();
    socket.on("internalNotification", (data) => {
      if (data.action === "create") showNotification(data.notification);
    });
    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, [showNotification]);

  return null;
};

export default DocumentNotificationListener;
