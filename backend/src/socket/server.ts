import { WebSocket } from "ws";
import { ServerPackage } from "../../../types";
import { clients } from "./client";
import * as msgpack from "@msgpack/msgpack";

function isStringArray(arr: any[]): arr is string[] {
  return typeof arr[0] === 'string';
}

export class ServerPackageSender {
  private package: ServerPackage;
  private clients: WebSocket[];

  constructor(userIds: string[], outgoing: ServerPackage);
  constructor(wsArray: WebSocket[], outgoing: ServerPackage);

  constructor(clientDescription: string[] | WebSocket[], outgoing: ServerPackage) {
    this.package = outgoing;
    if (isStringArray(clientDescription)) {
      this.clients = clients.filter((client) => {
        clientDescription.includes(client.userId)
      })
      .map((client) => client.ws)
    }
    else {
      this.clients = clientDescription;
    }
  }

  async sendPackage() {
    const encoded = msgpack.encode(this.package);

  }
}
