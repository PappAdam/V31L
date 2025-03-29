import { EncryptedMessage } from "./public";

export type ClientPackageDescription =
  | ClientConnectionPackage
  | ClientNewMessagePackage
  | ClientBodyLessPackage
  | ClientGetChatsPackage
  | ClientGetMessagesPackage
  | ClientPinMessagePackage
  | ClientLeaveChatPackage;

export type ClientPackage = ClientPackageDescription & { id: string };

export type ClientNewMessagePackage = {
  header: "NewMessage";
  chatId: string;
  messageContent: EncryptedMessage;
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
  pinnedOnly?: boolean;
  /**
   * MessageId used as cursor if paging is needed
   */
  fromId?: string;
};

export type ClientPinMessagePackage = {
  header: "PinMessage";
  messageId: string;
};

export type ClientLeaveChatPackage = {
  header: "LeaveChat";
  chatId: string;
};
