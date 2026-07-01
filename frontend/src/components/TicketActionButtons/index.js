import React, { useContext, useState } from "react";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import { IconButton } from "@material-ui/core";
import { MoreVert, Replay } from "@material-ui/icons";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import TicketOptionsMenu from "../TicketOptionsMenu";
import ButtonWithSpinner from "../ButtonWithSpinner";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import TransferTicketModal from "../TransferTicketModal";

const useStyles = makeStyles(theme => ({
	actionButtons: {
		display: "flex",
		alignItems: "center",
		justifyContent: "flex-end",
		flexWrap: "wrap",
		gap: theme.spacing(0.75),
		marginRight: theme.spacing(1),
		marginLeft: "auto",
		flex: "none",
		alignSelf: "center",
		"& > *": {
			margin: 0,
		},
	},
}));

const TicketActionButtons = ({ ticket }) => {
	const classes = useStyles();
	const history = useHistory();
	const [anchorEl, setAnchorEl] = useState(null);
	const [transferTicketModalOpen, setTransferTicketModalOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const ticketOptionsMenuOpen = Boolean(anchorEl);
	const { user } = useContext(AuthContext);
	const isManager = user?.profile === "admin" || user?.profile === "supervisor";

	const handleOpenTicketOptionsMenu = e => {
		setAnchorEl(e.currentTarget);
	};

	const handleCloseTicketOptionsMenu = () => {
		setAnchorEl(null);
	};

	const handleUpdateTicketStatus = async (status, userId) => {
		setLoading(true);
		try {
			await api.put(`/tickets/${ticket.id}`, {
				status: status,
				userId: userId || null,
			});

			setLoading(false);
			if (status === "open") {
				history.push(`/tickets/${ticket.id}`);
			} else {
				history.push("/tickets");
			}
		} catch (err) {
			setLoading(false);
			toastError(err);
		}
	};

	return (
		<div className={classes.actionButtons}>
			{ticket.status === "closed" && (
				<ButtonWithSpinner
					loading={loading}
					startIcon={<Replay />}
					size="small"
					variant="outlined"
					color="primary"
					onClick={() => handleUpdateTicketStatus("open", user?.id)}
				>
					{i18n.t("messagesList.header.buttons.reopen")}
				</ButtonWithSpinner>
			)}
			{ticket.status === "closed" && user?.profile === "admin" && (
				<>
					<IconButton onClick={handleOpenTicketOptionsMenu}>
						<MoreVert />
					</IconButton>
					<TicketOptionsMenu
						ticket={ticket}
						anchorEl={anchorEl}
						menuOpen={ticketOptionsMenuOpen}
						handleClose={handleCloseTicketOptionsMenu}
					/>
				</>
			)}
			{ticket.status === "open" && (
				<>
					<ButtonWithSpinner
						loading={loading}
						startIcon={<Replay />}
						size="small"
						variant="outlined"
						color="primary"
						onClick={() => handleUpdateTicketStatus("pending", null)}
					>
						{i18n.t("messagesList.header.buttons.return")}
					</ButtonWithSpinner>
					<ButtonWithSpinner
						loading={loading}
						size="small"
						variant="contained"
						color="primary"
						onClick={() => handleUpdateTicketStatus("closed", user?.id)}
					>
						{i18n.t("messagesList.header.buttons.resolve")}
					</ButtonWithSpinner>
					<IconButton onClick={handleOpenTicketOptionsMenu}>
						<MoreVert />
					</IconButton>
					<TicketOptionsMenu
						ticket={ticket}
						anchorEl={anchorEl}
						menuOpen={ticketOptionsMenuOpen}
						handleClose={handleCloseTicketOptionsMenu}
					/>
				</>
			)}
			{ticket.status === "pending" && isManager && (
				<>
					<ButtonWithSpinner
						loading={loading}
						size="small"
						variant="contained"
						color="primary"
						onClick={() => setTransferTicketModalOpen(true)}
					>
						{i18n.t("messagesList.header.buttons.assign")}
					</ButtonWithSpinner>
					{user?.profile === "admin" && (
						<>
							<IconButton onClick={handleOpenTicketOptionsMenu}>
								<MoreVert />
							</IconButton>
							<TicketOptionsMenu
								ticket={ticket}
								anchorEl={anchorEl}
								menuOpen={ticketOptionsMenuOpen}
								handleClose={handleCloseTicketOptionsMenu}
							/>
						</>
					)}
					<TransferTicketModal
						modalOpen={transferTicketModalOpen}
						onClose={() => setTransferTicketModalOpen(false)}
						ticketid={ticket.id}
						ticketWhatsappId={ticket.whatsappId}
						ticketEcosystemId={ticket.ecosystemId}
					/>
				</>
			)}
			{ticket.status === "pending" && !isManager && (
				<ButtonWithSpinner
					loading={loading}
					size="small"
					variant="contained"
					color="primary"
					onClick={() => handleUpdateTicketStatus("open", user?.id)}
				>
					{i18n.t("messagesList.header.buttons.accept")}
				</ButtonWithSpinner>
			)}
		</div>
	);
};

export default TicketActionButtons;
