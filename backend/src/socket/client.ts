import { WebSocket, MessageEvent, CloseEvent } from "ws";
import { ClientPackage, ClientPackageDescription, PublicUser } from "@common";
import * as msgpack from "@msgpack/msgpack";
import { extractUserIdFromToken } from "@/http/middlewares/validate";
import { findUserById } from "../db/user";
import { findChatMember } from "../db/chatMember";
import processPackage from "./processor";
import { findMessageById } from "@/db/message";
import { findChatById } from "@/db/chat";
import { User } from "@prisma/client";

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
  user: PublicUser = {
    id: "",
    username: "",
  };

  constructor(connection: WebSocket) {
    this.ws = connection;

    this.ws.onmessage = this.onIncomingPackage;
    this.ws.onclose = this.onClose;

    clients.push(this);
  }

  static withUser(userid: string): Client | undefined {
    const client = clients.find((c) => c.user.id == userid);
    return client;
  }

  get isAuthorized() {
    return !!this.user.id;
  }

  /**
   * This method is triggered when a package is received through the WebSocket connection
   *
   * @param {MessageEvent} event - The event object containing the incoming package data
   */
  onIncomingPackage = async (event: MessageEvent) => {
    try {
      const decoded = msgpack.decode(event.data as Uint8Array) as ClientPackage;
      const packageValid = await this.validateIncomingPackage(decoded);
      if (packageValid) {
        processPackage(this, decoded);
      }
    } catch (error) {
      console.error("Error while processing incoming package: \n", error);
    }
  };

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
  validateIncomingPackage = async (
    incoming: ClientPackageDescription
  ): Promise<boolean> => {
    switch (incoming.header) {
      case "Authorization":
        const token = extractUserIdFromToken(incoming.token);
        const user = await findUserById(token.userId || "");
        return !!user && !token.expired;

      case "NewMessage":
        var chatMember = await findChatMember(this.user.id, incoming.chatId);
        return this.isAuthorized && !!chatMember && !!incoming.messageContent;

      case "DeAuthorization":
        return this.isAuthorized;

      case "GetChats":
        const fromChat = findChatById(incoming.fromId || "");
        return (
          this.isAuthorized &&
          !!fromChat &&
          incoming.chatCount > 0 &&
          incoming.messageCount > 0
        );

      case "GetChatMessages":
        const fromMessage = findMessageById(incoming.fromId || "");
        return (
          this.isAuthorized &&
          !!fromMessage &&
          (incoming.messageCount > 0 || incoming.messageCount == -1)
        );

      case "PinMessage":
        const message = await findMessageById(incoming.messageId);
        return this.isAuthorized && !!message;

      case "LeaveChat":
        var chatMember = await findChatMember(this.user.id, incoming.chatId);
        return this.isAuthorized && !!chatMember;

      default:
        throw new Error(
          "Validation for this package type has not been implemented."
        );
    }
  };
}
