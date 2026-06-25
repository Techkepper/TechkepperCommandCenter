import React, { useEffect, useState } from "react";

import { makeStyles } from "@material-ui/core/styles";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Paper,
	Typography,
	Divider,
} from "@material-ui/core";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
	metaPaper: {
		padding: theme.spacing(1.5, 2),
		backgroundColor: theme.palette.background.default,
	},
	metaTitle: {
		display: "flex",
		alignItems: "center",
		gap: theme.spacing(1),
		marginBottom: theme.spacing(1),
		fontWeight: 600,
	},
	metaRow: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "baseline",
		gap: theme.spacing(2),
		padding: theme.spacing(0.5, 0),
	},
	metaLabel: {
		color: theme.palette.text.secondary,
		whiteSpace: "nowrap",
	},
	metaValue: {
		fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
		textAlign: "right",
		wordBreak: "break-all",
	},
	metaConnDot: {
		width: 10,
		height: 10,
		borderRadius: "50%",
		display: "inline-block",
		marginRight: 8,
	},
}));

const QUALITY_COLORS = {
	GREEN: "#4caf50",
	YELLOW: "#ffb300",
	RED: "#f44336",
};

export const WhatsAppMetaInfo = ({ whatsAppId, open, showTitle = true }) => {
	const classes = useStyles();
	const [metaInfo, setMetaInfo] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);

	useEffect(() => {
		if (!open || !whatsAppId) {
			setMetaInfo(null);
			setError(false);
			return undefined;
		}

		let active = true;
		const fetchMetaInfo = async () => {
			setLoading(true);
			setError(false);
			try {
				const { data } = await api.get(`whatsapp/${whatsAppId}/meta-info`);
				if (active) setMetaInfo(data);
			} catch (err) {
				if (active) {
					setMetaInfo(null);
					setError(true);
				}
			} finally {
				if (active) setLoading(false);
			}
		};
		fetchMetaInfo();

		return () => {
			active = false;
		};
	}, [open, whatsAppId]);

	if (!whatsAppId) return null;

	const dotColor =
		QUALITY_COLORS[metaInfo?.qualityRating?.toUpperCase()] || "#9e9e9e";

	return (
		<Paper variant="outlined" className={classes.metaPaper}>
			{showTitle && (
				<Typography variant="subtitle2" className={classes.metaTitle}>
					{i18n.t("whatsappModal.meta.title")}
				</Typography>
			)}

			{loading && (
				<Typography variant="body2" color="textSecondary">
					{i18n.t("whatsappModal.meta.loading")}
				</Typography>
			)}

			{!loading && error && (
				<Typography variant="body2" color="error">
					{i18n.t("whatsappModal.meta.error")}
				</Typography>
			)}

			{!loading && metaInfo && (
				<>
					<div className={classes.metaRow}>
						<Typography variant="body2" className={classes.metaLabel}>
							{i18n.t("whatsappModal.meta.number")}
						</Typography>
						<Typography variant="body2" className={classes.metaValue}>
							<span
								className={classes.metaConnDot}
								style={{ backgroundColor: dotColor }}
							/>
							{metaInfo.displayPhoneNumber || "—"}
						</Typography>
					</div>
					<div className={classes.metaRow}>
						<Typography variant="body2" className={classes.metaLabel}>
							{i18n.t("whatsappModal.meta.verifiedName")}
						</Typography>
						<Typography variant="body2" className={classes.metaValue}>
							{metaInfo.verifiedName || "—"}
						</Typography>
					</div>
					<div className={classes.metaRow}>
						<Typography variant="body2" className={classes.metaLabel}>
							{i18n.t("whatsappModal.meta.phoneNumberId")}
						</Typography>
						<Typography variant="body2" className={classes.metaValue}>
							{metaInfo.phoneNumberId || "—"}
						</Typography>
					</div>
					<div className={classes.metaRow}>
						<Typography variant="body2" className={classes.metaLabel}>
							{i18n.t("whatsappModal.meta.apiVersion")}
						</Typography>
						<Typography variant="body2" className={classes.metaValue}>
							{metaInfo.apiVersion || "—"}
						</Typography>
					</div>
					<Divider style={{ margin: "8px 0" }} />
					<div className={classes.metaRow}>
						<Typography variant="body2" className={classes.metaLabel}>
							{i18n.t("whatsappModal.meta.webhook")}
						</Typography>
						<Typography variant="body2" className={classes.metaValue}>
							{metaInfo.webhookUrl || "—"}
						</Typography>
					</div>
				</>
			)}
		</Paper>
	);
};

const WhatsAppMetaInfoModal = ({ open, onClose, whatsAppId }) => {
	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
			<DialogTitle>{i18n.t("whatsappModal.meta.title")}</DialogTitle>
			<DialogContent dividers>
				<WhatsAppMetaInfo whatsAppId={whatsAppId} open={open} showTitle={false} />
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} color="primary" variant="outlined">
					{i18n.t("whatsappModal.buttons.cancel")}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default WhatsAppMetaInfoModal;
