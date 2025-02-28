export type FChat = {
  id: string;
  name: string;
};

export type FMessage = {
  id: string;
  username: string;
  chatId: string;
  timeStamp: Date;
  content: string;
};

export type ChatMessage = {
  chat: FChat;
  messages: FMessage[];
};
