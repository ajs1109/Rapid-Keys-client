import { io, Socket } from "socket.io-client";

let socket: Socket | undefined;

export const initSocket = (): Socket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000", {
      path: "/api/socket",
      reconnectionDelay: 1000,
      reconnection: true,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Socket connected!");
    });

    socket.on("connect_error", (err) => {
      console.log("Socket connection error:", err);
    });
  }
  return socket;
};

export const getSocket = (): Socket | undefined => socket;