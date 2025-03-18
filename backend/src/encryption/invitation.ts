import { randomUUID, createHmac } from "crypto";

const Invitations: InvitationDescription[] = [];

export class InvitationDescription {
  id: string;
  createdAt: number;
  expireTime: number;
  chatId: string;
  joinKey: string;

  constructor(key: string, chatId: string, expireTime: number) {
    this.id = randomUUID();
    this.createdAt = Date.now();
    this.expireTime = expireTime;
    this.chatId = chatId;
    this.joinKey = key;

    Invitations.push(this);
  }

  hashInvitationId() {
    const hmac = createHmac("sha256", this.joinKey);
    hmac.update(this.id);
    return hmac.digest("hex");
  }
}

export function validateChatJoinRequest(
  incomingID: string,
  key: string
): InvitationDescription | undefined {
  const index = Invitations.findIndex((inv) => {
    if (incomingID == inv.id && key == inv.joinKey) {
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
