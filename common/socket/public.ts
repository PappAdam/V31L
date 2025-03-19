export type PublicUser = {
  id: string;
  username: string;
};

export type PublicMessage = {
  id: string;
  user: PublicUser;
  timeStamp: Date;
  encryptedData: EncryptedMessage;
};

export type PublicChat = {
  id: string;
  name?: string;
  encryptedMessages: PublicMessage[];
};

export type EncryptedMessage = {
  data: ArrayBuffer;
  iv: Uint8Array;
};
