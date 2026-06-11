import openSocket from "socket.io-client";
import { getBackendUrl } from "../config";
import { getAccessToken } from "./tokenStore";

function connectToSocket() {
    return openSocket(getBackendUrl(), {
      transports: ["websocket", "polling"],
      auth: {
        token: getAccessToken(),
      },
    });
}

export default connectToSocket;
