import { Prisma, PrismaClient } from "@prisma/client";
import WebSocket, { WebSocketServer } from "ws";

//Example usage of prisma
const prisma = new PrismaClient();
async function addUser(
  //Type can be anything, but all fields in the schema without a @default property have to be supplied to the data field.
  //In this example username and password are the two required fields
  user: Prisma.XOR<Prisma.UserCreateInput, Prisma.UserUncheckedCreateInput>
) {
  //You have to await on create/update/delete for it to take effect.
  //Will not execute without await
  await prisma.user.create({ data: user });
}

// addUser({
//   username: "asdasd",
//   password: "asdasdsa",
// });

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
