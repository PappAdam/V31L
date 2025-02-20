import { WebSocket } from "ws";
import { ServerMessage } from "../../../types";
import { clients } from "./client";
import * as msgpack from "@msgpack/msgpack";
import { getChatMembersByChat, getChatMembersByUser } from "../db/chatMember";

export class ServerMessageDescription {
  private msg!: ServerMessage;
  private sender!: string;
  private target!: string;

  constructor(sender: string, target: string, msg: ServerMessage) {
    this.sender = sender;
    this.target = target;
    this.msg = msg;
  }

  /**
   * Validates the message sender and target, ensuring that the sender is part of the target chat.
   * If the validation passes, it returns an encoded server message with the target chat's member user IDs.
   * 
   * @returns {Promise<EncodedServerMessage | undefined>} 
   * - Returns an EncodedServerMessage containing the message and target chat members' user IDs if validation is successful.
   * - Returns undefined if any of the following conditions are met:
   *   - The sender or target is empty.
   *   - The sender is not a member of the target chat.
   *   - The target chat's members cannot be fetched
  */
  async validate(): Promise<EncodedServerMessage | undefined> {
    if (this.sender == "" || this.target == "") return undefined;

    const senderChats = await getChatMembersByUser(this.sender);
    if (!senderChats?.find((ch) => ch.chatId == this.target)) return undefined;

    const targetChatMembers = await getChatMembersByChat(this.target).then((chms) => chms?.map((chm) => chm.userId));
    if (!targetChatMembers) return undefined;
    
    return new EncodedServerMessage(this.msg, targetChatMembers);
  }
}

export class EncodedServerMessage {
  private data!: Uint8Array;
  private targets!: WebSocket[];

  constructor(msg: ServerMessage, targets: string[]) {
    this.data = msgpack.encode(msg);
    this.targets = clients.filter((t) => {     
      return targets.includes(t.userId)
    }).map((t) => t.ws);
  }

  /**
    * Sends the encoded server message for each target 
    * - targets are determined by the target groups members, and containing all the corresponding clients
  */
  send() {
    this.targets.forEach((t) => {
      t.send(this.data);
    });
  }
}
