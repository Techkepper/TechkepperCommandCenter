import React, { useEffect, useState } from "react";
import QRCode from "qrcode.react";
import openSocket from "../../services/socket-io";
import toastError from "../../errors/toastError";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Typography,
} from "@material-ui/core";
import api from "../../services/api";

const QrcodeModal = ({ open, onClose, whatsAppId }) => {
  const [qrCode, setQrCode] = useState("");
  const [status, setStatus] = useState("OPENING");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!open || !whatsAppId) return;

    setQrCode("");
    setStatus("OPENING");

    api
      .get(`/whatsapp/${whatsAppId}/qrcode`)
      .then(({ data }) => {
        setQrCode(data.qrcode || "");
        setStatus(data.status || "OPENING");
      })
      .catch((err) => {
        setStatus("ERROR");
        toastError(err);
      });
  }, [open, whatsAppId]);

  useEffect(() => {
    if (!open || !whatsAppId) return;

    const socket = openSocket();
    socket.on("whatsappSession", (data) => {
      if (
        data.action === "update" &&
        Number(data.session.id) === Number(whatsAppId)
      ) {
        setQrCode(data.session.qrcode || "");
        setStatus(data.session.status || "OPENING");

        if (!data.session.qrcode && data.session.status === "CONNECTED") {
          onClose();
        }
      }
    });
    socket.on("whatsappSessionQr", (data) => {
      if (
        data.action === "update" &&
        Number(data.session.id) === Number(whatsAppId)
      ) {
        setQrCode(data.session.qrcode || "");
        setStatus(data.session.status || "OPENING");
      }
    });
    return () => socket.disconnect();
  }, [open, whatsAppId, onClose]);

  const handleSessionAction = async (requestNewQr = false) => {
    setActionLoading(true);
    setQrCode("");
    setStatus("OPENING");

    try {
      if (requestNewQr) {
        await api.put(`/whatsappsession/${whatsAppId}`);
      } else {
        await api.post(`/whatsappsession/${whatsAppId}`);
      }
    } catch (err) {
      setStatus("ERROR");
      toastError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const hasError = status === "ERROR" || status === "DISCONNECTED";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Vincular WhatsApp Business</DialogTitle>
      <DialogContent>
        <Box textAlign="center" pb={3}>
          <Typography color="textSecondary" paragraph>
            1. Abra WhatsApp Business · 2. Entre a Dispositivos vinculados ·
            3. Escanee el código · 4. Espere la confirmación.
          </Typography>
          <Paper
            elevation={0}
            style={{
              display: "inline-flex",
              padding: 20,
              background: "#fff",
              borderRadius: 16,
            }}
          >
            {qrCode ? (
              <QRCode value={qrCode} size={320} level="M" />
            ) : hasError ? (
              <Box
                width={320}
                minHeight={320}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                px={3}
              >
                <Typography variant="h6" gutterBottom>
                  Error al iniciar sesión de WhatsApp
                </Typography>
                <Typography color="textSecondary">
                  No fue posible iniciar WhatsApp Web. Verifique la
                  configuración del navegador en el servidor.
                </Typography>
              </Box>
            ) : (
              <Box
                width={320}
                height={320}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
              >
                <CircularProgress />
                <Typography color="textSecondary" style={{ marginTop: 16 }}>
                  Generando código QR...
                </Typography>
              </Box>
            )}
          </Paper>
          <Typography variant="caption" display="block" style={{ marginTop: 16 }}>
            Mantenga esta ventana abierta hasta que la conexión cambie a
            “Conectado”.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        {hasError && (
          <Button
            onClick={() => handleSessionAction(false)}
            color="primary"
            disabled={actionLoading}
          >
            Reintentar
          </Button>
        )}
        {(hasError || Boolean(qrCode)) && (
          <Button
            onClick={() => handleSessionAction(true)}
            color="primary"
            variant="contained"
            disabled={actionLoading}
          >
            Nuevo QR
          </Button>
        )}
        <Button onClick={onClose} color="default">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(QrcodeModal);
