import { WebSocket } from "ws";
import {
  ClientHeader,
  ClientMessage,
  ServerHeader,
  ServerMessage,
} from "../../../types";
import { ServerMessageDescription } from "./server";
import * as msgpack from "@msgpack/msgpack";
import { extractUserIdFromToken } from "../http/auth";

export const clients: Client[] = [];

export class Client {
  ws: WebSocket;
  userId: string = "";

  constructor(connection: WebSocket) {
    this.ws = connection;
    this.ws.onmessage = (msg) => {
      const decoded = msgpack.decode(msg.data as Uint8Array) as ClientMessage;
      this.parseMsg(decoded)
        ?.validate()
        .then((enc) => {
         enc?.send();
        })
    };

    this.ws.close = () => {
      const client_index = clients.findIndex((c) => c.ws == this.ws);
      clients.splice(client_index, 1);
    };

    clients.push(this);
  }

  /**
   * Parses a client message and converts it into a server message description if applicable.
   *
   * @param {ClientMessage} msg - The client message to be parsed.
   * @returns {ServerMessageDescription | undefined} A `ServerMessageDescription` if the message is processed, or `undefined` if no response is needed.
   */
  parseMsg(msg: ClientMessage): ServerMessageDescription | undefined {
    switch (msg.header) {
      case ClientHeader.Connection:
        try {
          this.userId = extractUserIdFromToken(msg.data.target);
        } catch {
          console.log("Token is invalid or expired");
        }
        return undefined;
        

      case ClientHeader.NewMsg:
        const servermsg: ServerMessage = {
          header: ServerHeader.NewMsg,
          data: msg.data.content,
        };

        return new ServerMessageDescription(
          this.userId,
          msg.data.target,
          servermsg
        );
    }
  }
}
