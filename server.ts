// server.ts
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import GameServer from "@/socket/game.js";
import { HOST_NAME, NODE_ENV, PORT } from "@/config";

const dev = NODE_ENV !== "production";
const hostname = HOST_NAME || "localhost";
const port = parseInt(PORT, 10);

async function startServer() {
    //@ts-ignore
    const app = next({ dev, hostname, port });
    const handler = app.getRequestHandler();

    await app.prepare();

    const httpServer = createServer(handler);
    
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // Initialize game server
    const gameServer = new GameServer(io);
    gameServer.initialize();

    httpServer
    .once("error", (err) => {
        console.error(err);
        process.exit(1);
    })
    .listen(port, () => {
        console.log(`Server running on http://${hostname}:${port}`);
    });
}

startServer().catch(console.error);