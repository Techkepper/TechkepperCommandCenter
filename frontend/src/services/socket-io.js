import openSocket from "socket.io-client";
import { getSocketConfig, getNgrokHeaders } from "../config";
import { getAccessToken } from "./tokenStore";

function connectToSocket() {
    const { url, path } = getSocketConfig();
    const extraHeaders = getNgrokHeaders();

    return openSocket(url, {
      path,
      transports: ["websocket", "polling"],
      auth: {
        token: getAccessToken(),
      },
      ...(Object.keys(extraHeaders).length > 0 ? { extraHeaders } : {}),
    });
}

export default connectToSocket;
