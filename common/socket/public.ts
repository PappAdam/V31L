export type PublicChat = {
  id: string;
  name?: string;
};

export type PublicMessage = {
  id: string;
  username: string;
  userId: string;
  timeStamp: Date;
  content: string;
};

export type PublicChatContent = {
  chat: PublicChat;
  messages: PublicMessage[];
};

export type PublicUser = {
  id: string;
  username: string;
};
