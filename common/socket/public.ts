export type ClientChat = {
  id: string;
  name?: string;
};

export type ClientMessage = {
  id: string;
  username: string;
  userId: string;
  timeStamp: Date;
  content: string;
};

export type ClientChatMessage = {
  chat: ClientChat;
  messages: ClientMessage[];
};
