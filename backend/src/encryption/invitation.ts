import { randomUUID, createHmac } from "crypto";

const Invitations: Invitation[] = [];

export class Invitation {
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
): Invitation | null {
  const i = Invitations.findIndex((inv) => {
    return incomingID == inv.id && key == inv.joinKey;
  });

  if (i == -1) return null;

  const timeSinceCreation = Date.now() - Invitations[i].createdAt;
  const invitationExpired = timeSinceCreation > Invitations[i].expireTime;

  if (invitationExpired) return null;

  const inv = Invitations.splice(i, 1);
  return inv[0];
}
