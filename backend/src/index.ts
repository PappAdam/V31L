import { WebSocketServer } from "ws";
import { Client } from "./socket/client";
import httpServer from "./http/http";

const socketServer = new WebSocketServer({ host: "0.0.0.0", port: 8080 });

socketServer.on("listening", () => {
  console.info("WebSocket server listening on port 8080");
  console.log(process.env.PRIVATE_KEY);
});

socketServer.on("connection", (connection) => {
  let newClient = new Client(connection);
});

httpServer.listen(3000, "0.0.0.0", () => {
  console.info("HTTP server listening on port 3000");
});
