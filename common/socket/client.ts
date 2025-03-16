export type ClientPackageDescription =
  | ClientConnectionPackage
  | ClientNewMessagePackage
  | ClientBodyLessPackage
  | ClientGetChatsPackage
  | ClientGetMessagesPackage
  | ClientCreateInvitaion
  | ClientJoinChat;

export type ClientPackage = ClientPackageDescription & { id: string };

export type ClientNewMessagePackage = {
  header: "NewMessage";
  chatId: string;
  messageContent: string;
};

export type ClientConnectionPackage = {
  header: "Authorization";
  token: string;
};

export type ClientBodyLessPackage = {
  header: "DeAuthorization";
};

export type ClientGetChatsPackage = {
  header: "GetChats";
  /**
   * Number of chats retrieved
   */
  chatCount: number;
  /**
   * Number of messages in each retrieved chat
   */
  messageCount: number;
  /**
   * chatId used as cursor if paging is needed
   */
  fromId?: string;
};

export type ClientGetMessagesPackage = {
  header: "GetChatMessages";
  messageCount: number;
  chatId: string;
  /**
   * MessageId used as cursor if paging is needed
   */
  fromId?: string;
};

export type ClientCreateInvitaion = {
  header: "CreateInvitation";
  chatId: string;
  key: string;
};

export type ClientJoinChat = {
  header: "JoinChat";
  invitationID: string;
  key: string;
};
