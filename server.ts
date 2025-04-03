// server.ts
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import GameServer from "@/socket/game.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST_NAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

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