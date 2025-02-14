import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

const connections: WebSocket[] = [];

wss.on("connection", (ws) => {
  connections.push(ws);

  ws.on("message", (msg) => {
    connections.forEach((s) => {
      s.send("newmsg:" + msg);
    });
  });
});
