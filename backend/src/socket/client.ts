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

    this.ws.onmessage = this.onMessage;
    this.ws.onclose = this.onClose;

    clients.push(this);
  }

  /**
   * This method is triggered when a message is received through the WebSocket connection
   *
   * @param {MessageEvent} event - The event object containing the incoming message data
   */
  async onMessage(event: MessageEvent) {
    try {
      const decoded = msgpack.decode(event.data as Uint8Array) as ClientPackage;
      const packageValid = await this.validateIncomingPackage(decoded);
      if (packageValid) {
        processPackage(this, decoded);
      }
    } catch {
      console.error("Error while processing incoming package: \n", event);
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
   * @returns {Promise<boolean>} `true` if the package is valid, `false` otherwise
   */
  async validateIncomingPackage(incoming: ClientPackage): Promise<boolean> {
    switch (incoming.header) {
      case "Connection":
        const token = extractUserIdFromToken(incoming.token);
        if (!token.userId || token.expired) {
          return false;
        }
        const user = await findUserById(token.userId);
        return user ? true : false;

      case "NewMessage":
        if (!incoming.chatId || !incoming.messageContent || !this.userId) {
          return false;
        }
        const chatMember = await findChatMember(this.userId, incoming.chatId);
        return chatMember ? true : false;

      default:
        console.error("This package type has not been implemented.");
        return false;
    }
  }
}
