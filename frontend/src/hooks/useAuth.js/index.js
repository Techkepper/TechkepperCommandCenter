import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import openSocket from "../../services/socket-io";

import { toast } from "react-toastify";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { getHomePath, ROUTES } from "../../routes/paths";
import {
	clearAccessToken,
	getAccessToken,
	setAccessToken,
} from "../../services/tokenStore";

const useAuth = () => {
	const history = useHistory();
	const [isAuth, setIsAuth] = useState(false);
	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState({});

	useEffect(() => {
		localStorage.removeItem("token");
		const requestInterceptor = api.interceptors.request.use(
			config => {
				const token = getAccessToken();
				if (token) {
					config.headers.Authorization = `Bearer ${token}`;
				}
				return config;
			},
			error => Promise.reject(error)
		);

		const responseInterceptor = api.interceptors.response.use(
			response => response,
			async error => {
				const originalRequest = error.config || {};
				const status = error?.response?.status;
				const serverError =
					error?.response?.data?.error ||
					error?.response?.data?.message ||
					"";
				const isAuthRequest =
					originalRequest.url?.includes("/auth/login") ||
					originalRequest.url?.includes("/auth/refresh_token");
				const isExpiredSession =
					status === 401 ||
					(status === 403 &&
						/invalid token|session expired|jwt/i.test(serverError));

				if (
					isExpiredSession &&
					!isAuthRequest &&
					!originalRequest._retry
				) {
					originalRequest._retry = true;
					try {
						const { data } = await api.post("/auth/refresh_token");
						setAccessToken(data.token);
						api.defaults.headers.Authorization = `Bearer ${data.token}`;
						originalRequest.headers = {
							...originalRequest.headers,
							Authorization: `Bearer ${data.token}`,
						};
						return api(originalRequest);
					} catch (refreshError) {
						clearAccessToken();
						api.defaults.headers.Authorization = undefined;
						setUser({});
						setIsAuth(false);
						return Promise.reject(refreshError);
					}
				}

				if (isExpiredSession && !isAuthRequest) {
					clearAccessToken();
					api.defaults.headers.Authorization = undefined;
					setUser({});
					setIsAuth(false);
				}

				return Promise.reject(error);
			}
		);

		return () => {
			api.interceptors.request.eject(requestInterceptor);
			api.interceptors.response.eject(responseInterceptor);
		};
	}, []);

	useEffect(() => {
		(async () => {
			try {
				const { data } = await api.post("/auth/refresh_token");
				setAccessToken(data.token);
				api.defaults.headers.Authorization = `Bearer ${data.token}`;
				setIsAuth(true);
				setUser(data.user);
			} catch (err) {
				clearAccessToken();
				api.defaults.headers.Authorization = undefined;
				setIsAuth(false);
			}
			setLoading(false);
		})();
	}, []);

	useEffect(() => {
		if (!user.id) return undefined;

		const socket = openSocket();
		socket.on("user", data => {
			if (data.action === "update" && data.user.id === user.id) {
				setUser(data.user);
			}
		});

		return () => {
			socket.disconnect();
		};
	}, [user.id]);

	const handleLogin = async userData => {
		setLoading(true);

		try {
			const { data } = await api.post("/auth/login", userData);
			setAccessToken(data.token);
			api.defaults.headers.Authorization = `Bearer ${data.token}`;
			setUser(data.user);
			setIsAuth(true);
			toast.success(i18n.t("auth.toasts.success"));
			history.push(getHomePath(data.user.profile));
			setLoading(false);
		} catch (err) {
			toastError(err);
			setLoading(false);
		}
	};

	const handleLogout = async () => {
		setLoading(true);

		try {
			await api.delete("/auth/logout");
			setIsAuth(false);
			setUser({});
			clearAccessToken();
			api.defaults.headers.Authorization = undefined;
			setLoading(false);
			history.push(ROUTES.login);
		} catch (err) {
			toastError(err);
			setLoading(false);
		}
	};

	return { isAuth, user, loading, handleLogin, handleLogout };
};

export default useAuth;
