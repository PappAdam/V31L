import { WebSocket } from "ws";
import { ServerPackage } from "../../../types";
import { clients } from "./client";
import * as msgpack from "@msgpack/msgpack";

function isStringArray(arr: any[]): arr is string[] {
  return typeof arr[0] === "string";
}

/**
 * A utility class for sevending serr packages to multiple clients, either via WebSocket instances or user IDs.
 * The packages are encoded using MessagePack for efficient data transfer.
 */
export default class ServerPackageSender {
  private package: ServerPackage;
  private clients: WebSocket[];

  // constructor(userIds: string[], outgoing: ServerPackage);
  // constructor(wsArray: WebSocket[], outgoing: ServerPackage);

  constructor(
    clientDescription: string[] | WebSocket[],
    outgoing: ServerPackage
  ) {
    this.package = outgoing;
    if (isStringArray(clientDescription)) {
      this.clients = clients
        .filter((client) => {
          clientDescription.includes(client.userId);
        })
        .map((client) => client.ws);
    } else {
      this.clients = clientDescription;
    }
  }

  /**
   * Sends a server package to multiple clients.
   * @param {WebSocket[]} wsArray - An array of WebSocket instances to send the package to.
   * @param {ServerPackage} outgoing - The server package to send.
   * @returns {Promise<void>} A promise that resolves when the package has been sent to all clients.
   */
  static async send(
    wsArray: WebSocket[],
    outgoing: ServerPackage
  ): Promise<void>;

  /**
   * Sends a server package to multiple clients identified by their user IDs.
   * @param {string[]} userIds - An array of user IDs to send the package to.
   * @param {ServerPackage} outgoing - The server package to send.
   * @returns {Promise<void>} A promise that resolves when the package has been sent to all clients.
   */
  static async send(userIds: string[], outgoing: ServerPackage): Promise<void>;

  static async send(
    clientDescriptrion: WebSocket[] | string[],
    outgoing: ServerPackage
  ) {
    const self = new ServerPackageSender(clientDescriptrion, outgoing);
    await self.sendPackage();
  }

  async sendPackage() {
    const encoded = msgpack.encode(this.package);
    this.clients.forEach((client) => {
      client.send(encoded);
    });
  }
}
