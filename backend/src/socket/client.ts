import { WebSocket, MessageEvent, CloseEvent } from "ws";
import { ClientPackage } from "../../../types";
import * as msgpack from "@msgpack/msgpack";
import { extractUserIdFromToken } from "@/http/middlewares/validate";
import { findUserById } from "../db/user";
import { findChatMember } from "../db/chatMember";
import processPackage from "./processor";

export const clients: Client[] = [];

/**
 * Represents a client WebSocket connection
 *
 * This class manages the WebSocket connection, validates incoming packages, and processes them based on their type
 * - Upon receiving a message, the class decodes the incoming data, validates the package, and processes it if valid
 * - The client is automatically removed from the list of clients when the connection is closed
 *
 * @property {WebSocket} ws - The WebSocket connection for the client
 * @property {string} userId - The ID of the user associated with the client
 */
export class Client {
  ws: WebSocket;
  userId: string = "";

  constructor(connection: WebSocket) {
    this.ws = connection;

    this.ws.onmessage = this.onIncomingPackage;
    this.ws.onclose = this.onClose;

    clients.push(this);
  }

  /**
   * This method is triggered when a package is received through the WebSocket connection
   *
   * @param {MessageEvent} event - The event object containing the incoming package data
   */
  async onIncomingPackage(event: MessageEvent) {
    try {
      const decoded = msgpack.decode(event.data as Uint8Array) as ClientPackage;
      console.log("Decoded: ", decoded.header);
      const userId = await this.validateIncomingPackage(decoded);
      console.log("Got userId");
      if (userId) {
        processPackage(userId, decoded);
      }
    } catch {
      console.error("Error while processing incoming package: \n");
    }
  }

  /**
   * This method is triggered when the WebSocket connection is closed
   *
   * @param {MessageEvent} event - The event object containing the incoming message data
   */
  onClose(event: CloseEvent) {
    const client_index = clients.findIndex((c) => c.ws == this.ws);
    clients.splice(client_index, 1);
  }

  /**
   * Validates a package based on its header type
   *
   * It queries the database, validates that the required data for the package exists
   *
   * @param incoming The incoming package to validate
   * @returns {Promise<string | null>} `userId` if the package is valid, `null` otherwise
   */
  async validateIncomingPackage(
    incoming: ClientPackage
  ): Promise<string | null> {
    console.log(incoming.header);
    switch (incoming.header) {
      case "Connection":
        console.log("here1");
        const token = extractUserIdFromToken(incoming.token);
        if (!token.userId || token.expired) {
          return null;
        }
        const user = await findUserById(token.userId);
        return user ? user.id : null;

      case "NewMessage":
        console.log("here2");
        if (!incoming.chatId || !incoming.messageContent || !this.userId) {
          return null;
        }
        const chatMember = await findChatMember(this.userId, incoming.chatId);
        return chatMember ? this.userId : null;

      default:
        console.log("here3");
        throw new Error("This package type has not been implemented.");
    }
  }
}
