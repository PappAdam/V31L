import { WebSocketServer } from "ws";
import { Client } from "./socket/client";
import httpServer from "./http/http";

const socketServer = new WebSocketServer({ port: 8080 });

socketServer.on("listening", () => {
  console.log("WebSocket server listening on port 8080");
});

socketServer.on("connection", (connection) => {
  let newClient = new Client(connection);
});

httpServer.listen(3000, () => {
  console.log("HTTP server listening on port 3000");
});
