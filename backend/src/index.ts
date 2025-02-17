import WebSocket, { WebSocketServer } from "ws";
import { PrismaClient, Prisma } from "@prisma/client";
import express from "express";
import authRouter from "./auth";

export const prisma = new PrismaClient();

const socketServer = new WebSocketServer({ port: 8080 });
const clients: WebSocket[] = [];
socketServer.on("listening", () => {
  console.log("WebSocket server listening on port 8080");
});
socketServer.on("connection", (newClient) => {
  clients.push(newClient);

  newClient.on("message", (message) => {
    clients.forEach((client) => {
      client.send(message);
    });
  });
});

const httpServer = express();
httpServer.use("/auth", authRouter);
httpServer.listen(3000, () => {
  console.log("HTTP server listening on port 3000");
});
