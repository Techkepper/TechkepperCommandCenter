import axios from "axios";
import { getBackendUrl, getNgrokHeaders } from "../config";
import { logClientError } from "./clientLogger";

const api = axios.create({
	baseURL: getBackendUrl(),
	withCredentials: true,
});

api.interceptors.request.use(config => {
	const ngrokHeaders = getNgrokHeaders();
	if (Object.keys(ngrokHeaders).length > 0) {
		config.headers = { ...config.headers, ...ngrokHeaders };
	}
	return config;
});

api.interceptors.response.use(
	response => response,
	error => {
		const config = error.config || {};
		if (!config.url?.includes("/client-logs")) {
			logClientError({
				message: error.message,
				error,
				status: error.response?.status,
				method: config.method?.toUpperCase(),
				requestUrl: config.url,
				responseError:
					error.response?.data?.error || error.response?.data?.message,
				level: error.response?.status >= 500 ? "error" : "warn",
			});
		}

		return Promise.reject(error);
	}
);

export default api;
