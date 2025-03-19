import * as crypto from "crypto";

const Invitations: InvitationDescription[] = [];

export class InvitationDescription {
  id: string;
  createdAt: number;
  expireTime: number;
  chatId: string;

  constructor(chatId: string, expireTime: number) {
    this.id = crypto.randomUUID();
    this.createdAt = Date.now();
    this.expireTime = expireTime;
    this.chatId = chatId;

    Invitations.push(this);
  }
}

export function validateChatJoinRequest(
  incomingID: string
): InvitationDescription | undefined {
  const index = Invitations.findIndex((inv) => {
    if (incomingID == inv.id) {
      if (Date.now() - inv.createdAt < inv.expireTime) {
        return inv;
      }
    }
  });

  if (index) {
    const inv = Invitations.splice(index, 1);
    return inv[0];
  }
}
