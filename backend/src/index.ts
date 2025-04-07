import { WebSocketServer } from "ws";
import { Client } from "./socket/client";
import httpServer from "./http/http";

const socketServer = new WebSocketServer({ host: "localhost", port: 8080 });

socketServer.on("listening", () => {
  console.info("WebSocket server listening on port 8080");
  console.info(process.env.PRIVATE_KEY);
});

socketServer.on("connection", (connection) => {
  let newClient = new Client(connection);
});

httpServer.listen(3000, "localhost", () => {
  console.info("HTTP server listening on port 3000");
});
