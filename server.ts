import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST_NAME as string || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

async function startServer() {
    //@ts-ignore
    const app = next({ dev, hostname, port });
    const handler = app.getRequestHandler();

    await app.prepare();

    const httpServer = createServer(handler);
    
    const io = new Server(httpServer);
    io.on("connection", (socket) => {
        console.log(`User connected:`, socket.id);
    });

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