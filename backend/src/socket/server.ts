import { WebSocket } from "ws";
import { ServerMessage } from "../../../types";
import { clients } from "./client";
import * as msgpack from "@msgpack/msgpack";
import { getChatMembersByUser } from "../db/chatMember";

export class ServerMessageDescription {
  private msg!: ServerMessage;
  private sender!: string;
  private target!: string;

  constructor(sender: string, target: string, msg: ServerMessage) {
    this.sender = sender;
    this.target = target;
    this.msg = msg;
  }

  async validate(): Promise<EncodedServerMessage | undefined> {
    if (this.sender == "" || this.target == "") return undefined;

    const senderChats = await getChatMembersByUser(this.sender);
    if (!senderChats?.find((ch) => ch.chatId == this.target)) return undefined;

    return new EncodedServerMessage(this.msg, this.target);
  }
}

export class EncodedServerMessage {
  private data!: Uint8Array;
  private targets!: WebSocket[];

  constructor(msg: ServerMessage, target: string) {
    this.data = msgpack.encode(msg);
    this.targets = clients.filter((t) => t.userId == target).map((t) => t.ws);
  }

  send() {
    this.targets.forEach((t) => {
      t.send(this.data);
    });
  }
}
