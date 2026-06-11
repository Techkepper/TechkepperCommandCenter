import React, { useState, useCallback, useContext } from "react";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import {
	Button,
	Chip,
	TableBody,
	TableRow,
	TableCell,
	IconButton,
	Table,
	TableHead,
	Paper,
	Tooltip,
	Typography,
	CircularProgress,
	Box,
} from "@material-ui/core";
import {
	Edit,
	CheckCircle,
	SignalCellularConnectedNoInternet2Bar,
	SignalCellularConnectedNoInternet0Bar,
	SignalCellular4Bar,
	DeleteOutline,
	ErrorOutline,
} from "@material-ui/icons";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import TableRowSkeleton from "../../components/TableRowSkeleton";

import api from "../../services/api";
import WhatsAppModal from "../../components/WhatsAppModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import { i18n } from "../../translate/i18n";
import { WhatsAppsContext } from "../../context/WhatsApp/WhatsAppsContext";
import toastError from "../../errors/toastError";

const useStyles = makeStyles(theme => ({
	mainPaper: {
		flex: 1,
		padding: theme.spacing(1),
		overflowY: "scroll",
		...theme.scrollbarStyles,
	},
	customTableCell: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	},
	tooltip: {
		backgroundColor: "#f5f5f9",
		color: "rgba(0, 0, 0, 0.87)",
		fontSize: theme.typography.pxToRem(14),
		border: "1px solid #dadde9",
		maxWidth: 450,
	},
	tooltipPopper: {
		textAlign: "center",
	},
	buttonProgress: {
		color: green[500],
	},
}));

const CustomToolTip = ({ title, content, children }) => {
	const classes = useStyles();

	return (
		<Tooltip
			arrow
			classes={{
				tooltip: classes.tooltip,
				popper: classes.tooltipPopper,
			}}
			title={
				<React.Fragment>
					<Typography gutterBottom color="inherit">
						{title}
					</Typography>
					{content && <Typography>{content}</Typography>}
				</React.Fragment>
			}
		>
			{children}
		</Tooltip>
	);
};

const Connections = () => {
	const classes = useStyles();

	const { whatsApps, loading } = useContext(WhatsAppsContext);
	const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
	const [selectedWhatsApp, setSelectedWhatsApp] = useState(null);
	const [confirmModalOpen, setConfirmModalOpen] = useState(false);
	const confirmationModalInitialState = {
		action: "",
		title: "",
		message: "",
		whatsAppId: "",
		open: false,
	};
	const [confirmModalInfo, setConfirmModalInfo] = useState(
		confirmationModalInitialState
	);
	const statusLabels = {
		CONNECTED: "Conectada",
		OPENING: "Verificando con Meta...",
		CONFIG_REQUIRED: "Configuración requerida",
		TIMEOUT: "Sin respuesta",
		DISCONNECTED: "Desconectada",
		ERROR: "Error",
	};

	const handleVerifyConnection = async whatsApp => {
		try {
			await api.post(`/whatsappsession/${whatsApp.id}`);
			toast.success("Verificación solicitada a WhatsApp Cloud API.");
		} catch (err) {
			toastError(err);
		}
	};

	const handleOpenWhatsAppModal = () => {
		setSelectedWhatsApp(null);
		setWhatsAppModalOpen(true);
	};

	const handleCloseWhatsAppModal = useCallback(() => {
		setWhatsAppModalOpen(false);
		setSelectedWhatsApp(null);
	}, [setSelectedWhatsApp, setWhatsAppModalOpen]);

	const handleEditWhatsApp = whatsApp => {
		setSelectedWhatsApp(whatsApp);
		setWhatsAppModalOpen(true);
	};

	const handleOpenConfirmationModal = (action, whatsAppId) => {
		if (action === "disconnect") {
			setConfirmModalInfo({
				action: action,
				title: i18n.t("connections.confirmationModal.disconnectTitle"),
				message: i18n.t("connections.confirmationModal.disconnectMessage"),
				whatsAppId: whatsAppId,
			});
		}

		if (action === "delete") {
			setConfirmModalInfo({
				action: action,
				title: i18n.t("connections.confirmationModal.deleteTitle"),
				message: i18n.t("connections.confirmationModal.deleteMessage"),
				whatsAppId: whatsAppId,
			});
		}
		setConfirmModalOpen(true);
	};

	const handleSubmitConfirmationModal = async () => {
		if (confirmModalInfo.action === "disconnect") {
			try {
				await api.delete(`/whatsappsession/${confirmModalInfo.whatsAppId}`);
			} catch (err) {
				toastError(err);
			}
		}

		if (confirmModalInfo.action === "delete") {
			try {
				await api.delete(`/whatsapp/${confirmModalInfo.whatsAppId}`);
				toast.success(i18n.t("connections.toasts.deleted"));
			} catch (err) {
				toastError(err);
			}
		}

		setConfirmModalInfo(confirmationModalInitialState);
	};

	const renderActionButtons = whatsApp => {
		return (
			<>
				{whatsApp.status !== "OPENING" && (
					<Button
						size="small"
						variant="outlined"
						color="primary"
						onClick={() => handleVerifyConnection(whatsApp)}
					>
						Verificar API oficial
					</Button>
				)}
				{whatsApp.status === "OPENING" && (
					<CircularProgress size={22} className={classes.buttonProgress} />
				)}
			</>
		);
	};

	const renderStatusToolTips = whatsApp => {
		return (
			<div className={classes.customTableCell}>
				{whatsApp.status === "DISCONNECTED" && (
					<CustomToolTip
						title={i18n.t("connections.toolTips.disconnected.title")}
						content={i18n.t("connections.toolTips.disconnected.content")}
					>
						<SignalCellularConnectedNoInternet0Bar color="secondary" />
					</CustomToolTip>
				)}
				{whatsApp.status === "OPENING" && (
					<CircularProgress size={24} className={classes.buttonProgress} />
				)}
				{whatsApp.status === "ERROR" && (
					<CustomToolTip
						title={i18n.t("connections.toolTips.error.title")}
						content={i18n.t("connections.toolTips.error.content")}
					>
						<ErrorOutline color="error" />
					</CustomToolTip>
				)}
				{whatsApp.status === "CONFIG_REQUIRED" && (
					<CustomToolTip
						title="Falta configurar Meta"
						content="Defina el token, Phone Number ID, versión de Graph API y secretos del webhook en el servidor."
					>
						<ErrorOutline color="action" />
					</CustomToolTip>
				)}
				{whatsApp.status === "CONNECTED" && (
					<CustomToolTip title={i18n.t("connections.toolTips.connected.title")}>
						<SignalCellular4Bar style={{ color: green[500] }} />
					</CustomToolTip>
				)}
				{whatsApp.status === "TIMEOUT" && (
					<CustomToolTip
						title={i18n.t("connections.toolTips.timeout.title")}
						content={i18n.t("connections.toolTips.timeout.content")}
					>
						<SignalCellularConnectedNoInternet2Bar color="secondary" />
					</CustomToolTip>
				)}
				<Box ml={1}>
					<Chip
						size="small"
						variant="outlined"
						color={whatsApp.status === "CONNECTED" ? "primary" : "default"}
						label={statusLabels[whatsApp.status] || "Estado desconocido"}
					/>
				</Box>
			</div>
		);
	};

	return (
		<MainContainer>
			<ConfirmationModal
				title={confirmModalInfo.title}
				open={confirmModalOpen}
				onClose={setConfirmModalOpen}
				onConfirm={handleSubmitConfirmationModal}
			>
				{confirmModalInfo.message}
			</ConfirmationModal>
			<WhatsAppModal
				open={whatsAppModalOpen}
				onClose={handleCloseWhatsAppModal}
				whatsAppId={selectedWhatsApp?.id}
			/>
			<MainHeader>
				<Title>Conexión WhatsApp</Title>
				<MainHeaderButtonsWrapper>
					<Button
						variant="contained"
						color="primary"
						onClick={handleOpenWhatsAppModal}
					>
						{i18n.t("connections.buttons.add")}
					</Button>
				</MainHeaderButtonsWrapper>
			</MainHeader>
			<Paper variant="outlined" style={{ padding: 16, marginBottom: 16 }}>
				<Box display="flex" flexWrap="wrap" style={{ gap: 12 }}>
					<Typography variant="body2">
						<strong>Integración oficial:</strong> esta instalación usa
						WhatsApp Cloud API de Meta, sin QR ni sesiones de WhatsApp Web.
					</Typography>
					<Typography variant="body2" color="textSecondary">
						Las respuestas de servicio dentro de la ventana de 24 horas no
						tienen cargo; otras categorías pueden tener costo según Meta.
					</Typography>
					<Typography variant="caption" color="textSecondary">
						Webhook: /webhooks/whatsapp. Los tokens permanecen únicamente
						en variables de entorno del servidor.
					</Typography>
				</Box>
			</Paper>
			<Paper className={classes.mainPaper} variant="outlined">
				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell align="center">
								{i18n.t("connections.table.name")}
							</TableCell>
							<TableCell align="center">
								{i18n.t("connections.table.status")}
							</TableCell>
							<TableCell align="center">
								Verificación
							</TableCell>
							<TableCell align="center">
								{i18n.t("connections.table.lastUpdate")}
							</TableCell>
							<TableCell align="center">
								{i18n.t("connections.table.default")}
							</TableCell>
							<TableCell align="center">
								{i18n.t("connections.table.actions")}
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{loading ? (
							<TableRowSkeleton />
						) : (
							<>
								{whatsApps?.length > 0 &&
									whatsApps.map(whatsApp => (
										<TableRow key={whatsApp.id}>
											<TableCell align="center">{whatsApp.name}</TableCell>
											<TableCell align="center">
												{renderStatusToolTips(whatsApp)}
											</TableCell>
											<TableCell align="center">
												{renderActionButtons(whatsApp)}
											</TableCell>
											<TableCell align="center">
												{format(parseISO(whatsApp.updatedAt), "dd/MM/yy HH:mm")}
											</TableCell>
											<TableCell align="center">
												{whatsApp.isDefault && (
													<div className={classes.customTableCell}>
														<CheckCircle style={{ color: green[500] }} />
													</div>
												)}
											</TableCell>
											<TableCell align="center">
												<IconButton
													size="small"
													onClick={() => handleEditWhatsApp(whatsApp)}
												>
													<Edit />
												</IconButton>

												<IconButton
													size="small"
													onClick={() => {
														handleOpenConfirmationModal("delete", whatsApp.id);
													}}
												>
													<DeleteOutline />
												</IconButton>
											</TableCell>
										</TableRow>
									))}
								{!whatsApps?.length && (
									<TableRow>
										<TableCell colSpan={6} align="center">
											<Box py={4}>
												<Typography color="textSecondary">
													No hay conexiones de WhatsApp configuradas.
												</Typography>
											</Box>
										</TableCell>
									</TableRow>
								)}
							</>
						)}
					</TableBody>
				</Table>
			</Paper>
		</MainContainer>
	);
};

export default Connections;
