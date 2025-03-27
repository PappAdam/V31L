const Invitations: Invitation[] = [];

export class Invitation {
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

export function validateChatJoinRequest(incomingID: string): Invitation | null {
  const i = Invitations.findIndex((inv) => {
    return incomingID == inv.id;
  });

  if (i == -1) return null;

  const timeSinceCreation = Date.now() - Invitations[i].createdAt;
  const invitationExpired = timeSinceCreation > Invitations[i].expireTime;

  if (invitationExpired) return null;

  const inv = Invitations.splice(i, 1);
  return inv[0];
}
