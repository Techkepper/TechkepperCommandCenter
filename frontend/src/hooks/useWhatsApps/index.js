import { useState, useEffect, useReducer, useCallback } from "react";
import openSocket from "../../services/socket-io";
import toastError from "../../errors/toastError";

import api from "../../services/api";

const normalizeWhatsApps = payload => (Array.isArray(payload) ? payload : []);

const reducer = (state, action) => {
	if (action.type === "LOAD_WHATSAPPS") {
		return [...normalizeWhatsApps(action.payload)];
	}

	if (action.type === "UPDATE_WHATSAPPS") {
		const whatsApp = action.payload;
		const whatsAppIndex = state.findIndex(s => s.id === whatsApp.id);

		if (whatsAppIndex !== -1) {
			const next = [...state];
			next[whatsAppIndex] = whatsApp;
			return next;
		}

		return [whatsApp, ...state];
	}

	if (action.type === "UPDATE_SESSION") {
		const whatsApp = action.payload;
		const whatsAppIndex = state.findIndex(s => s.id === whatsApp.id);

		if (whatsAppIndex !== -1) {
			const next = [...state];
			next[whatsAppIndex] = { ...next[whatsAppIndex], ...whatsApp };
			return next;
		}

		return [whatsApp, ...state];
	}

	if (action.type === "DELETE_WHATSAPPS") {
		const whatsAppId = action.payload;
		return state.filter(whatsApp => whatsApp.id !== whatsAppId);
	}

	if (action.type === "RESET") {
		return [];
	}

	return state;
};

const useWhatsApps = () => {
	const [whatsApps, dispatch] = useReducer(reducer, []);
	const [loading, setLoading] = useState(true);

	const loadWhatsApps = useCallback(async ({ showToast = true } = {}) => {
		setLoading(true);
		try {
			const { data } = await api.get("/whatsapp/");
			dispatch({
				type: "LOAD_WHATSAPPS",
				payload: normalizeWhatsApps(data),
			});
		} catch (err) {
			if (showToast) {
				toastError(err);
			}
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadWhatsApps();
	}, [loadWhatsApps]);

	useEffect(() => {
		const socket = openSocket();

		const handleConnect = () => {
			loadWhatsApps({ showToast: false }).catch(() => {});
		};

		socket.on("connect", handleConnect);

		socket.on("whatsapp", data => {
			if (data.action === "update") {
				dispatch({ type: "UPDATE_WHATSAPPS", payload: data.whatsapp });
			}

			if (data.action === "delete") {
				dispatch({ type: "DELETE_WHATSAPPS", payload: data.whatsappId });
			}
		});

		socket.on("whatsappSession", data => {
			if (data.action === "update") {
				dispatch({ type: "UPDATE_SESSION", payload: data.session });
			}
		});

		return () => {
			socket.off("connect", handleConnect);
			socket.disconnect();
		};
	}, [loadWhatsApps]);

	return { whatsApps, loading, reloadWhatsApps: loadWhatsApps };
};

export default useWhatsApps;
