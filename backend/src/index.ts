import { WebSocketServer } from "ws";
import { PrismaClient } from "@prisma/client";
import express from "express";
import authRouter, { extractUserFromTokenMiddleWare } from "./http/auth";
import bodyParser from "body-parser";

import logRouter from "./http/log";
import { Client, clients } from "./socket/client";

export const prisma = new PrismaClient();

const socketServer = new WebSocketServer({ port: 8080 });

socketServer.on("listening", () => {
  console.log("WebSocket server listening on port 8080");
});

socketServer.on("connection", (connection) => {
  let newClient = new Client(connection);
});

const httpServer = express();
httpServer.use(bodyParser.json());
httpServer.use("/auth", authRouter);

// You can use req.user after this middleware runs
const protectedRoutes = httpServer.use(extractUserFromTokenMiddleWare);

protectedRoutes.use("/log", logRouter);

httpServer.listen(3000, () => {
  console.log("HTTP server listening on port 3000");
});
