import { ServerPackage } from "../../../types";
import { clients } from "./client";
import * as msgpack from "@msgpack/msgpack";

export class ServerPackageSender {
  private package: ServerPackage;
  private targetId: string;

  constructor(targetId: string, outgoing: ServerPackage) {
    this.package = outgoing;
    this.targetId = targetId;
  }

  async sendPackage() {
    const encoded = msgpack.encode(this.package);
    const targetClients = clients.filter(
      (client) => client.userId == this.targetId
    );
    targetClients.forEach((targetClient) => {
      targetClient.ws.send(encoded);
    });
  }
}
