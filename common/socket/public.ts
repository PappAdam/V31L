export type PublicUser = {
  id: string;
  username: string;
};

export type PublicMessage = {
  id: string;
  user: PublicUser;
  timeStamp: Date;
  pinned: boolean;
  encryptedData: EncryptedMessage;
};

export type PublicChat = {
  id: string;
  name?: string;
  users: PublicUser[];
  encryptedMessages: PublicMessage[];
  encryptedChatKey?: Uint8Array;
};

export type EncryptedMessage = {
  data: Uint8Array;
  iv: Uint8Array;
};
